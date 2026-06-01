---
title: Order Confirmation
description: Learn how Akeed confirms COD orders on WhatsApp and how to act on each status in your daily shipping workflow.
order: 2
slug: order-confirmation
---

## Overview

Akeed helps you confirm cash-on-delivery (COD) orders before shipping.

When a new eligible COD order is created, Akeed sends a WhatsApp confirmation message to the customer, waits for a response, then updates the order status in your dashboard.

This gives your team a clear “ship” or “hold” signal.

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

> [!INFO]
> Akeed’s main confirmation workflow is for COD orders.

## Statuses and What You Should Do

| Status | Meaning | Recommended Action |
| --- | --- | --- |
| Pending | Verification exists but first message has not been sent yet. | Wait briefly, then review delay settings if it stays pending too long. |
| Sent | Message was sent successfully. | Wait for customer response. |
| Delivered | WhatsApp reports delivery. | Keep monitoring for response. |
| Read | Customer opened the message. | Keep monitoring or rely on follow-up automation. |
| Confirmed | Customer confirmed the order. | Prioritize for fulfillment. |
| Canceled | Customer canceled (or merchant canceled after no reply). | Do not ship. |
| No reply | No response within your configured escalation window. | Review quickly and follow your cancellation policy. |
| Failed | Send failed or was blocked. | Check phone quality, usage limits, and settings. |

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
- Check current plan usage.
- Send a test confirmation to a known-valid number.

## FAQ

### Does Akeed auto-cancel all unconfirmed orders?

No. Your settings and process determine how no-reply orders are handled.

### Can customers still reply after no-reply status?

They may reply later, depending on timing and whether the order has already been finalized by merchant action.

### Is “delivered” enough to ship?

No. Delivered only means the message reached the customer. Use **Confirmed** for shipping confidence.

### Where do I tune timing and follow-up?

Go to your settings automation section.

See also: [Automation Rules](/docs/automation-rules)
