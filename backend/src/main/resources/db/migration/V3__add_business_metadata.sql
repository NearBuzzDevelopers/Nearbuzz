-- ==============================================================================
-- NearBuzz - V3 Add Flexible JSONB Metadata Column to Businesses
-- Purpose: Allow each of the 6 vendor portal types (hostel, mess, printing,
--          books, kirana, library) to persist category-specific rules, policies,
--          facilities, and operational toggles without per-category tables.
-- ==============================================================================

ALTER TABLE businesses
    ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
