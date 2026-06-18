-- =================================================================================
-- UNIVERSAL EVENT ENGINE: CORRECTED SCHEMA
-- =================================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  system_role VARCHAR(50) DEFAULT 'JUDGE'
);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE 
);

CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id INT NOT NULL,
  unstop_team_id VARCHAR(255) NOT NULL,
  team_name VARCHAR(255) NOT NULL,
  team_passcode VARCHAR(50) NOT NULL,
  progress_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  member_details JSONB,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_registrations_event
    FOREIGN KEY (event_id)
    REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT uq_event_unstop_team
    UNIQUE(event_id, unstop_team_id)
);

CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  registration_id UUID NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Added missing comma

  CONSTRAINT fk_submissions_registration
    FOREIGN KEY (registration_id)
    REFERENCES registrations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS evaluations (
  id SERIAL PRIMARY KEY,
  submission_id INT NOT NULL, -- REMOVED 'UNIQUE' FROM HERE
  judge_id INT NOT NULL,
  score_breakdown JSONB,
  total_score INT NOT NULL,
  feedback TEXT,
  graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_evaluations_submission
    FOREIGN KEY (submission_id)
    REFERENCES submissions(id) ON DELETE CASCADE,
  CONSTRAINT fk_evaluations_judge
    FOREIGN KEY (judge_id) REFERENCES users(id),
  -- ADDED COMPOSITE UNIQUE CONSTRAINT HERE
  CONSTRAINT uq_evaluation_per_judge 
    UNIQUE(submission_id, judge_id) 
);

-- =================================================================================
-- MOCK SEED DATA
-- =================================================================================

INSERT INTO users (username, password_hash, system_role) 
VALUES 
    ('ad1tyq', '$2a$10$X9r...', 'ADMIN'),
    ('judge_dinesh_sir', '$2a$10$K7b...', 'JUDGE')
ON CONFLICT (username) DO NOTHING;

INSERT INTO events (slug, name, event_type, config, is_active) 
VALUES (
    'unlockd-2024', 
    'Unlock''D', 
    'PROGRESSIVE_PRODUCT_BUILDING_EVENT', 
    '{"total_rounds": 3, "rubric": ["functionality", "code_quality", "ux"]}'::jsonb, 
    TRUE
)
ON CONFLICT (slug) DO NOTHING;
