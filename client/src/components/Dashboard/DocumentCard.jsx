import { Link } from 'react-router-dom';
import { FiFileText, FiTrash2, FiEye, FiClock, FiCheckCircle, FiAlertOctagon } from 'react-icons/fi';
import { formatFileSize, formatRelativeTime, getStatusClass, getStatusLabel } from '../../utils/helpers';

export default function DocumentCard({ doc, onDelete }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'signed':
        return <FiCheckCircle className="h-3.5 w-3.5" />;
      case 'pending':
        return <FiClock className="h-3.5 w-3.5" />;
      case 'rejected':
        return <FiAlertOctagon className="h-3.5 w-3.5" />;
      default:
        return <FiFileText className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="glass-card flex flex-col justify-between h-[180px] p-5 shadow-lg relative group overflow-hidden">
      {/* Dynamic Status Border Line */}
      <div className={`absolute top-0 inset-x-0 h-[2px] transition-all duration-300 ${
        doc.status === 'signed' ? 'bg-success' :
        doc.status === 'pending' ? 'bg-warning' :
        doc.status === 'rejected' ? 'bg-danger' : 'bg-surface-700'
      }`}></div>

      {/* Top Section */}
      <div>
        <div className="flex justify-between items-start gap-2 mb-2">
          <h4 className="font-bold text-white text-base leading-tight truncate group-hover:text-primary-400 transition-colors duration-200" title={doc.title}>
            {doc.title}
          </h4>
          <span className={`badge ${getStatusClass(doc.status)} flex items-center gap-1 shrink-0`}>
            {getStatusIcon(doc.status)}
            <span>{getStatusLabel(doc.status)}</span>
          </span>
        </div>
        
        <p className="text-xs text-surface-400 flex items-center gap-1.5 mb-1">
          <span>PDF File</span>
          <span>•</span>
          <span>{formatFileSize(doc.fileSize)}</span>
        </p>
      </div>

      {/* Bottom Section */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-surface-900/50">
        <span className="text-[11px] text-surface-500" title={new Date(doc.createdAt).toLocaleString()}>
          Uploaded {formatRelativeTime(doc.createdAt)}
        </span>

        <div className="flex items-center gap-2">
          {/* Action buttons */}
          <Link
            to={`/document/${doc._id}`}
            className="btn btn-secondary btn-sm px-2.5 py-1.5 flex items-center gap-1 hover:text-white"
            title="Open Document"
          >
            <FiEye className="h-3.5 w-3.5" />
            <span className="text-xs">View</span>
          </Link>

          <button
            onClick={() => onDelete(doc._id)}
            className="btn btn-danger btn-sm p-1.5 hover:bg-danger/25 text-danger"
            title="Delete Document"
          >
            <FiTrash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
