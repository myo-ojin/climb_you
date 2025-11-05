/**
 * Goals Feature Types
 * 型定義：目標設定機能
 */

// Goal Status
export type GoalStatus = 'active' | 'completed' | 'paused' | 'archived';

// Goal Priority
export type GoalPriority = 'low' | 'medium' | 'high';

// SMART Analysis
export interface SmartAnalysis {
  specific: boolean;
  measurable: boolean;
  achievable: boolean;
  relevant: boolean;
  timeBound: boolean;
}

// WOOP Analysis
export interface WoopAnalysis {
  wish: string;
  outcome: string;
  obstacles: string[];
  plan: string[];
}

// Goal Details
export interface GoalDetails {
  id: string;
  userId: string;
  title: string;
  description?: string;
  kpi: string;
  deadline: string;
  duration: string;
  durationDays: number;
  status: GoalStatus;
  priority: GoalPriority;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// Goal with Analysis
export interface GoalWithAnalysis extends GoalDetails {
  smartAnalysis: SmartAnalysis;
  woopAnalysis: WoopAnalysis;
}

// Goal Update Request
export interface GoalUpdateRequest {
  title?: string;
  description?: string;
  kpi?: string;
  deadline?: string;
  duration?: string;
  priority?: GoalPriority;
  status?: GoalStatus;
}

// Goal List Item (simplified for list view)
export interface GoalListItem {
  id: string;
  title: string;
  status: GoalStatus;
  priority: GoalPriority;
  deadline: string;
  durationDays: number;
  progress: number; // 0-100
}

// Goal Statistics
export interface GoalStatistics {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  averageProgress: number;
  completionRate: number; // 0-100
}

// Goal Validation Result
export interface GoalValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

// Goal Analysis Request
export interface GoalAnalysisRequest {
  goalText: string;
  context?: string;
}

// Goal Analysis Result
export interface GoalAnalysisResult {
  isComplete: boolean;
  smartAnalysis: SmartAnalysis;
  woopAnalysis: WoopAnalysis;
  missingElements: string[];
  suggestions: string[];
}

// Goal Creation Payload
export interface GoalCreationPayload {
  title: string;
  kpi: string;
  duration: string;
  deadline: string;
  description?: string;
  priority?: GoalPriority;
  obstacles: string[];
  plans: string[];
}

// Goal Edit Form State
export interface GoalEditFormState {
  title: string;
  description: string;
  kpi: string;
  deadline: string;
  duration: string;
  priority: GoalPriority;
  status: GoalStatus;
  errors: Record<string, string>;
}

// Goal History Entry
export interface GoalHistoryEntry {
  id: string;
  goalId: string;
  action: 'created' | 'updated' | 'paused' | 'resumed' | 'completed';
  timestamp: string;
  previousValues?: Partial<GoalDetails>;
  newValues?: Partial<GoalDetails>;
}

// Goal Milestone Summary
export interface GoalMilestoneSummary {
  goalId: string;
  totalMilestones: number;
  completedMilestones: number;
  currentMilestoneStation: number;
  progress: number; // 0-100
  nextMilestoneTitle?: string;
  lastCompletedAt?: string;
}
