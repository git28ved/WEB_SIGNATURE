import { useRef, useEffect } from 'react';
import { FiTrash2, FiEdit3, FiCheckCircle } from 'react-icons/fi';

export default function SignatureField({
  field,
  canvasRef,
  onUpdate,
  onDelete,
  onOpenSignModal,
  scale,
  readOnly = false,
}) {
  const fieldRef = useRef(null);

  // Drag Handler using Mouse Events relative to the PDF Page Canvas
  const handleMouseDown = (e) => {
    if (readOnly) return;
    // Prevent dragging on button clicks
    if (e.target.closest('button')) return;
    
    e.preventDefault();
    e.stopPropagation();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const fieldRect = fieldRef.current.getBoundingClientRect();

    // Initial click offsets relative to the field itself
    const startX = e.clientX - fieldRect.left;
    const startY = e.clientY - fieldRect.top;

    const handleMouseMove = (moveEvent) => {
      // Calculate new position relative to the PDF canvas page
      let left = moveEvent.clientX - rect.left - startX;
      let top = moveEvent.clientY - rect.top - startY;

      // Restrict boundaries (keep box inside the PDF page bounds)
      const maxLeft = rect.width - fieldRect.width;
      const maxTop = rect.height - fieldRect.height;
      
      left = Math.max(0, Math.min(left, maxLeft));
      top = Math.max(0, Math.min(top, maxTop));

      // Convert to percentage values
      const xPct = (left / rect.width) * 100;
      const yPct = (top / rect.height) * 100;

      onUpdate(field._id, { x: xPct, y: yPct });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Support Touch Drag for Mobile Users
  const handleTouchStart = (e) => {
    if (readOnly) return;
    if (e.target.closest('button')) return;
    if (!e.touches || !e.touches[0]) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const fieldRect = fieldRef.current.getBoundingClientRect();

    const startX = e.touches[0].clientX - fieldRect.left;
    const startY = e.touches[0].clientY - fieldRect.top;

    const handleTouchMove = (moveEvent) => {
      if (!moveEvent.touches || !moveEvent.touches[0]) return;

      let left = moveEvent.touches[0].clientX - rect.left - startX;
      let top = moveEvent.touches[0].clientY - rect.top - startY;

      const maxLeft = rect.width - fieldRect.width;
      const maxTop = rect.height - fieldRect.height;

      left = Math.max(0, Math.min(left, maxLeft));
      top = Math.max(0, Math.min(top, maxTop));

      const xPct = (left / rect.width) * 100;
      const yPct = (top / rect.height) * 100;

      onUpdate(field._id, { x: xPct, y: yPct });
    };

    const handleTouchEnd = () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
  };

  // Determine signature rendering content
  const renderSignatureContent = () => {
    if (field.status === 'signed' && field.signatureData) {
      if (field.type === 'text') {
        const fontClass = field.meta?.font || 'font-signature-1';
        return (
          <div className="w-full h-full flex items-center justify-center p-2 text-center select-none overflow-hidden bg-white/40">
            <span className={`text-2xl text-slate-900 leading-none truncate ${fontClass}`}>
              {field.signatureData}
            </span>
          </div>
        );
      } else {
        // Image (draw tab)
        return (
          <img
            src={field.signatureData}
            alt="Signature"
            className="w-full h-full object-contain p-1 select-none pointer-events-none mix-blend-multiply"
          />
        );
      }
    }

    // Unsigned / Pending field placeholder
    return (
      <button
        onClick={() => onOpenSignModal(field._id)}
        className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 font-bold w-full h-full justify-center transition-all bg-primary-500/5 hover:bg-primary-500/10 active:scale-95"
      >
        <FiEdit3 className="h-4 w-4 animate-bounce" />
        <span>Click to Sign</span>
      </button>
    );
  };

  return (
    <div
      ref={fieldRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{
        left: `${field.x}%`,
        top: `${field.y}%`,
        width: `${field.width || 20}%`,
        height: `${field.height || 7}%`,
        position: 'absolute',
      }}
      className={`group border-2 rounded-xl flex items-center justify-center shadow-lg transition-shadow duration-200 z-20 ${
        field.status === 'signed'
          ? 'border-success bg-success/5 hover:shadow-success/10'
          : 'border-primary-500 hover:shadow-primary-500/10'
      } ${readOnly ? '' : 'cursor-move'}`}
    >
      {/* Draggable indicator tag */}
      <div className={`absolute -top-6 left-0 text-[9px] font-bold text-white px-2 py-0.5 rounded-t-lg select-none ${
        field.status === 'signed' ? 'bg-success' : 'bg-primary-600'
      }`}>
        {field.status === 'signed'
          ? '✓ SIGNED'
          : readOnly
          ? '✍ SIGN HERE'
          : '✍ SIGNATURE FIELD'}
      </div>

      {/* Action buttons (only visible if unsigned and not readOnly) */}
      {field.status !== 'signed' && !readOnly && (
        <div className="absolute -top-7 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30">
          <button
            onClick={() => onDelete(field._id)}
            className="p-1 rounded-md bg-surface-900 border border-surface-800 text-danger hover:bg-danger/10 transition-colors"
            title="Remove Signature Field"
          >
            <FiTrash2 className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="w-full h-full rounded-[10px] overflow-hidden">
        {renderSignatureContent()}
      </div>
    </div>
  );
}
