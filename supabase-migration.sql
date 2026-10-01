-- Migration: Add profile picture, high score, and selected skin columns to profiles table
-- This migration adds three columns needed for the unified player profile system:
-- 1. profile_picture: Stores the selected zombie profile avatar ID
-- 2. high_score: Stores the player's best Zombie Smash score
-- 3. selected_skin: Stores the currently selected console skin

-- Check if columns exist before adding them (PostgreSQL compatible)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_picture TEXT,
ADD COLUMN IF NOT EXISTS high_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS selected_skin TEXT DEFAULT 'gunmetal';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_high_score ON profiles(high_score DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_selected_skin ON profiles(selected_skin);

-- Add comment documentation
COMMENT ON COLUMN profiles.profile_picture IS 'Zombie boss ID selected as player avatar (jordan, glowinghumanity, debo, caffeinatedsloth, fatamy, drmantis)';
COMMENT ON COLUMN profiles.high_score IS 'Best Zombie Smash arcade game score';
COMMENT ON COLUMN profiles.selected_skin IS 'Currently selected console skin (default: gunmetal)';
