import { pool } from './db';

export async function initializeDatabase() {
  console.log('🔧 Initializing database tables...');
  
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        first_name VARCHAR,
        last_name VARCHAR,
        profile_image_url VARCHAR,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Users table ready');

    // Create sessions table (if not created by connect-pg-simple)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      );
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions(expire);
    `);
    console.log('✅ Sessions table ready');

    // Create ai_systems table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_systems (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR NOT NULL,
        description TEXT,
        risk_level VARCHAR,
        status VARCHAR DEFAULT 'active',
        sector VARCHAR,
        primary_use_case VARCHAR,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ AI Systems table ready');

    // Create risk_assessments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS risk_assessments (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        ai_system_id VARCHAR NOT NULL REFERENCES ai_systems(id) ON DELETE CASCADE,
        assessment_data JSONB NOT NULL,
        risk_level VARCHAR NOT NULL,
        risk_score INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Risk Assessments table ready');

    console.log('🎉 Database initialization complete!');
    return true;
  } catch (error: any) {
    console.error('❌ Database initialization error:', error.message);
    console.error('💡 Ensure DATABASE_URL is set and PostgreSQL server is accessible');
    return false;
  }
}
