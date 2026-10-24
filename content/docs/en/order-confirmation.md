---
title: Order Confirmation
description: Learn how Akeed confirms COD orders on WhatsApp and how to act on each status in your daily shipping workflow.
order: 7
slug: order-confirmation
---

## Overview

Akeed helps you confirm cash-on-delivery (COD) orders before shipping.

When a new eligible COD order is created, Akeed sends a WhatsApp confirmation message to the customer, waits for a response, then updates the order status in your dashboard.

This gives your team a clear “ship” or “hold” signal.

Orders can come from Shopify, from an order you add by hand, or from a file you import. After the first message, they all follow the same flow. See [Using Akeed Without Shopify](/docs/standalone-platform) and [Bulk Order Import](/docs/bulk-order-import).

## Why It Matters

COD operations usually lose money in two places:

- Orders shipped before customer intent is verified.
- Orders that fail delivery because the customer does not respond.

Order confirmation helps reduce both.

## How the Flow Works

1. Akeed checks if the order qualifies for COD confirmation.
2. Akeed sends a WhatsApp confirmation message.
3. The customer confirms, cancels, or does not reply.
4. Akeed updates status and reflects it in dashboard views.
5. Follow-up and escalation rules apply based on your settings.
6. On a connected store, Akeed records the answer on the order: a tag on Shopify, a status on EasyOrders, a note or a cancelled status on WooCommerce.

> [!INFO]
> Akeed’s main confirmation workflow is for COD orders.

## Statuses and What You Should Do

| Status | Meaning | Recommended Action |
| --- | --- | --- |
| Awaiting start | Imported from a file and held. No message has been sent yet. | Start confirmation from the import screen, or upload the file again if the 24-hour window passed. |
| Pending | Verification exists but first message has not been sent yet. | Wait briefly, then review delay settings if it stays pending too long. |
| Sent | Message was sent successfully. | Wait for customer response. |
| Delivered | WhatsApp reports delivery. | Keep monitoring for response. |
| Read | Customer opened the message. | Keep monitoring or rely on follow-up automation. |
| Confirmed | Customer confirmed the order. | Prioritize for fulfillment. |
| Canceled | Customer canceled (or merchant canceled after no reply). | Do not ship. |
| No reply | No response within your configured escalation window. | Review quickly and follow your cancellation policy. |
| No WhatsApp | The customer’s number isn’t on WhatsApp, so the message can’t reach them. Akeed sends no reminder and counts no usage for it. | Call the customer, then confirm or cancel the order by hand. |
| Waiting to send | Your plan’s confirmations or your credits ran out, so the message wasn’t sent. Nothing is charged for it. | Upgrade or buy credits. Akeed then sends it automatically. |
| Failed | Send failed or was blocked. | Check phone quality, plan usage or credit balance, and settings. |

## Practical Merchant Workflow

### 1) Ship confirmed orders first

Use confirmed status as your safest fulfillment queue.

### 2) Review no-reply orders daily

Do not let no-reply orders pile up. Decide whether to retry or cancel based on your SOP.

### 3) Track failed sends

A failed send is an operational signal, not just a dashboard number.

## Common Mistakes

| Mistake | Better Approach |
| --- | --- |
| Shipping all COD orders without waiting for status | Make “confirmed first” your default rule. |
| Ignoring no-reply orders for days | Add a daily no-reply review routine. |
| Turning off automation with no fallback process | Assign manual ownership before disabling automation. |
| Treating “delivered” as “confirmed” | Only “confirmed” should drive ship decisions. |

## Troubleshooting

### Too many no-reply orders

- Reduce initial send delay.
- Enable follow-up reminders.
- Check that message timing matches customer activity hours.

### Orders stay pending too long

- Review send delay configuration.
- Confirm auto-verification is enabled.
- Confirm orders are actually COD-eligible.

### Failed confirmations increase

- Verify phone number quality and country code formatting.
- Check current plan usage or credit balance.
- Send a test confirmation to a known-valid number.

## FAQ

### Does Akeed auto-cancel all unconfirmed orders?

Only if you turn on **Cancel unanswered orders automatically** in Settings, and then only orders that reached No Reply after every message was delivered and the customer never wrote back. Otherwise no-reply orders wait for you. See [Automation Rules](/docs/automation-rules).

### Can customers still reply after no-reply status?

Yes, at any time. Akeed can’t show what they wrote, because messages go out from Akeed’s number, so the order moves to **Needs action**. Contact the customer with **WhatsApp them** or by phone. If Akeed already canceled the order, it stays canceled until you change it in your store.

### Is “delivered” enough to ship?

No. Delivered only means the message reached the customer. Use **Confirmed** for shipping confidence.

### What if the customer’s number isn’t on WhatsApp?

WhatsApp tells Akeed the message can’t be delivered, and the order moves to **No WhatsApp**. You find it under the **No WhatsApp** tab and in **Needs action**. Akeed cancels the reminder, does not count the message in your usage, and on Shopify tags the order `Akeed: No WhatsApp`. Call the customer, then confirm or cancel the order by hand.

### What happens when my plan or credits run out?

New orders are still taken in, but their messages wait with the status **Waiting to send**, and a red banner on the dashboard shows how many are waiting and what you can do. Nothing is charged for them. Once you upgrade, buy credits, or your plan’s allowance renews, Akeed sends them automatically, oldest first, keeping your send delay and quiet hours. An order that waits more than 24 hours is not sent on its own: it moves to **Needs action**, where you can confirm, cancel or retry it.

### Where do I tune timing and follow-up?

Go to your settings automation section.

See also: [Automation Rules](/docs/automation-rules)
