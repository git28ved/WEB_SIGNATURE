import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { FiUploadCloud, FiFile, FiAlertCircle } from 'react-icons/fi';
import { docAPI } from '../../services/api';

export default function UploadZone({ onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await handleUpload(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleUpload = async (file) => {
    // Basic validation
    if (file.type !== 'application/pdf') {
      return toast.error('Only PDF documents are supported for signing.');
    }

    if (file.size > 10 * 1024 * 1024) {
      return toast.error('Document size exceeds the 10MB limit.');
    }

    const formData = new FormData();
    formData.append('document', file);
    formData.append('title', file.name.replace('.pdf', ''));

    try {
      setUploading(true);
      setProgress(20);
      
      // Simulate/mock progress update (since standard axios upload progress is clean but requires setup)
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 10 : prev));
      }, 100);

      const res = await docAPI.upload(formData);
      clearInterval(interval);
      setProgress(100);
      
      toast.success('Document uploaded successfully!');
      if (onUploadSuccess) {
        onUploadSuccess(res.data.data);
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Error uploading document';
      toast.error(msg);
    } finally {
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 500);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={onButtonClick}
      className={`upload-zone relative glass flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed rounded-2xl cursor-pointer p-8 select-none transition-all duration-300 ${
        dragActive
          ? 'border-primary-500 bg-primary-500/5 scale-[1.01] shadow-lg shadow-primary-500/10'
          : 'border-surface-800 hover:border-surface-700 hover:bg-surface-800/10'
      } ${uploading ? 'pointer-events-none' : ''}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="application/pdf"
        onChange={handleChange}
        disabled={uploading}
      />

      {uploading ? (
        <div className="flex flex-col items-center w-full max-w-xs text-center">
          <FiFile className="h-10 w-10 text-primary-400 animate-pulse mb-3" />
          <span className="text-sm font-semibold text-white mb-2">Uploading Document...</span>
          <div className="w-full bg-surface-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="gradient-primary h-1.5 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="text-xs text-surface-400 mt-1">{progress}%</span>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center">
          <div className="p-3 rounded-full bg-surface-800 text-surface-400 border border-surface-700 mb-3 group-hover:scale-110 transition-transform duration-200">
            <FiUploadCloud className="h-6 w-6 text-primary-400" />
          </div>
          <p className="text-sm font-bold text-white mb-1">
            Drag & drop your PDF file here, or{' '}
            <span className="text-primary-400 hover:underline">browse</span>
          </p>
          <p className="text-xs text-surface-400 flex items-center gap-1.5">
            <FiAlertCircle className="h-3.5 w-3.5" /> PDF files only (Max 10MB)
          </p>
        </div>
      )}
    </div>
  );
}
