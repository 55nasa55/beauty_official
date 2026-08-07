-- Insert Monthly membership plan
-- NOTE: Replace the stripe_price_id with the actual Stripe monthly price ID (price_xxx)
-- before enabling monthly checkout in production.
INSERT INTO membership_plans (name, description, stripe_price_id, billing_interval, amount_cents, is_active, sort_order)
VALUES (
  'Monthly Membership',
  'Exclusive member pricing across the store — billed monthly',
  'price_MONTHLY_PLACEHOLDER_REPLACE_ME',
  'month',
  699,
  true,
  1
)
ON CONFLICT (stripe_price_id) DO NOTHING;
