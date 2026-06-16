import { useRef } from 'react';
import { Page } from 'react-pdf';
import SignatureField from './SignatureField';

export default function PDFCanvas({
  pageNumber,
  scale,
  signatures,
  onUpdateSignature,
  onDeleteSignature,
  onOpenSignModal,
  canvasRef,
  readOnly = false,
}) {
  const overlayRef = useRef(null);

  // Filter signatures that belong to the current page
  const pageSignatures = signatures.filter((sig) => sig.page === pageNumber);

  return (
    <div className="relative border border-surface-800 rounded-2xl overflow-hidden bg-slate-900 shadow-2xl flex justify-center items-center">
      {/* react-pdf page rendering */}
      <Page
        pageNumber={pageNumber}
        scale={scale}
        canvasRef={canvasRef}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        loading={
          <div className="h-[500px] w-[350px] flex items-center justify-center bg-slate-950">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></div>
          </div>
        }
      />

      {/* Relative Coordinate Absolute Overlay Container */}
      <div
        ref={overlayRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'auto',
        }}
        className="z-10"
      >
        {/* Render signature fields placed on this page */}
        {pageSignatures.map((sig) => (
          <SignatureField
            key={sig._id}
            field={sig}
            canvasRef={canvasRef}
            onUpdate={onUpdateSignature}
            onDelete={onDeleteSignature}
            onOpenSignModal={onOpenSignModal}
            scale={scale}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
}
