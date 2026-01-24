# Stripe Webhook Architecture

This document explains the simplified webhook logic for handling subscriptions and memberships.

## Overview

The webhook handles five essential events to maintain accurate membership state:

1. **customer.subscription.created** - Creates memberships with billing period
2. **customer.subscription.updated** - Updates subscription status changes
3. **invoice.payment_succeeded** - Confirms payment and updates billing period
4. **invoice.payment_failed** - Marks membership as past_due
5. **invoice.finalized** - Cancels membership when invoice is uncollectible

Additionally, `checkout.session.completed` handles order creation (payment mode only).

## Key Design Principles

1. **No External API Calls**: Never call `stripe.subscriptions.retrieve()` - use event data directly
2. **Event Data Only**: All data comes from `event.data.object`
3. **current_period_end Always Set**: Billing periods are set immediately from subscription/invoice data
4. **Simple Status Mapping**: Three primary statuses (active, past_due, canceled)
5. **Idempotent Operations**: Safe to receive duplicate events

## Event Handlers

### 1. checkout.session.completed

**Purpose:** Handle completed checkout sessions for orders only

**Process:**
- Subscription checkouts are ignored (handled by `customer.subscription.created`)
- Payment mode creates order records with items
- Includes customer info, shipping address, and billing address

**Key Points:**
- Subscriptions are NOT handled here
- Only processes payment mode sessions
- Creates order and order_items records

### 2. customer.subscription.created

**Purpose:** Create membership when subscription is first created

**Process:**
- Extracts `price_id` from `subscription.items.data[0].price.id`
- Looks up membership plan by `stripe_price_id`
- Resolves `user_id` through:
  1. `subscription.metadata.user_id`
  2. Customer metadata (`customer.metadata.user_id`)
  3. Existing membership lookup by `stripe_customer_id`
- Maps Stripe status to membership status:
  - `active` or `trialing` → `active`
  - `past_due` → `past_due`
  - `canceled`, `unpaid`, `incomplete_expired` → `canceled`
- Sets `current_period_end` from `subscription.current_period_end` (converted to ISO string)
- Upserts membership by `stripe_subscription_id`

**Key Design Decisions:**
- Always sets `current_period_end` (never null)
- Treats `trialing` as `active`
- Uses event data only - no API calls
- Idempotent via upsert

**Example:**
```typescript
const currentPeriodEndISO = subscription.current_period_end
  ? new Date(subscription.current_period_end * 1000).toISOString()
  : null;
```

### 3. customer.subscription.updated

**Purpose:** Handle subscription changes (cancellations, status updates)

**Process:**
- Gets `current_period_end` from subscription
- Maps Stripe status to membership status:
  - `active` or `trialing` → `active`
  - `past_due` → `past_due`
  - `canceled`, `unpaid`, `incomplete_expired` → `canceled` (sets `ended_at`)
- Updates `cancel_at_period_end` flag
- Updates membership by `stripe_subscription_id`

**Key Design Decisions:**
- Updates billing period if changed
- Sets `ended_at` for canceled subscriptions
- Uses event data only - no API calls
- Handles all status transitions

### 4. invoice.payment_succeeded

**Purpose:** Confirm successful payment and update billing period

**Process:**
- Extracts `customer_id` and `subscription_id` from invoice
- Gets `current_period_end` from `invoice.lines.data[0].period.end`
- Updates membership to `status = 'active'`
- Updates `current_period_end` if available
- Updates by `stripe_customer_id`

**Key Design Decisions:**
- Always sets status to `active` on successful payment
- Updates billing period from invoice line items
- Uses `stripe_customer_id` for lookup (more reliable than subscription_id)
- Handles both initial and renewal payments

**Example:**
```typescript
const currentPeriodEndISO = invoice.lines?.data?.[0]?.period?.end
  ? new Date(invoice.lines.data[0].period.end * 1000).toISOString()
  : null;
```

### 5. invoice.payment_failed

**Purpose:** Mark membership as past_due when payment fails

**Process:**
- Extracts `customer_id` from invoice
- Updates membership to `status = 'past_due'`
- Updates by `stripe_customer_id`

**Key Design Decisions:**
- Does NOT cancel membership immediately
- Allows for retry attempts
- User can still access during grace period (if configured)

### 6. invoice.finalized

**Purpose:** Cancel membership when invoice becomes uncollectible

**Process:**
- Checks if invoice status is `uncollectible`
- If yes, updates membership to:
  - `status = 'canceled'`
  - `ended_at = now()`
- Updates by `stripe_customer_id`

**Key Design Decisions:**
- Only processes uncollectible invoices
- Other finalized invoices are ignored
- Marks exact time of cancellation

## Membership Status Values

The `status` field can have the following values:

- **active**: Membership is currently active and paid
- **past_due**: Payment failed but subscription still active (grace period)
- **canceled**: Membership has been canceled or payment is uncollectible
- **trialing**: Legacy status (now treated as active)
- **expired**: Legacy status (no longer used)
- **inactive**: Initial state (rare)

These values are enforced by a database check constraint:
```sql
CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'expired', 'inactive'))
```

## Database Schema

### Memberships Table

```sql
CREATE TABLE memberships (
  id uuid PRIMARY KEY,
  user_id uuid UNIQUE REFERENCES auth.users(id),
  plan_id uuid REFERENCES membership_plans(id),
  status text DEFAULT 'inactive',
  stripe_customer_id text,
  stripe_subscription_id text UNIQUE,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT memberships_status_check
    CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'expired', 'inactive'))
);
```

**Key Fields:**
- `current_period_end`: Always set (never null after creation)
- `stripe_customer_id`: Used for lookups in invoice events
- `stripe_subscription_id`: Used for lookups in subscription events
- `cancel_at_period_end`: Indicates if subscription will cancel at period end
- `ended_at`: Records when membership ended (for canceled status)

## Event Flow Examples

### New Subscription Flow

1. User completes checkout → `checkout.session.completed` (ignored for subscriptions)
2. Subscription created → `customer.subscription.created`
   ```
   Membership created:
   - status: active
   - current_period_end: 2026-02-24T00:00:00Z
   - cancel_at_period_end: false
   ```
3. First invoice paid → `invoice.payment_succeeded`
   ```
   Membership confirmed:
   - status: active
   - current_period_end: 2026-02-24T00:00:00Z (updated if different)
   ```

### Renewal Flow

1. Invoice paid → `invoice.payment_succeeded`
   ```
   Membership updated:
   - status: active
   - current_period_end: 2027-02-24T00:00:00Z
   ```

### Failed Payment Flow

1. Payment fails → `invoice.payment_failed`
   ```
   Membership updated:
   - status: past_due
   ```
2. If retry succeeds → `invoice.payment_succeeded`
   ```
   Membership updated:
   - status: active
   ```
3. If invoice becomes uncollectible → `invoice.finalized`
   ```
   Membership updated:
   - status: canceled
   - ended_at: 2026-03-15T12:34:56Z
   ```

### Cancellation Flow

1. User cancels → `customer.subscription.updated`
   ```
   Membership updated:
   - status: active (if cancel_at_period_end)
   - cancel_at_period_end: true
   ```
2. Period ends → `customer.subscription.updated`
   ```
   Membership updated:
   - status: canceled
   - ended_at: 2026-03-24T00:00:00Z
   ```

## Idempotency

All webhook operations are idempotent:

- **customer.subscription.created**: Upsert by `stripe_subscription_id`
- **customer.subscription.updated**: Update by `stripe_subscription_id`
- **invoice.payment_succeeded**: Update by `stripe_customer_id`
- **invoice.payment_failed**: Update by `stripe_customer_id`
- **invoice.finalized**: Update by `stripe_customer_id`

Receiving duplicate events will not cause data corruption.

## Error Handling

All handlers follow a consistent pattern:

```typescript
try {
  // Process event
  console.log('[Webhook] ✓ Success message');
  return NextResponse.json({ received: true });
} catch (error: any) {
  console.error('[Webhook] Error:', error.message);
  console.error('[Webhook] Stack trace:', error.stack);
  return NextResponse.json({ received: true });
}
```

**Key Points:**
- Always return 200 status to acknowledge receipt
- Log errors but don't crash
- Let Stripe retry on actual failures
- Prevents webhook event buildup

## Benefits of This Architecture

1. **Simplicity**: Minimal event handlers, clear logic
2. **No API Calls**: Uses event data only - faster and more reliable
3. **current_period_end Always Set**: No null billing periods
4. **Clear Status Model**: Three primary statuses (active, past_due, canceled)
5. **Idempotent**: Safe to receive duplicate events
6. **Maintainable**: Easy to understand and modify
7. **Reliable**: No external dependencies within handlers

## Testing Checklist

### Subscription Creation
- [ ] New subscription creates membership with `current_period_end` set
- [ ] Status is set to `active`
- [ ] User ID resolution works through all fallback methods
- [ ] Price lookup finds correct membership plan

### Subscription Updates
- [ ] Status changes update membership correctly
- [ ] `cancel_at_period_end` flag updates properly
- [ ] Canceled subscriptions set `ended_at`
- [ ] `current_period_end` updates when changed

### Invoice Success
- [ ] Payment success sets status to `active`
- [ ] `current_period_end` updates from invoice
- [ ] Works for both initial and renewal invoices
- [ ] Lookup by `stripe_customer_id` works

### Invoice Failure
- [ ] Failed payment sets status to `past_due`
- [ ] Membership remains accessible during grace period
- [ ] Subsequent success resets to `active`

### Invoice Uncollectible
- [ ] Uncollectible invoice sets status to `canceled`
- [ ] Sets `ended_at` timestamp
- [ ] Non-uncollectible finalized invoices are ignored

### General
- [ ] Duplicate events don't cause errors
- [ ] All handlers return 200 status
- [ ] Errors are logged but don't crash webhook
- [ ] Database constraints prevent invalid statuses

## Common Issues & Solutions

### Issue: current_period_end is null
**Solution**: This is now fixed. All subscription events set `current_period_end` from event data.

### Issue: Membership not created
**Solution**: Check that:
- Price ID exists in `membership_plans` table
- User ID can be resolved through metadata or lookup
- Webhook events are being received

### Issue: Status not updating
**Solution**: Verify that:
- Webhook is receiving the correct events
- Event types are in the handler list
- Database updates are not failing

### Issue: Duplicate memberships
**Solution**: Upsert by `stripe_subscription_id` prevents this. Check for orphaned records.
