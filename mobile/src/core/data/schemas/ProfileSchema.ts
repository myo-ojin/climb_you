/**
 * User Profile Table Schema
 * SQLite用のユーザープロファイルテーブルスキーマ
 */

export const createProfilesTable = `
  CREATE TABLE IF NOT EXISTS user_profiles (
    user_id TEXT PRIMARY KEY,
    daily_commit_time TEXT NOT NULL,
    lifestyle TEXT,
    focus_time TEXT,
    work_environment TEXT,
    task_pace TEXT,
    past_failure_reason TEXT,
    skill_level TEXT,
    difficulty_preference TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_synced INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`;

export const createProfilesIndexes = `
  CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
`;
