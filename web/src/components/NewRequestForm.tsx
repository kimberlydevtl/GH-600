import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export function NewRequestForm({ user }: { user: string }) {
  const qc = useQueryClient();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState('');
  const create = useMutation({
    mutationFn: () => api.create(user, { start, end, reason }),
    onSuccess: () => {
      setStart(''); setEnd(''); setReason('');
      qc.invalidateQueries({ queryKey: ['leave'] });
      qc.invalidateQueries({ queryKey: ['audit'] });
    }
  });

  function submit(e: FormEvent) { e.preventDefault(); create.mutate(); }

  const input = 'w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none';
  return (
    <form onSubmit={submit} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold">New leave request</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-neutral-600">Start<input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={input} /></label>
        <label className="text-xs text-neutral-600">End<input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={input} /></label>
      </div>
      <label className="mt-3 block text-xs text-neutral-600">Reason
        <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} className={input} placeholder="e.g. Family trip" />
      </label>
      {create.error && <p className="mt-2 text-sm text-critical">{create.error.message}</p>}
      <button disabled={create.isPending} className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
        {create.isPending ? 'Submitting...' : 'Submit request'}
      </button>
    </form>
  );
}
