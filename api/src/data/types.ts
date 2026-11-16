export type Role = 'employee' | 'manager' | 'admin';
export type Status = 'pending' | 'approved' | 'rejected';
export const STATUSES: Status[] = ['pending', 'approved', 'rejected'];

export interface User { id: string; name: string; role: Role; managerId: string | null }
export interface LeaveRequest { id: number; userId: string; start: string; end: string; reason: string; status: Status }
export interface AuditEvent { at: string; actor: string; action: string; requestId: number; from: Status | null; to: Status }

/**
 * Every read and write goes through this interface. That is what makes the
 * local -> Azure move a single swap: today MemoryRepo, later an Azure SQL repo
 * using managed identity (no passwords). Routes never know which one they talk to.
 */
export interface Repo {
  users(): Promise<User[]>;
  requests(): Promise<LeaveRequest[]>;
  getRequest(id: number): Promise<LeaveRequest | undefined>;
  createRequest(input: Omit<LeaveRequest, 'id'>, actor: string): Promise<LeaveRequest>;
  setStatus(id: number, to: Status, actor: string): Promise<LeaveRequest>;
  audit(): Promise<AuditEvent[]>;
}
