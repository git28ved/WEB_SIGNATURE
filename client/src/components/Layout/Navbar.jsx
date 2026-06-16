import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiLogOut, FiFolder, FiEdit3, FiUser } from 'react-icons/fi';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="glass border-b border-surface-800 sticky top-0 z-30 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="gradient-primary p-2 rounded-xl text-white shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform duration-200">
            <FiEdit3 className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">
            Doc<span className="text-primary-400">Sign</span>
          </span>
        </Link>

        {/* User navigation */}
        {user && (
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-2 text-sm font-medium text-surface-300 hover:text-white transition-colors duration-200"
            >
              <FiFolder className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>

            {/* User Profile Info */}
            <div className="h-4 w-[1px] bg-surface-700"></div>

            <Link
              to="/profile"
              className="flex items-center gap-3 group/profile cursor-pointer"
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-surface-800 border border-surface-700 text-primary-400 font-semibold text-sm group-hover/profile:border-primary-500 transition-colors duration-200">
                {user.name ? user.name[0].toUpperCase() : <FiUser />}
              </div>
              <div className="hidden md:flex flex-col">
                <span className="text-xs font-semibold text-white leading-tight group-hover/profile:text-primary-400 transition-colors duration-200">
                  {user.name}
                </span>
                <span className="text-[10px] text-surface-400 leading-none">
                  {user.email}
                </span>
              </div>
            </Link>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-sm flex items-center gap-1.5 hover:text-white"
              title="Logout"
            >
              <FiLogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
