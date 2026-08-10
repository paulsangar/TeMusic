// ============================================================
// Gemini Client — STUB (Phase 2)
// ============================================================
// This module will be replaced with real Gemini API calls in Phase 2.
// For now, it returns mock/static strings.

/**
 * Generate a weekly listening summary.
 * Phase 2: Will use Gemini Pro for creative text generation.
 */
export async function generateWeeklySummary(
  _metrics: Record<string, unknown>,
): Promise<string> {
  return '🎵 Your weekly summary is coming soon! This feature will be powered by Gemini AI in a future update.';
}

/**
 * Generate an insight about listening patterns.
 * Phase 2: Will analyze metrics and produce narrative insights.
 */
export async function generateInsight(
  _metrics: Record<string, unknown>,
): Promise<string> {
  return '💡 AI-powered insights are coming soon. Stay tuned for deep analysis of your listening patterns!';
}

/**
 * Generate an attractive description for a new playlist.
 * Phase 2: Will create creative, contextual descriptions.
 */
export async function generatePlaylistDescription(
  _playlistName: string,
  _tracks: Record<string, unknown>[],
): Promise<string> {
  return 'A curated playlist crafted by TeMusc LAB. AI-generated descriptions coming in a future update.';
}
