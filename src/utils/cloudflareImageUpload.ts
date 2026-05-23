import type { AxiosInstance } from 'axios';

export type CloudflareUploadPurpose = 'creator-avatar' | 'creator-gallery' | 'user-avatar';

export type DirectUploadSession = {
  uploadUrl: string;
  sessionId: string;
  imageId: string;
  expiresAt: string;
};

type ApiEnvelope = {
  success?: boolean;
  code?: string;
  error?: string;
  data?: Record<string, unknown>;
};

function imagesDisabledMessage(code?: string, error?: string): string {
  if (code === 'IMAGES_DISABLED' || error?.includes('USE_CLOUDFLARE_IMAGES')) {
    return 'Image uploads are disabled on the API. Set USE_CLOUDFLARE_IMAGES=true and configure Cloudflare credentials.';
  }
  return error || 'Image upload failed';
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Normalize POST /images/direct-upload response (backend uses `uploadURL`; alias `uploadUrl`).
 */
export function parseDirectUploadPayload(body: unknown): DirectUploadSession {
  const envelope = (body ?? {}) as ApiEnvelope;
  if (envelope.success === false) {
    const msg = imagesDisabledMessage(envelope.code, envelope.error);
    const err = new Error(msg);
    (err as Error & { code?: string }).code = envelope.code;
    throw err;
  }

  const data = (envelope.data ?? envelope) as Record<string, unknown>;
  const uploadUrl =
    asNonEmptyString(data.uploadURL) ?? asNonEmptyString(data.uploadUrl);
  const sessionId = asNonEmptyString(data.sessionId);
  const imageId = asNonEmptyString(data.imageId) ?? '';
  const expiresAt =
    asNonEmptyString(data.expiresAt) ?? new Date(Date.now() + 3600_000).toISOString();

  if (!uploadUrl || !sessionId) {
    const code = envelope.code ?? (typeof data.code === 'string' ? data.code : undefined);
    const hint = code ? ` (${code})` : '';
    throw new Error(
      `Direct-upload response missing uploadURL/sessionId${hint}. Check API Cloudflare image settings.`,
    );
  }

  return { uploadUrl, sessionId, imageId, expiresAt };
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
  },
): Promise<DirectUploadSession> {
  const contentType = params.contentType ?? 'image/jpeg';
  const res = await api.post('/images/direct-upload', {
    purpose: params.purpose,
    declaredSizeBytes: params.blob.size,
    declaredMimeType: contentType,
  });
  const session = parseDirectUploadPayload(res.data);

  const formData = new FormData();
  formData.append('file', params.blob, params.filename ?? `upload-${Date.now()}.jpg`);
  const put = await fetch(session.uploadUrl, {
    method: 'POST',
    body: formData,
  });
  if (!put.ok) {
    throw new Error(`Cloudflare upload failed (${put.status})`);
  }

  return session;
}

export function formatCloudflareApiError(err: unknown): string {
  const e = err as {
    code?: string;
    response?: { data?: { code?: string; error?: string; success?: boolean } };
    message?: string;
  };
  const code = e.code ?? e.response?.data?.code;
  const msg = e.response?.data?.error;
  if (e.response?.data?.success === false) {
    return imagesDisabledMessage(code, msg);
  }
  return imagesDisabledMessage(code, msg || e.message);
}
