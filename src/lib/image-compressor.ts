// ==============================================================================
// SIGN SMC - Client-Side Image Compression & Storage Optimization Utility
// ==============================================================================

export interface CompressionResult {
  file: File;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  savedPercentage: number;
}

/**
 * Automatically optimizes and compresses an image in the browser before upload.
 * Reduces 3-8 MB mobile screenshots down to ~100-250 KB with crystal-clear
 * readability for Easypaisa transaction details.
 */
export async function compressPaymentReceipt(
  file: File,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.82
): Promise<CompressionResult> {
  const originalSize = file.size;

  // Fallback for non-browser or mock environments
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      file,
      previewUrl: '',
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      savedPercentage: 0,
    };
  }

  // If not an image (e.g. PDF document), return as-is
  if (!file.type || !file.type.startsWith('image/')) {
    return {
      file,
      previewUrl: '',
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      savedPercentage: 0,
    };
  }

  // Check if Canvas 2D is supported in current environment (e.g. jsdom test fallback)
  try {
    const testCanvas = document.createElement('canvas');
    if (!testCanvas || typeof testCanvas.getContext !== 'function' || !testCanvas.getContext('2d')) {
      const previewUrl = await readFileAsDataURL(file);
      return {
        file,
        previewUrl,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1,
        savedPercentage: 0,
      };
    }
  } catch {
    return {
      file,
      previewUrl: '',
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      savedPercentage: 0,
    };
  }

  // If already under 120 KB, keep original file to avoid unnecessary degradation
  if (file.size <= 120 * 1024 && (file.type === 'image/jpeg' || file.type === 'image/webp' || file.type === 'image/png')) {
    const previewUrl = await readFileAsDataURL(file);
    return {
      file,
      previewUrl,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      savedPercentage: 0,
    };
  }

  return new Promise<CompressionResult>((resolve) => {
    // 3-second safeguard against hung image decoding
    const safetyTimer = setTimeout(() => {
      resolve({
        file,
        previewUrl: '',
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1,
        savedPercentage: 0,
      });
    }, 3000);

    const safeResolve = (res: CompressionResult) => {
      clearTimeout(safetyTimer);
      resolve(res);
    };

    const reader = new FileReader();

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        safeResolve({
          file,
          previewUrl: '',
          originalSize,
          compressedSize: originalSize,
          compressionRatio: 1,
          savedPercentage: 0,
        });
        return;
      }

      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Calculate proportional scale down to max dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          safeResolve({
            file,
            previewUrl: dataUrl,
            originalSize,
            compressedSize: originalSize,
            compressionRatio: 1,
            savedPercentage: 0,
          });
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG for universal mobile/desktop compatibility
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              safeResolve({
                file,
                previewUrl: dataUrl,
                originalSize,
                compressedSize: originalSize,
                compressionRatio: 1,
                savedPercentage: 0,
              });
              return;
            }

            const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
            const compressedFile = new File([blob], cleanName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            const compressedSize = compressedFile.size;
            const compressionRatio = Number((originalSize / (compressedSize || 1)).toFixed(2));
            const savedPercentage = Math.max(
              0,
              Math.round(((originalSize - compressedSize) / originalSize) * 100)
            );

            const compressedPreviewUrl = canvas.toDataURL('image/jpeg', quality);

            safeResolve({
              file: compressedFile,
              previewUrl: compressedPreviewUrl,
              originalSize,
              compressedSize,
              compressionRatio,
              savedPercentage,
            });
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        safeResolve({
          file,
          previewUrl: dataUrl,
          originalSize,
          compressedSize: originalSize,
          compressionRatio: 1,
          savedPercentage: 0,
        });
      };

      img.src = dataUrl;
    };

    reader.onerror = () => {
      safeResolve({
        file,
        previewUrl: '',
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1,
        savedPercentage: 0,
      });
    };

    reader.readAsDataURL(file);
  });
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/**
 * Format bytes to readable string (e.g. 240 KB or 1.2 MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Automatically optimizes and compresses a certificate document image before upload.
 * Preserves ultra-crisp typography (up to 1920px width) while reducing heavy 5 MB scans down to ~150-250 KB,
 * preserving your free Supabase storage quota.
 */
export async function compressCertificateImage(file: File): Promise<CompressionResult> {
  const originalSize = file.size;

  // 1. If not an image (e.g. PDF), return as-is
  if (!file.type || !file.type.startsWith('image/')) {
    return {
      file,
      previewUrl: '',
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      savedPercentage: 0,
    };
  }

  // 2. If already lightweight (< 350 KB), keep original
  if (originalSize <= 350 * 1024) {
    const previewUrl = await readFileAsDataURL(file);
    return {
      file,
      previewUrl,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      savedPercentage: 0,
    };
  }

  // 3. Compress with high fidelity (max 1920x1920, quality 0.86)
  return compressPaymentReceipt(file, 1920, 1920, 0.86);
}

