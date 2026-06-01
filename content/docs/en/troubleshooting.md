---
title: Troubleshooting
description: Fix common COD confirmation issues quickly with clear checks and next actions.
order: 6
slug: troubleshooting
---

## Overview

This page helps you quickly diagnose and fix the most common operational issues in Akeed.

Use it when:

- orders are not getting confirmed,
- messages are delayed or not sent,
- too many orders move to no-reply,
- plan usage blocks new sends.

## Quick Triage Checklist

Before deep troubleshooting, check these first:

1. Auto-confirmation is enabled.
2. Order is COD-eligible.
3. Plan usage has not reached the limit.
4. Quiet hours are not delaying sends.
5. Phone number format includes country code.

These five checks solve most issues.

## Issue: Order was not confirmed

### What to check

- Was the order payment method COD?
- Is auto-confirmation enabled in settings?
- Did the order enter pending/sent status in dashboard?

### What to do

1. Confirm the order is COD.
2. Confirm auto-confirmation is enabled.
3. Send a test confirmation to a known-valid number.
4. If test works but real order does not, review order data and timing rules.

## Issue: Message was not sent

### What to check

- Current plan usage (`used / limit`).
- Failed sends in dashboard.
- Send delay + quiet-hours configuration.

### What to do

1. If usage is near/full, upgrade plan or wait for next cycle.
2. If failed status appears, verify customer phone quality.
3. If delayed, check quiet hours and timezone settings.

> [!WARNING]
> Plan limit reached can look like a sending outage. Always check usage before deeper debugging.

## Issue: Customer says they did not receive message

### What to check

- Phone number format and country code.
- Whether status is sent/delivered/failed.
- Whether customer is in a region/time window with low response.

### What to do

1. Re-test with a clean, known-valid number.
2. Review template language and style for customer segment.
3. Use follow-up reminders to recover missed first messages.

## Issue: Too many no-reply orders

### Likely causes

- Initial send delay is too long.
- Follow-up is disabled.
- Escalation is too aggressive.
- Message style/language is not audience-fit.

### What to do

1. Reduce first-send delay.
2. Enable follow-up.
3. Increase escalation window slightly.
4. Test a better-fitting template style.

## Issue: Auto-confirmation looks disabled

### What to check

- Auto-confirmation toggle in settings.
- Save status (did setting change actually save?).
- Any recent config rollback after an error.

### What to do

1. Re-enable auto-confirmation.
2. Save and confirm success banner.
3. Send a test confirmation to verify behavior.

## Issue: Quiet hours are delaying messages too much

### What to check

- Quiet hours start/end values.
- Selected timezone.
- Whether quiet-hours window overlaps your main order volume period.

### What to do

1. Confirm timezone is correct for your operating market.
2. Narrow quiet-hours window if needed.
3. Re-test with a live order and watch status timing.

## Issue: Billing or plan change problems

### What to check

- Current billing status in settings.
- Whether plan change was approved in Shopify.
- Usage level vs included limit.

### What to do

1. Retry plan change if approval was not completed.
2. Keep current active plan if upgrade was declined.
3. Upgrade before reaching hard usage limit in busy periods.

## When to Contact Support

Contact support when:

- issue persists after checklist + issue-specific steps,
- test message also fails repeatedly,
- billing status appears inconsistent with Shopify approval.

When contacting support, include:

- shop name,
- affected order number,
- screenshot of status,
- timestamp of issue,
- what you already tried.

This shortens time-to-fix significantly.

## FAQ

### Can I recover performance after a bad configuration change?

Yes. Roll back to last stable settings, then re-test one change at a time.

### Should I disable automation while troubleshooting?

Only if needed for risk control. In most cases, targeted setting corrections are enough.

### What is the fastest health check?

Run a test confirmation and verify:

- message sent,
- response captured,
- status updated in dashboard.

See also: [Getting Started](/docs/getting-started)
