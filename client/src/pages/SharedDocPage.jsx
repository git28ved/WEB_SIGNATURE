import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiZoomIn, FiZoomOut, FiChevronLeft, FiChevronRight, FiCheckCircle, FiClock, FiAlertTriangle, FiEdit3 } from 'react-icons/fi';
import { Document, pdfjs } from 'react-pdf';
import { publicAPI } from '../services/api';
import PDFCanvas from '../components/Editor/PDFCanvas';
import PublicSignatureModal from '../components/Editor/PublicSignatureModal';

// Set up PDFjs worker if not already done
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function SharedDocPage() {
  const { token } = useParams();
  
  const [doc, setDoc] = useState(null);
  const [signatures, setSignatures] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // PDF Rendering States
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pdfLoadError, setPdfLoadError] = useState(null);

  // Signing states
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [activeSigningFieldId, setActiveSigningFieldId] = useState(null);

  const canvasRef = useRef(null);

  // Fetch document details via token
  const fetchSharedDoc = async () => {
    try {
      setLoading(true);
      const res = await publicAPI.getSharedDoc(token);
      setDoc(res.data.data.document);
      setSignatures(res.data.data.signatures);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load shared document. The link may have expired or is invalid.');
      setPdfLoadError('This document is no longer accessible.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSharedDoc();
  }, [token]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setPdfLoadError(null);
  };

  const handlePageChange = (offset) => {
    setPageNumber((prev) => Math.min(Math.max(1, prev + offset), numPages || 1));
  };

  const handleScaleChange = (amount) => {
    setScale((prev) => Math.min(Math.max(0.5, prev + amount), 2.5));
  };

  const handleOpenSignModal = (fieldId) => {
    setActiveSigningFieldId(fieldId);
    setIsSignModalOpen(true);
  };

  const handleSaveSignature = async (payload) => {
    if (!activeSigningFieldId) return;

    try {
      // API call to public signature submit route
      const res = await publicAPI.signPublic(token, activeSigningFieldId, payload);
      
      // Update signature list locally
      setSignatures((prev) =>
        prev.map((sig) => (sig._id === activeSigningFieldId ? res.data.data : sig))
      );

      // Check if all signatures are now complete
      const updatedSigs = signatures.map((sig) =>
        sig._id === activeSigningFieldId ? { ...sig, status: 'signed' } : sig
      );
      const allSigned = updatedSigs.every((s) => s.status === 'signed');

      if (allSigned) {
        setDoc((prev) => ({ ...prev, status: 'signed' }));
        toast.success('Awesome! All signature fields have been completed.');
      } else {
        toast.success('Signature applied successfully!');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to submit signature');
    } finally {
      setActiveSigningFieldId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
          <p className="text-sm text-surface-400 font-medium">Loading secure signature portal...</p>
        </div>
      </div>
    );
  }

  // Determine complete status
  const allSigned = signatures.length > 0 && signatures.every((s) => s.status === 'signed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] text-[#e2e8f0] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation / Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-800/80 pb-6">
          <div className="flex items-center gap-3">
            <div className="gradient-primary p-2.5 rounded-2xl text-white shadow-lg shadow-cyan-500/20">
              <FiEdit3 className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">
                Secure Signature Portal
              </span>
              <h1 className="text-2xl font-black text-white flex flex-wrap items-center gap-2">
                <span>{doc?.title}</span>
                {doc && (
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                    doc.status === 'signed'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {doc.status === 'signed' ? 'Signed' : 'Needs Signatures'}
                  </span>
                )}
              </h1>
            </div>
          </div>

          <div className="text-right text-xs text-surface-400">
            <p>Sent by: <span className="text-white font-semibold">{doc?.owner?.name}</span></p>
            <p>{doc?.owner?.email}</p>
          </div>
        </div>

        {/* Celebration / Finish Banner */}
        {allSigned && (
          <div className="glass border border-emerald-500/30 bg-emerald-500/5 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4 animate-scale-in">
            <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400">
              <FiCheckCircle className="h-8 w-8" />
            </div>
            <div className="text-center sm:text-left flex-1">
              <h3 className="text-lg font-bold text-white">Signing Complete</h3>
              <p className="text-sm text-surface-400 mt-0.5">
                All signature requirements have been met. The document owner has been notified.
              </p>
            </div>
          </div>
        )}

        {/* Action Controls Toolbar */}
        {numPages && !pdfLoadError && (
          <div className="glass rounded-2xl p-4 border border-surface-800 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            {/* Page Nav */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(-1)}
                disabled={pageNumber <= 1}
                className="btn btn-secondary btn-icon btn-sm disabled:opacity-30 disabled:pointer-events-none"
              >
                <FiChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold text-surface-300">
                Page {pageNumber} of {numPages}
              </span>
              <button
                onClick={() => handlePageChange(1)}
                disabled={pageNumber >= numPages}
                className="btn btn-secondary btn-icon btn-sm disabled:opacity-30 disabled:pointer-events-none"
              >
                <FiChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Hint message */}
            {!allSigned && (
              <div className="hidden md:flex items-center gap-2 text-xs text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-xl border border-cyan-500/20 font-medium">
                <FiClock className="h-3.5 w-3.5 animate-pulse" />
                <span>Locate signature fields below and click them to apply your signature.</span>
              </div>
            )}

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleScaleChange(-0.1)}
                disabled={scale <= 0.5}
                className="btn btn-secondary btn-icon btn-sm"
              >
                <FiZoomOut className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold text-surface-300">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => handleScaleChange(0.1)}
                disabled={scale >= 2.5}
                className="btn btn-secondary btn-icon btn-sm"
              >
                <FiZoomIn className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* PDF Document Canvas Viewport */}
        <div className="flex flex-col items-center overflow-auto py-4 min-h-[500px]">
          {doc && !pdfLoadError ? (
            <Document
              file={publicAPI.getSharedFileUrl(token)}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(err) => setPdfLoadError(err.message)}
              className="flex justify-center"
              loading={
                <div className="flex h-[400px] items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
                </div>
              }
            >
              <PDFCanvas
                pageNumber={pageNumber}
                scale={scale}
                signatures={signatures}
                onOpenSignModal={handleOpenSignModal}
                readOnly={true} // Guest signer: READONLY coordinates (no drag-drop)
                canvasRef={canvasRef}
              />
            </Document>
          ) : (
            <div className="glass rounded-3xl p-12 text-center border-dashed border-surface-800 flex flex-col items-center justify-center max-w-md mx-auto">
              <FiAlertTriangle className="h-12 w-12 text-rose-500 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Invalid Access Link</h3>
              <p className="text-sm text-surface-400">
                {pdfLoadError || 'The shared signature link is no longer valid, or has been revoked by the owner.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Public Guest Sign Modal */}
      <PublicSignatureModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        onSave={handleSaveSignature}
      />
    </div>
  );
}
