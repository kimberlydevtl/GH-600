import type { Repo, User, LeaveRequest, AuditEvent, Status } from './types.js';

// Local, in-memory data. Resets on restart. Good for demos and tests.
// The state change and its audit entry happen together, so they cannot drift apart.
export class MemoryRepo implements Repo {
  private _users: User[] = [
    { id: 'ana', name: 'Ana Lim', role: 'employee', managerId: 'ben' },
    { id: 'raj', name: 'Raj Kumar', role: 'employee', managerId: 'ben' },
    { id: 'ben', name: 'Ben Tan', role: 'manager', managerId: 'cara' },
    { id: 'cara', name: 'Cara Wong', role: 'admin', managerId: null }
  ];
  private _requests: LeaveRequest[] = [];
  private _audit: AuditEvent[] = [];
  private nextId = 1;

  constructor() { this.reset(); }

  reset() {
    this._requests = [
      { id: 1, userId: 'ana', start: '2026-12-01', end: '2026-12-03', reason: 'Family trip', status: 'pending' },
      { id: 2, userId: 'raj', start: '2026-12-10', end: '2026-12-10', reason: 'Medical appointment', status: 'approved' },
      { id: 3, userId: 'ben', start: '2026-12-20', end: '2026-12-24', reason: 'Year-end break', status: 'pending' }
    ];
    this._audit = [];
    this.nextId = 4;
  }

  async users() { return this._users; }
  async requests() { return this._requests; }
  async getRequest(id: number) { return this._requests.find((r) => r.id === id); }
  async audit() { return this._audit; }

  async createRequest(input: Omit<LeaveRequest, 'id'>, actor: string) {
    const item = { id: this.nextId++, ...input };
    this._requests.push(item);
    this.record({ actor, action: 'create', requestId: item.id, from: null, to: item.status });
    return item;
  }

  async setStatus(id: number, to: Status, actor: string) {
    const item = this._requests.find((r) => r.id === id);
    if (!item) throw new Error(`Request ${id} not found`);
    const from = item.status;
    item.status = to;
    this.record({ actor, action: to === 'approved' ? 'approve' : 'reject', requestId: id, from, to });
    return item;
  }

  private record(e: Omit<AuditEvent, 'at'>) {
    this._audit.push({ at: new Date().toISOString(), ...e });
  }
}
