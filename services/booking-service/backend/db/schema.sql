-- Booking lifecycle: pending -> paid (then fulfilled: calendar + email).
CREATE TABLE IF NOT EXISTS bookings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT,
  agenda            TEXT,
  slot_start        TIMESTAMPTZ NOT NULL,
  slot_end          TIMESTAMPTZ NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending',  -- pending | paid | fulfilled
  stripe_session_id TEXT,
  calendar_event_id TEXT,
  email_preview_url TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bookings_session ON bookings (stripe_session_id);
