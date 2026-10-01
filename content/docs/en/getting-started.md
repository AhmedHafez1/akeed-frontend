---
title: Getting Started
description: Set up Akeed on Shopify or with your own store, and send your first COD confirmation message.
order: 1
slug: getting-started
---

## Overview

**Akeed — COD confirmation infrastructure for merchants.** Akeed helps you confirm cash-on-delivery orders on WhatsApp before shipping. For every eligible COD order, Akeed sends a confirmation message and updates your dashboard when the customer responds.

Akeed works in two ways. Use this guide when you are setting it up for the first time.

| If you… | Use | How orders arrive | How you pay |
| --- | --- | --- | --- |
| Have a Shopify store | [Path A: Shopify](#path-a-shopify) | Automatically from your store. | A monthly plan billed by Shopify. |
| Sell anywhere else, or work from a spreadsheet | [Path B: Your own store](#path-b-your-own-store-no-shopify) | You add them one by one, or import a file. | Credits, bought through Paymob. |

> [!INFO]
> Akeed is designed for COD order confirmation. It does not send confirmation messages for online-paid orders.

## Path A: Shopify

### Before You Start

Make sure you have:

- Access to your Shopify store admin.
- Permission to install apps and approve app subscriptions.
- At least one recent COD order or a phone number you can use for a test confirmation.

You do not need to connect your own WhatsApp number for the standard setup. Akeed sends messages through official WhatsApp infrastructure.

### Step 1: Install Akeed

Install Akeed from Shopify and open the app from your Shopify admin. If this is your first time opening Akeed, you will be guided through onboarding.

During installation, Shopify may ask you to approve app permissions. These permissions allow Akeed to read order details, detect COD orders, and update Shopify orders after confirmation.

### Step 2: Complete Store Setup

In the setup screen, review your store settings:

| Setting | What It Means |
| --- | --- |
| Store name | The name shown in your app setup and message previews. |
| App language | The language used inside Akeed. |
| Default message language | The language Akeed uses for customer WhatsApp messages. |
| Auto-confirmation | Whether new eligible COD orders are confirmed automatically. |

For most stores, keep auto-confirmation enabled. This lets Akeed send confirmation messages automatically when a new COD order is created.

### Step 3: Choose a Plan

Choose the plan that matches your expected monthly COD confirmation volume.

| Plan | Included Confirmations | Best For |
| --- | ---: | --- |
| Starter | 30 | Trying Akeed for the first time. |
| Basic | 300 | Small stores confirming COD orders regularly. |
| Pro | 1,000 | Stores with daily COD volume and automation needs. |
| Scale | 2,500 | Higher-volume COD operations. |

> [!WARNING]
> When your included confirmation limit is reached, new WhatsApp sends may stop until your plan renews or you upgrade.

### Step 4: Send a Test Confirmation

After onboarding, open the Akeed dashboard and send a test confirmation to your own phone number.

Use the test to verify:

- The WhatsApp message is delivered.
- The confirm and cancel buttons work.
- The result appears in your Akeed dashboard.

Test confirmations help you understand the customer experience before real orders start flowing.

### Step 5: Review Your Dashboard

The dashboard shows your order confirmation activity, including:

- Confirmed orders.
- Canceled orders.
- Orders waiting for customer response.
- Failed or blocked sends.
- Follow-ups sent.
- Current plan usage.

Check the dashboard regularly so your fulfillment team knows which COD orders are ready to ship.

## Path B: Your Own Store (No Shopify)

Use this path if you do not use Shopify. See [Using Akeed Without Shopify](/docs/standalone-platform) for the full picture.

### Step 1: Create Your Account

Sign up and confirm your email address.

### Step 2: Set Up Your Store

Enter your store name and your own WhatsApp number. You do not need to connect a WhatsApp number for customers. Akeed sends messages from its official number.

### Step 3: Try the Message

Akeed sends a free test confirmation to your own number. Check that it arrives and that the confirm and cancel buttons work. You can skip this step.

### Step 4: Add Your Orders

- **One order:** use **Verify order** on the dashboard.
- **Many orders:** use **Import from file** to bring in a CSV or Excel file. See [Bulk Order Import](/docs/bulk-order-import).

### Step 5: Keep Credits Available

You start with 30 free credits. One credit is one WhatsApp message, and a follow-up costs one more. Open **Billing & credits** to buy more through Paymob with a card or Vodafone Cash.

> [!WARNING]
> When your credits run out, new confirmations stop until you buy more.

## Common Mistakes

| Mistake | How To Avoid It |
| --- | --- |
| Turning off auto-confirmation by accident | Keep auto-confirmation enabled unless you want to pause all new COD confirmations. |
| Shipping before the customer responds | Wait for a confirmed status whenever possible. |
| Ignoring plan usage or credit balance | Watch your usage bar (Shopify) or your credit balance (standalone) so sends do not stop unexpectedly. |
| Setting very long delays | Keep first-send and follow-up delays practical for your fulfillment workflow. |

## Troubleshooting

### A COD order was not confirmed

Check that auto-confirmation is enabled and that the order payment method is actually cash on delivery.

### A test message did not arrive

Make sure the phone number is valid and includes the country code. If the issue continues, try another phone number before contacting support.

### New sends stopped

On Shopify, check your plan usage. If your included confirmations are used up, upgrade your plan or wait for the next billing period. On a standalone account, check your credit balance and buy more credits if it is empty.

## FAQ

### Does Akeed confirm every order?

No. Akeed is focused on cash-on-delivery orders. Online-paid orders are not automatically confirmed through this workflow.

### Do I need Shopify to use Akeed?

No. Shopify stores install Akeed from Shopify. Everyone else can use a standalone account. See [Using Akeed Without Shopify](/docs/standalone-platform).

### Do I need my own WhatsApp Business account?

Not for the standard setup. Akeed can send confirmation messages using its official WhatsApp infrastructure.

### Can I change the message language later?

Yes. You can change the default message language from settings.

### What should I do after a customer confirms?

Use the dashboard status to decide whether the order is ready for fulfillment. Confirmed COD orders are safer to ship than orders with no customer response.
