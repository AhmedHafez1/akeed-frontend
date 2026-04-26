# Akeed Shopify Feature Video

Production brief for the Shopify App Store feature media video.

## Goal

Create a 75-100 second English promotional video that shows how Akeed helps
MENA merchants confirm cash-on-delivery orders before shipping.

The video must position Akeed as a reliable WhatsApp COD confirmation workflow
powered by official Meta WhatsApp Cloud APIs. It should focus on business
impact, not step-by-step instruction.

## Production Assets

Supporting production files are in `docs/shopify-feature-media/`:

- `README.md`: asset package usage notes.
- `captions.vtt`: English caption file timed to the approved voiceover.
- `editor-shot-list.csv`: shot-by-shot edit checklist.
- `generate-thumbnail.ps1`: thumbnail generator.
- `generate-video.ps1`: first-pass silent video renderer.
- `assets/akeed-feature-thumbnail.png`: exported 1600x900 thumbnail.
- `assets/akeed-feature-video.avi`: generated 95-second storyboard video.

## Core Message

Confirm COD orders on WhatsApp before you ship.

## Product Claims To Use

- Akeed sends branded WhatsApp confirmation flows for new COD orders.
- Messages are sent through official Meta WhatsApp Cloud APIs.
- Most merchants can start without setting up their own WhatsApp number or API.
- Customers confirm the order and delivery address in a structured flow.
- Merchants see confirmed, canceled, pending, response-rate, funnel, and money
  saved metrics in the dashboard.
- Akeed helps reduce avoidable shipping losses and repetitive manual calls.

## Do Not Say Or Show

- Do not mention GPS.
- Do not mention collecting customer location.
- Do not show a share-location button.
- Do not imply Akeed is affiliated with Shopify or Meta.
- Do not use the Shopify logo in the thumbnail or decorative scenes.
- Do not show real customer/order data.

## Voiceover Script

Cash-on-delivery orders move fast.

But when customers do not confirm, merchants pay for failed delivery attempts,
reverse shipping, and hours of manual follow-up.

Akeed automates COD confirmation on WhatsApp using official Meta Cloud APIs.

When a new COD order arrives, Akeed sends a branded confirmation flow to the
customer.

The customer confirms the order, checks the delivery address, and responds in a
clear, structured conversation.

Your dashboard updates automatically, showing what is confirmed, canceled,
pending, and how customers move through the confirmation funnel.

You can track response rate, monitor recent verifications, and see the shipping
waste you are avoiding.

Setup is simple for most stores, with no WhatsApp number or API setup required
to start.

Ship with more confidence.

Akeed: reliable WhatsApp COD confirmation for MENA commerce.

## Storyboard

| Time | Scene | Visual Direction | On-Screen Text |
| --- | --- | --- | --- |
| 0-8s | Problem hook | Fast cuts of incoming COD orders, unread messages, and a merchant reviewing a fulfillment list. Keep visuals generic and data-free. | COD orders move fast. |
| 8-18s | Manual work cost | Show a merchant/team calling customers, checking spreadsheets, and pausing shipments. Use animated cost markers for failed delivery and reverse shipping. | Manual COD confirmation does not scale. |
| 18-30s | Akeed intro | Transition into Akeed branding with WhatsApp-style message cards and official API/reliability language. Avoid third-party logos. | Akeed confirms COD orders on WhatsApp. |
| 30-45s | Customer flow | Show the demo chat: order details, Confirm Order, delivery address, and Yes, address is correct. | Confirm order details and address before shipping. |
| 45-60s | Dashboard clarity | Show short UI captures of dashboard metrics: Confirmed, Canceled, Awaiting response, Response rate. | See every verification result. |
| 60-72s | Operational impact | Show funnel cards and money saved card. Emphasize decision clarity rather than guaranteed savings. | Know what to ship, hold, or review. |
| 72-85s | Setup confidence | Show onboarding/settings concepts: store name, language, auto-verification, shared WhatsApp infrastructure. | Start without WhatsApp API setup for most stores. |
| 85-95s | CTA | End on Akeed logo/brand screen with subtle WhatsApp confirmation cards flowing into a dashboard card. | Akeed: reliable WhatsApp COD confirmation for MENA commerce. |

## UI Capture List

Capture only synthetic/demo data.

- Marketing demo chat from the hero section.
- Embedded dashboard top metrics.
- Embedded dashboard verification funnel.
- Embedded dashboard money saved card.
- Embedded verification table with fake or seeded data.
- Embedded onboarding configuration step showing store name, language, and
  auto-verification.
- Dashboard empty state test verification flow, if no seeded data is available.

## Thumbnail Brief

Required output: 1600x900 PNG or JPG.

Concept:

- Left side: a clean WhatsApp-style confirmation bubble for an order.
- Right side: a simple dashboard card with Confirmed, Canceled, and Response
  Rate metrics.
- Center motion cue: a subtle arrow or flow line from message to dashboard.
- Headline: Confirm COD before shipping
- Visual tone: clean, high-contrast, trustworthy, MENA commerce-focused.

Constraints:

- One focal point.
- Leave at least 100px margin around outer edges.
- Avoid heavy text.
- Do not use Shopify logo.
- Do not show real customer data.

Suggested alt text:

Akeed WhatsApp COD confirmation flow updating a merchant dashboard before
shipping.

## Editing Notes

- Target runtime: 75-100 seconds.
- Keep screencasts to roughly 25% of the video.
- Use animated UI compositions and short screen captures instead of long
  walkthroughs.
- Use English narration with readable captions.
- Use Arabic or English sample WhatsApp messages only from the current frontend
  demo copy.
- Keep pacing promotional and outcome-focused.

## Upload Checklist

- Upload to YouTube or Vimeo.
- Set visibility to public or unlisted.
- Enable embedding on external websites.
- Turn comments off.
- Attach the 1600x900 thumbnail.
- Use a title that includes Akeed and COD confirmation.
- Check playback at desktop and mobile sizes.

## QA Checklist

- No GPS claim appears in voiceover, captions, thumbnails, or UI captures.
- No share-location UI appears in the video.
- Claims match current frontend copy in `public/messages/en.json`.
- Thumbnail dimensions are exactly 1600x900.
- Thumbnail is PNG or JPG.
- No Shopify logo is used in thumbnail art.
- No real customer/order data is visible.
- Screencast segments stay short and promotional.
- Video runtime is no longer than 2-3 minutes.

## Current Frontend Source References

- `public/messages/en.json`: hero, demo, problem, how_it_works, solution,
  pricing, faq, dashboard, and onboarding copy.
- `src/features/marketing/ui/components/chat/useDemoChat.ts`: current demo flow
  uses order confirmation and address confirmation only.
- `src/features/dashboard/skins/embedded/StatsEmbedded.tsx`: dashboard metrics,
  funnel, money saved, and usage warning UI.
- `src/features/dashboard/skins/embedded/DashboardEmbeddedSkin.tsx`: embedded
  dashboard verification table and filters.
- `src/features/onboarding/ui/embedded/steps/ConfigurationStep.tsx`: setup
  screen for store name, language, and auto-verification.
