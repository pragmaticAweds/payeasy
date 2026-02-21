-- ============================================================
-- Migration: 20240101000002_seed_amenities.sql
-- Description: Pre-seed the amenities master table
-- Run this SECOND in Supabase SQL Editor
-- ============================================================

INSERT INTO amenities (name, slug, category, icon) VALUES
  -- Utilities
  ('WiFi',              'wifi',             'utilities',     'Wifi'),
  ('Generator',         'generator',        'utilities',     'Zap'),
  ('Borehole Water',    'borehole',         'utilities',     'Droplets'),
  ('Solar Power',       'solar',            'utilities',     'Sun'),
  ('Water Heater',      'water_heater',     'appliances',    'Flame'),

  -- Appliances
  ('Air Conditioning',  'ac',               'appliances',    'Wind'),
  ('Laundry',           'laundry',          'appliances',    'WashingMachine'),
  ('Dishwasher',        'dishwasher',       'appliances',    'Sparkles'),
  ('Refrigerator',      'refrigerator',     'appliances',    'Refrigerator'),
  ('Microwave',         'microwave',        'appliances',    'Microwave'),

  -- Outdoor
  ('Swimming Pool',     'swimming_pool',    'outdoor',       'Waves'),
  ('Gym',               'gym',              'outdoor',       'Dumbbell'),
  ('Parking',           'parking',          'outdoor',       'Car'),
  ('Balcony',           'balcony',          'outdoor',       'Home'),
  ('Garden',            'garden',           'outdoor',       'Trees'),
  ('Rooftop Access',    'rooftop',          'outdoor',       'Building'),

  -- Security
  ('Security Guard',    'security_guard',   'security',      'Shield'),
  ('CCTV',              'cctv',             'security',      'Camera'),
  ('Intercom',          'intercom',         'security',      'Phone'),
  ('Gated Compound',    'gated',            'security',      'Lock'),

  -- Entertainment
  ('Cable TV',          'cable_tv',         'entertainment', 'Tv'),
  ('Netflix',           'netflix',          'entertainment', 'Play'),
  ('Smart TV',          'smart_tv',         'entertainment', 'Monitor'),

  -- Accessibility
  ('Elevator',          'elevator',         'accessibility', 'ArrowUpDown'),
  ('Wheelchair Access', 'wheelchair',       'accessibility', 'Accessibility')

ON CONFLICT (slug) DO NOTHING;