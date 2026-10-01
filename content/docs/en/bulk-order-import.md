---
title: Bulk Order Import
description: Import COD orders from a CSV or Excel file, check them, and start WhatsApp confirmation for all of them at once.
order: 3
slug: bulk-order-import
---

## Overview

Bulk Order Import lets you bring many cash-on-delivery (COD) orders into Akeed from a spreadsheet, instead of adding them one by one.

**CSV or XLSX → Map columns → Preview orders → Import → Start WhatsApp confirmation**

Importing never messages anyone by itself. Customers are contacted only when you press **Send**, and only after you have seen how many messages will go out and what they will cost.

Bulk import is available on standalone accounts. If you use Akeed on Shopify, your orders already arrive automatically. See [Using Akeed Without Shopify](/docs/standalone-platform).

> [!INFO]
> Only owners and admins can import orders. Viewers can see the imported orders in the Confirmations list but cannot import or change them.

## Before You Start

| Requirement | Details |
| --- | --- |
| File type | `.csv` or `.xlsx`. Older `.xls` files, files with macros and password-protected files are not accepted. |
| Size | Up to 5 MB and 100 orders per file. For more orders, split the file and import each part. |
| Header row | The first row must contain column names. |
| Minimum columns | Customer phone, customer name and order amount. |
| Credits | Enough credits for every order you want to confirm. See [Using Akeed Without Shopify](/docs/standalone-platform). |

No file ready? Download the sample **CSV** or **Excel** template on the upload screen, in Arabic or English.

Optional columns Akeed can use: order number, currency, payment method, order date, city, address and notes.

## Step by Step

### 1. Choose your file

Select **Import from file** in the top bar, then drag your file in or choose it from your device. Akeed reads the file and moves to the next step by itself.

### 2. Map the columns

Akeed matches your column names to its own fields automatically, in Arabic or English, ignoring capital letters and punctuation. Matched columns are marked **Matched**. Items marked **Check this** or **Required** need you to choose the right column from a list. Columns Akeed cannot match are not imported.

Also check the import settings:

| Setting | What it does |
| --- | --- |
| Phone country | Used to read phone numbers written without a country code. |
| Default currency | Used for rows that have no currency. |
| Date format | Asked only when dates such as `05/06/2026` could be read two ways. |

If your file has a payment column, Akeed asks **Which orders do we confirm?** and sorts the values you use into two groups, **Confirm · cash on delivery** and **Skip · paid in advance**. Tap a value to move it. Akeed remembers your choices for your next files.

### 3. Preview the orders

Akeed checks every row and shows how many orders are ready, and why any others will be skipped. Nothing has been imported yet. Use **Change** or **Show** next to a reason to see the rows.

| Result | Meaning | What to do |
| --- | --- | --- |
| Ready | Will be imported and confirmed. | Nothing. |
| Needs fixing | A required detail is missing or invalid, such as a phone number. | Fix the number on screen, or fix the file and upload it again. |
| Duplicate | Already imported before, or repeated in the same file. | Nothing. It will not be imported again. |
| Excluded | Skipped on purpose. See the reasons below. | Leave it, or include it if it was a possible duplicate. |

Rows are excluded when the payment is not cash on delivery, when the order date is more than 7 days old, or when it looks like an order you already have (the same phone and amount in the last 7 days, or the same order number in the last 30 days). If you know a possible duplicate is a real new order, choose **Include anyway**.

### 4. Import and start confirmation

The preview ends with the cost and timing: the number of messages, up to double that if follow-ups are on, your balance after sending, and the expected time. Press **Send to N customers**.

Akeed then imports the ready orders and starts confirmation. You can follow each order's status in **Confirmations**.

> [!WARNING]
> If your balance does not cover every order, or automatic confirmation is turned off, **Send** is blocked and nothing is sent. Akeed shows how many credits you are short and a **Buy credits** button. There are no partial starts.

## What Akeed Recognizes

You do not need to rename your columns. Akeed recognizes common names in English and Arabic, including the ones used by Shopify order exports.

| Detail | Examples of recognized names |
| --- | --- |
| Customer phone | Phone, Mobile, Shipping Phone, Billing Phone, WhatsApp, رقم الهاتف, الموبايل |
| Customer name | Customer name, Full name, Shipping Name, الاسم, اسم العميل. First and last name columns are joined. |
| Amount | Amount, Total, Price, COD Amount, الإجمالي, المبلغ |
| Order number | Order ID, Order Number, Name (when it holds values like `#1001`), رقم الطلب |
| Currency | Currency, العملة |
| Payment method | Payment Method, Payment, Financial Status, طريقة الدفع |
| Order date | Order Date, Created at, التاريخ |
| City and address | City, Governorate, Shipping City, Address, Shipping Street, المدينة, العنوان |

Email and product (line item) columns are not imported. Shopify exports list one row per product. Rows with the same order number, phone and amount are combined into one order.

### Phone numbers

- If a file has more than one phone column, Akeed uses the **shipping phone** first, then **phone**, then **billing phone**. You can choose a different column.
- Numbers are converted to international format. A number that starts with `+` or `00` keeps its own country. Other numbers use your **Phone country**, which defaults to your store's country or Egypt.
- Egyptian numbers that lost their leading zero in Excel are repaired.
- Landline numbers, cells holding two numbers, and numbers Excel turned into scientific notation (such as `2.01E+11`) are rejected, because WhatsApp needs one valid mobile number. Format the phone column as text, or correct the number on the preview screen.

### Currency and amounts

- The currency comes from the row's currency column. If there is none, Akeed also reads a code or symbol written in the amount (such as `EGP 750` or `750 ج.م`). If that is missing too, it uses your default currency.
- Supported currencies: EGP, SAR, AED, QAR, KWD, BHD, OMR, JOD, MAD, USD and EUR.
- Amounts must be more than zero with at most two decimals. Arabic digits are understood. If a comma could mean thousands or decimals, Akeed asks you to fix that row instead of guessing.

## Saved Column Mapping

When you continue past the column step, Akeed saves your mapping. The next time you upload a file with the same column names, in any order, it is applied automatically. You can still review and change it. Your cash-on-delivery choices for payment values are remembered too.

## Held Orders and Safety

After import, and before confirmation starts, orders are **held** and shown as **Awaiting start** in the Confirmations list. A held order has not been messaged.

You normally never see this state, because **Send** imports and starts in one action. You see it only if starting is blocked after the import, for example if your balance changed. In that case the orders wait, and you can start them from the import screen.

| Rule | Details |
| --- | --- |
| Starting | Starting sends to every held order of that import. To leave an order out, take it out of the file and upload it again before you send. |
| Start window | Held orders must be started within 24 hours. Otherwise they are withdrawn at no cost, and you can upload the file again. |
| Pacing | Akeed sends gradually, about 20 first messages per minute, so your WhatsApp quality stays healthy. |
| Quiet hours | If you set quiet hours in Settings, sending pauses during them and resumes afterward. |
| Out of credits | If credits run out while sending, the import pauses. Buy credits and choose **Resume**. |

## Same File Twice: Safe by Design

- An order that has an order number is imported **once**, even if you upload the same file again or press Import twice.
- If you upload the same file again within 24 hours, Akeed warns you and lets you continue or view the earlier import.
- Orders without an order number get a reference from Akeed. If their phone and amount match a recent order, they are marked as possible duplicates and left out unless you include them.

## Imported Orders in the Confirmations list

Imported orders live in the same **Confirmations** list as every other order and work the same way: status, follow-up, no-reply handling, retry and cancel, and credit use. Statuses before the first message are **Awaiting start**, **Queued** and **Sending**.

## Privacy and Retention

- Your file itself is never stored. Akeed keeps only its name, size and a fingerprint.
- An import you have not sent expires after 24 hours and its rows are deleted.
- Row details from sent imports are deleted after 90 days. Counts and the link to each order remain.
- Phone numbers and names are not written to Akeed's logs.
- You can have a few imports in progress at once, and uploads are limited to a few per minute.

## Troubleshooting

| What you see | What to do |
| --- | --- |
| This file type isn't supported | Save as Excel Workbook (`.xlsx`) or CSV UTF-8, without macros or a password. |
| This file has too many orders | Split it into files of up to 100 orders. |
| We need your help with a column | Choose the right column for phone, name or amount in the column step. |
| Excel turned this phone into a number like 2.01E+11 | Format the phone column as text and export the file again. |
| This is a landline | Replace it with the customer's mobile number. |
| Not cash on delivery, so it won't be confirmed | Check the payment value. If it is really COD, move it to **Confirm · cash on delivery** in the column step. |
| Order is more than 7 days old | Orders that old are too late to confirm. To skip date checks, set the order date to **Not in the file** in the column step. |
| Buy credits to start | Buy credits so your balance covers every order, then press **Send** again. |
| Automatic confirmation is turned off | Turn it on in Settings, then send. |
| This import expired | Upload the file again. |
| Importing isn't available for this store | Bulk import is for standalone accounts. Shopify stores receive orders automatically. |

## FAQ

### Does importing send messages?

No. Messages are sent only after you press **Send**, and Akeed shows the cost first.

### Can I import more than 100 orders?

Not in one file. Split the file into parts of up to 100 orders and import each part.

### Can I choose which orders to confirm after the import?

Starting applies to the whole import. Take out any orders you do not want from the file before you press **Send**.

### What happens to customers who do not reply?

The same as for any other order: a follow-up, then **No reply**. See [Automation Rules](/docs/automation-rules).

### How many credits will an import use?

One credit per message. A file of 80 ready orders uses 80 credits (EGP 160 at EGP 2.00 per credit), or up to 160 credits if follow-ups are on and customers do not reply.

### Can I download a report of rows that were skipped?

Not yet. The preview screen shows the reason for every skipped row.

## Related Guides

- [Using Akeed Without Shopify](/docs/standalone-platform)
- [Order Confirmation](/docs/order-confirmation)
- [Automation Rules](/docs/automation-rules)
- [Troubleshooting](/docs/troubleshooting)
