-- Add tags column to recipes table
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Create an index for better performance when filtering by tags
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes USING GIN (tags);

-- Update existing recipes to have empty tags array if NULL
UPDATE recipes 
SET tags = '{}' 
WHERE tags IS NULL; 