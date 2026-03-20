-- Create ads table
CREATE TABLE IF NOT EXISTS ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    link_url TEXT,
    button_text TEXT DEFAULT 'Learn More',
    position TEXT NOT NULL DEFAULT 'sidebar',
    status TEXT NOT NULL DEFAULT 'active',
    priority INTEGER NOT NULL DEFAULT 0,
    impressions INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    target_audience TEXT NOT NULL DEFAULT 'unsubscribed',
    created_by UUID REFERENCES "user"(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create ad_interactions table
CREATE TABLE IF NOT EXISTS ad_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES "user"(id) ON DELETE SET NULL,
    fingerprint TEXT,
    interaction_type TEXT NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_or_fingerprint_check CHECK (user_id IS NOT NULL OR fingerprint IS NOT NULL)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ads_status_position_audience ON ads(status, position, target_audience);
CREATE INDEX IF NOT EXISTS idx_ads_priority ON ads(priority);
CREATE INDEX IF NOT EXISTS idx_ads_dates ON ads(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_ad_interactions_ad_id ON ad_interactions(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_interactions_type ON ad_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_ad_interactions_created_at ON ad_interactions(created_at);

-- Insert sample ads for testing
INSERT INTO ads (title, description, image_url, link_url, button_text, position, status, priority, target_audience)
VALUES 
    (
        'Subscribe to ThePressRadio Premium',
        'Get unlimited access to premium African news, analysis, and exclusive content. Start your 14-day free trial today.',
        'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop',
        '/subscribe',
        'Start Free Trial',
        'sidebar',
        'active',
        10,
        'unsubscribed'
    ),
    (
        'African Business Summit 2026',
        'Join leading African entrepreneurs and investors at the premier business conference. Early bird tickets now available.',
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop',
        'https://example.com/business-summit',
        'Get Tickets',
        'sidebar',
        'active',
        5,
        'unsubscribed'
    ),
    (
        'Invest in African Markets',
        'Discover investment opportunities across African markets with our comprehensive market analysis and expert insights.',
        'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop',
        'https://example.com/investment-platform',
        'Learn More',
        'sidebar',
        'active',
        3,
        'unsubscribed'
    )
ON CONFLICT DO NOTHING;

-- Display success message
SELECT 'Ads tables created successfully!' as message;