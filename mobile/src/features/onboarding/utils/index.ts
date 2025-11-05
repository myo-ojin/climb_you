/**
 * Onboarding Utilities
 * Export all utility functions and helpers
 */

// Milestone Utilities
export {
  transformMilestoneResponse,
  transformMilestoneResponses,
  estimateDifficultyLevel,
  parseDurationToDays,
  calculateDurationDisplay,
  buildMilestoneGenerationParams,
  validateMilestones,
} from './milestoneTransformer';

// Profile Utilities
export {
  parseCommitTimeToMinutes,
  formatMinutesToCommitTime,
  normalizeProfileData,
  validateProfileData,
  transformProfileToAPIRequest,
  transformAPIResponseToProfile,
  extractProfileInsights,
  areProfilesEqual,
  PROFILE_QUESTIONS,
  COMMIT_TIME_OPTIONS,
  type NormalizedProfileData,
  type ProfileAPIRequest,
  type ProfileAPIResponse,
  type ProfileInsights,
} from './profileTransformer';
