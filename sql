-- Clubs table with geolocation
CREATE TABLE clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text, -- 'nature', 'auto', 'sewing', 'knitting', etc.
  created_by uuid REFERENCES auth.users(id),
  zip_code text,
  city text,
  county text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Club members (join table)
CREATE TABLE club_members (
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'member', -- 'member', 'moderator', 'admin'
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (club_id, user_id)
);
