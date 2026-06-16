import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  FiArrowLeft,
  FiEdit,
  FiZoomIn,
  FiZoomOut,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiDownload,
  FiShare2,
  FiActivity
} from 'react-icons/fi';
import { Document, Page, pdfjs } from 'react-pdf';
import { docAPI, auditAPI } from '../services/api';
import { formatFileSize, formatDateTime, getStatusClass, getStatusLabel } from '../utils/helpers';
import AuditTimeline from '../components/Dashboard/AuditTimeline';
import ShareModal from '../components/Dashboard/ShareModal';

// Configure PDFjs worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function DocumentViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  
  // PDF Rendering States
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pdfLoadError, setPdfLoadError] = useState(null);

  const fetchDocAndLogs = async () => {
    try {
      setLoading(true);
      const res = await docAPI.getById(id);
      setDoc(res.data.data);
      
      setLogsLoading(true);
      const logsRes = await auditAPI.getByDoc(id);
      setAuditLogs(logsRes.data.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load document details');
      navigate('/');
    } finally {
      setLoading(false);
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocAndLogs();
  }, [id]);

  const handleDownload = () => {
    try {
      const url = docAPI.getDownloadUrl(doc._id);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${doc.title}_signed.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Generating signed PDF...');

      // Refetch audit log shortly after to show download entry
      setTimeout(async () => {
        try {
          const logsRes = await auditAPI.getByDoc(id);
          setAuditLogs(logsRes.data.data);
        } catch (err) {
          console.error(err);
        }
      }, 1500);
    } catch (error) {
      console.error(error);
      toast.error('Failed to download document');
    }
  };

  const handleShareUpdated = (isPublic, shareToken) => {
    setDoc((prev) => ({ ...prev, isPublic, shareToken }));
    // Refresh audit logs to show share event
    setTimeout(async () => {
      try {
        const logsRes = await auditAPI.getByDoc(id);
        setAuditLogs(logsRes.data.data);
      } catch (err) {
        console.error(err);
      }
    }, 1000);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setPdfLoadError(null);
  };

  const onDocumentLoadError = (err) => {
    console.error('PDF Load Error:', err);
    setPdfLoadError(err.message || 'Could not render PDF document.');
  };

  const changePage = (offset) => {
    setPageNumber((prevPageNumber) => {
      const newPage = prevPageNumber + offset;
      return Math.min(Math.max(1, newPage), numPages || 1);
    });
  };

  const adjustZoom = (amount) => {
    setScale((prevScale) => Math.min(Math.max(0.5, prevScale + amount), 2.5));
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          <p className="text-sm text-surface-400">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!doc) return null;

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="btn btn-secondary btn-icon"
            title="Back to Dashboard"
          >
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-3">
              <span className="truncate max-w-[300px] sm:max-w-md" title={doc.title}>
                {doc.title}
              </span>
              <span className={`badge ${getStatusClass(doc.status)} shrink-0`}>
                {getStatusLabel(doc.status)}
              </span>
            </h1>
            <p className="text-xs text-surface-400 mt-0.5">
              Uploaded {formatDateTime(doc.createdAt)} • {formatFileSize(doc.fileSize)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/document/${doc._id}/edit`}
            className="btn btn-primary shadow-lg shadow-primary-500/20"
          >
            <FiEdit className="h-4 w-4" />
            <span>Place Signature</span>
          </Link>
        </div>
      </div>

      {/* PDF View Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Sidebar Column Group */}
        <div className="lg:col-span-1 space-y-6">
          {/* Status Card */}
          <div className="glass rounded-2xl p-6 border border-surface-800 space-y-6 shadow-xl">
            <h3 className="font-bold text-white text-lg">Document Status</h3>

            <div className="space-y-4">
              <div className="flex gap-3 items-start">
                <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                  doc.status === 'signed' ? 'bg-success/10 text-success border border-success/20' :
                  doc.status === 'pending' ? 'bg-warning/10 text-warning border border-warning/20' :
                  'bg-surface-800 text-surface-400 border border-surface-700'
                }`}>
                  {doc.status === 'signed' ? <FiCheckCircle className="h-4 w-4" /> : <FiClock className="h-4 w-4" />}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {doc.status === 'signed' ? 'Document Signed' : 'Signing In Progress'}
                  </h4>
                  <p className="text-xs text-surface-400 mt-1">
                    {doc.status === 'signed'
                      ? 'All signature fields have been successfully finalized.'
                      : 'Place signature fields and direct them to users to sign.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-surface-800 space-y-3">
              <button
                onClick={handleDownload}
                className="btn btn-secondary w-full justify-start text-xs font-semibold py-2.5"
              >
                <FiDownload className="h-4 w-4 text-primary-400" />
                <span>Download Signed PDF</span>
              </button>
              <button
                onClick={() => setShareOpen(true)}
                className="btn btn-secondary w-full justify-start text-xs font-semibold py-2.5"
              >
                <FiShare2 className="h-4 w-4 text-cyan-400" />
                <span>Share Public Link</span>
              </button>
            </div>

            <div className="pt-4 border-t border-surface-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-surface-400">File Name:</span>
                <span className="text-white truncate max-w-[120px]" title={doc.fileName}>{doc.fileName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-400">Total Pages:</span>
                <span className="text-white">{numPages || 'Loading...'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-400">File Size:</span>
                <span className="text-white">{formatFileSize(doc.fileSize)}</span>
              </div>
            </div>
          </div>

          {/* Audit History Card */}
          <div className="glass rounded-2xl p-6 border border-surface-800 space-y-4 shadow-xl">
            <h3 className="font-bold text-white text-md flex items-center gap-2 border-b border-surface-800/50 pb-3">
              <FiActivity className="h-4 w-4 text-primary-400" />
              <span>Activity History</span>
            </h3>
            <AuditTimeline logs={auditLogs} loading={logsLoading} />
          </div>
        </div>

        {/* Center PDF Canvas Panel */}
        <div className="lg:col-span-3 space-y-4 flex flex-col items-center">
          {/* Controls toolbar */}
          {numPages && !pdfLoadError && (
            <div className="glass rounded-xl px-4 py-2.5 border border-surface-800 flex items-center justify-between gap-4 w-full shadow-md">
              {/* Pagination controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changePage(-1)}
                  disabled={pageNumber <= 1}
                  className="btn btn-secondary btn-icon btn-sm disabled:opacity-30 disabled:pointer-events-none"
                >
                  <FiChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-semibold text-surface-300">
                  Page {pageNumber} of {numPages}
                </span>
                <button
                  onClick={() => changePage(1)}
                  disabled={pageNumber >= numPages}
                  className="btn btn-secondary btn-icon btn-sm disabled:opacity-30 disabled:pointer-events-none"
                >
                  <FiChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Zoom controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => adjustZoom(-0.1)}
                  disabled={scale <= 0.5}
                  className="btn btn-secondary btn-icon btn-sm"
                  title="Zoom Out"
                >
                  <FiZoomOut className="h-4 w-4" />
                </button>
                <span className="text-xs font-semibold text-surface-300">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={() => adjustZoom(0.1)}
                  disabled={scale >= 2.5}
                  className="btn btn-secondary btn-icon btn-sm"
                  title="Zoom In"
                >
                  <FiZoomIn className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* PDF Viewer container */}
          <div className="glass rounded-2xl border border-surface-800 p-6 w-full flex justify-center overflow-auto shadow-2xl relative min-h-[400px]">
            {pdfLoadError ? (
              <div className="flex flex-col items-center justify-center text-center p-8 max-w-sm">
                <FiAlertTriangle className="h-12 w-12 text-danger mb-4" />
                <h4 className="text-white font-bold mb-2">Failed to render PDF</h4>
                <p className="text-xs text-surface-400">{pdfLoadError}</p>
              </div>
            ) : (
              <Document
                file={docAPI.getFileUrl(doc._id)}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex h-[300px] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  loading={
                    <div className="h-[300px] flex items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary-500 border-t-transparent"></div>
                    </div>
                  }
                />
              </Document>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        document={doc}
        onShareUpdated={handleShareUpdated}
      />
    </div>
  );
}
