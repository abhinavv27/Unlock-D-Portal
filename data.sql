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
  current_global_round INT NOT NULL DEFAULT 1,
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
  total_score DOUBLE PRECISION DEFAULT 0.0,
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
  round_number INT NOT NULL, 
  task_id VARCHAR(100) NOT NULL, -- '1a', 'feature-auth'
  payload JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  average_score DOUBLE PRECISION,
  rejection_reason TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

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

INSERT INTO events (slug, name, event_type, config, current_global_round, is_active) 
VALUES (
    'unlockd-2024', 
    'Unlock''D', 
    'PROGRESSIVE_PRODUCT_BUILDING_EVENT', 
    '{"total_rounds": 3, "passing_threshold": 60, "roadmap": [{"step": 1, "task_id": "FEATURE-1", "round": 1, "rubric": ["functionality", "code_quality"], "title": "Feature 1 — Core Architecture", "description": "Design and implement the foundational architecture of your application, including database schema, API structure, and core business logic."}, {"step": 2, "task_id": "FEATURE-2", "round": 1, "rubric": ["functionality", "code_quality"], "title": "Feature 2 — User Interaction", "description": "Build user-facing features including authentication, onboarding flows, and interactive UI components."}, {"step": 3, "task_id": "FEATURE-3", "round": 1, "rubric": ["functionality", "code_quality"], "title": "Feature 3 — Data Integration", "description": "Implement data processing, third-party API integrations, and real-time data synchronization."}, {"step": 4, "task_id": "FEATURE-4", "round": 1, "rubric": ["functionality", "code_quality"], "title": "Feature 4 — Advanced Capabilities", "description": "Add advanced functionality such as search, filtering, notifications, and background job processing."}, {"step": 5, "task_id": "FEATURE-5", "round": 1, "rubric": ["functionality", "code_quality"], "title": "Feature 5 — Polish & Performance", "description": "Optimize application performance, add error handling, loading states, and refine the user experience."}, {"step": 6, "task_id": "FINAL-FEATURE", "round": 1, "rubric": ["functionality", "code_quality"], "title": "Final Feature — Complete Integration", "description": "Integrate all features into a cohesive product. Ensure all components work together seamlessly end-to-end."}, {"step": 7, "task_id": "ROUND-2", "round": 2, "rubric": ["ux", "polish", "innovation"], "title": "Round 2 — UX & Innovation", "description": "Elevate the user experience with polished interfaces, innovative interactions, and comprehensive error handling."}, {"step": 8, "task_id": "ROUND-3", "round": 3, "rubric": ["presentation", "business_viability"], "title": "Round 3 — Presentation & Viability", "description": "Prepare your final pitch, demo the working product, and present business viability."}]}'::jsonb, 
    1,
    TRUE
)
ON CONFLICT (slug) DO NOTHING;
