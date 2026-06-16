import {
  FiPlus,
  FiTrash,
  FiDownload,
  FiShare2,
  FiEdit3,
  FiCheckCircle,
  FiXCircle,
  FiMail,
  FiHelpCircle
} from 'react-icons/fi';
import { formatDateTime } from '../../utils/helpers';

const getEventConfig = (action) => {
  switch (action) {
    case 'document_created':
      return { icon: FiPlus, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', label: 'Document Uploaded' };
    case 'document_deleted':
      return { icon: FiTrash, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', label: 'Document Deleted' };
    case 'document_downloaded':
      return { icon: FiDownload, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', label: 'PDF Downloaded' };
    case 'document_shared':
      return { icon: FiShare2, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', label: 'Sharing Toggled' };
    case 'signature_added':
      return { icon: FiEdit3, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', label: 'Signature Field Added' };
    case 'signature_signed':
      return { icon: FiCheckCircle, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'Signed' };
    case 'signature_rejected':
      return { icon: FiXCircle, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', label: 'Signature Rejected' };
    case 'signature_deleted':
      return { icon: FiTrash, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'Signature Field Removed' };
    case 'invite_sent':
      return { icon: FiMail, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20', label: 'Invitation Sent' };
    default:
      return { icon: FiHelpCircle, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', label: 'Activity' };
  }
};

export default function AuditTimeline({ logs, loading }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4 items-start animate-pulse">
            <div className="h-8 w-8 rounded-full bg-surface-800 shrink-0"></div>
            <div className="space-y-2 flex-1 pt-1">
              <div className="h-4 w-1/3 bg-surface-800 rounded"></div>
              <div className="h-3 w-2/3 bg-surface-800 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-surface-500 border border-dashed border-surface-800 rounded-xl">
        No activity logged yet.
      </div>
    );
  }

  return (
    <div className="relative border-l border-surface-800 pl-4 ml-3 space-y-6 max-h-[350px] overflow-y-auto pr-2">
      {logs.map((log) => {
        const config = getEventConfig(log.action);
        const Icon = config.icon;
        const actorName = log.user?.name || log.actorName || 'System/Guest';
        const actorEmail = log.user?.email || log.actorEmail;

        return (
          <div key={log._id} className="relative group animate-fade-in">
            {/* Timeline node */}
            <span className="absolute -left-[29px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-surface-950 border border-surface-800 z-10 transition-transform duration-300 group-hover:scale-110">
              <span className={`p-1 rounded-full border ${config.color} flex items-center justify-center`}>
                <Icon className="h-3 w-3" />
              </span>
            </span>

            <div className="space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h4 className="text-sm font-semibold text-white group-hover:text-primary-400 transition-colors duration-300">
                  {config.label}
                </h4>
                <span className="text-[10px] text-surface-500 font-medium whitespace-nowrap">
                  {formatDateTime(log.createdAt)}
                </span>
              </div>
              <p className="text-xs text-surface-400 font-medium">
                Performed by:{' '}
                <span className="text-surface-300 font-semibold">{actorName}</span>
                {actorEmail && <span className="text-surface-500 font-normal"> ({actorEmail})</span>}
              </p>
              {log.details && (
                <p className="text-xs text-surface-500 bg-surface-900/40 p-2 rounded-lg border border-surface-800/50 mt-1 max-w-full break-words">
                  {log.details}
                </p>
              )}
              {log.ipAddress && (
                <p className="text-[10px] text-surface-600 font-mono">
                  IP: {log.ipAddress}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
