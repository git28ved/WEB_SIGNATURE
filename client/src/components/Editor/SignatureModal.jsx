import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiX, FiCheck, FiRefreshCw, FiEdit3, FiType } from 'react-icons/fi';

export default function SignatureModal({ isOpen, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState('type');
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState('font-signature-1');
  const [isDrawing, setIsDrawing] = useState(false);
  
  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  // Initialize Canvas
  useEffect(() => {
    if (activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.offsetWidth * 2; // Double resolution for HD
      canvas.height = canvas.offsetHeight * 2;
      canvas.style.width = `${canvas.offsetWidth}px`;
      canvas.style.height = `${canvas.offsetHeight}px`;

      const context = canvas.getContext('2d');
      context.scale(2, 2);
      context.lineCap = 'round';
      context.strokeStyle = '#6366f1'; // primary indigo color
      context.lineWidth = 3;
      contextRef.current = context;
      
      // Clear canvas with white background (necessary for PDF rendering later)
      clearCanvas();
    }
  }, [activeTab, isOpen]);

  const startDrawing = ({ nativeEvent }) => {
    if (!contextRef.current) return;
    const { offsetX, offsetY } = getCoordinates(nativeEvent);
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing || !contextRef.current) return;
    const { offsetX, offsetY } = getCoordinates(nativeEvent);
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    if (!contextRef.current) return;
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const getCoordinates = (event) => {
    // Handle touch vs mouse event coordinates
    if (event.touches && event.touches[0]) {
      const rect = canvasRef.current.getBoundingClientRect();
      return {
        offsetX: event.touches[0].clientX - rect.left,
        offsetY: event.touches[0].clientY - rect.top,
      };
    }
    return {
      offsetX: event.offsetX,
      offsetY: event.offsetY,
    };
  };

  const clearCanvas = () => {
    if (!canvasRef.current || !contextRef.current) return;
    const canvas = canvasRef.current;
    const context = contextRef.current;
    
    // Fill background with white (prevents transparent background issue in pdf-lib)
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleConfirm = () => {
    if (activeTab === 'type') {
      if (!typedName.trim()) {
        return toast.error('Please enter your name to sign');
      }
      onSave({
        type: 'text',
        data: typedName,
        meta: { font: selectedFont }
      });
    } else if (activeTab === 'draw') {
      if (!canvasRef.current) return;
      
      // Extract base64 image data
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSave({
        type: 'draw',
        data: dataUrl
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="overlay" onClick={onClose}></div>

      {/* Modal Card */}
      <div className="modal glass border border-surface-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-surface-800">
          <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
            <FiEdit3 className="text-primary-400 h-5 w-5" />
            <span>Create Your Signature</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-surface-400 hover:text-white rounded-lg hover:bg-surface-800/50 transition-colors"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Custom font faces for typed signatures */}
        <style dangerouslySetInnerHTML={{__html: `
          @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Great+Vibes&family=Playball&family=Sacramento&display=swap');
          .font-signature-1 { font-family: 'Caveat', cursive; }
          .font-signature-2 { font-family: 'Great Vibes', cursive; }
          .font-signature-3 { font-family: 'Playball', cursive; }
          .font-signature-4 { font-family: 'Sacramento', cursive; }
        `}} />

        {/* Tabs */}
        <div className="flex border-b border-surface-800/80 my-4">
          <button
            onClick={() => setActiveTab('type')}
            className={`flex-1 pb-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'type'
                ? 'border-primary-500 text-white'
                : 'border-transparent text-surface-400 hover:text-surface-200'
            }`}
          >
            <FiType className="h-4 w-4" />
            <span>Type Signature</span>
          </button>
          <button
            onClick={() => setActiveTab('draw')}
            className={`flex-1 pb-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'draw'
                ? 'border-primary-500 text-white'
                : 'border-transparent text-surface-400 hover:text-surface-200'
            }`}
          >
            <FiEdit3 className="h-4 w-4" />
            <span>Draw Signature</span>
          </button>
        </div>

        {/* Tab content */}
        <div className="min-h-[160px] flex flex-col justify-center mb-6">
          {activeTab === 'type' ? (
            <div className="space-y-4">
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                className="input text-lg tracking-wide"
                placeholder="Type your name..."
                maxLength={40}
              />
              
              {/* Fonts options */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'font-signature-1', label: 'Cursive Elegant (Caveat)' },
                  { id: 'font-signature-2', label: 'Classic Script (Great Vibes)' },
                  { id: 'font-signature-3', label: 'Bold Brush (Playball)' },
                  { id: 'font-signature-4', label: 'Flowing Feather (Sacramento)' },
                ].map((font) => (
                  <button
                    key={font.id}
                    onClick={() => setSelectedFont(font.id)}
                    className={`p-3 rounded-xl border text-left bg-surface-900 transition-all ${
                      selectedFont === font.id
                        ? 'border-primary-500 text-primary-400 ring-2 ring-primary-500/10'
                        : 'border-surface-800 text-surface-400 hover:border-surface-700'
                    }`}
                  >
                    <span className="text-xs block text-surface-500 mb-1">{font.label}</span>
                    <span className={`text-xl font-medium block truncate ${font.id}`}>
                      {typedName || 'Signature'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="relative w-full h-[180px] bg-white rounded-xl overflow-hidden border border-surface-800 shadow-inner group">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-full cursor-crosshair bg-white"
              />
              
              {/* Canvas controls overlay */}
              <button
                onClick={clearCanvas}
                className="absolute bottom-3 right-3 btn btn-secondary btn-sm flex items-center gap-1.5 shadow-md border border-surface-200 hover:bg-surface-100 text-surface-700 bg-white"
                title="Clear Signature Canvas"
              >
                <FiRefreshCw className="h-3.5 w-3.5" />
                <span>Clear</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-800">
          <button onClick={onClose} className="btn btn-secondary text-sm">
            Cancel
          </button>
          <button onClick={handleConfirm} className="btn btn-primary text-sm flex items-center gap-1">
            <FiCheck className="h-4 w-4" />
            <span>Confirm & Sign</span>
          </button>
        </div>
      </div>
    </div>
  );
}
