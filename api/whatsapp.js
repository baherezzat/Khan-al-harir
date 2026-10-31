import crypto from "node:crypto";

export const config = { api: { bodyParser: false } };

const MENU_API = "https://dashboard.iconapp.site/api";
const BRANCH_ID = 33;
const MENU_URL = "https://qr.iconapp.site/IS.ZCTpt";
const WEBSITE_URL = "https://khan101.vercel.app/";
const WEBSITE_MENU_URL = "https://khan101.vercel.app/#menu";
const BOT_NAME = "Khan Al Harir Service";
const SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/khan.alharir.restaurant",
  instagram: "https://www.instagram.com/khan.alharir.restaurant/",
  tiktok: "https://www.tiktok.com/@khan.alharir.restaurant"
};
const CACHE_TTL_MS = 15 * 60 * 1000;

let menuCache = { expiresAt: 0, value: null };

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function readRawBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function verifyMetaSignature(rawBody, signature) {
  const appSecret = required("WHATSAPP_APP_SECRET");
  if (!signature?.startsWith("sha256=")) return false;
  const expected = `sha256=${crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  return safeEqual(expected, signature);
}

function asPrice(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalize(value) {
  return String(value || "")
    .normalize("NFKD")
    .toLocaleLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, " ")
    .trim();
}

function isArabic(text) {
  return /[\u0600-\u06ff]/.test(text);
}

async function fetchMenuJSON(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(6000)
  });
  if (!response.ok) throw new Error(`Menu request failed (${response.status})`);
  const payload = await response.json();
  if (!payload?.status) throw new Error(payload?.msg || "Official menu response failed");
  return payload.data;
}

function productToItem(product, category) {
  const basePrice = asPrice(product.discounted_price) ?? asPrice(product.price);
  const options = (product.attributes || [])
    .filter(attribute => Number(attribute.override_price) === 1)
    .flatMap(attribute => attribute.values || [])
    .map(value => ({
      en: value.title?.en || value.title?.ar || "Option",
      ar: value.title?.ar || value.title?.en || "اختيار",
      price: asPrice(value.price)
    }))
    .filter(option => Number.isFinite(option.price));
  return {
    id: product.id,
    name: product.title?.en || product.title?.ar || "Menu item",
    arabic: product.title?.ar || product.title?.en || "صنف من المنيو",
    description: product.description?.en || "",
    descriptionAr: product.description?.ar || "",
    category: category.title?.en || category.title?.ar || "Menu",
    categoryAr: category.title?.ar || category.title?.en || "المنيو",
    price: basePrice,
    oldPrice: asPrice(product.discounted_price) !== null ? asPrice(product.price) : null,
    image: product.images?.[0]?.image || category.image || null,
    options
  };
}

async function loadOfficialMenu() {
  if (menuCache.value && Date.now() < menuCache.expiresAt) return menuCache.value;
  const categories = await fetchMenuJSON(`${MENU_API}/branches/${BRANCH_ID}/categories`);
  const results = await Promise.allSettled(categories.map(async category => {
    const data = await fetchMenuJSON(`${MENU_API}/branches/${BRANCH_ID}/categories/${category.id}/products`);
    return (data.products || []).map(product => productToItem(product, category));
  }));
  const items = results.flatMap(result => result.status === "fulfilled" ? result.value : []);
  if (!items.length) throw new Error("Official menu returned no products");
  const value = { categories, items };
  menuCache = { value, expiresAt: Date.now() + CACHE_TTL_MS };
  return value;
}

function priceText(item, arabic) {
  const currency = arabic ? "ج.م" : "EGP";
  if (item.options.length) {
    return item.options.slice(0, 6).map(option => {
      const label = arabic ? option.ar : option.en;
      return `${label}: ${option.price} ${currency}`;
    }).join("، ");
  }
  if (!Number.isFinite(item.price)) return arabic ? "السعر غير منشور" : "Price not published";
  const current = `${item.price} ${currency}`;
  if (Number.isFinite(item.oldPrice) && item.oldPrice !== item.price) {
    return arabic ? `${current} بدلًا من ${item.oldPrice} ${currency}` : `${current}, was ${item.oldPrice} ${currency}`;
  }
  return current;
}

function rankItems(items, question) {
  const query = normalize(question);
  const tokens = query.split(/\s+/).filter(token => token.length > 1);
  return items.map(item => {
    const names = normalize(`${item.name} ${item.arabic}`);
    const searchable = normalize(`${names} ${item.description} ${item.descriptionAr} ${item.category} ${item.categoryAr}`);
    let score = names.includes(query) && query ? 20 : 0;
    for (const token of tokens) {
      if (names.includes(token)) score += 8;
      else if (searchable.includes(token)) score += 2;
    }
    return { item, score };
  }).filter(entry => entry.score > 0).sort((a, b) => b.score - a.score).map(entry => entry.item);
}

function isOffer(item) {
  return /offer|عرض|عروض/i.test(`${item.category} ${item.categoryAr} ${item.name} ${item.arabic}`);
}

function hasOfferIntent(question) {
  return /offer|offers|deal|deals|promotion|promo|عرض|عروض|خصم|خصومات/.test(normalize(question));
}

function offerImagesForQuestion(menu, question) {
  const offers = menu.items.filter(item => isOffer(item) && /^https:\/\//i.test(item.image || ""));
  const ranked = rankItems(offers, question);
  if (hasOfferIntent(question)) return (ranked.length ? ranked : offers).slice(0, 3);
  const query = normalize(question);
  if (query.length < 4) return [];
  return ranked.filter(item => {
    const names = normalize(`${item.name} ${item.arabic}`);
    return names.includes(query) || query.includes(names);
  }).slice(0, 1);
}

function shouldSendMenuWelcome(question) {
  const text = normalize(question);
  return /^(hi|hello|hey|start|menu|full menu|مرحبا|اهلا|اهلين|هاي|السلام عليكم|منيو|المنيو|القائمه|القائمة)$/.test(text);
}

function socialLinkForQuestion(question) {
  const text = normalize(question);
  if (/instagram|insta|انستجرام|انستغرام/.test(text)) return SOCIAL_LINKS.instagram;
  if (/tiktok|tik tok|تيك توك|تيكتوك/.test(text)) return SOCIAL_LINKS.tiktok;
  if (/facebook|face book|فيسبوك|فيس بوك/.test(text)) return SOCIAL_LINKS.facebook;
  return null;
}

function selectContext(menu, question) {
  const normalized = normalize(question);
  const wantsOffers = hasOfferIntent(normalized);
  const ranked = rankItems(menu.items, question);
  const selected = wantsOffers
    ? menu.items.filter(isOffer).slice(0, 18)
    : ranked.length ? ranked.slice(0, 18) : menu.items.filter(isOffer).slice(0, 10);
  return selected.map(item => {
    const options = item.options.length
      ? ` | Options: ${item.options.map(option => `${option.en}/${option.ar}=${option.price} EGP`).join(", ")}`
      : "";
    return `- ${item.name} / ${item.arabic} | ${item.category} / ${item.categoryAr} | Price: ${priceText(item, false)}${options} | Description: ${item.description || item.descriptionAr || "Not published"}`;
  }).join("\n");
}

function fallbackAnswer(question, menu) {
  const arabic = isArabic(question);
  const normalized = normalize(question);
  const matches = rankItems(menu.items, question).slice(0, 6);
  if (/who are you|your name|اسمك|مين انت|من انت/.test(normalized)) {
    return arabic ? `أنا ${BOT_NAME}، مساعد مطعم خان الحرير.` : `I’m ${BOT_NAME}, Khan Al Harir’s restaurant assistant.`;
  }
  if (/calorie|calories|kcal|سعرات|سعره حراريه|سعره حرارية/.test(normalized)) {
    return arabic
      ? "خان الحرير لم ينشر معلومات رسمية عن السعرات الحرارية حاليًا، لذلك لن أخمّنها. للاستفسار اتصل على 19443."
      : "Khan Al Harir has not published official calorie information, so I won’t guess it. Please call 19443 for dietary questions.";
  }
  const socialLink = socialLinkForQuestion(question);
  if (socialLink) return socialLink;
  if (hasOfferIntent(normalized)) {
    const offers = menu.items.filter(isOffer).slice(0, 8);
    if (!offers.length) return arabic ? "لا توجد عروض منشورة حاليًا في المنيو الرسمي." : "No offers are currently published in the official menu.";
    const lines = offers.map(item => `• ${arabic ? item.arabic : item.name}: ${priceText(item, arabic)}`);
    return `${arabic ? "العروض الحالية:" : "Current offers:"}\n${lines.join("\n")}\n${MENU_URL}`;
  }
  if (/address|location|where|map|عنوان|مكان|فين|موقع/.test(normalized)) {
    return arabic
      ? "فرع خان الحرير: مول 24، منطقة خدمات البنفسج، فيلا 10، شارع د. أحمد عكاشة، التجمع الأول، القاهرة الجديدة."
      : "Khan Al Harir is at Mall 24, Banafseg Service Area, Villa 10, Dr. Ahmed Okasha Street, First Settlement, New Cairo.";
  }
  if (/phone|call|hotline|delivery|رقم|تليفون|هاتف|دليفري|توصيل/.test(normalized)) {
    return arabic ? "الخط الساخن للتوصيل: 19443\nهاتف الفرع: +20 105 071 4404" : "Delivery hotline: 19443\nBranch phone: +20 105 071 4404";
  }
  if (/bot|chatbot|assistant|الشات بوت|البوت|المساعد/.test(normalized) && /hour|open|available|24|مواعيد|مفتوح|متاح/.test(normalized)) {
    return arabic ? `${BOT_NAME} متاح 24 ساعة طوال الأسبوع.` : `${BOT_NAME} is available 24/7.`;
  }
  if (/hour|open|close|مواعيد|يفتح|يقفل/.test(normalized)) {
    return arabic
      ? "يغلق المطعم الساعة 3:00 صباحًا. وقت الفتح غير مؤكد حاليًا؛ للتأكيد اتصل على 19443."
      : "The restaurant closes at 3:00 AM. The opening time is not currently confirmed; please call 19443 to verify.";
  }
  if (matches.length) {
    const lines = matches.map(item => `• ${arabic ? item.arabic : item.name}: ${priceText(item, arabic)}${(arabic ? item.descriptionAr : item.description) ? ` — ${arabic ? item.descriptionAr : item.description}` : ""}`);
    return `${lines.join("\n")}\n${MENU_URL}`;
  }
  return arabic
    ? `أقدر أساعدك في الأسعار، العروض، الأصناف، العنوان والتوصيل. اكتب اسم الطبق أو شاهد المنيو: ${WEBSITE_URL}`
    : `I can help with prices, offers, dishes, location, and delivery. Send a dish name or view the menu: ${WEBSITE_URL}`;
}

function extractOutputText(response) {
  if (typeof response.output_text === "string" && response.output_text.trim()) return response.output_text.trim();
  for (const item of response.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text?.trim()) return content.text.trim();
    }
  }
  return "";
}

async function createAIAnswer(question, menu) {
  if (!process.env.OPENAI_API_KEY) return fallbackAnswer(question, menu);
  const context = selectContext(menu, question);
  const instructions = `You are Khan Al Harir's WhatsApp restaurant assistant. Reply in the same language as the customer (Arabic or English), in a warm concise WhatsApp style. Answer only about Khan Al Harir, its restaurant details, and the supplied official menu context. Never invent dishes, prices, availability, opening hours, ingredients, allergens, or nutrition. The restaurant has not published official calorie data; do not mention calories unless the customer asks, then say the information is unavailable and do not estimate. Whenever the customer asks about a specific menu item, include its verified current price. Treat EGP prices as current only when supplied below. If asked for social media, send the requested direct link: Facebook ${SOCIAL_LINKS.facebook}, Instagram ${SOCIAL_LINKS.instagram}, TikTok ${SOCIAL_LINKS.tiktok}. If a fact is missing, say it is not officially available and offer hotline 19443. Do not claim an order or reservation was completed. Website: ${WEBSITE_URL} Official menu: ${MENU_URL}. Address: Mall 24, Banafseg Service Area, Villa 10, Dr. Ahmed Okasha Street, First Settlement, New Cairo. Delivery hotline: 19443. Branch phone: +20 105 071 4404. Relevant live official menu data:\n${context || "No matching menu items were found."}`;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-6-luna",
      instructions: `Your name is ${BOT_NAME}. Only answer questions related to Khan Al Harir. The chatbot is available 24/7. If asked about restaurant opening hours, say the restaurant closes at 3:00 AM. The restaurant opening time is not currently confirmed, so offer 19443 to verify it and never guess. Clearly distinguish chatbot availability from restaurant hours.\n${instructions}`,
      input: question,
      max_output_tokens: 350,
      store: false
    }),
    signal: AbortSignal.timeout(6000)
  });
  if (!response.ok) throw new Error(`OpenAI request failed (${response.status})`);
  const payload = await response.json();
  return extractOutputText(payload) || fallbackAnswer(question, menu);
}

async function sendWhatsAppText(to, body) {
  return sendWhatsAppPayload(to, {
    type: "text",
    text: { preview_url: true, body: String(body).slice(0, 3900) }
  });
}

async function sendWhatsAppPayload(to, message) {
  const version = required("WHATSAPP_GRAPH_API_VERSION");
  const phoneNumberId = required("WHATSAPP_PHONE_NUMBER_ID");
  const accessToken = required("WHATSAPP_ACCESS_TOKEN");
  const response = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      ...message
    }),
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error(`WhatsApp send failed (${response.status}): ${await response.text()}`);
}

function offerImageProxyURL(source) {
  return `${WEBSITE_URL}api/offer-image?src=${encodeURIComponent(source)}`;
}

async function sendOfferImage(to, item, arabic) {
  const title = arabic ? item.arabic : item.name;
  const caption = `${title}\n${priceText(item, arabic)}`;
  return sendWhatsAppPayload(to, {
    type: "image",
    image: {
      link: offerImageProxyURL(item.image),
      caption: caption.slice(0, 1000)
    }
  });
}

async function sendWelcomeMenu(to) {
  return sendWhatsAppText(to, WEBSITE_MENU_URL);
}

export default async function handler(request, response) {
  if (request.method === "GET") {
    if (!process.env.WHATSAPP_VERIFY_TOKEN) {
      response.status(503).json({ error: "WhatsApp bot is not configured" });
      return;
    }
    const mode = request.query?.["hub.mode"];
    const token = request.query?.["hub.verify_token"];
    const challenge = request.query?.["hub.challenge"];
    if (mode === "subscribe" && safeEqual(token || "", required("WHATSAPP_VERIFY_TOKEN"))) {
      response.status(200).send(challenge);
      return;
    }
    response.status(403).json({ error: "Webhook verification failed" });
    return;
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const rawBody = await readRawBody(request);
    if (!verifyMetaSignature(rawBody, request.headers["x-hub-signature-256"])) {
      response.status(401).json({ error: "Invalid webhook signature" });
      return;
    }
    const payload = JSON.parse(rawBody.toString("utf8"));
    const messages = (payload.entry || []).flatMap(entry =>
      (entry.changes || []).flatMap(change => change.value?.messages || [])
    );
    const textMessages = messages.filter(message => message.type === "text" && message.text?.body).slice(0, 1);
    if (!textMessages.length) {
      response.status(200).json({ received: true });
      return;
    }
    for (const message of textMessages) {
      const question = message.text.body.trim().slice(0, 1200);
      const arabic = isArabic(question);
      if (shouldSendMenuWelcome(question)) {
        await sendWelcomeMenu(message.from);
        continue;
      }
      const socialLink = socialLinkForQuestion(question);
      if (socialLink) {
        await sendWhatsAppText(message.from, socialLink);
        continue;
      }

      const menu = await loadOfficialMenu();
      const offerImages = offerImagesForQuestion(menu, question);
      for (const item of offerImages) {
        try {
          await sendOfferImage(message.from, item, arabic);
        } catch (error) {
          console.error("Offer image send failed", error);
        }
      }

      let answer;
      try {
        answer = await createAIAnswer(question, menu);
      } catch (error) {
        console.error("AI response failed; using verified fallback", error);
        answer = fallbackAnswer(question, menu);
      }
      await sendWhatsAppText(message.from, answer);
    }
    response.status(200).json({ received: true });
  } catch (error) {
    console.error("WhatsApp webhook failed", error);
    response.status(500).json({ error: "Webhook processing failed" });
  }
}

