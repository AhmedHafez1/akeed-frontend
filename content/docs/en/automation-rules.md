---
title: Automation Rules
description: Configure send timing, follow-ups, escalation, and quiet hours to match your COD operations.
order: 8
slug: automation-rules
---

## Overview

Automation Rules control **when** Akeed sends confirmation messages and **how** it handles customers who do not reply.

These settings let you balance speed, customer experience, and shipping risk.

## Why These Rules Matter

Good timing improves reply quality.

- Send too early or too late → lower response rate.
- No follow-up → more no-reply orders.
- Escalate too fast → you may cancel orders that would have confirmed.

The goal is simple: send at the right time, follow up once, escalate with clear rules.

## Rule 1: Initial Send Delay

This controls how long Akeed waits before sending the first WhatsApp confirmation.

### Recommended default

- Start with **0 to 15 minutes** for most stores.

### Use longer delay when

- You need a short buffer for order edits.
- You want to avoid immediate sends during peak checkout spikes.

> [!INFO]
> Very long first-send delays usually reduce confirmation performance because customer intent cools down over time.

## Rule 2: Follow-Up Reminder

If enabled, Akeed sends one follow-up reminder to customers who did not reply.

### Recommended default

- Keep follow-up **enabled**.
- Start with **6 hours** after the first message. This is the default.

### Why it helps

- Customers often miss the first message.
- A single follow-up recovers a meaningful share of confirmations.

## Rule 3: No-Reply Escalation

Escalation marks the order as **No Reply** when the customer still has not responded after your configured time.

### Recommended default

- Start with **12 hours** after the reminder. This is the default.
- Keep escalation later than follow-up.

### Operational use

Use No Reply as a review queue for operations.

- Retry manually for high-value orders.
- Cancel low-confidence orders according to your policy.

> [!WARNING]
> If escalation is too aggressive, you may block valid orders that would have replied later.

### Cancel unanswered orders automatically

You can let Akeed cancel an order in your store when it reaches **No Reply**. It is off until you turn it on under **Timing & follow-up** in Settings, and it needs the no-reply alert. It cancels at the moment the order reaches No Reply, so your no-reply delay is the deadline.

Akeed cancels an order only when all of these hold:

- The confirmation, and the reminder if one was due, were delivered.
- The customer did not confirm or cancel. Akeed ignores a message it can’t read as either.
- You did not keep the order out with **Don’t auto-cancel**.
- The store still shows the order unpaid and unfulfilled.

A message Akeed could not send or deliver, for example because your plan or credits ran out, pauses the cancellation instead. Akeed never cancels an order because of its own sending limits.

On Shopify you choose whether the items are restocked and whether Shopify tells the customer. WooCommerce and EasyOrders follow your store’s own settings. A canceled order shows **No response after confirmation attempts**. If the customer confirms after that, the order shows **Confirmed after cancel** and moves to **Needs action** so you can contact them. The order stays canceled. Any other message after the cancellation is ignored.

Turning the setting off stops every cancellation that has not reached your store yet.

## Rule 4: Quiet Hours

Quiet Hours prevent sends during specific local times (for example overnight).

### Recommended use

- Quiet hours are off by default. When you turn them on, the window is 22:00 to 09:00 in your timezone until you change it. Turn them on if your customers do not expect messages at night.
- Set start/end based on your market behavior.

### Important

Messages are delayed until the quiet window ends.

If your team sees many pending/no-reply cases in the morning, check whether quiet hours are pushing sends later than expected.

## Rule 5: Timezone

Timezone defines how Quiet Hours are applied.

Set timezone to the same timezone used by your core operations team and customer base.

## Practical Configuration Templates

| Store Pattern | Initial Delay | Follow-Up | Escalation | Quiet Hours |
| --- | ---: | ---: | ---: | --- |
| Fast fulfillment store | 0–10 min | 60 min | 240 min | Optional |
| Balanced default setup | 0 min | 360 min | 720 min after the reminder | Off, or 22:00–09:00 |

Use these as starting points, then tune weekly using your reply and confirmation rates.

## Common Mistakes

| Mistake | Better Approach |
| --- | --- |
| Follow-up disabled from day one | Keep one follow-up active and measure impact first. |
| Escalation too close to first send | Leave enough response time between first send, follow-up, and escalation. |
| Quiet hours enabled with wrong timezone | Double-check timezone after setup changes. |
| Constantly changing rules daily | Make changes in controlled weekly cycles and compare outcomes. |

## Troubleshooting

### Reply rate dropped after rule changes

- Revert to previous stable timing.
- Check whether quiet hours now block peak response windows.
- Make one timing change at a time.

### Too many orders in No Reply

- Increase escalation window.
- Ensure follow-up is enabled.
- Reduce first-send delay if messages are going out too late.

### Customers complain about message timing

- Enable quiet hours.
- Shift send windows to daytime in local timezone.

## FAQ

### Should every store use the same automation rules?

No. Use your own order behavior, audience patterns, and support capacity to tune rules.

### Is one follow-up enough?

For most stores, yes. One follow-up usually captures most recoverable responses without creating spam.

### What is the best escalation time?

There is no universal value. Start with 12 hours after the reminder, then adjust based on actual response patterns.

### Where can I check if my rules are working?

Monitor reply rate, confirmation rate, no-reply volume, and failed sends in your dashboard.

See also: [Order Confirmation](/docs/order-confirmation)
