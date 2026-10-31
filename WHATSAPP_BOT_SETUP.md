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

- `What offers do you have?`
- `بكام عرض البرجر؟`
- `Where is the restaurant?`
- `كم سعر حراري؟`

The bot reads current dishes, descriptions, offers, variants, and EGP prices from Khan Al Harir's official QR menu. It does not invent calories or other unpublished restaurant information.

Before production use, publish a customer privacy notice explaining that WhatsApp messages are processed by the restaurant's automated assistant and its AI provider. Follow Meta's customer opt-in and messaging-policy requirements. The OpenAI request is configured with `store: false`.

