/**
 * Profile Repository Interface
 * ユーザープロファイルデータの永続化を抽象化
 */

// オンボーディング用の拡張プロファイル
export interface OnboardingProfile {
  userId: string;
  dailyCommitTime: string; // "30分"などの文字列
  lifestyle?: string; // "会社員"、"学生"など
  focusTime?: string; // "朝"、"夜"など
  workEnvironment?: string; // "自宅"、"オフィス"など
  taskPace?: string; // "毎日"、"週末"など
  pastFailureReason?: string; // "時間不足"など
  skillLevel?: string; // "初心者"、"経験者"など
  difficultyPreference?: string; // "簡単"、"チャレンジング"など
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProfileDTO {
  userId: string;
  dailyCommitTime: string;
  lifestyle?: string;
  focusTime?: string;
  workEnvironment?: string;
  taskPace?: string;
  pastFailureReason?: string;
  skillLevel?: string;
  difficultyPreference?: string;
}

/**
 * ProfileRepository Interface
 * ドメイン層で定義し、データ層で実装する
 */
export interface ProfileRepository {
  /**
   * プロファイルを作成（ローカル保存）
   */
  createProfile(profile: CreateProfileDTO): Promise<OnboardingProfile>;

  /**
   * ユーザーIDでプロファイルを取得
   */
  getProfileByUserId(userId: string): Promise<OnboardingProfile | null>;

  /**
   * プロファイルを更新
   */
  updateProfile(profile: OnboardingProfile): Promise<OnboardingProfile>;

  /**
   * プロファイルを削除
   */
  deleteProfile(userId: string): Promise<void>;
}
