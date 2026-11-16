import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, DEMO_USERS, type LeaveRequest } from './api';
import { StatusPill } from './components/StatusPill';
import { NewRequestForm } from './components/NewRequestForm';

function loadUser() {
  try { return localStorage.getItem('demo-user') ?? 'ben'; } catch { return 'ben'; }
}

export default function App() {
  const qc = useQueryClient();
  const [user, setUser] = useState(loadUser);
  // Trainer mode shows every button to every user. The API still refuses what the
  // user is not allowed to do: hiding a button is ergonomics, not security.
  const [trainerMode, setTrainerMode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try { localStorage.setItem('demo-user', user); } catch { /* storage unavailable */ }
    setToast(null);
  }, [user]);

  const me = useQuery({ queryKey: ['me', user], queryFn: () => api.me(user) });
  const version = useQuery({ queryKey: ['version'], queryFn: api.version });
  const leave = useQuery({ queryKey: ['leave', user], queryFn: () => api.list(user) });
  const audit = useQuery({ queryKey: ['audit', user], queryFn: () => api.audit(user), enabled: !!me.data?.can.viewAudit });

  const approve = useMutation({
    mutationFn: (id: number) => api.approve(user, id),
    onSuccess: (r) => { setToast(`Approved request #${r.id}`); qc.invalidateQueries({ queryKey: ['leave'] }); qc.invalidateQueries({ queryKey: ['audit'] }); },
    onError: (e: Error & { status?: number }) => setToast(`Refused by the API (${e.status ?? 'error'}): ${e.message}`)
  });

  const items = leave.data ?? [];
  const counts = { pending: items.filter((i) => i.status === 'pending').length, approved: items.filter((i) => i.status === 'approved').length };
  const canSeeApprove = (r: LeaveRequest) => trainerMode || (me.data?.can.approve && r.status === 'pending' && r.userId !== user);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Leave Tracker</h1>
          <p className="text-xs text-neutral-500">build {version.data?.build ?? '...'}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-neutral-600">
            <input type="checkbox" checked={trainerMode} onChange={(e) => setTrainerMode(e.target.checked)} />
            Trainer mode: show all buttons
          </label>
          <select value={user} onChange={(e) => setUser(e.target.value)} className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm">
            {DEMO_USERS.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
          </select>
        </div>
      </header>

      {toast && (
        <div role="status" className="mb-4 flex items-center justify-between rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm shadow-sm">
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="text-neutral-400 hover:text-neutral-700">Dismiss</button>
        </div>
      )}

      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Visible to you" value={items.length} />
        <Stat label="Pending" value={counts.pending} tone="warn" />
        <Stat label="Approved" value={counts.approved} tone="ok" />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs text-neutral-500">
              <tr><th className="px-4 py-2">#</th><th className="px-4 py-2">Who</th><th className="px-4 py-2">Dates</th><th className="px-4 py-2">Reason</th><th className="px-4 py-2">Status</th><th className="px-4 py-2" /></tr>
            </thead>
            <tbody>
              {leave.isLoading && <tr><td colSpan={6} className="px-4 py-6 text-center text-neutral-400">Loading...</td></tr>}
              {leave.error && <tr><td colSpan={6} className="px-4 py-6 text-center text-critical">{leave.error.message}</td></tr>}
              {items.map((r) => (
                <tr key={r.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2 text-neutral-400">{r.id}</td>
                  <td className="px-4 py-2">{r.userId}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{r.start} to {r.end}</td>
                  <td className="px-4 py-2">{r.reason}</td>
                  <td className="px-4 py-2"><StatusPill status={r.status} /></td>
                  <td className="px-4 py-2 text-right">
                    {canSeeApprove(r) && (
                      <button onClick={() => approve.mutate(r.id)} className="rounded-md border border-primary px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary hover:text-primary-foreground">
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <aside className="space-y-6">
          <NewRequestForm user={user} />
          {me.data?.can.viewAudit && (
            <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold">Audit log</h2>
              {(audit.data ?? []).length === 0 && <p className="text-xs text-neutral-400">No changes yet.</p>}
              <ul className="space-y-1 text-xs">
                {(audit.data ?? []).slice().reverse().map((e, i) => (
                  <li key={i} className="text-neutral-600">
                    <span className="font-medium text-neutral-900">{e.actor}</span> {e.action} #{e.requestId}: {e.from ?? 'new'} to {e.to}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'ok' | 'warn' }) {
  const bar = tone === 'ok' ? 'bg-ok' : tone === 'warn' ? 'bg-warn' : 'bg-primary';
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className={`mb-2 h-1 w-8 rounded-full ${bar}`} />
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-neutral-500">{label}</div>
    </div>
  );
}
