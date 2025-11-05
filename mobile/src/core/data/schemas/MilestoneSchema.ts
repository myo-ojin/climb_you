/**
 * Milestone Table Schema
 * SQLite用のマイルストーンテーブルスキーマ
 */

export const createMilestonesTable = `
  CREATE TABLE IF NOT EXISTS milestones (
    id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    station_number INTEGER NOT NULL CHECK (station_number >= 1 AND station_number <= 10),
    title TEXT NOT NULL,
    description TEXT,
    criteria TEXT,
    required_steps INTEGER NOT NULL,
    estimated_duration TEXT,
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'reached', 'achieved', 'not_achieved')),
    progress_rate INTEGER,
    achieved_at TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_synced INTEGER DEFAULT 0,
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
  );
`;

export const createMilestoneAchievementsTable = `
  CREATE TABLE IF NOT EXISTS milestone_achievements (
    id TEXT PRIMARY KEY,
    milestone_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    achieved INTEGER NOT NULL CHECK (achieved IN (0, 1)),
    evidence TEXT,
    progress_rate INTEGER,
    not_achieved_option TEXT CHECK (not_achieved_option IN ('continue', 'adjust_goal', 'redesign_milestones')),
    confirmed_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    is_synced INTEGER DEFAULT 0,
    FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE CASCADE
  );
`;

export const createMilestonesIndexes = `
  CREATE INDEX IF NOT EXISTS idx_milestones_goal_id ON milestones(goal_id);
  CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON milestones(user_id);
  CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(status);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_milestones_goal_station ON milestones(goal_id, station_number);
`;

export const createMilestoneAchievementsIndexes = `
  CREATE INDEX IF NOT EXISTS idx_milestone_achievements_milestone_id ON milestone_achievements(milestone_id);
  CREATE INDEX IF NOT EXISTS idx_milestone_achievements_user_id ON milestone_achievements(user_id);
  CREATE INDEX IF NOT EXISTS idx_milestone_achievements_confirmed_at ON milestone_achievements(confirmed_at);
`;
