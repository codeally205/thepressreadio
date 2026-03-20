-- Add new fields to subscriptions table for better tracking
-- Run this migration to add the new fields

-- Add upgraded_from_trial_id field to track trial-to-paid conversions
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS upgraded_from_trial_id UUID REFERENCES subscriptions(id);

-- Add payment_reference field to track payment transactions
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS payment_reference TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_reference 
ON subscriptions(payment_reference);

CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_expiration 
ON subscriptions(trial_ends_at) 
WHERE status = 'trialing';

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_processor 
ON subscriptions(user_id, payment_processor);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status 
ON subscriptions(status);

-- Add comments for documentation
COMMENT ON COLUMN subscriptions.upgraded_from_trial_id IS 'Links to the original trial subscription if this subscription was upgraded from a trial';
COMMENT ON COLUMN subscriptions.payment_reference IS 'Payment reference from payment processor for tracking';

-- Display migration success message
SELECT 'Migration completed successfully! New fields added to subscriptions table.' AS status;
