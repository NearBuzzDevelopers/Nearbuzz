-- ==============================================================================
-- NearBuzz - V2 Seed Indore (Bholaram Ustad Marg / Bhawarkuan) Demo Businesses
-- Purpose: Provide realistic demo listings for all 6 service categories near
--          Bholaram Ustad Marg, Indore (22.6847, 75.8639) for live GPS demos.
-- Note: Safe and idempotent — skips rows if emails or businesses already exist.
-- ==============================================================================

INSERT INTO users (email, name, role, status) VALUES
    ('indore.hostel@nearbuzz.demo',     'Kailash Sharma', 'VENDOR', 'ACTIVE'),
    ('indore.mess@nearbuzz.demo',       'Annapurna Devi', 'VENDOR', 'ACTIVE'),
    ('indore.print@nearbuzz.demo',      'Rohan Malviya',  'VENDOR', 'ACTIVE'),
    ('indore.books@nearbuzz.demo',      'Neha Agrawal',   'VENDOR', 'ACTIVE'),
    ('indore.kirana@nearbuzz.demo',     'Deepak Patidar', 'VENDOR', 'ACTIVE'),
    ('indore.library@nearbuzz.demo',    'Vikram Joshi',   'VENDOR', 'ACTIVE')
ON CONFLICT (email) DO NOTHING;

INSERT INTO businesses (owner_id, name, category, description, address, location, phone, whatsapp, status, verification_status)
SELECT u.id,
       'Sai Krupa Boys & Girls Hostel',
       'HOSTEL_PG',
       'Who: Separate Boys & Girls Wings | Meals: 3 meals included | Cooling: Both AC & Non-AC | RO water & Wi-Fi',
       '42 Bholaram Ustad Marg, Bhawarkuan, Indore',
       ST_SetSRID(ST_MakePoint(75.8635, 22.6852), 4326)::geography,
       '+919826011101',
       '+919826011101',
       'OPEN',
       'VERIFIED'
FROM users u
WHERE u.email = 'indore.hostel@nearbuzz.demo'
  AND NOT EXISTS (SELECT 1 FROM businesses b WHERE b.owner_id = u.id);

INSERT INTO businesses (owner_id, name, category, description, address, location, phone, whatsapp, status, verification_status)
SELECT u.id,
       'Malwa Home Style Veg Mess',
       'MESS_TIFFIN',
       'Food: Pure Veg | Tiffin Delivery: Yes, free nearby delivery | Meals: Breakfast, Lunch & Dinner',
       'Near 99 Shop, Bholaram Ustad Marg, Indore',
       ST_SetSRID(ST_MakePoint(75.8644, 22.6844), 4326)::geography,
       '+919826011102',
       '+919826011102',
       'OPEN',
       'VERIFIED'
FROM users u
WHERE u.email = 'indore.mess@nearbuzz.demo'
  AND NOT EXISTS (SELECT 1 FROM businesses b WHERE b.owner_id = u.id);

INSERT INTO businesses (owner_id, name, category, description, address, location, phone, whatsapp, status, verification_status)
SELECT u.id,
       'Bhawarkuan Fast Print & Xerox',
       'PRINTING',
       'Color Printing: Both B&W and Color | Binding: Spiral & Hardbound both | Bulk student rate available',
       'Shop 8, Bhawarkuan Square, Indore',
       ST_SetSRID(ST_MakePoint(75.8628, 22.6860), 4326)::geography,
       '+919826011103',
       '+919826011103',
       'OPEN',
       'VERIFIED'
FROM users u
WHERE u.email = 'indore.print@nearbuzz.demo'
  AND NOT EXISTS (SELECT 1 FROM businesses b WHERE b.owner_id = u.id);

INSERT INTO businesses (owner_id, name, category, description, address, location, phone, whatsapp, status, verification_status)
SELECT u.id,
       'Indore Campus Books & Stationery',
       'BOOKS_STATIONERY',
       'Second-hand & Semester Rental: Yes | Courses: B.Tech, BCA, Pharmacy & Competitive Exams | Drafters stocked',
       'Opposite Holkar Gate, Bhawarkuan, Indore',
       ST_SetSRID(ST_MakePoint(75.8655, 22.6871), 4326)::geography,
       '+919826011104',
       '+919826011104',
       'OPEN',
       'VERIFIED'
FROM users u
WHERE u.email = 'indore.books@nearbuzz.demo'
  AND NOT EXISTS (SELECT 1 FROM businesses b WHERE b.owner_id = u.id);

INSERT INTO businesses (owner_id, name, category, description, address, location, phone, whatsapp, status, verification_status)
SELECT u.id,
       'Patidar Student Mart & Kirana',
       'KIRANA',
       'Hostel Delivery: Yes | RO Water jars & milk daily | Open till 11:30 PM',
       'Lane 2, Bholaram Ustad Marg, Indore',
       ST_SetSRID(ST_MakePoint(75.8630, 22.6838), 4326)::geography,
       '+919826011105',
       '+919826011105',
       'OPEN',
       'VERIFIED'
FROM users u
WHERE u.email = 'indore.kirana@nearbuzz.demo'
  AND NOT EXISTS (SELECT 1 FROM businesses b WHERE b.owner_id = u.id);

INSERT INTO businesses (owner_id, name, category, description, address, location, phone, whatsapp, status, verification_status)
SELECT u.id,
       'Sankalp 24x7 AC Study Library',
       'LIBRARY',
       'Environment: Full AC Reading Hall | Open Hours: 24x7 | High-speed Wi-Fi & personal lockers',
       '2nd Floor, Bholaram Main Road, Indore',
       ST_SetSRID(ST_MakePoint(75.8649, 22.6856), 4326)::geography,
       '+919826011106',
       '+919826011106',
       'OPEN',
       'VERIFIED'
FROM users u
WHERE u.email = 'indore.library@nearbuzz.demo'
  AND NOT EXISTS (SELECT 1 FROM businesses b WHERE b.owner_id = u.id);

-- Offerings for Indore Demo Businesses
INSERT INTO offerings (business_id, offering_type, title, price, pricing_unit, status, attributes)
SELECT b.id, 'HOSTEL_ROOM', 'Double Sharing AC Room', 7800.00, 'PER_MONTH', 'AVAILABLE', '{"ac": true, "wifi": true, "sharing": 2, "meals": true}'::jsonb
FROM businesses b WHERE b.name = 'Sai Krupa Boys & Girls Hostel'
  AND NOT EXISTS (SELECT 1 FROM offerings o WHERE o.business_id = b.id);

INSERT INTO offerings (business_id, offering_type, title, price, pricing_unit, status, attributes)
SELECT b.id, 'MESS_MENU', 'Monthly Pure Veg Tiffin Plan', 2900.00, 'PER_MONTH', 'AVAILABLE', '{"veg": true, "delivery": true}'::jsonb
FROM businesses b WHERE b.name = 'Malwa Home Style Veg Mess'
  AND NOT EXISTS (SELECT 1 FROM offerings o WHERE o.business_id = b.id);

INSERT INTO offerings (business_id, offering_type, title, price, pricing_unit, status, attributes)
SELECT b.id, 'PRINT_SERVICE', 'B&W Laser Printout (Bulk)', 1.50, 'PER_PAGE', 'AVAILABLE', '{"duplex": true, "binding": true}'::jsonb
FROM businesses b WHERE b.name = 'Bhawarkuan Fast Print & Xerox'
  AND NOT EXISTS (SELECT 1 FROM offerings o WHERE o.business_id = b.id);

INSERT INTO offerings (business_id, offering_type, title, price, pricing_unit, status, attributes)
SELECT b.id, 'PRODUCT_STOCK', 'Engineering Semester Textbook Rent', 250.00, 'PER_MONTH', 'AVAILABLE', '{"rental": true}'::jsonb
FROM businesses b WHERE b.name = 'Indore Campus Books & Stationery'
  AND NOT EXISTS (SELECT 1 FROM offerings o WHERE o.business_id = b.id);

INSERT INTO offerings (business_id, offering_type, title, price, pricing_unit, status, attributes)
SELECT b.id, 'PRODUCT_STOCK', '20L Chilled RO Water Jar', 25.00, 'PER_PIECE', 'AVAILABLE', '{"delivery": true}'::jsonb
FROM businesses b WHERE b.name = 'Patidar Student Mart & Kirana'
  AND NOT EXISTS (SELECT 1 FROM offerings o WHERE o.business_id = b.id);

INSERT INTO offerings (business_id, offering_type, title, price, pricing_unit, status, attributes)
SELECT b.id, 'LIBRARY_SEAT', '24x7 Reserved AC Study Cabin', 1100.00, 'PER_MONTH', 'AVAILABLE', '{"ac": true, "wifi": true, "24x7": true}'::jsonb
FROM businesses b WHERE b.name = 'Sankalp 24x7 AC Study Library'
  AND NOT EXISTS (SELECT 1 FROM offerings o WHERE o.business_id = b.id);

-- Operating Hours (Mon-Sat open 08:00-22:00, Sun open for Library/Hostel/Mess)
INSERT INTO business_hours (business_id, day_of_week, opens_at, closes_at, is_closed)
SELECT b.id, d.day_num, TIME '08:00:00', TIME '22:00:00', FALSE
FROM businesses b
CROSS JOIN (VALUES (0), (1), (2), (3), (4), (5), (6)) AS d(day_num)
WHERE b.owner_id IN (SELECT id FROM users WHERE email LIKE 'indore.%@nearbuzz.demo')
ON CONFLICT (business_id, day_of_week) DO NOTHING;

-- Sample Updates for Indore Demo Businesses
INSERT INTO updates (business_id, update_type, title, content, expires_at)
SELECT b.id, 'MENU_UPDATE', 'Today Special: Dal Bafla, Kadhi & Paneer', 'Fresh hot lunch served 12:30 PM – 2:30 PM at Bholaram mess.', NOW() + INTERVAL '30 days'
FROM businesses b WHERE b.name = 'Malwa Home Style Veg Mess'
  AND NOT EXISTS (SELECT 1 FROM updates u WHERE u.business_id = b.id);

INSERT INTO updates (business_id, update_type, title, content, expires_at)
SELECT b.id, 'ANNOUNCEMENT', '3 AC Double-Sharing Seats Available', 'Immediate shifting available for this semester. RO water & Wi-Fi included.', NOW() + INTERVAL '30 days'
FROM businesses b WHERE b.name = 'Sai Krupa Boys & Girls Hostel'
  AND NOT EXISTS (SELECT 1 FROM updates u WHERE u.business_id = b.id);
