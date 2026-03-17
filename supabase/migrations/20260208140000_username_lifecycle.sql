-- =====================================================
-- COMPLETE USERNAME SYSTEM FIX
-- Run this ENTIRE script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- STEP 1: BACKFILL NULL USERNAMES
-- Generates gamer-style usernames like: NovaWolf_4821
-- =====================================================

UPDATE profiles
SET username = INITCAP(
  (ARRAY['Swift','Brave','Shadow','Epic','Nova','Silent','Crimson','Lucky','Fierce','Clever'])[floor(random()*10)+1]
  ||
  (ARRAY['Tiger','Wolf','Dragon','Falcon','Phoenix','Raven','Lion','Eagle','Viper','Panther'])[floor(random()*10)+1]
  || '_' ||
  floor(random()*9000 + 1000)::text
)
WHERE username IS NULL;

-- =====================================================
-- STEP 2: STRIP EMAILS FROM ANY USERNAME CONTAINING @
-- =====================================================

UPDATE profiles
SET username = INITCAP(
  (ARRAY['Swift','Brave','Shadow','Epic','Nova','Silent','Crimson','Lucky','Fierce','Clever'])[floor(random()*10)+1]
  ||
  (ARRAY['Tiger','Wolf','Dragon','Falcon','Phoenix','Raven','Lion','Eagle','Viper','Panther'])[floor(random()*10)+1]
  || '_' ||
  floor(random()*9000 + 1000)::text
)
WHERE username LIKE '%@%';

-- =====================================================
-- STEP 3: FIX DUPLICATE USERNAMES BEFORE CONSTRAINT
-- =====================================================

DO $$
DECLARE
  dup RECORD;
BEGIN
  FOR dup IN 
    SELECT username, COUNT(*) as cnt 
    FROM profiles 
    WHERE username IS NOT NULL
    GROUP BY username 
    HAVING COUNT(*) > 1
  LOOP
    UPDATE profiles 
    SET username = username || '_' || floor(random() * 10000)::TEXT
    WHERE username = dup.username
    AND id NOT IN (
      SELECT id FROM profiles WHERE username = dup.username LIMIT 1
    );
  END LOOP;
END $$;

-- =====================================================
-- STEP 4: ADD UNIQUE CONSTRAINT
-- =====================================================

ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_username_unique;

ALTER TABLE profiles
ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- =====================================================
-- STEP 5: SET NOT NULL CONSTRAINT
-- =====================================================

ALTER TABLE profiles
ALTER COLUMN username SET NOT NULL;

-- =====================================================
-- STEP 6: CREATE RANDOM USERNAME GENERATOR FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION generate_random_username()
RETURNS TEXT AS $$
DECLARE
  adjectives TEXT[] := ARRAY['Swift','Brave','Shadow','Epic','Nova','Silent','Crimson','Lucky','Fierce','Clever'];
  animals TEXT[] := ARRAY['Tiger','Wolf','Dragon','Falcon','Phoenix','Raven','Lion','Eagle','Viper','Panther'];
  result TEXT;
BEGIN
  result := INITCAP(
    adjectives[floor(random()*10)+1] ||
    animals[floor(random()*10)+1] ||
    '_' ||
    floor(random()*9000 + 1000)::text
  );
  
  -- Keep regenerating until unique
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = result) LOOP
    result := INITCAP(
      adjectives[floor(random()*10)+1] ||
      animals[floor(random()*10)+1] ||
      '_' ||
      floor(random()*9000 + 1000)::text
    );
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 7: UPDATE NEW USER TRIGGER (NO EMAIL USAGE)
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- SECURITY: Generate random username, NEVER use email
  INSERT INTO profiles (user_id, username)
  VALUES (NEW.id, generate_random_username());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- VERIFICATION: Check all usernames are valid
-- =====================================================

SELECT 
  username,
  CASE 
    WHEN username LIKE '%@%' THEN '❌ EMAIL DETECTED'
    WHEN username IS NULL THEN '❌ NULL'
    ELSE '✅ OK'
  END as status
FROM profiles
ORDER BY created_at DESC
LIMIT 20;
