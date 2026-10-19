import type { LeadershipProfile } from '../types/database.types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Checks whether a given string is a valid UUID (used by Supabase primary keys).
 */
export function isValidUuid(id?: string | null): boolean {
  return Boolean(id && UUID_REGEX.test(id.trim()));
}

/**
 * Normalizes an array of leadership profiles so that:
 * 1. Profiles are sorted primarily by their current `display_order`.
 * 2. Ties or duplicate orders are resolved deterministically without collisions.
 * 3. Every profile is assigned a unique, contiguous 1-based `display_order` (1, 2, 3, ... N).
 */
export function normalizeProfileOrders(profiles: LeadershipProfile[]): LeadershipProfile[] {
  if (!profiles || profiles.length === 0) return [];

  // Sort by display_order ascending, using current array index as stable tie-breaker
  const sorted = [...profiles].sort((a, b) => {
    const orderA = typeof a.display_order === 'number' && !isNaN(a.display_order) ? a.display_order : 9999;
    const orderB = typeof b.display_order === 'number' && !isNaN(b.display_order) ? b.display_order : 9999;
    if (orderA !== orderB) return orderA - orderB;
    // Tie-breaker: keep relative position or compare full_name
    return a.full_name.localeCompare(b.full_name);
  });

  return sorted.map((p, index) => ({
    ...p,
    display_order: index + 1,
  }));
}

/**
 * Re-sequences leadership profiles when a profile is assigned a new display_order rank.
 *
 * For example:
 * - If Hadia (currently #9) is moved to rank #8:
 *   Eshaal (#8) shifts down to #9.
 * - If Yusra (currently #10) is moved to rank #8:
 *   Eshaal (#8) shifts to #9, and Hadia (#9) shifts to #10.
 *
 * Guaranteed results:
 * - The moved profile is placed precisely at `targetOrder`.
 * - All other profiles shift smoothly without gaps, duplicates, or collisions.
 * - Every profile has a clean, contiguous 1..N display_order.
 */
export function resequenceLeadershipProfiles(
  profiles: LeadershipProfile[],
  targetProfileId: string,
  targetOrder: number
): LeadershipProfile[] {
  if (!profiles || profiles.length === 0) return [];

  // First normalize existing list to eliminate any pre-existing duplicates
  const normalized = normalizeProfileOrders(profiles);

  // Clamp target order within valid range: [1, normalized.length]
  const clampedOrder = Math.max(1, Math.min(Math.round(targetOrder) || 1, normalized.length));
  const targetIndex = clampedOrder - 1;

  const currentIndex = normalized.findIndex((p) => p.id === targetProfileId);
  if (currentIndex === -1) {
    // Target not found in existing list; return normalized list
    return normalized;
  }

  if (currentIndex === targetIndex) {
    // Already at target position
    return normalized;
  }

  // Remove moved profile from current position
  const copy = [...normalized];
  const [movedProfile] = copy.splice(currentIndex, 1);

  // Insert at target index
  copy.splice(targetIndex, 0, movedProfile);

  // Re-assign strict 1..N display orders
  return copy.map((p, idx) => ({
    ...p,
    display_order: idx + 1,
  }));
}

/**
 * Moves a profile one position up (e.g. from rank 9 to rank 8).
 * Returns the updated, normalized list.
 */
export function moveProfileUp(
  profiles: LeadershipProfile[],
  targetProfileId: string
): LeadershipProfile[] {
  const normalized = normalizeProfileOrders(profiles);
  const currentIndex = normalized.findIndex((p) => p.id === targetProfileId);
  if (currentIndex <= 0) return normalized; // Already at the top
  return resequenceLeadershipProfiles(normalized, targetProfileId, currentIndex); // currentIndex is (currentRank - 1)
}

/**
 * Moves a profile one position down (e.g. from rank 8 to rank 9).
 * Returns the updated, normalized list.
 */
export function moveProfileDown(
  profiles: LeadershipProfile[],
  targetProfileId: string
): LeadershipProfile[] {
  const normalized = normalizeProfileOrders(profiles);
  const currentIndex = normalized.findIndex((p) => p.id === targetProfileId);
  if (currentIndex === -1 || currentIndex >= normalized.length - 1) return normalized; // Already at the bottom
  return resequenceLeadershipProfiles(normalized, targetProfileId, currentIndex + 2); // currentIndex + 2 is (currentRank + 1)
}
