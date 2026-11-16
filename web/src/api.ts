export type Status = 'pending' | 'approved' | 'rejected';
export interface Me { id: string; name: string; role: 'employee' | 'manager' | 'admin'; can: { approve: boolean; viewAudit: boolean } }
export interface LeaveRequest { id: number; userId: string; start: string; end: string; reason: string; status: Status }
export interface AuditEvent { at: string; actor: string; action: string; requestId: number; from: Status | null; to: Status }

export const DEMO_USERS = [
  { id: 'ana', label: 'Ana Lim (employee)' },
  { id: 'raj', label: 'Raj Kumar (employee)' },
  { id: 'ben', label: 'Ben Tan (manager)' },
  { id: 'cara', label: 'Cara Wong (admin)' }
];

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// DEMO IDENTITY: the x-user header stands in for a real sign-in token.
async function call<T>(user: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'content-type': 'application/json', 'x-user': user, ...(init.headers ?? {}) }
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.error ?? res.statusText);
  return body as T;
}

export const api = {
  me: (u: string) => call<Me>(u, '/api/me'),
  version: () => fetch('/api/version').then((r) => r.json() as Promise<{ build: string }>),
  list: (u: string) => call<{ items: LeaveRequest[] }>(u, '/api/leave').then((r) => r.items),
  create: (u: string, input: { start: string; end: string; reason: string }) =>
    call<LeaveRequest>(u, '/api/leave', { method: 'POST', body: JSON.stringify(input) }),
  approve: (u: string, id: number) => call<LeaveRequest>(u, `/api/leave/${id}/approve`, { method: 'POST' }),
  audit: (u: string) => call<{ items: AuditEvent[] }>(u, '/api/audit').then((r) => r.items)
};
