---
title: Server API
description: Send cash-on-delivery orders from your own website or back end to Akeed with one HTTPS request, and retry safely.
order: 3
slug: server-api
---

## Overview

The Server API lets your own system send orders to Akeed as they are placed, instead of adding them by hand or importing a file. It is written for the developer who connects a custom website, an order system or a delivery back end.

**Your server → `POST /api/v1/orders` → Akeed stores the order → WhatsApp confirmation → result in your dashboard**

There is one endpoint, and it does one thing: it creates an order. From there the order follows the same confirmation flow as every other order in Akeed.

> [!INFO]
> The API is available on standalone accounts. Shopify stores do not need it, because their orders arrive automatically. See [Using Akeed Without Shopify](/docs/standalone-platform).

> [!WARNING]
> An API key is a secret for your server only. Never put it in a web page, a mobile app or any code a customer can open. Anyone who has the key can send orders to your store.

## Before You Start

| Requirement | Details |
| --- | --- |
| A ready store | A standalone Akeed account that has finished setup. |
| An API key | An owner or admin creates it in **Settings → API keys**. The key is shown once, so store it in your server's settings right away. |
| The endpoint address | Shown in **Settings → API keys** under **Send orders to**. The examples call it `$AKEED_API_URL`. |
| Automatic confirmation | Turned on in **Settings**. While it is off, the API refuses new orders. |
| Credits | Enough credits for the messages you will send. See [Using Akeed Without Shopify](/docs/standalone-platform). |
| HTTPS and JSON | Requests are sent over HTTPS with a JSON body in UTF-8. |

A key belongs to one store. Every order sent with it goes to that store. There is no field for choosing another store or account, and a request that tries to send one is rejected.

This guide describes version 1 of the API, under `/api/v1`. A change that would break your integration will get a new version instead of changing this one.

## Quick Start

### 1. Create a key

Sign in to Akeed, open **Settings → API keys** and select **Create key**. Copy the key and save it on your server as `AKEED_API_KEY`. Save the endpoint address shown on the same screen, without the `/api/v1/orders` path, as `AKEED_API_URL`.

### 2. Send one order

```bash
curl -i -X POST "$AKEED_API_URL/api/v1/orders" \
  -H "Authorization: Bearer $AKEED_API_KEY" \
  -H "Idempotency-Key: order-10023" \
  -H "Content-Type: application/json" \
  -d '{
  "externalOrderId": "10023",
  "customerName": "Mona Ali",
  "customerPhone": "+201001234567",
  "totalPrice": "450.00",
  "currency": "EGP",
  "paymentMethod": "cod",
  "city": "Cairo",
  "address": "12 Nile St",
  "notes": "Call before delivery"
}'
```

Every request needs these three headers:

| Header | Value |
| --- | --- |
| `Authorization` | `Bearer` followed by your key. A key sent in the URL is refused. |
| `Idempotency-Key` | A value you choose for this order. See [Sending an Order Twice](#sending-an-order-twice). |
| `Content-Type` | `application/json` |

Akeed answers:

```http
HTTP/1.1 202 Accepted
Content-Type: application/json; charset=utf-8
X-Correlation-Id: <CORRELATION_ID>

{
  "orderId": "<ORDER_ID>",
  "status": "accepted",
  "duplicate": false
}
```

### 3. Find the order in your dashboard

Open **Confirmations** in Akeed. The order is there, and the customer receives the WhatsApp confirmation message.

> [!WARNING]
> There is no test mode. An accepted cash-on-delivery order sends a real WhatsApp message and uses a credit. While you build, send orders with your own phone number.

## Order Fields

Send one order per request, as a JSON object.

### Field reference

| Field | Required | What to send |
| --- | --- | --- |
| `externalOrderId` | Yes | Your own id for the order. It is the order's identity in Akeed. Up to 100 characters. |
| `customerName` | Yes | The customer's name as it should appear in the message. Up to 255 characters. |
| `customerPhone` | Yes | International format with `+` and the country code, for example `+201001234567`. 7 to 20 characters. |
| `totalPrice` | Yes | A decimal **string** greater than zero with at most 2 decimals, for example `"450.00"`. A JSON number is rejected. |
| `currency` | Yes | One of the supported currency codes listed below. |
| `paymentMethod` | Yes | How the customer pays, in your own words, for example `cod` or `Credit Card`. Up to 100 characters. |
| `orderNumber` | No | The number the customer sees in the message. Defaults to `externalOrderId` as you wrote it. Up to 100 characters. |
| `orderDate` | No | The day the order was placed, as `YYYY-MM-DD`. A timestamp is rejected. |
| `city` | No | Delivery city. Up to 1,000 characters. |
| `address` | No | Delivery address. Up to 1,000 characters. |
| `notes` | No | Anything your team should see beside the order. Up to 1,000 characters. |

Supported currencies: USD, EUR, EGP, SAR, AED, QAR, KWD, BHD, OMR, JOD, MAD.

### How Akeed reads the fields

- **`externalOrderId` is the order's identity.** Use the id your own system already has for the order. Spaces, a leading `#` and the difference between capital and small letters are ignored, so `#A-1001`, `a-1001` and ` A-1001 ` are the same order. Orders imported from a file use the same identity, so an order you import and later send through the API is still one order.
- **`paymentMethod` decides whether a message is sent.** Akeed confirms cash-on-delivery orders only. Values such as `cod`, `cash on delivery`, `cash_on_delivery`, `pay on delivery` and `الدفع عند الاستلام` are read as cash on delivery. Any other value, such as `Credit Card`, is read as already paid.
- **Text is trimmed.** Spaces at the start and end of a value are removed before it is checked and stored.
- **Unknown fields are rejected.** A request with a field that is not in the table gets a `400`, so a typing mistake in a field name cannot pass unnoticed.
- **`orderNumber` is what the customer reads.** If your public order number differs from your internal id, send the internal id as `externalOrderId` and the public one as `orderNumber`.

## What "accepted" Means

A `202` response with `"status": "accepted"` means Akeed has stored the order safely. It does **not** mean the message was sent, delivered or answered. Those happen afterwards.

| Field | Meaning |
| --- | --- |
| `orderId` | Akeed's id for the order. Keep it with your own order so support can find it. |
| `status` | Always `accepted`. |
| `duplicate` | `false` when this request created the order. `true` when Akeed already had it and nothing new was created. |
| `verificationId` | Akeed's id for the confirmation. It is present only once a confirmation exists, so it is usually missing from the first answer and never present for an order that is not cash on delivery. |

What happens next depends on the order:

- **Cash on delivery:** Akeed sends the WhatsApp confirmation, follows up if the customer does not reply, and marks the result. Your quiet hours and sending delay apply, as they do for every order.
- **Not cash on delivery:** the order is stored and visible in your dashboard, but the customer is never messaged and no credit is used.

### Where to see the result

The result of every order is in your Akeed dashboard, in **Confirmations**: sent, delivered, read, confirmed, canceled, no reply or failed. See [Order Confirmation](/docs/order-confirmation) for what each status means and what to do with it.

The API creates orders and does nothing else. You cannot change or cancel an order through it, you cannot ask it for an order's status, and Akeed does not call your server back when a customer replies. Use the dashboard to decide what to ship.

## Sending an Order Twice

Networks fail, and jobs run twice. The API is built so that sending an order again is always safe: a customer never gets a second message, and you never pay twice.

### Choose one key per order

The `Idempotency-Key` header names the order you are sending. Build it from your own order id, for example `order-` followed by the id, and use **the same key every time you send that order**, including every retry. Do not use a random value or the current time: a retry would then look like a new request.

Keys have a minimum length (see [Limits](#limits)), so use a longer prefix if your order ids are very short. A key belongs to your store, not to the API key that sent it, so it keeps working after you replace an API key.

### What Akeed answers

| You send | Akeed answers |
| --- | --- |
| The same key and the same order data | `202` with `duplicate: true` and the original `orderId`. Nothing new is created or sent. |
| The same key and different order data | `409` `API_ORDER_IDEMPOTENCY_CONFLICT`. The stored order is not changed. |
| A new key for an `externalOrderId` Akeed already has, with identical order data | `202` with `duplicate: true` and the existing `orderId`. Nothing new is created or sent. |
| A new key for an `externalOrderId` Akeed already has, with different order data | `409` `API_ORDER_EXTERNAL_ID_CONFLICT`. The stored order is not changed. |

The third and fourth rows apply whichever way the order first reached Akeed, including a file import.

### "Identical" is strict

Two requests carry the same order only when every field matches, including the optional ones. Sending `city` the second time when the first request had none is different order data. So is a different `notes` or `orderNumber`.

The order of the fields in the JSON does not matter, and neither do spaces around a value.

Write `externalOrderId` the same way every time. `#10023` and `10023` are the same order, but when you send no `orderNumber`, the customer-facing number is taken from the id as you wrote it, so the two requests carry different order data.

For an order that came from a file import, compare with what the import stored. If the file had no order number for that row, Akeed gave the order a number that starts with `IMP-`, and a request for the same order matches only if it sends that value as `orderNumber`.

### Orders waiting in an import

An order that is already in Akeed keeps its state when you send it again. If it belongs to an import that has not been started, it stays **Awaiting start**. If its import was stopped or expired before the order was sent, the customer is still not contacted. The answer is the usual `duplicate: true` in both cases, and no message is sent. The dashboard always shows the real state.

### When to retry

| Response | Retry? |
| --- | --- |
| `202` | No. The order is stored. |
| No response, a timeout or a dropped connection | Yes, with the same key. If the first request arrived, you get `duplicate: true`. |
| `429` | Yes, with the same key, after the number of seconds in the `Retry-After` header. |
| `500` or `503` | Yes, with the same key. Wait a little longer between each attempt. |
| `400`, `401` or `413` | No. Fix the request or the key first. |
| `409` with a conflict code | No. The order already exists with other data. |
| `409` with any other code | Not yet. The store cannot send right now. Once the cause is fixed in Akeed, send the order again with the same key. |

## Limits

| Limit | Value |
| --- | --- |
| Requests | 60 per minute for each store. All keys of a store share the limit, so a second key does not add requests. |
| Request size | 32 KB for each request body. |
| Orders per request | One. There is no batch endpoint. |
| `Idempotency-Key` | 8 to 128 characters: letters, numbers, dots, underscores, colons and hyphens. |

A request over a limit is refused before Akeed looks at the order, so it never creates an order or uses a credit. These are the standard limits. If your store needs more, contact support before you go live.

## Examples

Every example below is run by an automated test against a test instance of the API, so the statuses and bodies are exactly what you get. Values in angle brackets, such as `<ORDER_ID>`, are placeholders. `$AKEED_API_URL` and `$AKEED_API_KEY` are your endpoint address and your key; all order data is made up.

### Create an order

A cash-on-delivery order from a ready store. `202` means Akeed stored the order. The WhatsApp message is sent afterwards.

```bash
curl -i -X POST "$AKEED_API_URL/api/v1/orders" \
  -H "Authorization: Bearer $AKEED_API_KEY" \
  -H "Idempotency-Key: order-10023" \
  -H "Content-Type: application/json" \
  -d '{
  "externalOrderId": "10023",
  "customerName": "Mona Ali",
  "customerPhone": "+201001234567",
  "totalPrice": "450.00",
  "currency": "EGP",
  "paymentMethod": "cod",
  "city": "Cairo",
  "address": "12 Nile St",
  "notes": "Call before delivery"
}'
```

The same request as raw HTTP:

```http
POST /api/v1/orders HTTP/1.1
Host: <AKEED_API_HOST>
Authorization: Bearer <API_KEY>
Idempotency-Key: order-10023
Content-Type: application/json

{
  "externalOrderId": "10023",
  "customerName": "Mona Ali",
  "customerPhone": "+201001234567",
  "totalPrice": "450.00",
  "currency": "EGP",
  "paymentMethod": "cod",
  "city": "Cairo",
  "address": "12 Nile St",
  "notes": "Call before delivery"
}
```

```http
HTTP/1.1 202 Accepted
Content-Type: application/json; charset=utf-8
X-Correlation-Id: <CORRELATION_ID>

{
  "orderId": "<ORDER_ID>",
  "status": "accepted",
  "duplicate": false
}
```

### Send the same request again

The same `Idempotency-Key` with the same body returns the original order with `duplicate: true`. No second order, message or credit.

Once Akeed has started the confirmation, the answer also carries its `verificationId`.

```bash
curl -i -X POST "$AKEED_API_URL/api/v1/orders" \
  -H "Authorization: Bearer $AKEED_API_KEY" \
  -H "Idempotency-Key: order-10023" \
  -H "Content-Type: application/json" \
  -d '{
  "externalOrderId": "10023",
  "customerName": "Mona Ali",
  "customerPhone": "+201001234567",
  "totalPrice": "450.00",
  "currency": "EGP",
  "paymentMethod": "cod",
  "city": "Cairo",
  "address": "12 Nile St",
  "notes": "Call before delivery"
}'
```

```http
HTTP/1.1 202 Accepted
Content-Type: application/json; charset=utf-8
X-Correlation-Id: <CORRELATION_ID>

{
  "orderId": "<ORDER_ID>",
  "verificationId": "<VERIFICATION_ID>",
  "status": "accepted",
  "duplicate": true
}
```

### Retry after a lost response

Your request timed out and you do not know whether Akeed received it. Send exactly the same request again, with the same `Idempotency-Key`. If the first one arrived, you get the same order back.

```bash
curl -i -X POST "$AKEED_API_URL/api/v1/orders" \
  -H "Authorization: Bearer $AKEED_API_KEY" \
  -H "Idempotency-Key: order-10023" \
  -H "Content-Type: application/json" \
  -d '{
  "externalOrderId": "10023",
  "customerName": "Mona Ali",
  "customerPhone": "+201001234567",
  "totalPrice": "450.00",
  "currency": "EGP",
  "paymentMethod": "cod",
  "city": "Cairo",
  "address": "12 Nile St",
  "notes": "Call before delivery"
}'
```

```http
HTTP/1.1 202 Accepted
Content-Type: application/json; charset=utf-8
X-Correlation-Id: <CORRELATION_ID>

{
  "orderId": "<ORDER_ID>",
  "status": "accepted",
  "duplicate": true
}
```

### Same key, different order data

The key `order-10023` was already used for an order of 450.00. Sending it with another amount is refused, and the stored order is not changed.

```bash
curl -i -X POST "$AKEED_API_URL/api/v1/orders" \
  -H "Authorization: Bearer $AKEED_API_KEY" \
  -H "Idempotency-Key: order-10023" \
  -H "Content-Type: application/json" \
  -d '{
  "externalOrderId": "10023",
  "customerName": "Mona Ali",
  "customerPhone": "+201001234567",
  "totalPrice": "999.00",
  "currency": "EGP",
  "paymentMethod": "cod",
  "city": "Cairo",
  "address": "12 Nile St",
  "notes": "Call before delivery"
}'
```

```http
HTTP/1.1 409 Conflict
Content-Type: application/json; charset=utf-8
X-Correlation-Id: <CORRELATION_ID>

{
  "code": "API_ORDER_IDEMPOTENCY_CONFLICT",
  "message": "Idempotency-Key was already used with different order data.",
  "correlationId": "<CORRELATION_ID>"
}
```

### New key for an order Akeed already has

Order `10023` already exists. Sending it again under a new key, with identical data, returns the existing order. Nothing new is stored or sent.

```bash
curl -i -X POST "$AKEED_API_URL/api/v1/orders" \
  -H "Authorization: Bearer $AKEED_API_KEY" \
  -H "Idempotency-Key: resync-10023" \
  -H "Content-Type: application/json" \
  -d '{
  "externalOrderId": "10023",
  "customerName": "Mona Ali",
  "customerPhone": "+201001234567",
  "totalPrice": "450.00",
  "currency": "EGP",
  "paymentMethod": "cod",
  "city": "Cairo",
  "address": "12 Nile St",
  "notes": "Call before delivery"
}'
```

```http
HTTP/1.1 202 Accepted
Content-Type: application/json; charset=utf-8
X-Correlation-Id: <CORRELATION_ID>

{
  "orderId": "<ORDER_ID>",
  "verificationId": "<VERIFICATION_ID>",
  "status": "accepted",
  "duplicate": true
}
```

### New key, same order id, different data

Order `10023` already exists with the note "Call before delivery". A new key with a different note is refused: a create request never updates an order.

```bash
curl -i -X POST "$AKEED_API_URL/api/v1/orders" \
  -H "Authorization: Bearer $AKEED_API_KEY" \
  -H "Idempotency-Key: resync-10023" \
  -H "Content-Type: application/json" \
  -d '{
  "externalOrderId": "10023",
  "customerName": "Mona Ali",
  "customerPhone": "+201001234567",
  "totalPrice": "450.00",
  "currency": "EGP",
  "paymentMethod": "cod",
  "city": "Cairo",
  "address": "12 Nile St",
  "notes": "Leave with the doorman"
}'
```

```http
HTTP/1.1 409 Conflict
Content-Type: application/json; charset=utf-8
X-Correlation-Id: <CORRELATION_ID>

{
  "code": "API_ORDER_EXTERNAL_ID_CONFLICT",
  "message": "An order with this externalOrderId already exists with different order data.",
  "correlationId": "<CORRELATION_ID>"
}
```

### Same order id, written differently

Order `10023` already exists. `#10023` is the same order, but without an `orderNumber` the customer-facing number is taken from the id as written, so the data differs and the request is refused.

```bash
curl -i -X POST "$AKEED_API_URL/api/v1/orders" \
  -H "Authorization: Bearer $AKEED_API_KEY" \
  -H "Idempotency-Key: resync-10023" \
  -H "Content-Type: application/json" \
  -d '{
  "externalOrderId": "#10023",
  "customerName": "Mona Ali",
  "customerPhone": "+201001234567",
  "totalPrice": "450.00",
  "currency": "EGP",
  "paymentMethod": "cod",
  "city": "Cairo",
  "address": "12 Nile St",
  "notes": "Call before delivery"
}'
```

```http
HTTP/1.1 409 Conflict
Content-Type: application/json; charset=utf-8
X-Correlation-Id: <CORRELATION_ID>

{
  "code": "API_ORDER_EXTERNAL_ID_CONFLICT",
  "message": "An order with this externalOrderId already exists with different order data.",
  "correlationId": "<CORRELATION_ID>"
}
```

Sending the original number as `orderNumber` makes the data identical again:

```http
HTTP/1.1 202 Accepted
Content-Type: application/json; charset=utf-8
X-Correlation-Id: <CORRELATION_ID>

{
  "orderId": "<ORDER_ID>",
  "verificationId": "<VERIFICATION_ID>",
  "status": "accepted",
  "duplicate": true
}
```

### An order that is not cash on delivery

A prepaid order is accepted and appears in the dashboard, but Akeed never messages the customer and no credit is used. The answer has no `verificationId`.

```bash
curl -i -X POST "$AKEED_API_URL/api/v1/orders" \
  -H "Authorization: Bearer $AKEED_API_KEY" \
  -H "Idempotency-Key: order-10024" \
  -H "Content-Type: application/json" \
  -d '{
  "externalOrderId": "10024",
  "customerName": "Mona Ali",
  "customerPhone": "+201001234567",
  "totalPrice": "450.00",
  "currency": "EGP",
  "paymentMethod": "Credit Card",
  "city": "Cairo",
  "address": "12 Nile St",
  "notes": "Call before delivery"
}'
```

```http
HTTP/1.1 202 Accepted
Content-Type: application/json; charset=utf-8
X-Correlation-Id: <CORRELATION_ID>

{
  "orderId": "<ORDER_ID>",
  "status": "accepted",
  "duplicate": false
}
```

Sending it again later gives the same order, still without a `verificationId`.

```http
HTTP/1.1 202 Accepted
Content-Type: application/json; charset=utf-8
X-Correlation-Id: <CORRELATION_ID>

{
  "orderId": "<ORDER_ID>",
  "status": "accepted",
  "duplicate": true
}
```

### Invalid phone number

The phone has no `+` and country code. `fieldErrors` names the field to fix.

```bash
curl -i -X POST "$AKEED_API_URL/api/v1/orders" \
  -H "Authorization: Bearer $AKEED_API_KEY" \
  -H "Idempotency-Key: order-10025" \
  -H "Content-Type: application/json" \
  -d '{
  "externalOrderId": "10025",
  "customerName": "Mona Ali",
  "customerPhone": "01001234567",
  "totalPrice": "450.00",
  "currency": "EGP",
  "paymentMethod": "cod",
  "city": "Cairo",
  "address": "12 Nile St",
  "notes": "Call before delivery"
}'
```

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8
X-Correlation-Id: <CORRELATION_ID>

{
  "code": "API_VALIDATION_FAILED",
  "message": "Order validation failed.",
  "correlationId": "<CORRELATION_ID>",
  "fieldErrors": {
    "customerPhone": "Invalid phone number format."
  }
}
```

### Missing Idempotency-Key

Every request needs the header.

```bash
curl -i -X POST "$AKEED_API_URL/api/v1/orders" \
  -H "Authorization: Bearer $AKEED_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "externalOrderId": "10023",
  "customerName": "Mona Ali",
  "customerPhone": "+201001234567",
  "totalPrice": "450.00",
  "currency": "EGP",
  "paymentMethod": "cod",
  "city": "Cairo",
  "address": "12 Nile St",
  "notes": "Call before delivery"
}'
```

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8
X-Correlation-Id: <CORRELATION_ID>

{
  "code": "API_VALIDATION_FAILED",
  "message": "Idempotency-Key header is required.",
  "correlationId": "<CORRELATION_ID>",
  "fieldErrors": {
    "idempotencyKey": "Idempotency-Key header is required."
  }
}
```

### Invalid API key

A revoked, unknown or mistyped key gets the same answer, so the response never reveals which keys exist.

```bash
curl -i -X POST "$AKEED_API_URL/api/v1/orders" \
  -H "Authorization: Bearer $AKEED_API_KEY" \
  -H "Idempotency-Key: order-10023" \
  -H "Content-Type: application/json" \
  -d '{
  "externalOrderId": "10023",
  "customerName": "Mona Ali",
  "customerPhone": "+201001234567",
  "totalPrice": "450.00",
  "currency": "EGP",
  "paymentMethod": "cod",
  "city": "Cairo",
  "address": "12 Nile St",
  "notes": "Call before delivery"
}'
```

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json; charset=utf-8
X-Correlation-Id: <CORRELATION_ID>

{
  "code": "API_KEY_INVALID",
  "message": "A valid API key is required.",
  "correlationId": "<CORRELATION_ID>"
}
```

### Request body too large

A body over 32 KB is refused before anything else is checked.

```bash
curl -i -X POST "$AKEED_API_URL/api/v1/orders" \
  -H "Authorization: Bearer $AKEED_API_KEY" \
  -H "Idempotency-Key: order-10026" \
  -H "Content-Type: application/json" \
  -d '{
  "externalOrderId": "10026",
  "customerName": "Mona Ali",
  "customerPhone": "+201001234567",
  "totalPrice": "450.00",
  "currency": "EGP",
  "paymentMethod": "cod",
  "city": "Cairo",
  "address": "12 Nile St",
  "notes": "<40,000 characters of text>"
}'
```

```http
HTTP/1.1 413 Payload Too Large
Content-Type: application/json; charset=utf-8
X-Correlation-Id: <CORRELATION_ID>

{
  "code": "API_PAYLOAD_TOO_LARGE",
  "message": "The request body is too large.",
  "correlationId": "<CORRELATION_ID>"
}
```

### Too many requests

The store already sent 60 requests in the last minute. Wait the number of seconds in `Retry-After`, then send the same request again.

```bash
curl -i -X POST "$AKEED_API_URL/api/v1/orders" \
  -H "Authorization: Bearer $AKEED_API_KEY" \
  -H "Idempotency-Key: order-10027" \
  -H "Content-Type: application/json" \
  -d '{
  "externalOrderId": "10027",
  "customerName": "Mona Ali",
  "customerPhone": "+201001234567",
  "totalPrice": "450.00",
  "currency": "EGP",
  "paymentMethod": "cod",
  "city": "Cairo",
  "address": "12 Nile St",
  "notes": "Call before delivery"
}'
```

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json; charset=utf-8
X-Correlation-Id: <CORRELATION_ID>
Retry-After: <SECONDS>

{
  "code": "API_RATE_LIMITED",
  "message": "Too many requests. Wait for the Retry-After period, then retry with the same Idempotency-Key.",
  "correlationId": "<CORRELATION_ID>"
}
```

### Automatic confirmation is turned off

The store cannot send messages right now, so the order is refused instead of being stored and forgotten.

```bash
curl -i -X POST "$AKEED_API_URL/api/v1/orders" \
  -H "Authorization: Bearer $AKEED_API_KEY" \
  -H "Idempotency-Key: order-10023" \
  -H "Content-Type: application/json" \
  -d '{
  "externalOrderId": "10023",
  "customerName": "Mona Ali",
  "customerPhone": "+201001234567",
  "totalPrice": "450.00",
  "currency": "EGP",
  "paymentMethod": "cod",
  "city": "Cairo",
  "address": "12 Nile St",
  "notes": "Call before delivery"
}'
```

```http
HTTP/1.1 409 Conflict
Content-Type: application/json; charset=utf-8
X-Correlation-Id: <CORRELATION_ID>

{
  "code": "API_AUTO_VERIFY_DISABLED",
  "message": "Enable automatic verification before submitting orders.",
  "correlationId": "<CORRELATION_ID>"
}
```

### Store setup is not finished

The store behind the key has not completed setup.

```http
HTTP/1.1 409 Conflict
Content-Type: application/json; charset=utf-8
X-Correlation-Id: <CORRELATION_ID>

{
  "code": "API_SETUP_INCOMPLETE",
  "message": "Complete Standalone setup before submitting orders.",
  "correlationId": "<CORRELATION_ID>"
}
```

### Store cannot accept orders

The store behind the key was deactivated or replaced.

```http
HTTP/1.1 409 Conflict
Content-Type: application/json; charset=utf-8
X-Correlation-Id: <CORRELATION_ID>

{
  "code": "API_SOURCE_UNAVAILABLE",
  "message": "The store this API key belongs to cannot accept orders.",
  "correlationId": "<CORRELATION_ID>"
}
```

### Not enough credits

The balance cannot cover one more message. Nothing is stored. Buy credits, then send the order again with the same key.

```http
HTTP/1.1 409 Conflict
Content-Type: application/json; charset=utf-8
X-Correlation-Id: <CORRELATION_ID>

{
  "code": "INSUFFICIENT_CREDITS",
  "message": "Credit is not available for this action.",
  "correlationId": "<CORRELATION_ID>"
}
```

## Error Codes

Every error has the same shape. Read `code`, not the message text: codes never change, messages may be reworded.

```json
{
  "code": "API_VALIDATION_FAILED",
  "message": "Order validation failed.",
  "correlationId": "<CORRELATION_ID>",
  "fieldErrors": {
    "customerPhone": "Invalid phone number format."
  }
}
```

`fieldErrors` appears only with `API_VALIDATION_FAILED`. `correlationId` is also sent in the `X-Correlation-Id` response header, on successful requests too.

| Code | Status | What it means | What to do |
| --- | --- | --- | --- |
| `API_VALIDATION_FAILED` | 400 | A field, the `Idempotency-Key` header or the JSON itself is invalid. `fieldErrors` names each problem. | Fix the request. Sending it again unchanged fails the same way. |
| `API_REQUEST_REJECTED` | 400 | The request was refused for a reason that has no code of its own. The status can be any 4xx. | Check the method, path and headers against this guide. |
| `API_KEY_INVALID` | 401 | The key is missing, mistyped, revoked, sent in the URL, or not sent as `Authorization: Bearer <key>`. | Check the header. If the key was revoked or lost, create a new one in **Settings → API keys**. |
| `API_ORDER_IDEMPOTENCY_CONFLICT` | 409 | This `Idempotency-Key` was already used for different order data. | Use one key per order. Do not reuse a key for another order or for a changed order. |
| `API_ORDER_EXTERNAL_ID_CONFLICT` | 409 | Akeed already has an order with this `externalOrderId`, and its data is different. | Orders cannot be changed through the API. Open the order in the dashboard, or use a new `externalOrderId` if it really is a new order. |
| `API_SOURCE_UNAVAILABLE` | 409 | The store this key belongs to cannot take orders: it was deactivated or replaced. A store that is not a Standalone store answers the same code with status 403. | Sign in to Akeed and check the store. Contact support if it looks active. |
| `API_SETUP_INCOMPLETE` | 409 | The store has not finished setup. | Finish setup in the Akeed app, then send the order again with the same key. |
| `API_AUTO_VERIFY_DISABLED` | 409 | Automatic confirmation is turned off for the store. | Turn it on in **Settings**, then send the order again with the same key. |
| `API_ENTITLEMENT_REQUIRED` | 409 | The store has no active plan or billing. | Open **Billing & credits** in the Akeed app. |
| `API_PLAN_LIMIT_REACHED` | 409 | The confirmations included for this period are used up. | Open **Billing & credits** in the Akeed app. |
| `INSUFFICIENT_CREDITS` | 409 | The credit balance cannot cover one more message. | Buy credits, then send the order again with the same key. |
| `CREDIT_ACCOUNT_SUSPENDED` | 409 | The credit account is suspended. | Contact support. |
| `CREDIT_DEBT_OUTSTANDING` | 409 | The credit account has a negative balance to settle first. | Open **Billing & credits** and settle the balance. |
| `CREDIT_ACCOUNT_NOT_PROVISIONED` | 409 | The store has no credit account. | Contact support. |
| `API_PAYLOAD_TOO_LARGE` | 413 | The request body is larger than the limit. | Send one order per request and keep the text fields short. |
| `API_RATE_LIMITED` | 429 | Too many requests in one minute. | Wait the number of seconds in `Retry-After`, then send the request again with the same key. |
| `API_INTERNAL_ERROR` | 500 | Something failed on Akeed's side. | Retry with the same key. If it keeps failing, send support the `correlationId`. |
| `API_ORDER_ACCEPTANCE_FAILED` | 503 | The order could not be stored. Nothing was saved. | Retry with the same key. |
| `API_ORDER_DISPATCH_FAILED` | 503 | The order was stored, but its confirmation could not be queued. | Retry with the same key. The retry queues the same order and never creates a second one. |

If you receive a `409` with a code that is not in this table, treat it the same way as the credit codes: the store cannot send right now, and nothing was stored.

## Getting Help

Every response carries an `X-Correlation-Id` header, and every error repeats it as `correlationId` in the body. It identifies that one request in Akeed's logs. Log it on your side for every request that does not return `202`.

When you [contact support](/support), send:

- the `correlationId`
- the date and time of the request
- the error `code` you received
- your `externalOrderId`

Never send your API key, in full or in part, to anyone. Support does not need it. If a key may have been exposed, revoke it in **Settings → API keys** and create a new one: requests with the old key are refused at once, and orders it already sent are kept.

You can also set the header yourself. If your request has an `X-Correlation-Id` of 8 to 64 letters, numbers, dots, underscores or hyphens, Akeed uses your value, so one id follows the order through both systems.

## FAQ

### Can I update or cancel an order through the API?

No. The API only creates orders. Sending changed data for an existing order returns a `409` and leaves the order as it was.

### How do I know whether the customer confirmed?

Look at the order in **Confirmations** in your dashboard. There is no status endpoint, and Akeed does not send callbacks to your server.

### Can I call the API from my website's front end or my mobile app?

No. The key would be visible to anyone who opens the page or the app. Send the order from your server after the customer places it.

### Can I send several orders in one request?

No. Send one request per order. For a large one-time batch, use [Bulk Order Import](/docs/bulk-order-import).

### What happens to orders that are already paid?

They are accepted and shown in your dashboard, but the customer is not messaged and no credit is used.

### Do I need a different key for each server?

It is a good habit. Name each key after the server that uses it, so you can revoke one without stopping the others. All keys of a store share the same request limit.

### Does a retry cost a credit?

No. A retry with the same key, or a second request for an order Akeed already has, never sends a second message.

## Related Guides

- [Using Akeed Without Shopify](/docs/standalone-platform)
- [Bulk Order Import](/docs/bulk-order-import)
- [Order Confirmation](/docs/order-confirmation)
- [Automation Rules](/docs/automation-rules)
- [Troubleshooting](/docs/troubleshooting)
