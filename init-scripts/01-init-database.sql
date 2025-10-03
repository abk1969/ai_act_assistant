-- AI Act Navigator - Database Initialization Script
-- This script runs automatically when the PostgreSQL container starts

-- Ensure the database and user exist (they should be created by environment variables)
-- This is just for additional security and logging

-- Log the initialization
\echo 'Initializing AI Act Navigator database...'

-- Set timezone to UTC for consistency
SET timezone = 'UTC';

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant additional privileges to ensure the application can work properly
GRANT ALL PRIVILEGES ON DATABASE ai_act_navigator TO ai_act_admin;
GRANT ALL PRIVILEGES ON SCHEMA public TO ai_act_admin;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ai_act_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ai_act_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO ai_act_admin;

\echo 'Database initialization completed successfully!'
