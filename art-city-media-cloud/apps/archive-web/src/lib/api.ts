const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export type Role = "tenant_admin" | "archivist" | "editor" | "contributor" | "reviewer";

export type User = {
  id: string;
  email: string;
  full_name: string;
  tenant_id: string;
  tenant_slug: string;
  role: Role;
};

export type Rendition = {
  id: string;
  profile: string;
  object_key: string;
  codec: string | null;
  resolution: string | null;
  duration_seconds: number | null;
  mime_type: string;
  size_bytes: number;
  url: string | null;
};

export type Asset = {
  id: string;
  tenant_id: string;
  workspace_id: string | null;
  title: string;
  description: string;
  asset_type: string;
  status: string;
  owner_user_id: string;
  primary_language: string;
  sensitivity: string;
  technical_metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  renditions: Rendition[];
  files: Array<{
    id: string;
    filename: string;
    size_bytes: number;
    mime_type: string;
    checksum_sha256: string | null;
    upload_status: string;
    is_original: boolean;
  }>;
};

export type UploadSession = {
  id: string;
  asset_id: string;
  file_id: string;
  filename: string;
  size_bytes: number;
  part_size_bytes: number;
  part_count: number;
  status: string;
  parts: Array<{ part_number: number; url: string; expires_in: number }>;
};

export type Job = {
  id: string;
  asset_id: string;
  operation: string;
  status: string;
  progress: number;
  error_message: string | null;
  correlation_id: string | null;
  created_at: string;
  updated_at: string;
};

function authHeaders(token?: string | null): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return res.json() as Promise<T>;
}

export async function login(email: string, password: string, tenantSlug?: string) {
  return parse<{ access_token: string; refresh_token: string }>(
    await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ email, password, tenant_slug: tenantSlug || null }),
    }),
  );
}

export async function me(token: string) {
  return parse<User>(
    await fetch(`${API_BASE}/api/v1/auth/me`, {
      headers: authHeaders(token),
    }),
  );
}

export async function listAssets(token: string, q?: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  return parse<{ items: Asset[]; total: number; page: number; page_size: number }>(
    await fetch(`${API_BASE}/api/v1/search/assets?${params}`, {
      headers: authHeaders(token),
    }),
  );
}

export async function getAsset(token: string, id: string) {
  return parse<Asset>(
    await fetch(`${API_BASE}/api/v1/assets/${id}`, {
      headers: authHeaders(token),
    }),
  );
}

export async function createAsset(
  token: string,
  body: { title: string; description?: string; asset_type?: string },
) {
  return parse<Asset>(
    await fetch(`${API_BASE}/api/v1/assets`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(body),
    }),
  );
}

export async function createUpload(
  token: string,
  body: { asset_id: string; filename: string; size_bytes: number; mime_type: string },
) {
  return parse<UploadSession>(
    await fetch(`${API_BASE}/api/v1/uploads`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(body),
    }),
  );
}

export async function getUpload(token: string, uploadId: string) {
  return parse<UploadSession>(
    await fetch(`${API_BASE}/api/v1/uploads/${uploadId}`, {
      headers: authHeaders(token),
    }),
  );
}

export async function completeUpload(
  token: string,
  uploadId: string,
  body: {
    parts: Array<{ part_number: number; etag: string }>;
    checksum_sha256: string;
  },
) {
  return parse<Job>(
    await fetch(`${API_BASE}/api/v1/uploads/${uploadId}/complete`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(body),
    }),
  );
}

export async function getJob(token: string, jobId: string) {
  return parse<Job>(
    await fetch(`${API_BASE}/api/v1/jobs/${jobId}`, {
      headers: authHeaders(token),
    }),
  );
}

export async function sha256Hex(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function uploadMultipart(
  session: UploadSession,
  file: File,
  onProgress?: (ratio: number) => void,
  signal?: AbortSignal,
): Promise<Array<{ part_number: number; etag: string }>> {
  const parts: Array<{ part_number: number; etag: string }> = [];
  let uploaded = 0;
  for (const part of session.parts) {
    if (signal?.aborted) throw new DOMException("Upload aborted", "AbortError");
    const start = (part.part_number - 1) * session.part_size_bytes;
    const end = Math.min(start + session.part_size_bytes, file.size);
    const blob = file.slice(start, end);
    const res = await fetch(part.url, {
      method: "PUT",
      body: blob,
      signal,
    });
    if (!res.ok) {
      throw new Error(`Part ${part.part_number} failed: ${res.status}`);
    }
    const etag = res.headers.get("ETag") || res.headers.get("etag");
    if (!etag) throw new Error(`Missing ETag for part ${part.part_number}`);
    parts.push({ part_number: part.part_number, etag: etag.replaceAll('"', "") });
    uploaded += blob.size;
    onProgress?.(uploaded / file.size);
  }
  return parts;
}

export { API_BASE };
