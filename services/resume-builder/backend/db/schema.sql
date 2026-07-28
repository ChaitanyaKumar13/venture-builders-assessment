-- Resume Builder schema. The structured resume lives in a single JSONB column
-- so templates can map over it freely without rigid table joins.
CREATE TABLE IF NOT EXISTS resumes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL DEFAULT 'Untitled resume',
  data       JSONB NOT NULL,
  template   TEXT NOT NULL DEFAULT 'modern',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
