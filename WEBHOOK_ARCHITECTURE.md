# Stripe Webhook Architecture

This document explains the simplified webhook logic for handling subscriptions and memberships.

## Overview

The webhook handles three critical events to maintain accurate membership state:

1. **checkout.session.completed** - Creates membership records immediately after checkout
2. **invoice.payment_succeeded** - Updates billing periods (both initial and renewals)
3. **customer.subscription.deleted** - Marks memberships as canceled

All other Stripe events are logged but not processed, keeping the logic simple and maintainable.

## Event Handlers

### 1. checkout.session.completed

**Purpose:** Create membership record immediately after successful checkout

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
  - `current_period_end = null` (will be set by invoice event)
- Uses `stripe_subscription_id` as upsert key (idempotent)

**For Payment Mode:**
- Creates order record with items
- Same logic as before for product checkouts

**Key Design Decisions:**
- Does NOT require `current_period_end` at creation
- Allows membership to exist before first invoice
- Trusts Stripe's event ordering for billing period updates

### 2. invoice.payment_succeeded

**Purpose:** Update billing periods - source of truth for when membership is paid

**Process:**
- Extracts `subscription_id` from invoice
- Retrieves subscription to get `current_period_end`
- Updates membership by `stripe_subscription_id`:
  - `status = 'active'`
  - `current_period_end = <timestamp>`
  - `updated_at = now()`

**Handles Both:**
- Initial subscription invoice (first billing period)
- All renewal invoices (subsequent billing periods)

**Key Design Decisions:**
- Looks up by `stripe_subscription_id` (not customer ID)
- Always sets status to active on successful payment
- Single handler for both initial and renewal payments
- Idempotent - safe to receive duplicate events

### 3. customer.subscription.deleted

**Purpose:** Mark membership as canceled when subscription ends

**Process:**
- Updates membership by `stripe_subscription_id`:
  - `status = 'canceled'`
  - `ended_at = now()`
  - `updated_at = now()`

**Key Design Decisions:**
- Does NOT delete membership records (preserves history)
- Uses timestamp to track when cancellation occurred
- Idempotent operation

## Database Schema

### Memberships Table

```sql
CREATE TABLE memberships (
  id uuid PRIMARY KEY,
  user_id uuid UNIQUE REFERENCES auth.users(id),
  plan_id uuid REFERENCES membership_plans(id),
  status text DEFAULT 'inactive',
  stripe_customer_id text,
  stripe_subscription_id text UNIQUE,  -- Used for upsert conflict key
  stripe_price_id text,                 -- Added for reference
  current_period_end timestamptz,       -- Can be NULL initially
  cancel_at_period_end boolean DEFAULT false,
  ended_at timestamptz,                 -- Added for cancellation tracking
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Constraints:**
- `user_id` - Unique (one membership per user)
- `stripe_subscription_id` - Unique (used for idempotent upserts)

**Indexes:**
- `user_id` - Fast user lookups
- `stripe_customer_id` - Customer-based queries
- `stripe_subscription_id` - Webhook updates

## Event Flow Examples

### New Subscription Flow

1. User completes checkout → `checkout.session.completed`
   ```
   Membership created:
   - status: active
   - current_period_end: null
   - stripe_subscription_id: sub_xxx
   ```

2. First invoice paid → `invoice.payment_succeeded`
   ```
   Membership updated:
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

1. Subscription canceled → `customer.subscription.deleted`
   ```
   Membership updated:
   - status: canceled
   - ended_at: 2026-06-15T12:34:56Z
   ```

## Idempotency

All webhook operations are designed to be idempotent:

- **checkout.session.completed**: Upsert by `stripe_subscription_id`
- **invoice.payment_succeeded**: Update by `stripe_subscription_id`
- **customer.subscription.deleted**: Update by `stripe_subscription_id`

Receiving duplicate events will not cause data corruption or errors.

## Removed Handlers

The following event handlers were removed as they're redundant:

- `customer.subscription.created` - Handled by checkout.session.completed
- `customer.subscription.updated` - Not needed; billing updates come from invoices
- `invoice.payment_failed` - Optional; Stripe handles retry logic
- `invoice.finalized` - Optional; uncollectible status is rare

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

## Benefits of This Architecture

1. **Simplicity**: Only 3 event handlers instead of 6+
2. **Reliability**: No assumptions about Stripe field availability
3. **Idempotency**: Safe to receive duplicate events
4. **Clear Responsibilities**: Each handler has one job
5. **Maintainability**: Easy to understand and debug
6. **Stripe-Correct**: Follows Stripe's recommended patterns

## Testing Checklist

- [ ] New subscription creates membership immediately
- [ ] First invoice updates billing period
- [ ] Renewal invoices update billing period correctly
- [ ] Subscription cancellation marks membership as canceled
- [ ] Duplicate events don't cause errors
- [ ] User ID resolution works through all fallback methods
- [ ] Invalid events are logged and ignored safely
