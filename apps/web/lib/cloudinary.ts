/**
 * Cloudinary Upload Utility
 * =========================
 * Server-side helper to upload files to Cloudinary via the Upload API.
 * Uses the REST API directly — no SDK dependency needed.
 *
 * All product images/videos are uploaded to the "rimoucha/" folder
 * with auto-format and auto-quality for optimal delivery.
 */

import crypto from 'crypto';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!;

const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}`;

interface CloudinaryUploadResult {
  /** Full delivery URL (HTTPS) */
  url: string;
  /** Cloudinary public_id (for future transformations) */
  publicId: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  bytes: number;
  /** 'IMAGE' | 'VIDEO' */
  kind: 'IMAGE' | 'VIDEO';
  /** Image/video width */
  width: number | null;
  /** Image/video height */
  height: number | null;
}

/**
 * Generate a SHA-1 signature for Cloudinary signed upload.
 */
function generateSignature(params: Record<string, string>): string {
  // Sort params alphabetically and join as key=value&key=value
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  // Append API secret and hash
  return crypto.createHash('sha1').update(sorted + API_SECRET).digest('hex');
}

/**
 * Upload a File (from FormData) to Cloudinary.
 *
 * @param file - The File object from multipart form data
 * @param options - Optional overrides for folder, resourceType, etc.
 */
export async function uploadToCloudinary(
  file: File,
  options?: {
    folder?: string;
    resourceType?: 'image' | 'video' | 'auto';
    publicId?: string;
  }
): Promise<CloudinaryUploadResult> {
  const mimeType = file.type || 'application/octet-stream';
  const isVideo = mimeType.startsWith('video/');
  const resourceType = options?.resourceType || (isVideo ? 'video' : 'image');
  const folder = options?.folder || 'rimoucha';

  const timestamp = Math.floor(Date.now() / 1000).toString();

  // Build params to sign
  const signParams: Record<string, string> = {
    folder,
    timestamp,
  };

  if (options?.publicId) {
    signParams.public_id = options.publicId;
  }

  const signature = generateSignature(signParams);

  // Build multipart form data for Cloudinary's upload API
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  formData.append('timestamp', timestamp);
  formData.append('api_key', API_KEY);
  formData.append('signature', signature);

  if (options?.publicId) {
    formData.append('public_id', options.publicId);
  }

  const uploadEndpoint = `${UPLOAD_URL}/${resourceType}/upload`;

  const response = await fetch(uploadEndpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[Cloudinary] Upload failed:', response.status, errorBody);
    throw new Error(`Cloudinary upload failed: ${response.status}`);
  }

  const result = await response.json();

  return {
    url: result.secure_url,
    publicId: result.public_id,
    mimeType: result.format ? `${resourceType}/${result.format}` : mimeType,
    bytes: result.bytes || 0,
    kind: isVideo ? 'VIDEO' : 'IMAGE',
    width: result.width || null,
    height: result.height || null,
  };
}

/**
 * Delete a file from Cloudinary by public_id.
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<boolean> {
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const signParams: Record<string, string> = {
    public_id: publicId,
    timestamp,
  };

  const signature = generateSignature(signParams);

  const formData = new FormData();
  formData.append('public_id', publicId);
  formData.append('timestamp', timestamp);
  formData.append('api_key', API_KEY);
  formData.append('signature', signature);

  const response = await fetch(
    `${UPLOAD_URL}/${resourceType}/destroy`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    console.error('[Cloudinary] Delete failed:', response.status);
    return false;
  }

  const data = await response.json();
  return data.result === 'ok';
}
