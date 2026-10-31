# Khan Al Harir WhatsApp assistant setup

The server endpoint is:

`https://khan101.vercel.app/api/whatsapp`

## 1. Add protected Vercel environment variables

In the Vercel project, open **Settings → Environment Variables** and add these values for Production:

- `WHATSAPP_ACCESS_TOKEN` — a permanent Meta system-user token with WhatsApp messaging access.
- `WHATSAPP_PHONE_NUMBER_ID` — the Phone Number ID shown in the Meta WhatsApp API setup page.
- `WHATSAPP_VERIFY_TOKEN` — create a private random phrase. Enter the same phrase in Meta when verifying the webhook.
- `WHATSAPP_APP_SECRET` — the Meta app secret used to verify webhook signatures.
- `WHATSAPP_GRAPH_API_VERSION` — the current Graph API version enabled for the Meta app, such as the value shown in its API setup page.
- `OPENAI_API_KEY` — the OpenAI project API key used for natural-language answers.
- `OPENAI_MODEL` — optional; defaults to `gpt-6-luna`.

Never put these values in GitHub, website JavaScript, screenshots, or chat messages.

## 2. Redeploy

Redeploy the latest `main` deployment after saving the environment variables.

## 3. Connect the Meta webhook

In the Meta app dashboard, open **WhatsApp → Configuration**:

1. Set the callback URL to `https://khan101.vercel.app/api/whatsapp`.
2. Enter the same value used for `WHATSAPP_VERIFY_TOKEN`.
3. Verify and save the webhook.
4. Subscribe the WhatsApp Business Account to the `messages` webhook field.

## 4. Test

Send these messages to the connected business number:

- `Hi` — sends only the complete live website menu link at the beginning of the chat.
- `What offers do you have?`
- `بكام عرض البرجر؟`
- `Where is the restaurant?`
- `كم سعر حراري؟`

The bot reads current dishes, descriptions, offers, variants, images, and EGP prices from Khan Al Harir's official QR menu. A greeting sends only the complete live website menu link. Offer questions send up to three official offer pictures with names and prices before the answer. It does not invent calories or other unpublished restaurant information.

When a customer asks about a specific menu item, the reply includes its verified current price. Calories are only discussed when the customer asks, and the bot never invents them.

Instagram, TikTok, and Facebook questions return the matching official page link directly.

The assistant is named **Khan Al Harir Service** and answers only Khan Al Harir-related questions.

Opening-hours questions say the restaurant closes at 3:00 AM. Until the opening time is confirmed, the bot directs customers to hotline 19443 instead of guessing.

Before production use, publish a customer privacy notice explaining that WhatsApp messages are processed by the restaurant's automated assistant and its AI provider. Follow Meta's customer opt-in and messaging-policy requirements. The OpenAI request is configured with `store: false`.

