-- Add avatar and profile effect columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS avatar_effect TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS profile_effect TEXT DEFAULT 'none';

-- Update existing profiles to have default effects
UPDATE user_profiles 
SET avatar_effect = 'none', profile_effect = 'none' 
WHERE avatar_effect IS NULL OR profile_effect IS NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN user_profiles.avatar_effect IS 'Avatar decoration effect: none, sparkle, glow, pulse, rainbow, fire, ice, electric, golden, mystic';
COMMENT ON COLUMN user_profiles.profile_effect IS 'Profile background effect: none, particles, snow, matrix, nebula, waves, fireflies, stars, aurora';
