import type {
  AuthSession,
  BatchCreateRequest,
  CatalogOptions,
  GeneratedAsset,
  GenerationBatch,
  GenerationBatchSummary,
  GenerationJob,
  GenerationRecord,
} from './types';

const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';
const SERVER_URL_STORAGE_KEY = 'thai-id-server-url';
const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;
const LOCAL_SERVER_PATTERN = /^(localhost|\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?(?:\/.*)?$/i;

export class ApiError extends Error {
  status: number;
  path: string;
  method: string;

  constructor(status: number, message: string, path: string, method: string) {
    super(message);
    this.status = status;
    this.path = path;
    this.method = method;
  }
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function ensureProtocol(value: string) {
  if (ABSOLUTE_URL_PATTERN.test(value) || value.startsWith('/')) {
    return value;
  }
  if (LOCAL_SERVER_PATTERN.test(value)) {
    return `http://${value}`;
  }
  return `https://${value}`;
}

function withApiPath(pathname: string) {
  const cleaned = stripTrailingSlash(pathname.trim());
  if (!cleaned) {
    return '/api';
  }
  if (cleaned.endsWith('/api')) {
    return cleaned;
  }
  return `${cleaned}/api`;
}

function normalizeAbsoluteApiBase(value: string) {
  const url = new URL(ensureProtocol(value));
  url.pathname = withApiPath(url.pathname);
  url.search = '';
  url.hash = '';
  return stripTrailingSlash(url.toString());
}

function normalizeRelativeApiBase(value: string) {
  const trimmed = value.trim();
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withApiPath(withLeadingSlash);
}

function normalizeServerRoot(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  if (trimmed.startsWith('/')) {
    return stripTrailingSlash(trimmed) || '/';
  }
  const url = new URL(ensureProtocol(trimmed));
  url.pathname = stripTrailingSlash(url.pathname) || '/';
  url.search = '';
  url.hash = '';
  return stripTrailingSlash(url.toString());
}

function resolveApiBase(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '/api';
  }
  if (trimmed.startsWith('/')) {
    return normalizeRelativeApiBase(trimmed);
  }
  return normalizeAbsoluteApiBase(trimmed);
}

export function getServerUrlOverride() {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.localStorage.getItem(SERVER_URL_STORAGE_KEY) ?? '';
}

export function setServerUrlOverride(value: string) {
  if (typeof window === 'undefined') {
    return;
  }
  const trimmed = value.trim();
  if (trimmed) {
    window.localStorage.setItem(SERVER_URL_STORAGE_KEY, trimmed);
    return;
  }
  window.localStorage.removeItem(SERVER_URL_STORAGE_KEY);
}

export function getApiBaseUrl() {
  const override = getServerUrlOverride();
  return resolveApiBase(override || DEFAULT_API_BASE);
}

export function previewApiBase(serverUrl: string) {
  return resolveApiBase(serverUrl || DEFAULT_API_BASE);
}

export function previewServerRoot(serverUrl: string) {
  return normalizeServerRoot(serverUrl);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method ?? 'GET';
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const payload = await response.json();
      message = payload.detail ?? JSON.stringify(payload);
    } catch {
      message = await response.text();
    }
    throw new ApiError(response.status, message, path, method);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function login(accessCode: string) {
  return request<AuthSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ access_code: accessCode }),
  });
}

export function logout() {
  return request<AuthSession>('/auth/logout', { method: 'POST' });
}

export function fetchSession() {
  return request<AuthSession>('/auth/session');
}

export function fetchCatalogOptions() {
  return request<CatalogOptions>('/catalogs/options');
}

export async function fetchBatches() {
  const payload = await request<{ items: GenerationBatchSummary[] }>('/batches');
  return payload.items;
}

export function fetchBatch(batchId: string) {
  return request<GenerationBatch>(`/batches/${batchId}`);
}

export function createBatch(payload: BatchCreateRequest) {
  return request<GenerationBatch>('/batches', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateRecord(recordId: string, updates: Partial<GenerationRecord>) {
  return request<GenerationRecord>(`/batches/records/${recordId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export function updateBatchSelection(batchId: string, recordIds: string[]) {
  return request<GenerationBatch>(`/batches/${batchId}/selection`, {
    method: 'PUT',
    body: JSON.stringify({ record_ids: recordIds }),
  });
}

export async function fetchJobs() {
  const payload = await request<{ items: GenerationJob[] }>('/jobs');
  return payload.items;
}

export function createJob(batchId: string, recordIds: string[]) {
  return request<GenerationJob>('/jobs', {
    method: 'POST',
    body: JSON.stringify({ batch_id: batchId, record_ids: recordIds }),
  });
}

export function fetchJob(jobId: string) {
  return request<GenerationJob>(`/jobs/${jobId}`);
}

export function cancelJob(jobId: string) {
  return request<GenerationJob>(`/jobs/${jobId}/cancel`, { method: 'POST' });
}

export async function fetchJobAssets(jobId: string) {
  const payload = await request<{ items: GeneratedAsset[]; total: number }>(`/jobs/${jobId}/assets`);
  return payload.items;
}

export async function fetchAllAssets(skip = 0, limit = 50) {
  return request<{ items: GeneratedAsset[]; total: number }>(`/assets?skip=${skip}&limit=${limit}`);
}

export function buildDownloadUrl(path: string) {
  return `${getApiBaseUrl()}${path}`;
}
