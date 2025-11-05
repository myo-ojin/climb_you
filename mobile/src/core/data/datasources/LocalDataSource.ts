/**
 * LocalDataSource
 * SQLite + AsyncStorage を使用したローカルデータ管理
 * オフライン機能とローカルストレージを担当
 */

import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Goal,
  Quest,
  QuestLog,
  Milestone,
  User,
  UserProgress,
  UserProfile,
  Streak
} from '@/core/domain/entities';

export class LocalDataSource {
  private static instance: LocalDataSource;
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized: boolean = false;

  private constructor() {}

  /**
   * シングルトンパターンでインスタンスを取得
   */
  static getInstance(): LocalDataSource {
    if (!LocalDataSource.instance) {
      LocalDataSource.instance = new LocalDataSource();
    }
    return LocalDataSource.instance;
  }

  /**
   * データベース初期化
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.db = await SQLite.openDatabaseAsync('climb-you.db');
      await this.createTables();
      this.initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * テーブル作成
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // users テーブル
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT,
          display_name TEXT,
          avatar TEXT,
          auth_provider_id TEXT,
          auth_provider_type TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);

      // goals テーブル
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS goals (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          kpi TEXT NOT NULL,
          duration TEXT NOT NULL,
          deadline TEXT,
          obstacles TEXT,
          plans TEXT,
          status TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          is_synced INTEGER DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `);

      // quests テーブル
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS quests (
          id TEXT PRIMARY KEY,
          quest_bundle_id TEXT NOT NULL,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          estimated_time INTEGER NOT NULL,
          difficulty TEXT NOT NULL,
          completion_criteria TEXT NOT NULL,
          evidence_type TEXT NOT NULL,
          contributes_to_station INTEGER NOT NULL,
          order_num INTEGER NOT NULL,
          status TEXT NOT NULL,
          created_at TEXT NOT NULL,
          valid_until TEXT NOT NULL,
          is_synced INTEGER DEFAULT 0
        );
      `);

      // quest_logs テーブル
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS quest_logs (
          id TEXT PRIMARY KEY,
          quest_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          status TEXT NOT NULL,
          actual_time INTEGER,
          skip_reason TEXT,
          skip_memo TEXT,
          obstacle TEXT,
          obstacle_details TEXT,
          contingency_plan TEXT,
          evidence_type TEXT,
          evidence_url TEXT,
          evidence_note TEXT,
          memo TEXT,
          steps_earned INTEGER NOT NULL,
          completed_at TEXT,
          created_at TEXT NOT NULL,
          is_synced INTEGER DEFAULT 0,
          FOREIGN KEY (quest_id) REFERENCES quests(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `);

      // milestones テーブル
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS milestones (
          id TEXT PRIMARY KEY,
          goal_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          station_number INTEGER NOT NULL CHECK (station_number >= 1 AND station_number <= 10),
          title TEXT NOT NULL,
          description TEXT,
          criteria TEXT,
          required_steps INTEGER NOT NULL DEFAULT 0,
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
      `);

      // milestone_achievements テーブル
      await this.db.execAsync(`
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
      `);

      // user_profiles テーブル
      await this.db.execAsync(`
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
      `);

      // user_progress テーブル
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS user_progress (
          user_id TEXT PRIMARY KEY,
          total_steps INTEGER NOT NULL,
          current_streak INTEGER NOT NULL,
          max_streak INTEGER NOT NULL,
          freeze_days_remaining INTEGER NOT NULL,
          last_activity_date TEXT NOT NULL,
          current_station INTEGER NOT NULL,
          steps_for_current_station INTEGER NOT NULL,
          updated_at TEXT NOT NULL,
          is_synced INTEGER DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `);

      // streaks テーブル
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS streaks (
          user_id TEXT PRIMARY KEY,
          current_streak INTEGER NOT NULL,
          max_streak INTEGER NOT NULL,
          freeze_days_used INTEGER NOT NULL,
          last_completion_date TEXT NOT NULL,
          start_date TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `);

      // notification_histories テーブル
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS notification_histories (
          id TEXT PRIMARY KEY,
          notification_id TEXT NOT NULL,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          body TEXT NOT NULL,
          subtitle TEXT,
          image_url TEXT,
          data TEXT,
          sent_at TEXT NOT NULL,
          is_tapped INTEGER NOT NULL DEFAULT 0,
          tapped_at TEXT,
          is_delivered INTEGER NOT NULL DEFAULT 1,
          user_id TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);

      // インデックス作成
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
        CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
        CREATE INDEX IF NOT EXISTS idx_quests_bundle_id ON quests(quest_bundle_id);
        CREATE INDEX IF NOT EXISTS idx_quest_logs_user_id ON quest_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_quest_logs_quest_id ON quest_logs(quest_id);
        CREATE INDEX IF NOT EXISTS idx_milestones_goal_id ON milestones(goal_id);
        CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON milestones(user_id);
        CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(status);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_milestones_goal_station ON milestones(goal_id, station_number);
        CREATE INDEX IF NOT EXISTS idx_milestone_achievements_milestone_id ON milestone_achievements(milestone_id);
        CREATE INDEX IF NOT EXISTS idx_milestone_achievements_user_id ON milestone_achievements(user_id);
        CREATE INDEX IF NOT EXISTS idx_milestone_achievements_confirmed_at ON milestone_achievements(confirmed_at);
        CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
        CREATE INDEX IF NOT EXISTS idx_notification_histories_user_id ON notification_histories(user_id);
        CREATE INDEX IF NOT EXISTS idx_notification_histories_type ON notification_histories(type);
        CREATE INDEX IF NOT EXISTS idx_notification_histories_sent_at ON notification_histories(sent_at);
        CREATE INDEX IF NOT EXISTS idx_notification_histories_is_tapped ON notification_histories(is_tapped);
        CREATE INDEX IF NOT EXISTS idx_notification_histories_notification_id ON notification_histories(notification_id);
      `);

      console.log('Tables created successfully');
    } catch (error) {
      console.error('Failed to create tables:', error);
      throw error;
    }
  }

  // ===== Goal 操作 =====

  async saveGoal(goal: Goal): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO goals
        (id, user_id, title, kpi, duration, deadline, obstacles, plans, status, created_at, updated_at, is_synced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          goal.id,
          goal.userId,
          goal.title,
          goal.kpi,
          goal.duration,
          goal.deadline?.toISOString() || null,
          JSON.stringify(goal.obstacles),
          JSON.stringify(goal.plans),
          goal.status,
          goal.createdAt.toISOString(),
          goal.updatedAt.toISOString(),
          0 // is_synced = false（ローカルで作成した場合）
        ]
      );
    } catch (error) {
      console.error('Failed to save goal:', error);
      throw error;
    }
  }

  async getGoal(userId: string): Promise<Goal | null> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getFirstAsync<any>(
        `SELECT * FROM goals WHERE user_id = ? LIMIT 1`,
        [userId]
      );

      if (!result) return null;

      return {
        id: result.id,
        userId: result.user_id,
        title: result.title,
        kpi: result.kpi,
        duration: result.duration,
        deadline: result.deadline ? new Date(result.deadline) : undefined,
        obstacles: JSON.parse(result.obstacles || '[]'),
        plans: JSON.parse(result.plans || '[]'),
        status: result.status,
        createdAt: new Date(result.created_at),
        updatedAt: new Date(result.updated_at)
      };
    } catch (error) {
      console.error('Failed to get goal:', error);
      throw error;
    }
  }

  // ===== Quest 操作 =====

  async saveQuests(quests: Quest[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      for (const quest of quests) {
        await this.db.runAsync(
          `INSERT OR REPLACE INTO quests
          (id, quest_bundle_id, type, title, description, estimated_time, difficulty,
           completion_criteria, evidence_type, contributes_to_station, order_num, status,
           created_at, valid_until, is_synced)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            quest.id,
            quest.questBundleId,
            quest.type,
            quest.title,
            quest.description,
            quest.estimatedTime,
            quest.difficulty,
            quest.completionCriteria,
            quest.evidenceType,
            quest.contributesToStation,
            quest.order,
            quest.status,
            quest.createdAt.toISOString(),
            quest.validUntil.toISOString(),
            0
          ]
        );
      }
    } catch (error) {
      console.error('Failed to save quests:', error);
      throw error;
    }
  }

  async getTodayQuests(): Promise<Quest[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const results = await this.db.getAllAsync<any>(
        `SELECT * FROM quests WHERE datetime(valid_until) >= datetime('now') ORDER BY order_num`
      );

      return results.map(row => ({
        id: row.id,
        questBundleId: row.quest_bundle_id,
        type: row.type,
        title: row.title,
        description: row.description,
        estimatedTime: row.estimated_time,
        difficulty: row.difficulty,
        completionCriteria: row.completion_criteria,
        evidenceType: row.evidence_type,
        contributesToStation: row.contributes_to_station,
        order: row.order_num,
        status: row.status,
        createdAt: new Date(row.created_at),
        validUntil: new Date(row.valid_until)
      }));
    } catch (error) {
      console.error('Failed to get today quests:', error);
      throw error;
    }
  }

  async getQuest(questId: string): Promise<Quest | null> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getFirstAsync<any>(
        `SELECT * FROM quests WHERE id = ?`,
        [questId]
      );

      if (!result) return null;

      return {
        id: result.id,
        questBundleId: result.quest_bundle_id,
        type: result.type,
        title: result.title,
        description: result.description,
        estimatedTime: result.estimated_time,
        difficulty: result.difficulty,
        completionCriteria: result.completion_criteria,
        evidenceType: result.evidence_type,
        contributesToStation: result.contributes_to_station,
        order: result.order_num,
        status: result.status,
        createdAt: new Date(result.created_at),
        validUntil: new Date(result.valid_until)
      };
    } catch (error) {
      console.error('Failed to get quest:', error);
      throw error;
    }
  }

  // ===== QuestLog 操作 =====

  async saveQuestLog(log: QuestLog): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO quest_logs
        (id, quest_id, user_id, status, actual_time, skip_reason, skip_memo, obstacle,
         obstacle_details, contingency_plan, evidence_type, evidence_url, evidence_note,
         memo, steps_earned, completed_at, created_at, is_synced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          log.id,
          log.questId,
          log.userId,
          log.status,
          log.actualTime || null,
          log.skipReason || null,
          log.skipMemo || null,
          log.obstacle || null,
          log.obstacleDetails || null,
          log.contingencyPlan || null,
          log.evidenceType || null,
          log.evidenceUrl || null,
          log.evidenceNote || null,
          log.memo || null,
          log.stepsEarned,
          log.completedAt?.toISOString() || null,
          log.createdAt.toISOString(),
          0
        ]
      );
    } catch (error) {
      console.error('Failed to save quest log:', error);
      throw error;
    }
  }

  async getQuestLogs(userId: string, limit: number = 30): Promise<QuestLog[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const results = await this.db.getAllAsync<any>(
        `SELECT * FROM quest_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
        [userId, limit]
      );

      return results.map(row => ({
        id: row.id,
        questId: row.quest_id,
        userId: row.user_id,
        status: row.status,
        actualTime: row.actual_time,
        skipReason: row.skip_reason,
        skipMemo: row.skip_memo,
        obstacle: row.obstacle,
        obstacleDetails: row.obstacle_details,
        contingencyPlan: row.contingency_plan,
        evidenceType: row.evidence_type,
        evidenceUrl: row.evidence_url,
        evidenceNote: row.evidence_note,
        memo: row.memo,
        stepsEarned: row.steps_earned,
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
        createdAt: new Date(row.created_at),
        isSynced: row.is_synced === 1
      }));
    } catch (error) {
      console.error('Failed to get quest logs:', error);
      throw error;
    }
  }

  // ===== UserProgress 操作 =====

  async saveUserProgress(progress: UserProgress): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO user_progress
        (user_id, total_steps, current_streak, max_streak, freeze_days_remaining,
         last_activity_date, current_station, steps_for_current_station, updated_at, is_synced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          progress.userId,
          progress.totalSteps,
          progress.currentStreak,
          progress.maxStreak,
          progress.freezeDaysRemaining,
          progress.lastActivityDate.toISOString(),
          progress.currentStation,
          progress.stepsForCurrentStation,
          progress.updatedAt.toISOString(),
          0
        ]
      );
    } catch (error) {
      console.error('Failed to save user progress:', error);
      throw error;
    }
  }

  async getUserProgress(userId: string): Promise<UserProgress | null> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getFirstAsync<any>(
        `SELECT * FROM user_progress WHERE user_id = ?`,
        [userId]
      );

      if (!result) return null;

      return {
        userId: result.user_id,
        totalSteps: result.total_steps,
        currentStreak: result.current_streak,
        maxStreak: result.max_streak,
        freezeDaysRemaining: result.freeze_days_remaining,
        lastActivityDate: new Date(result.last_activity_date),
        currentStation: result.current_station,
        stepsForCurrentStation: result.steps_for_current_station,
        updatedAt: new Date(result.updated_at),
        isSynced: result.is_synced === 1
      };
    } catch (error) {
      console.error('Failed to get user progress:', error);
      throw error;
    }
  }

  // ===== Goal 操作（追加メソッド） =====

  async getGoalById(id: string): Promise<Goal | null> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getFirstAsync<any>(
        `SELECT * FROM goals WHERE id = ?`,
        [id]
      );

      if (!result) return null;

      return {
        id: result.id,
        userId: result.user_id,
        title: result.title,
        kpi: result.kpi,
        duration: result.duration,
        deadline: result.deadline ? new Date(result.deadline) : undefined,
        obstacles: JSON.parse(result.obstacles || '[]'),
        plans: JSON.parse(result.plans || '[]'),
        status: result.status,
        createdAt: new Date(result.created_at),
        updatedAt: new Date(result.updated_at)
      };
    } catch (error) {
      console.error('Failed to get goal by id:', error);
      throw error;
    }
  }

  async updateGoal(goal: Goal): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        `UPDATE goals SET
        title = ?, kpi = ?, duration = ?, deadline = ?, obstacles = ?, plans = ?,
        status = ?, updated_at = ?, is_synced = 0
        WHERE id = ?`,
        [
          goal.title,
          goal.kpi,
          goal.duration,
          goal.deadline?.toISOString() || null,
          JSON.stringify(goal.obstacles),
          JSON.stringify(goal.plans),
          goal.status,
          new Date().toISOString(),
          goal.id
        ]
      );
    } catch (error) {
      console.error('Failed to update goal:', error);
      throw error;
    }
  }

  async deleteGoal(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(`DELETE FROM goals WHERE id = ?`, [id]);
    } catch (error) {
      console.error('Failed to delete goal:', error);
      throw error;
    }
  }

  async getUserGoals(userId: string): Promise<Goal[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const results = await this.db.getAllAsync<any>(
        `SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC`,
        [userId]
      );

      return results.map(row => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        kpi: row.kpi,
        duration: row.duration,
        deadline: row.deadline ? new Date(row.deadline) : undefined,
        obstacles: JSON.parse(row.obstacles || '[]'),
        plans: JSON.parse(row.plans || '[]'),
        status: row.status,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }));
    } catch (error) {
      console.error('Failed to get user goals:', error);
      throw error;
    }
  }

  // ===== Milestone 操作 =====

  async saveMilestone(milestone: Milestone, userId?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO milestones
        (id, goal_id, user_id, station_number, title, description, criteria, required_steps,
         estimated_duration, status, completed_at, created_at, updated_at, is_synced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          milestone.id,
          milestone.goalId,
          userId || 'unknown', // user_idが必要
          milestone.station,
          milestone.title,
          milestone.description || null,
          milestone.achievementCriteria || null,
          milestone.targetSteps || 0,
          milestone.estimatedDuration || null,
          milestone.status,
          milestone.completedAt?.toISOString() || null,
          milestone.createdAt.toISOString(),
          milestone.updatedAt.toISOString(),
          0
        ]
      );
    } catch (error) {
      console.error('Failed to save milestone:', error);
      throw error;
    }
  }

  async saveMilestones(milestones: Milestone[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      for (const milestone of milestones) {
        await this.saveMilestone(milestone);
      }
    } catch (error) {
      console.error('Failed to save milestones:', error);
      throw error;
    }
  }

  async getMilestone(id: string): Promise<Milestone | null> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getFirstAsync<any>(
        `SELECT * FROM milestones WHERE id = ?`,
        [id]
      );

      if (!result) return null;

      return {
        id: result.id,
        goalId: result.goal_id,
        station: result.station_number,
        title: result.title,
        description: result.description,
        estimatedDuration: result.estimated_duration,
        achievementCriteria: result.criteria,
        targetSteps: result.required_steps,
        status: result.status,
        completedAt: result.completed_at ? new Date(result.completed_at) : undefined,
        createdAt: new Date(result.created_at),
        updatedAt: new Date(result.updated_at)
      };
    } catch (error) {
      console.error('Failed to get milestone:', error);
      throw error;
    }
  }

  async getMilestones(goalId: string): Promise<Milestone[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const results = await this.db.getAllAsync<any>(
        `SELECT * FROM milestones WHERE goal_id = ? ORDER BY station_number`,
        [goalId]
      );

      return results.map(row => ({
        id: row.id,
        goalId: row.goal_id,
        station: row.station_number,
        title: row.title,
        description: row.description,
        estimatedDuration: row.estimated_duration,
        achievementCriteria: row.criteria,
        targetSteps: row.required_steps,
        status: row.status,
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }));
    } catch (error) {
      console.error('Failed to get milestones:', error);
      throw error;
    }
  }

  async updateMilestone(milestone: Milestone): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        `UPDATE milestones SET
        title = ?, description = ?, estimated_duration = ?, criteria = ?,
        required_steps = ?, status = ?, completed_at = ?, updated_at = ?, is_synced = 0
        WHERE id = ?`,
        [
          milestone.title,
          milestone.description || null,
          milestone.estimatedDuration || null,
          milestone.achievementCriteria || null,
          milestone.targetSteps || 0,
          milestone.status,
          milestone.completedAt?.toISOString() || null,
          new Date().toISOString(),
          milestone.id
        ]
      );
    } catch (error) {
      console.error('Failed to update milestone:', error);
      throw error;
    }
  }

  async deleteMilestone(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(`DELETE FROM milestones WHERE id = ?`, [id]);
    } catch (error) {
      console.error('Failed to delete milestone:', error);
      throw error;
    }
  }

  async deleteGoalMilestones(goalId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(`DELETE FROM milestones WHERE goal_id = ?`, [goalId]);
    } catch (error) {
      console.error('Failed to delete goal milestones:', error);
      throw error;
    }
  }

  // ===== Profile 操作 =====

  async saveProfile(profile: UserProfile): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO user_profiles
        (user_id, daily_commit_time, lifestyle, focus_time, work_environment, task_pace,
         past_failure_reason, skill_level, difficulty_preference, created_at, updated_at, is_synced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          profile.userId,
          profile.dailyCommitTime,
          profile.lifestyle || null,
          profile.focusTime || null,
          profile.workEnvironment || null,
          profile.taskPace || null,
          profile.pastFailureReason || null,
          profile.skillLevel || null,
          profile.difficultyPreference || null,
          profile.createdAt.toISOString(),
          profile.updatedAt.toISOString(),
          0
        ]
      );
    } catch (error) {
      console.error('Failed to save profile:', error);
      throw error;
    }
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getFirstAsync<any>(
        `SELECT * FROM user_profiles WHERE user_id = ?`,
        [userId]
      );

      if (!result) return null;

      return {
        userId: result.user_id,
        dailyCommitTime: result.daily_commit_time,
        lifestyle: result.lifestyle,
        focusTime: result.focus_time,
        workEnvironment: result.work_environment,
        taskPace: result.task_pace,
        pastFailureReason: result.past_failure_reason,
        skillLevel: result.skill_level,
        difficultyPreference: result.difficulty_preference,
        createdAt: new Date(result.created_at),
        updatedAt: new Date(result.updated_at)
      };
    } catch (error) {
      console.error('Failed to get profile:', error);
      throw error;
    }
  }

  async updateProfile(profile: UserProfile): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        `UPDATE user_profiles SET
        daily_commit_time = ?, lifestyle = ?, focus_time = ?, work_environment = ?,
        task_pace = ?, past_failure_reason = ?, skill_level = ?, difficulty_preference = ?,
        updated_at = ?, is_synced = 0
        WHERE user_id = ?`,
        [
          profile.dailyCommitTime,
          profile.lifestyle || null,
          profile.focusTime || null,
          profile.workEnvironment || null,
          profile.taskPace || null,
          profile.pastFailureReason || null,
          profile.skillLevel || null,
          profile.difficultyPreference || null,
          new Date().toISOString(),
          profile.userId
        ]
      );
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }

  async deleteProfile(userId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(`DELETE FROM user_profiles WHERE user_id = ?`, [userId]);
    } catch (error) {
      console.error('Failed to delete profile:', error);
      throw error;
    }
  }

  // ===== AsyncStorage 操作 =====

  async saveSetting(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Failed to save setting:', error);
      throw error;
    }
  }

  async getSetting(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Failed to get setting:', error);
      throw error;
    }
  }

  async removeSetting(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove setting:', error);
      throw error;
    }
  }

  async clearAllSettings(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Failed to clear settings:', error);
      throw error;
    }
  }

  // ===== データベースリセット（テスト用） =====

  async resetDatabase(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.execAsync(`
        DROP TABLE IF EXISTS notification_histories;
        DROP TABLE IF EXISTS quest_logs;
        DROP TABLE IF EXISTS streaks;
        DROP TABLE IF EXISTS user_progress;
        DROP TABLE IF EXISTS user_profiles;
        DROP TABLE IF EXISTS milestone_achievements;
        DROP TABLE IF EXISTS milestones;
        DROP TABLE IF EXISTS quests;
        DROP TABLE IF EXISTS goals;
        DROP TABLE IF EXISTS users;
      `);

      await this.createTables();
      console.log('Database reset successfully');
    } catch (error) {
      console.error('Failed to reset database:', error);
      throw error;
    }
  }
}
