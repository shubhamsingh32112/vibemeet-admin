import type { AxiosInstance } from 'axios';

export type CloudflareUploadPurpose = 'creator-avatar' | 'creator-gallery' | 'user-avatar';

export type DirectUploadSession = {
  uploadUrl: string;
  sessionId: string;
  imageId: string;
  expiresAt: string;
};

function imagesDisabledMessage(code?: string, error?: string): string {
  if (code === 'IMAGES_DISABLED' || error?.includes('USE_CLOUDFLARE_IMAGES')) {
    return 'Image uploads are disabled on the API. Set USE_CLOUDFLARE_IMAGES=true and configure Cloudflare credentials.';
  }
  return error || 'Image upload failed';
}

/**
 * Issue a direct-upload session and POST bytes to Cloudflare.
 * Returns sessionId for the caller to commit on the resource endpoint.
 */
export async function uploadImageViaDirectSession(
  api: AxiosInstance,
  params: {
    purpose: CloudflareUploadPurpose;
    blob: Blob;
    contentType?: string;
    filename?: string;
  }
): Promise<DirectUploadSession> {
  const contentType = params.contentType ?? 'image/jpeg';
  const res = await api.post('/images/direct-upload', {
    purpose: params.purpose,
    declaredSizeBytes: params.blob.size,
    declaredMimeType: contentType,
  });
  const data = res.data?.data as DirectUploadSession | undefined;
  if (!data?.uploadUrl || !data?.sessionId) {
    throw new Error('Invalid direct-upload response from API');
  }

  const formData = new FormData();
  formData.append('file', params.blob, params.filename ?? `upload-${Date.now()}.jpg`);
  const put = await fetch(data.uploadUrl, {
    method: 'POST',
    body: formData,
  });
  if (!put.ok) {
    throw new Error(`Cloudflare upload failed (${put.status})`);
  }

  return data;
}

export function formatCloudflareApiError(err: unknown): string {
  const e = err as {
    response?: { data?: { code?: string; error?: string } };
    message?: string;
  };
  const code = e.response?.data?.code;
  const msg = e.response?.data?.error;
  return imagesDisabledMessage(code, msg || e.message);
}
