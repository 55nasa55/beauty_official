# Stripe Webhook Architecture

This document explains the webhook logic for handling subscriptions and memberships.

## Overview

The webhook handles five critical events to maintain accurate membership state:

1. **checkout.session.completed** - Creates orders and initiates memberships
2. **customer.subscription.created** - Creates/updates membership records
3. **customer.subscription.updated** - Handles subscription status changes
4. **invoice.payment_succeeded** - Updates billing periods and validates status
5. **customer.subscription.deleted** - Marks memberships as canceled

All other Stripe events are logged but not processed.

## Event Handlers

### 1. checkout.session.completed

**Purpose:** Handle completed checkout sessions for both orders and subscriptions

**For Subscription Mode:**
- Resolves `user_id` using multiple fallback methods:
  1. Session `client_reference_id` or `metadata.user_id`
  2. Customer metadata lookup
  3. Email lookup in Supabase auth
  4. Existing membership lookup by `stripe_customer_id`
- Retrieves subscription to get `stripe_price_id`
- Creates membership with:
  - `status = 'active'`
  - `cancel_at_period_end = false`
  - `current_period_end = null` (will be set by invoice or subscription events)
- Uses `stripe_subscription_id` as upsert key (idempotent)

**For Payment Mode:**
- Creates order record with items
- Handles product purchases

### 2. customer.subscription.created

**Purpose:** Create or update membership when a subscription is first created

**Process:**
- Extracts price ID from subscription
- Looks up membership plan
- Resolves user_id through metadata or existing records
- Maps Stripe subscription status to membership status:
  - `active` → `active`
  - `trialing` → `trialing`
  - `canceled`, `unpaid`, `incomplete_expired` → `canceled`
- Creates/updates membership with billing period

**Key Design Decisions:**
- Handles initial subscription creation
- Sets current_period_end if available
- Upserts by `stripe_subscription_id` for idempotency

### 3. customer.subscription.updated

**Purpose:** Handle subscription changes (status updates, cancellations, etc.)

**Process:**
- Gets current_period_end from subscription
- Determines membership status based on:
  - Stripe subscription status
  - Whether period has expired (current_period_end < now)
- Status mapping:
  - `trialing` → `trialing`
  - `canceled`, `unpaid`, `incomplete_expired` → `canceled`
  - `active` with expired period → `expired`
  - `active` with valid period → `active`
- Sets `ended_at` for canceled/expired statuses
- Updates `cancel_at_period_end` flag

**Key Design Decisions:**
- Includes expiry logic
- Tracks when membership ended
- Handles subscription cancellations

### 4. invoice.payment_succeeded

**Purpose:** Source of truth for billing periods - handles both initial and renewal payments

**Process:**
- Extracts subscription_id from invoice
- Retrieves subscription to get current_period_end
- Checks if period has expired (current_period_end < now)
- Determines membership status:
  - `trialing` → `trialing`
  - `canceled`, `unpaid`, `incomplete_expired` → `canceled`
  - `active` with expired period → `expired`
  - `active` with valid period → `active`
- Updates membership by `stripe_subscription_id`
- Sets `ended_at` for expired/canceled statuses

**Handles Both:**
- Initial subscription invoice (first billing period)
- All renewal invoices (subsequent billing periods)

**Key Design Decisions:**
- Always updates current_period_end with accurate date
- Validates expiry on every payment
- Idempotent - safe to receive duplicate events

### 5. customer.subscription.deleted

**Purpose:** Mark membership as canceled when subscription is deleted

**Process:**
- Updates membership by `stripe_subscription_id`:
  - `status = 'canceled'`
  - `ended_at = now()`
  - `updated_at = now()`

**Key Design Decisions:**
- Does NOT delete membership records (preserves history)
- Uses timestamp to track when cancellation occurred
- Idempotent operation

## Membership Status Values

The `status` field can have the following values:

- **active**: Membership is currently active and paid
- **trialing**: Membership is in trial period
- **canceled**: Membership has been canceled by user or payment failure
- **expired**: Membership period has ended (current_period_end is in the past)
- **inactive**: Initial state or temporary state (rarely used)

These values are enforced by a database check constraint.

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
  stripe_price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT memberships_status_check
    CHECK (status IN ('active', 'trialing', 'canceled', 'expired', 'inactive'))
);
```

**Constraints:**
- `user_id` - Unique (one membership per user)
- `stripe_subscription_id` - Unique (used for idempotent upserts)
- `status` - Check constraint for valid values

**Indexes:**
- `user_id` - Fast user lookups
- `stripe_customer_id` - Customer-based queries
- `stripe_subscription_id` - Webhook updates
- `status` - Filtering by status
- `current_period_end` - Expiry checks

## Expiry Logic

Memberships are checked for expiry in two places:

1. **customer.subscription.updated**: When subscription changes are detected
2. **invoice.payment_succeeded**: On every payment (initial and renewal)

**Expiry Check:**
```typescript
const now = new Date();
const periodEndDate = new Date(currentPeriodEndISO);

if (periodEndDate < now) {
  membershipStatus = 'expired';
  endedAt = new Date().toISOString();
}
```

This ensures memberships are marked as expired when their billing period has passed.

## Event Flow Examples

### New Subscription Flow

1. User completes checkout → `checkout.session.completed`
   ```
   Membership created:
   - status: active
   - current_period_end: null
   ```

2. Subscription created → `customer.subscription.created`
   ```
   Membership updated:
   - status: active
   - current_period_end: 2026-01-22T00:00:00Z
   ```

3. First invoice paid → `invoice.payment_succeeded`
   ```
   Membership confirmed:
   - status: active
   - current_period_end: 2026-01-22T00:00:00Z
   ```

### Renewal Flow

1. Invoice paid → `invoice.payment_succeeded`
   ```
   Membership updated:
   - status: active
   - current_period_end: 2027-01-22T00:00:00Z
   ```

### Cancellation Flow

1. User cancels → `customer.subscription.updated`
   ```
   Membership updated:
   - status: canceled (or active if cancel_at_period_end)
   - cancel_at_period_end: true
   ```

2. Subscription ends → `customer.subscription.deleted`
   ```
   Membership updated:
   - status: canceled
   - ended_at: 2026-06-15T12:34:56Z
   ```

### Expiry Flow

1. Period ends without renewal → `customer.subscription.updated`
   ```
   Membership updated:
   - status: expired
   - ended_at: 2026-01-22T00:00:00Z
   ```

## Idempotency

All webhook operations are designed to be idempotent:

- **checkout.session.completed**: Upsert by `stripe_subscription_id` or `order_number`
- **customer.subscription.created**: Upsert by `stripe_subscription_id`
- **customer.subscription.updated**: Update by `stripe_subscription_id`
- **invoice.payment_succeeded**: Update by `stripe_subscription_id`
- **customer.subscription.deleted**: Update by `stripe_subscription_id`

Receiving duplicate events will not cause data corruption or errors.

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
- Log errors for debugging but don't retry
- Trust Stripe's webhook retry mechanism
- Errors don't crash the webhook

## Benefits of This Architecture

1. **Comprehensive Coverage**: Handles all subscription lifecycle events
2. **Expiry Detection**: Automatically marks expired memberships
3. **Status Validation**: Database constraints prevent invalid statuses
4. **Reliability**: Multiple fallback methods for user resolution
5. **Idempotency**: Safe to receive duplicate events
6. **Clear Status Mapping**: Stripe statuses map cleanly to membership statuses
7. **History Preservation**: Never deletes membership records
8. **Maintainability**: Clear, well-documented handlers

## Testing Checklist

- [ ] New subscription creates membership immediately
- [ ] Subscription.created sets billing period correctly
- [ ] First invoice confirms active status
- [ ] Renewal invoices update billing period correctly
- [ ] Subscription cancellation marks membership appropriately
- [ ] Subscription deletion marks membership as canceled
- [ ] Expired periods set status to expired
- [ ] Trial periods show trialing status
- [ ] Failed payments mark as canceled
- [ ] Duplicate events don't cause errors
- [ ] User ID resolution works through all fallback methods
- [ ] Invalid events are logged and ignored safely
- [ ] Database constraints prevent invalid statuses
