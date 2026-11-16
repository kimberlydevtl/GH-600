import type { Status } from '../api';

const styles: Record<Status, string> = {
  pending: 'bg-warn/15 text-amber-800 ring-warn/40',
  approved: 'bg-ok/15 text-emerald-800 ring-ok/40',
  rejected: 'bg-critical/15 text-red-800 ring-critical/40'
};

export function StatusPill({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[status]}`}>
      {status}
    </span>
  );
}
