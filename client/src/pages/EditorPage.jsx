import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Document, pdfjs } from 'react-pdf';
import { docAPI, signatureAPI } from '../services/api';
import EditorToolbar from '../components/Editor/EditorToolbar';
import PDFCanvas from '../components/Editor/PDFCanvas';
import SignatureModal from '../components/Editor/SignatureModal';

// Set up PDFjs worker if not already done
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // PDF Page stats
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  // Signatures coordinates list
  const [signatures, setSignatures] = useState([]);
  
  // Modal controllers
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [activeSigningFieldId, setActiveSigningFieldId] = useState(null);

  const canvasRef = useRef(null);

  // Load document details and existing signature fields
  useEffect(() => {
    const initPage = async () => {
      try {
        setLoading(true);
        const [docRes, sigRes] = await Promise.all([
          docAPI.getById(id),
          signatureAPI.getByDoc(id)
        ]);
        
        setDoc(docRes.data.data);
        setSignatures(sigRes.data.data);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load editor assets');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    initPage();
  }, [id]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const handlePageChange = (offset) => {
    setPageNumber((prev) => Math.min(Math.max(1, prev + offset), numPages || 1));
  };

  const handleScaleChange = (amount) => {
    setScale((prev) => Math.min(Math.max(0.5, prev + amount), 2.5));
  };

  // Add a new local signature box placeholder
  const handleAddSignatureField = () => {
    // Generate a temporary negative ID for tracking locally before DB save
    const tempId = `temp-${Date.now()}`;
    const newField = {
      _id: tempId,
      document: id,
      x: 40, // Centered default
      y: 40,
      width: 20, // default size %
      height: 7,
      page: pageNumber,
      status: 'pending',
      type: 'text',
      signatureData: '',
      isNew: true, // Marker to indicate it needs to be saved to DB
    };

    setSignatures((prev) => [...prev, newField]);
    setHasUnsavedChanges(true);
    toast.success('Added signature field. Drag it into position.');
  };

  // Update field coordinates during drag cycles
  const handleUpdateSignature = (fieldId, updates) => {
    setSignatures((prev) =>
      prev.map((sig) => (sig._id === fieldId ? { ...sig, ...updates } : sig))
    );
    setHasUnsavedChanges(true);
  };

  // Delete a signature field placeholder
  const handleDeleteSignature = async (fieldId) => {
    // If it's a new field not saved in DB, remove it locally
    if (fieldId.toString().startsWith('temp-')) {
      setSignatures((prev) => prev.filter((sig) => sig._id !== fieldId));
      setHasUnsavedChanges(true);
      return;
    }

    try {
      if (!window.confirm('Delete this signature field?')) return;
      await signatureAPI.delete(fieldId);
      setSignatures((prev) => prev.filter((sig) => sig._id !== fieldId));
      toast.success('Signature field deleted');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete signature field');
    }
  };

  // Save changes to backend
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Separate new vs updated signatures
      const newSigs = signatures.filter((sig) => sig.isNew);
      const existingSigs = signatures.filter((sig) => !sig.isNew && !sig._id.toString().startsWith('temp-'));

      // 1. Create new fields in backend
      const createPromises = newSigs.map((sig) =>
        signatureAPI.create({
          documentId: id,
          x: sig.x,
          y: sig.y,
          width: sig.width,
          height: sig.height,
          page: sig.page,
          type: sig.type,
        })
      );

      // 2. Update existing fields' positions
      const updatePromises = existingSigs.map((sig) =>
        signatureAPI.update(sig._id, {
          x: sig.x,
          y: sig.y,
          width: sig.width,
          height: sig.height,
        })
      );

      await Promise.all([...createPromises, ...updatePromises]);

      // Refetch all signatures from backend to get fresh database IDs
      const freshSigsRes = await signatureAPI.getByDoc(id);
      setSignatures(freshSigsRes.data.data);
      
      setHasUnsavedChanges(false);
      toast.success('All positions and fields saved successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save layout changes');
    } finally {
      setSaving(false);
    }
  };

  // Open Sign Modal
  const handleOpenSignModal = (fieldId) => {
    // If field is newly created, require saving layout coordinates first
    const field = signatures.find((s) => s._id === fieldId);
    if (field?.isNew) {
      toast.error('Please save your signature fields to the server before signing.');
      return;
    }
    setActiveSigningFieldId(fieldId);
    setIsSignModalOpen(true);
  };

  // Callback when signature modal provides data (sign process completion)
  const handleSaveSignatureData = async (signaturePayload) => {
    if (!activeSigningFieldId) return;

    try {
      // Send sign updates to backend directly
      const res = await signatureAPI.update(activeSigningFieldId, {
        status: 'signed',
        type: signaturePayload.type,
        signatureData: signaturePayload.data,
        meta: signaturePayload.meta
      });

      // Update state locally
      setSignatures((prev) =>
        prev.map((sig) => (sig._id === activeSigningFieldId ? res.data.data : sig))
      );
      
      toast.success('Document signed successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to apply signature');
    } finally {
      setActiveSigningFieldId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          <p className="text-sm text-surface-400">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Editor top navigation and controls */}
      <EditorToolbar
        onBack={() => navigate(`/document/${id}`)}
        onAddSignatureField={handleAddSignatureField}
        onSave={handleSave}
        saving={saving}
        pageNumber={pageNumber}
        numPages={numPages}
        onPageChange={handlePageChange}
        scale={scale}
        onScaleChange={handleScaleChange}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      {/* Main Canvas view area */}
      <div className="flex flex-col items-center overflow-auto py-4">
        {doc && (
          <Document
            file={docAPI.getFileUrl(doc._id)}
            onLoadSuccess={onDocumentLoadSuccess}
            className="flex justify-center"
          >
            <PDFCanvas
              pageNumber={pageNumber}
              scale={scale}
              signatures={signatures}
              onUpdateSignature={handleUpdateSignature}
              onDeleteSignature={handleDeleteSignature}
              onOpenSignModal={handleOpenSignModal}
              canvasRef={canvasRef}
            />
          </Document>
        )}
      </div>

      {/* Signature Modal */}
      <SignatureModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        onSave={handleSaveSignatureData}
      />
    </div>
  );
}
