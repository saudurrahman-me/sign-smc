import { describe, it, expect } from 'vitest';
import { formatBytes, compressPaymentReceipt } from '../lib/image-compressor';

describe('Image Compressor & Storage Utility', () => {
  describe('formatBytes', () => {
    it('formats 0 bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
    });

    it('formats bytes into KB', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(153600)).toBe('150 KB');
    });

    it('formats bytes into MB', () => {
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(5.4 * 1024 * 1024)).toBe('5.4 MB');
    });
  });

  describe('compressPaymentReceipt', () => {
    it('preserves small images under 120 KB without quality degradation', async () => {
      const smallContent = new Uint8Array(50 * 1024); // 50 KB
      const testFile = new File([smallContent], 'small_receipt.jpg', { type: 'image/jpeg' });

      const result = await compressPaymentReceipt(testFile);
      expect(result.file).toBeDefined();
      expect(result.originalSize).toBe(testFile.size);
      expect(result.compressedSize).toBe(testFile.size);
      expect(result.savedPercentage).toBe(0);
    });

    it('gracefully handles non-image files or server environment fallback', async () => {
      const pdfContent = new Uint8Array(200 * 1024); // 200 KB
      const testFile = new File([pdfContent], 'receipt.pdf', { type: 'application/pdf' });

      const result = await compressPaymentReceipt(testFile);
      expect(result.file).toBeDefined();
      expect(result.originalSize).toBe(200 * 1024);
      expect(typeof result.savedPercentage).toBe('number');
    });
  });
});
