/**
 * AI generation token costs and daily limits.
 *
 * Platform tokens are charged per chapter generation.
 * Daily limits prevent abuse and control API costs.
 */

/** Platform token cost per chapter generation */
export const CHAPTER_GENERATION_COST = 50;

/** Maximum chapters a user can generate per day */
export const DAILY_GENERATION_LIMIT = 20;

/** Maximum word count target per chapter */
export const MAX_CHAPTER_WORDS = 5000;

/** Default word count target per chapter */
export const DEFAULT_CHAPTER_WORDS = 3000;

/** Claude API model to use */
export const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

/** Max tokens for Claude API response */
export const CLAUDE_MAX_TOKENS = 8192;

/** Retry configuration for API calls */
export const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
} as const;
