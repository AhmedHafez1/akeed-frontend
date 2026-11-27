---
title: Shipping Notifications
description: Send one WhatsApp message when a Shopify order ships, and act on the customer's reply.
order: 8
slug: shipping-notifications
---

## Overview

When you ship a COD order, Akeed can send the customer one WhatsApp message. It says the order is on its way, asks the customer to have the total ready in cash and keep their phone on for the courier, includes the tracking number when you add one, and offers three buttons, **I’ll receive it**, **Won’t be available** and **Change address**, followed by a **Track order** button.

Shipping notifications are available for Shopify stores.

## Switch It On

1. Open **Settings › Shipping**.
2. Tick **Send a message when an order ships**.
3. Choose what marks an order as shipped under **When to send**.
4. Click **Save**.

## When the Message Is Sent

- **When I fulfill the order**: Akeed sends the message when you fulfill the order in Shopify.
- **When I add a tag**: add up to 10 tags you already use, such as `Shipped`. Akeed sends the message when one of them is added to the order.

Each order gets one Shipped message, the first time either happens. Akeed's own tags, such as `Akeed: Verified`, never count.

The message goes to COD orders that Akeed received. Test orders, cancelled orders and orders older than 30 days are skipped.

## The Shipping Column

Your orders list shows one word per order in the **Shipping** column. The **Status** column keeps the confirmation result, such as **Confirmed**.

| What you see | What it means |
| --- | --- |
| **Sent** | The message went out. Hover the word to see whether it was delivered or read. |
| **Will receive** | The customer tapped **I’ll receive it**. |
| **Not available** | The customer tapped **Won’t be available**. Contact them. |
| **Change address** | The customer asked to change the address. Contact them. |
| **WhatsApp undeliverable** | The customer has no phone number, or the number is not on WhatsApp. |
| **Failed to send** | Something stopped the message. Hover the word to see why. |
| **Not sent** | The order is older than 30 days or was cancelled. |

After you click **Mark done**, the word stays in grey. Hover it to see when it was done.

Open an order to see why the message was sent, its tracking and the customer's reply.

## Why a Message Was Not Sent

| Reason | What to do |
| --- | --- |
| No phone number | Contact the customer another way. |
| Number isn’t on WhatsApp | Call the customer. |
| No messages left in your plan | Choose a bigger plan, or wait for the next period. |
| WhatsApp couldn’t deliver it | Contact the customer directly. |
| Not available in this language yet | The message in that language is waiting for WhatsApp's approval. |
| Order is older than 30 days | Nothing to do. |
| Order was cancelled | Nothing to do. |

## Track Order Button

**Track order** opens your courier’s tracking page when the shipment has a tracking link, or when Akeed recognizes the courier and the tracking number. Otherwise it opens a short Akeed page with your store name, the order number, the courier and the tracking number to copy. It never shows the customer’s address or phone number.

## Customer Replies

When the customer taps **Won’t be available** or **Change address**, the order moves to **Needs your action**. Contact the customer, arrange the delivery with your courier, then click **Mark done** in the order's **⋯** menu or in its details.

**I’ll receive it** needs nothing from you. If thank-you messages are on, Akeed thanks the customer for their reply.

An order whose message could not reach the customer also appears in **Needs your action**, with **WhatsApp undeliverable** in the **Shipping** column. Call the customer, then click **Mark done**.

Only the store owner and admins can mark a reply done.

## Billing

Each Shipped message uses 1 message from your plan, like a confirmation. If you send from your own WhatsApp number, it uses your own-number messages first. When your plan has no messages left, the Shipped message is not sent.
