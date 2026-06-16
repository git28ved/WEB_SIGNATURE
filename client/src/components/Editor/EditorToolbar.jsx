import { FiArrowLeft, FiPlus, FiSave, FiChevronLeft, FiChevronRight, FiZoomIn, FiZoomOut } from 'react-icons/fi';

export default function EditorToolbar({
  onBack,
  onAddSignatureField,
  onSave,
  saving,
  pageNumber,
  numPages,
  onPageChange,
  scale,
  onScaleChange,
  hasUnsavedChanges,
}) {
  return (
    <div className="glass rounded-2xl px-5 py-4 border border-surface-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
      {/* Left items: Back Button + Doc Title Info */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        <button
          onClick={onBack}
          className="btn btn-secondary btn-icon"
          title="Back to Document Details"
        >
          <FiArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-sm font-bold text-white leading-tight">Document Editor</h2>
          <p className="text-[10px] text-surface-400 mt-0.5">
            {hasUnsavedChanges ? (
              <span className="text-warning font-semibold">● Unsaved Changes</span>
            ) : (
              <span className="text-success font-semibold">✓ Changes Saved</span>
            )}
          </p>
        </div>
      </div>

      {/* Middle items: Pagination & Zoom */}
      {numPages && (
        <div className="flex items-center flex-wrap gap-4 justify-center">
          {/* Pagination */}
          <div className="flex items-center gap-2 bg-surface-900 border border-surface-800 rounded-xl px-2.5 py-1">
            <button
              onClick={() => onPageChange(-1)}
              disabled={pageNumber <= 1}
              className="btn btn-ghost btn-icon btn-sm py-1.5 px-1.5 text-surface-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
            >
              <FiChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-surface-300">
              Page {pageNumber} / {numPages}
            </span>
            <button
              onClick={() => onPageChange(1)}
              disabled={pageNumber >= numPages}
              className="btn btn-ghost btn-icon btn-sm py-1.5 px-1.5 text-surface-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
            >
              <FiChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-2 bg-surface-900 border border-surface-800 rounded-xl px-2.5 py-1">
            <button
              onClick={() => onScaleChange(-0.1)}
              disabled={scale <= 0.6}
              className="btn btn-ghost btn-icon btn-sm py-1.5 px-1.5 text-surface-400 hover:text-white disabled:opacity-30"
            >
              <FiZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-surface-300 min-w-[36px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => onScaleChange(0.1)}
              disabled={scale >= 2.0}
              className="btn btn-ghost btn-icon btn-sm py-1.5 px-1.5 text-surface-400 hover:text-white disabled:opacity-30"
            >
              <FiZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Right items: Add Field & Save */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
        <button
          onClick={onAddSignatureField}
          className="btn btn-secondary text-xs flex items-center gap-1.5 py-2 hover:bg-surface-800"
        >
          <FiPlus className="h-4 w-4 text-primary-400" />
          <span>Add Signature Field</span>
        </button>

        <button
          onClick={onSave}
          disabled={saving}
          className="btn btn-primary text-xs flex items-center gap-1.5 py-2 shadow-lg shadow-primary-500/20"
        >
          {saving ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          ) : (
            <FiSave className="h-4 w-4" />
          )}
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  );
}
