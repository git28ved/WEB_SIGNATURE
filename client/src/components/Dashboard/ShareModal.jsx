import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { FiX, FiShare2, FiCopy, FiCheck, FiGlobe, FiLock } from 'react-icons/fi';
import { docAPI } from '../../services/api';

export default function ShareModal({ isOpen, onClose, document, onShareUpdated }) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !document) return null;

  const handleToggleShare = async () => {
    try {
      setLoading(true);
      const res = await docAPI.toggleShare(document._id);
      onShareUpdated(res.data.data.isPublic, res.data.data.shareToken);
      toast.success(res.data.message || 'Share status updated');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update share status');
    } finally {
      setLoading(false);
    }
  };

  const shareLink = `${window.location.origin}/shared/${document.shareToken}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="overlay" onClick={onClose} />

      {/* Modal Content */}
      <div className="modal glass border border-surface-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 border-b border-surface-800/50 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/20">
              <FiShare2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Share Document</h3>
              <p className="text-xs text-surface-400">Manage public access links</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon btn-sm text-surface-400 hover:text-white"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Info Area */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-surface-300 mb-1 truncate max-w-full">
            {document.title}
          </h4>
          <p className="text-xs text-surface-500">
            Enable public sharing to let external users sign signature fields without needing an account.
          </p>
        </div>

        {/* Toggle Panel */}
        <div className="glass-light border border-surface-800/50 rounded-2xl p-4 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              document.isPublic
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-surface-800 text-surface-400 border border-surface-700'
            }`}>
              {document.isPublic ? <FiGlobe className="h-5 w-5 animate-pulse" /> : <FiLock className="h-5 w-5" />}
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                {document.isPublic ? 'Public Link Enabled' : 'Private'}
              </div>
              <div className="text-xs text-surface-400">
                {document.isPublic ? 'Anyone with link can sign' : 'Owner-only access'}
              </div>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={handleToggleShare}
            disabled={loading}
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
              document.isPublic ? 'bg-primary-500' : 'bg-surface-800 border border-surface-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${
                document.isPublic ? 'transform translate-x-6' : ''
              }`}
            />
          </button>
        </div>

        {/* Copy Link Area (if active) */}
        {document.isPublic && (
          <div className="space-y-2 animate-slide-up">
            <label className="label">Public Signing Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareLink}
                className="input text-xs font-mono text-surface-300 select-all"
              />
              <button
                onClick={handleCopyLink}
                className="btn btn-primary btn-icon shrink-0"
                title="Copy Link"
              >
                {copied ? <FiCheck className="h-4 w-4" /> : <FiCopy className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[10px] text-surface-500 italic mt-1">
              Tip: You can email this link to any signer. They will be prompted to enter their name & email when signing.
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 mt-6 border-t border-surface-800/50 pt-4">
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
