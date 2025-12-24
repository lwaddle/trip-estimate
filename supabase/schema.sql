-- Trip Estimate Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USER DEFAULTS TABLE
-- Stores per-user calculator default values
-- ============================================
CREATE TABLE IF NOT EXISTS user_defaults (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fuel_price NUMERIC(10, 4) DEFAULT 5.50,
    fuel_density NUMERIC(10, 4) DEFAULT 6.7,
    pilot_rate NUMERIC(10, 2) DEFAULT 800,
    attendant_rate NUMERIC(10, 2) DEFAULT 500,
    hotel_rate NUMERIC(10, 2) DEFAULT 200,
    meals_rate NUMERIC(10, 2) DEFAULT 75,
    maintenance_rate NUMERIC(10, 2) DEFAULT 150,
    apu_burn NUMERIC(10, 2) DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT user_defaults_user_unique UNIQUE (user_id)
);

-- ============================================
-- ESTIMATES TABLE
-- Stores saved trip estimates
-- ============================================
CREATE TABLE IF NOT EXISTS estimates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    estimate_data JSONB NOT NULL,
    creator_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_estimates_user_id ON estimates(user_id);
CREATE INDEX IF NOT EXISTS idx_estimates_created_at ON estimates(created_at DESC);

-- ============================================
-- ESTIMATE SHARES TABLE
-- Stores shareable links for estimates
-- ============================================
CREATE TABLE IF NOT EXISTS estimate_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    share_token UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    share_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    CONSTRAINT estimate_shares_unique UNIQUE (estimate_id)
);

CREATE INDEX IF NOT EXISTS idx_estimate_shares_token ON estimate_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_estimate_shares_estimate_id ON estimate_shares(estimate_id);

-- ============================================
-- USER PROFILES TABLE
-- Stores aircraft profiles and custom configurations
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profiles_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    default_profile_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT user_profiles_user_unique UNIQUE (user_id)
);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
DROP TRIGGER IF EXISTS update_user_defaults_updated_at ON user_defaults;
CREATE TRIGGER update_user_defaults_updated_at
    BEFORE UPDATE ON user_defaults
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_estimates_updated_at ON estimates;
CREATE TRIGGER update_estimates_updated_at
    BEFORE UPDATE ON estimates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- User Defaults Policies
CREATE POLICY "Users can view own defaults"
    ON user_defaults FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own defaults"
    ON user_defaults FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own defaults"
    ON user_defaults FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own defaults"
    ON user_defaults FOR DELETE
    USING (auth.uid() = user_id);

-- Estimates Policies
CREATE POLICY "Users can view own estimates"
    ON estimates FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared estimates"
    ON estimates FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM estimate_shares
            WHERE estimate_shares.estimate_id = estimates.id
        )
    );

CREATE POLICY "Users can insert own estimates"
    ON estimates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own estimates"
    ON estimates FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own estimates"
    ON estimates FOR DELETE
    USING (auth.uid() = user_id);

-- Estimate Shares Policies
CREATE POLICY "Users can view own shares"
    ON estimate_shares FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view shares by token"
    ON estimate_shares FOR SELECT
    USING (true);

CREATE POLICY "Users can create shares for own estimates"
    ON estimate_shares FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM estimates
            WHERE estimates.id = estimate_id AND estimates.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own shares"
    ON estimate_shares FOR DELETE
    USING (auth.uid() = user_id);

-- User Profiles Policies
CREATE POLICY "Users can view own profiles"
    ON user_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profiles"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profiles"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profiles"
    ON user_profiles FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- STORAGE BUCKET FOR PROFILE IMAGES
-- Run this separately in Supabase Dashboard > Storage
-- ============================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('profile-images', 'profile-images', true);

-- CREATE POLICY "Users can upload profile images"
--     ON storage.objects FOR INSERT
--     WITH CHECK (bucket_id = 'profile-images' AND auth.role() = 'authenticated');

-- CREATE POLICY "Anyone can view profile images"
--     ON storage.objects FOR SELECT
--     USING (bucket_id = 'profile-images');

-- CREATE POLICY "Users can update own profile images"
--     ON storage.objects FOR UPDATE
--     USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete own profile images"
--     ON storage.objects FOR DELETE
--     USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);
