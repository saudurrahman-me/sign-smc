import { describe, it, expect } from 'vitest';
import {
  normalizeProfileOrders,
  resequenceLeadershipProfiles,
  moveProfileUp,
  moveProfileDown,
  isValidUuid,
} from '../lib/leadership-reorder';
import { INITIAL_LEADERSHIP_PLACEHOLDERS } from '../data/fallback-content';
import type { LeadershipProfile } from '../types/database.types';

describe('leadership-reorder utilities', () => {
  it('validates UUIDs correctly and rejects placeholder IDs', () => {
    expect(isValidUuid('d3b07384-d113-43ef-a7e8-e54d3cf26e25')).toBe(true);
    expect(isValidUuid('D3B07384-D113-43EF-A7E8-E54D3CF26E25')).toBe(true);
    expect(isValidUuid('leader-10')).toBe(false);
    expect(isValidUuid('leader-8')).toBe(false);
    expect(isValidUuid('dev-lead-12345')).toBe(false);
    expect(isValidUuid(null)).toBe(false);
    expect(isValidUuid(undefined)).toBe(false);
    expect(isValidUuid('')).toBe(false);
  });

  it('normalizes profiles into strict 1..N contiguous sequence', () => {
    const scrambled: LeadershipProfile[] = [
      { ...INITIAL_LEADERSHIP_PLACEHOLDERS[0], display_order: 10 },
      { ...INITIAL_LEADERSHIP_PLACEHOLDERS[1], display_order: 2 },
      { ...INITIAL_LEADERSHIP_PLACEHOLDERS[2], display_order: 5 },
    ];

    const normalized = normalizeProfileOrders(scrambled);
    expect(normalized.map((p) => p.display_order)).toEqual([1, 2, 3]);
    expect(normalized[0].full_name).toBe(INITIAL_LEADERSHIP_PLACEHOLDERS[1].full_name);
    expect(normalized[1].full_name).toBe(INITIAL_LEADERSHIP_PLACEHOLDERS[2].full_name);
    expect(normalized[2].full_name).toBe(INITIAL_LEADERSHIP_PLACEHOLDERS[0].full_name);
  });

  it('resolves duplicate ranks (e.g. collision at order 8) without error', () => {
    const listWithCollision: LeadershipProfile[] = [
      { ...INITIAL_LEADERSHIP_PLACEHOLDERS[6], display_order: 7 }, // Waqar (7)
      { ...INITIAL_LEADERSHIP_PLACEHOLDERS[7], display_order: 8 }, // Eshaal (8)
      { ...INITIAL_LEADERSHIP_PLACEHOLDERS[8], display_order: 8 }, // Hadia (also 8 - collision!)
      { ...INITIAL_LEADERSHIP_PLACEHOLDERS[9], display_order: 10 }, // Yusra (10)
    ];

    const resolved = normalizeProfileOrders(listWithCollision);
    expect(resolved.map((p) => p.display_order)).toEqual([1, 2, 3, 4]);
    // The two collision items are assigned distinct contiguous ranks
    expect(new Set(resolved.map((p) => p.display_order)).size).toBe(4);
  });

  it('allows moving someone from rank 9 (Hadia) to rank 8, shifting the girl at rank 8 (Eshaal) to 9', () => {
    // Starting with authentic full list (10 members)
    const originalList = normalizeProfileOrders(INITIAL_LEADERSHIP_PLACEHOLDERS);
    
    // Find Hadia (#9) and Eshaal (#8)
    const eshaal = originalList.find((p) => p.full_name.includes('Eshaal'))!;
    const hadia = originalList.find((p) => p.full_name.includes('Hadia'))!;

    expect(eshaal.display_order).toBe(8);
    expect(hadia.display_order).toBe(9);

    // Admin sets Hadia to rank 8
    const reordered = resequenceLeadershipProfiles(originalList, hadia.id, 8);

    const updatedHadia = reordered.find((p) => p.id === hadia.id)!;
    const updatedEshaal = reordered.find((p) => p.id === eshaal.id)!;

    // Hadia is now rank 8!
    expect(updatedHadia.display_order).toBe(8);
    // Eshaal automatically shifted to rank 9!
    expect(updatedEshaal.display_order).toBe(9);

    // All ranks 1 through 10 must be unique and contiguous
    expect(reordered.map((p) => p.display_order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('allows moving anyone to rank 8 cleanly (e.g. Yusra from 10 to 8)', () => {
    const originalList = normalizeProfileOrders(INITIAL_LEADERSHIP_PLACEHOLDERS);
    const yusra = originalList.find((p) => p.full_name.includes('Yusra'))!;
    const eshaal = originalList.find((p) => p.full_name.includes('Eshaal'))!;
    const hadia = originalList.find((p) => p.full_name.includes('Hadia'))!;

    expect(yusra.display_order).toBe(10);
    expect(eshaal.display_order).toBe(8);
    expect(hadia.display_order).toBe(9);

    // Admin sets Yusra (#10) to rank 8
    const reordered = resequenceLeadershipProfiles(originalList, yusra.id, 8);

    const newYusra = reordered.find((p) => p.id === yusra.id)!;
    const newEshaal = reordered.find((p) => p.id === eshaal.id)!;
    const newHadia = reordered.find((p) => p.id === hadia.id)!;

    expect(newYusra.display_order).toBe(8);
    expect(newEshaal.display_order).toBe(9);
    expect(newHadia.display_order).toBe(10);
    expect(reordered.map((p) => p.display_order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('supports 1-click moveProfileUp and moveProfileDown', () => {
    const originalList = normalizeProfileOrders(INITIAL_LEADERSHIP_PLACEHOLDERS);
    const hadia = originalList.find((p) => p.full_name.includes('Hadia'))!; // rank 9
    const eshaal = originalList.find((p) => p.full_name.includes('Eshaal'))!; // rank 8

    // Move Hadia UP one position (from 9 to 8)
    const afterUp = moveProfileUp(originalList, hadia.id);
    expect(afterUp.find((p) => p.id === hadia.id)?.display_order).toBe(8);
    expect(afterUp.find((p) => p.id === eshaal.id)?.display_order).toBe(9);

    // Move Hadia DOWN one position (from 8 back to 9)
    const afterDown = moveProfileDown(afterUp, hadia.id);
    expect(afterDown.find((p) => p.id === hadia.id)?.display_order).toBe(9);
    expect(afterDown.find((p) => p.id === eshaal.id)?.display_order).toBe(8);
  });

  it('persists arrow reordering in localStorage so positions survive page reload', () => {
    localStorage.clear();
    sessionStorage.clear();

    const originalList = normalizeProfileOrders(INITIAL_LEADERSHIP_PLACEHOLDERS);
    const hadia = originalList.find((p) => p.full_name.includes('Hadia'))!;
    
    // Simulate clicking Arrow Up on Hadia
    const reordered = moveProfileUp(originalList, hadia.id);
    
    // Simulate persistence handler saving to localStorage
    localStorage.setItem('sign_dev_leadership_profiles', JSON.stringify(reordered));

    // Simulate page refresh in another tab (sessionStorage is empty, localStorage has data)
    sessionStorage.clear();
    const stored = localStorage.getItem('sign_dev_leadership_profiles');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!) as LeadershipProfile[];
    const normalizedOnReload = normalizeProfileOrders(parsed);

    const reloadedHadia = normalizedOnReload.find((p) => p.full_name.includes('Hadia'))!;
    const reloadedEshaal = normalizedOnReload.find((p) => p.full_name.includes('Eshaal'))!;

    expect(reloadedHadia.display_order).toBe(8);
    expect(reloadedEshaal.display_order).toBe(9);
  });
});
