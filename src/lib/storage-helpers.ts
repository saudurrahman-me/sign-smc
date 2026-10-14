// ==============================================================================
// SIGN SMC - Supabase Storage Resolution & Security Helpers
// ==============================================================================

import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Extracts the relative object file path from a Supabase storage URL or path.
 * Handles formats:
 * - Public URL: https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<path>
 * - Signed URL: https://<ref>.supabase.co/storage/v1/object/sign/<bucket>/<path>?token=...
 * - Bucket prefixed: applicant-documents/<path>
 * - Direct relative path: <userId>/<filename>
 */
export function extractStoragePath(urlOrPath: string, bucket = 'applicant-documents'): string {
  if (!urlOrPath) return '';

  // Data URLs (e.g. data:image/png;base64,...) are embedded and not storage keys
  if (urlOrPath.startsWith('data:')) return '';

  try {
    if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
      const url = new URL(urlOrPath);
      const publicPrefix = `/storage/v1/object/public/${bucket}/`;
      const signPrefix = `/storage/v1/object/sign/${bucket}/`;

      if (url.pathname.includes(publicPrefix)) {
        const afterPrefix = url.pathname.substring(url.pathname.indexOf(publicPrefix) + publicPrefix.length);
        return decodeURIComponent(afterPrefix);
      }
      if (url.pathname.includes(signPrefix)) {
        const afterPrefix = url.pathname.substring(url.pathname.indexOf(signPrefix) + signPrefix.length);
        return decodeURIComponent(afterPrefix);
      }
    }
  } catch {
    // If not a parseable URL, fall through to relative string parsing
  }

  // If path starts with bucket name: e.g. "applicant-documents/2dcd5.../receipt.png"
  if (urlOrPath.startsWith(`${bucket}/`)) {
    return urlOrPath.substring(bucket.length + 1);
  }

  // If already relative path
  return urlOrPath;
}

/**
 * Resolves a storage URL or path into a signed URL (valid for 1 hour by default),
 * falling back gracefully to public URL or the original string.
 */
export async function resolveStorageViewUrl(
  urlOrPath: string,
  bucket = 'applicant-documents',
  expiresIn = 3600
): Promise<string> {
  if (!urlOrPath) return '';

  // Return Base64 data URLs directly
  if (urlOrPath.startsWith('data:')) {
    return urlOrPath;
  }

  // If not connected to Supabase or in mock mode, return as-is
  if (!isSupabaseConfigured) {
    return urlOrPath;
  }

  const filePath = extractStoragePath(urlOrPath, bucket);
  if (!filePath) {
    return urlOrPath;
  }

  try {
    // Attempt signed URL first (authorizes both private and public buckets for authenticated sessions)
    const { data: signedData, error: signError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (!signError && signedData?.signedUrl) {
      return signedData.signedUrl;
    }
  } catch (err) {
    console.warn('[SIGN Storage] createSignedUrl resolution fallback:', err);
  }

  // Secondary fallback: generate public URL
  try {
    const { data: pubData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    if (pubData?.publicUrl) {
      return pubData.publicUrl;
    }
  } catch {
    // Fall back to original
  }

  return urlOrPath;
}
