---
title: Connect EasyOrders
description: Connect your EasyOrders store so Akeed confirms new cash-on-delivery orders on WhatsApp and updates the order status with the customer's answer.
order: 4
slug: easyorders
---

## Overview

Connect your EasyOrders store once, and Akeed receives every new cash-on-delivery (COD) order by itself. It confirms the order with the customer on WhatsApp and updates the order's status in EasyOrders.

You do not copy any keys. You approve the connection inside EasyOrders.

> [!INFO]
> Akeed confirms COD orders only. Orders with another payment method are received and skipped.

## Before You Start

- You are an owner or admin of your Akeed account.
- Your EasyOrders store is active.
- Your Akeed account does not already have another order source. An account takes its orders from one source.

## Connect Your Store

1. **Choose EasyOrders when you sign up.** You are taken to the connect screen after you confirm your email.
2. **Choose Connect EasyOrders.** EasyOrders opens in a new tab. Sign in to the store you want to connect, then choose **Accept**.
3. **Return to Akeed.** The page updates by itself when the connection is ready.
4. **Choose your store's country and currency.** EasyOrders sends order totals without a currency and phone numbers without a country code, so Akeed needs both to message your customers correctly.
5. **Send the free test message.** Akeed sends a test confirmation to your own WhatsApp number. Then your store is set up.

Akeed asks EasyOrders for two permissions only:

- read your new orders,
- update an order's status when your customer confirms or cancels.

Messages reach your customers from Akeed's WhatsApp number. You do not need a WhatsApp number of your own.

> [!WARNING]
> Orders are not confirmed until you choose both the customer phone country and the store currency.

## What Akeed Writes to Your Store

| What happens | In EasyOrders |
| --- | --- |
| The customer confirms | The order status changes to **confirmed**. |
| The customer cancels | The order status changes to **canceled**. |
| You cancel a no-reply order from Akeed | The order status changes to **canceled**. |
| The customer does not reply | Nothing. The order is marked **No reply** in Akeed only. |

Akeed never cancels an order in EasyOrders by itself. It also updates only an order that is still pending: if you already changed the order's status, Akeed leaves it alone.

## Keep the Connection Healthy

Open **Settings**, then your order source, to see the connection.

| What you see | What it means | What to do |
| --- | --- | --- |
| Your EasyOrders store isn't active | EasyOrders reports the store as inactive or overdue. Orders do not reach Akeed. | Reactivate the store in EasyOrders. |
| EasyOrders no longer accepts Akeed's access | The API key was removed in EasyOrders. | Disconnect, then connect the same store again. |
| Orders were refused because their webhook secret didn't match | The Akeed webhooks were deleted and created again in EasyOrders. | Open **Fix the webhook secrets** and choose **Reset and learn again**. |

Akeed secures the two webhooks by itself: it checks your first order with EasyOrders, then keeps the secret EasyOrders sends with it. There is nothing for you to copy.

Keep exactly one orders webhook and one order-status webhook named **Akeed** in EasyOrders. If an address appears twice, delete the extra one.

> [!WARNING]
> Orders placed while the store was disconnected or inactive are not sent to Akeed later. Confirm those orders yourself.

## Disconnect and Reconnect

Choose **Disconnect EasyOrders** in Settings. Akeed stops receiving orders from the store, sending messages for them and updating their status. Your earlier orders, results and usage history are kept.

Akeed asks EasyOrders to delete the webhooks it created. The API key stays in EasyOrders until you delete it:

1. In EasyOrders, open Settings > Public API.
2. Delete the API key named **Akeed**.
3. If Akeed tells you the webhooks were not deleted, delete every webhook named **Akeed** under Webhooks.

You can reconnect the same store at any time by approving again in EasyOrders. A different store cannot be connected to the same account. Contact Akeed support if you need that.

## Common Mistakes

| Mistake | Better Approach |
| --- | --- |
| Skipping the country and currency | Choose both. Orders are not confirmed without them. |
| Signing in to another EasyOrders store when reconnecting | Sign in to the store that was connected before. |
| Deleting the Akeed webhooks in EasyOrders to "refresh" them | Leave them. If they were recreated, reset the webhook secrets in Akeed. |
| Expecting missed orders to arrive after a fix | They are not imported. Confirm them by hand. |

## Troubleshooting

### EasyOrders wasn't connected

The request was not accepted, or it expired. Start again. If you chose Accept and it still failed, EasyOrders may have created an API key and webhooks named Akeed: delete them under Settings > Public API before you try again.

### This store is already connected to another Akeed account

A store connects to one Akeed account. Contact Akeed support.

### Orders stopped arriving

Check that the store is active in EasyOrders, and open your order source in Settings to see whether orders are being refused.

### An order was not confirmed

Check that its payment method is cash on delivery, that the customer's phone number is valid for the country you chose, and that the order total is above zero.

## FAQ

### Do I need my own WhatsApp Business number?

No. Messages are sent from Akeed's WhatsApp number.

### Does Akeed import my old orders?

No. Akeed confirms orders placed after the store is connected.

### Can I change the country or currency later?

Yes, from your order source in Settings.

### How do I pay?

With credits, like every account that does not use Shopify. See [Using Akeed Without Shopify](/docs/standalone-platform#how-credits-work).

## Related Guides

- [Getting Started](/docs/getting-started)
- [Order Confirmation](/docs/order-confirmation)
- [Automation Rules](/docs/automation-rules)
- [Troubleshooting](/docs/troubleshooting)
