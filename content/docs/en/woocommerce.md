---
title: Connect WooCommerce
description: Connect your WooCommerce store so Akeed confirms new cash-on-delivery orders on WhatsApp and records the customer's answer on the order.
order: 3
slug: woocommerce
---

## Overview

Connect your WooCommerce store once, and Akeed receives every new cash-on-delivery (COD) order by itself. It confirms the order with the customer on WhatsApp and records the answer on the order in your store.

You do not install a WordPress plugin and you do not copy any keys. You approve the connection inside your own store.

> [!INFO]
> Akeed confirms COD orders only. Orders paid online are received and skipped.

## Before You Start

Your store needs all of the following:

- An address that starts with `https://` and opens on the public internet.
- Permalinks set to anything other than **Plain** (WordPress > Settings > Permalinks).
- The standard **Cash on delivery** payment method of WooCommerce.
- A WordPress user who is an administrator or a shop manager, to approve the connection.

You also need to be an owner or admin of your Akeed account. An Akeed account takes its orders from one source, so the account must not already have another one.

> [!WARNING]
> Akeed cannot promise that it works with every hosting setup or plugin. A custom payment method, a custom order status, or a plugin that changes how orders are sent may cause orders to be skipped.

## Connect Your Store

1. **Choose WooCommerce when you sign up.** You are taken to the connect screen after you confirm your email.
2. **Enter your store's address.** Use the address your customers visit, for example `https://example.com`. Akeed checks that it can reach the store.
3. **Approve in your store.** Your store opens in the same tab. Sign in as an administrator or shop manager, then choose **Approve**. Your store asks you to give Akeed read and write access.
4. **Wait for the connection to finish.** You return to Akeed, and the page updates by itself.
5. **Send the free test message.** Akeed sends a test confirmation to your own WhatsApp number so you see what customers see. Then your store is set up.

Akeed uses the access only to:

- receive your new orders,
- set up the two order notifications it needs in your store,
- record your customer's answer on the order.

Messages reach your customers from Akeed's WhatsApp number. You do not need a WhatsApp number of your own.

## What Akeed Writes to Your Store

| What happens | In your WooCommerce order |
| --- | --- |
| The customer confirms | Akeed adds a private order note. The order status does not change. |
| The customer cancels | The order status changes to **Cancelled**. |
| You cancel a no-reply order from Akeed | The order status changes to **Cancelled**. |
| The customer does not reply | Nothing. The order is marked **No reply** in Akeed only. |

Akeed never cancels an order in WooCommerce by itself. When a customer does not reply, you decide what to do.

When an order is cancelled, WooCommerce does what it always does for a cancelled order, such as returning the stock and sending its cancellation email.

Akeed only writes to an order that is still **Processing** or **On hold**. If you already completed, refunded or changed the order, Akeed leaves it alone.

## Keep the Connection Healthy

Open **Settings**, then your order source, to see the connection:

| What you see | What it means | What to do |
| --- | --- | --- |
| Order notifications are **Active** | Your store sends new orders to Akeed. | Nothing. |
| **Disabled by your store** | WooCommerce turns a notification off after several deliveries in a row fail. New orders do not reach Akeed. | Choose **Re-enable order notifications**. |
| **Paused in your store** | Someone paused the notification in WooCommerce. | Activate it in WordPress under WooCommerce > Settings > Advanced > Webhooks. |
| **Deleted from your store** | The notification was removed in WooCommerce. | Disconnect, then connect the same store again. |
| Your store no longer accepts Akeed's access | The API key was revoked, or the WordPress user can no longer manage WooCommerce. | Disconnect, then connect the same store again. |

**Check connection** asks your store whether everything still works and lists what needs attention.

> [!WARNING]
> Orders placed while a notification was disabled, or while the store was disconnected, are not sent to Akeed later. Confirm those orders yourself.

## Disconnect and Reconnect

Choose **Disconnect WooCommerce** in Settings. Akeed stops receiving orders from the store, sending messages for them and updating them. Your earlier orders, results and usage history are kept.

Akeed asks your store to delete its two order notifications. One thing is left for you, because Akeed cannot revoke its own key in your store:

1. In WordPress, open WooCommerce > Settings > Advanced > REST API.
2. Find the key named **Akeed** and choose **Revoke**.
3. If Akeed tells you the notifications were not deleted, open WooCommerce > Settings > Advanced > Webhooks and delete any webhook whose name starts with **Akeed**.

You can reconnect the same store at any time by approving again. A different store, or the same store at a different address, cannot be connected to the same account. Contact Akeed support if you need that.

## Common Mistakes

| Mistake | Better Approach |
| --- | --- |
| Entering an address that redirects | Enter the final address, with or without `www`, exactly as it appears in the browser. |
| Approving as a user who cannot manage WooCommerce | Sign in as an administrator or shop manager. |
| Editing the Akeed webhooks in WooCommerce | Leave them as they are. If one was changed, disconnect and reconnect. |
| Expecting missed orders to arrive after a fix | They are not imported. Confirm them by hand. |

## Troubleshooting

### Akeed could not find the WooCommerce REST API

In WordPress, open Settings > Permalinks, choose any option other than **Plain**, and make sure WooCommerce is active and up to date.

### My store did not accept the API key

Some hosting setups remove the `Authorization` header before it reaches WordPress. Ask your hosting provider to allow it. Then delete the unused key under WooCommerce > Settings > Advanced > REST API and connect again.

### My store reports a different address

Enter the address exactly as it is set in WordPress. If your store moved to a new address after connecting, contact Akeed support.

### Orders stopped arriving

Open Settings and look at the order notifications. If one is disabled, re-enable it. If the check finds a problem with your hosting, your certificate or your domain, your hosting provider can fix it.

### An order was not confirmed

Check that its payment method is cash on delivery, that it is a new order placed after you connected, and that the customer's phone number is valid.

## FAQ

### Do I need a WordPress plugin?

No. Akeed connects through WooCommerce's own approval screen.

### Do I need my own WhatsApp Business number?

No. Messages are sent from Akeed's WhatsApp number.

### Does Akeed import my old orders?

No. Akeed confirms orders placed after the store is connected.

### How do I pay?

With credits, like every account that does not use Shopify. See [Using Akeed Without Shopify](/docs/standalone-platform#how-credits-work).

### Can I connect two stores to one account?

No. An account has one order source.

## Related Guides

- [Getting Started](/docs/getting-started)
- [Order Confirmation](/docs/order-confirmation)
- [Automation Rules](/docs/automation-rules)
- [Troubleshooting](/docs/troubleshooting)
