import { describe, it, expect } from 'vitest';
import { extractStoragePath, resolveStorageViewUrl } from '../lib/storage-helpers';

describe('Storage Helpers Unit Tests', () => {
  const sampleBucket = 'applicant-documents';
  const samplePath = '2dcd5f00-9902-41c7-8d64-987b705d2a60/receipt_2dcd5f00-9902-41c7-8d64-987b705d2a60_1791997517861.png';

  it('correctly extracts path from standard Supabase public object URL', () => {
    const publicUrl = `https://nwcijaanocgdxbwtkaru.supabase.co/storage/v1/object/public/${sampleBucket}/${samplePath}`;
    const extracted = extractStoragePath(publicUrl, sampleBucket);
    expect(extracted).toBe(samplePath);
  });

  it('correctly extracts path from Supabase signed object URL', () => {
    const signedUrl = `https://nwcijaanocgdxbwtkaru.supabase.co/storage/v1/object/sign/${sampleBucket}/${samplePath}?token=abc123token`;
    const extracted = extractStoragePath(signedUrl, sampleBucket);
    expect(extracted).toBe(samplePath);
  });

  it('correctly handles bucket-prefixed relative path', () => {
    const prefixed = `${sampleBucket}/${samplePath}`;
    const extracted = extractStoragePath(prefixed, sampleBucket);
    expect(extracted).toBe(samplePath);
  });

  it('correctly returns raw relative path unchanged', () => {
    const extracted = extractStoragePath(samplePath, sampleBucket);
    expect(extracted).toBe(samplePath);
  });

  it('returns empty string for base64 data URLs', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const extracted = extractStoragePath(dataUrl, sampleBucket);
    expect(extracted).toBe('');
  });

  it('returns base64 data URL unchanged when resolving', async () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const resolved = await resolveStorageViewUrl(dataUrl, sampleBucket);
    expect(resolved).toBe(dataUrl);
  });

  it('returns empty string when urlOrPath is empty', async () => {
    const resolved = await resolveStorageViewUrl('', sampleBucket);
    expect(resolved).toBe('');
  });
});
