import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiSearch, FiSliders, FiFileText, FiActivity } from 'react-icons/fi';
import { docAPI, statsAPI } from '../services/api';
import UploadZone from '../components/Dashboard/UploadZone';
import DocumentCard from '../components/Dashboard/DocumentCard';
import StatsBar from '../components/Dashboard/StatsBar';

export default function DashboardPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await statsAPI.get();
      setStats(res.data.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;
      params.sort = sortBy;

      const res = await docAPI.getAll(params);
      setDocuments(res.data.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    // Debounce search input to avoid hitting database on every keystroke
    const timer = setTimeout(() => {
      fetchDocuments();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, sortBy]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document? This action is permanent.')) {
      return;
    }

    try {
      await docAPI.delete(id);
      toast.success('Document deleted');
      // Refresh list locally
      setDocuments((prev) => prev.filter((d) => d._id !== id));
      fetchStats();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete document');
    }
  };

  const handleUploadSuccess = (newDoc) => {
    setDocuments((prev) => [newDoc, ...prev]);
    fetchStats();
  };

  return (
    <div className="space-y-8">
      {/* Page Header / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Document <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-sm text-surface-400 mt-1">
            Upload, manage, and place electronic signatures on your PDF contracts
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <StatsBar stats={stats} loading={statsLoading} />

      {/* Upload Zone Area */}
      <div className="animate-slide-up">
        <UploadZone onUploadSuccess={handleUploadSuccess} />
      </div>

      {/* Search and Filters Bar */}
      <div className="glass rounded-2xl p-5 border border-surface-800 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-500">
            <FiSearch className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
            placeholder="Search documents..."
          />
        </div>

        {/* Filter Selection */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2">
            <FiSliders className="text-surface-400 h-4 w-4" />
            <span className="text-xs font-semibold text-surface-400">Filter:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input py-2 px-3 text-xs w-auto bg-surface-900 border-surface-800 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="signed">Signed</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input py-2 px-3 text-xs w-auto bg-surface-900 border-surface-800 cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>
      </div>

      {/* Document Grid / Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card h-[180px] p-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="h-5 skeleton w-2/3 mb-4"></div>
                <div className="h-3 skeleton w-1/3 mb-1"></div>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-surface-900/50">
                <div className="h-3 skeleton w-1/4"></div>
                <div className="flex gap-2">
                  <div className="h-8 w-16 skeleton rounded-lg"></div>
                  <div className="h-8 w-8 skeleton rounded-lg"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : documents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {documents.map((doc) => (
            <DocumentCard key={doc._id} doc={doc} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center border-dashed flex flex-col items-center justify-center max-w-lg mx-auto">
          <div className="p-4 rounded-full bg-surface-900 border border-surface-800 text-surface-400 mb-4">
            <FiFileText className="h-8 w-8 text-primary-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No documents found</h3>
          <p className="text-sm text-surface-400">
            {search || statusFilter !== 'all'
              ? 'No documents match your filter settings. Try adjusting your filters or search query.'
              : "You haven't uploaded any documents yet. Drag and drop a PDF file above to get started!"}
          </p>
        </div>
      )}
    </div>
  );
}
