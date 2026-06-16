import { FiFileText, FiEdit2, FiClock, FiCheckCircle, FiXCircle, FiAward } from 'react-icons/fi';

export default function StatsBar({ stats, loading }) {
  const statItems = [
    {
      label: 'Total Documents',
      value: stats?.total ?? 0,
      icon: FiFileText,
      gradient: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30',
      glow: 'shadow-blue-500/5',
    },
    {
      label: 'Drafts',
      value: stats?.draft ?? 0,
      icon: FiEdit2,
      gradient: 'from-slate-500/20 to-zinc-500/20 text-slate-400 border-slate-500/30',
      glow: 'shadow-slate-500/5',
    },
    {
      label: 'Pending',
      value: stats?.pending ?? 0,
      icon: FiClock,
      gradient: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
      glow: 'shadow-amber-500/5',
    },
    {
      label: 'Completed',
      value: stats?.signed ?? 0,
      icon: FiCheckCircle,
      gradient: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
      glow: 'shadow-emerald-500/5',
    },
    {
      label: 'Rejected',
      value: stats?.rejected ?? 0,
      icon: FiXCircle,
      gradient: 'from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/30',
      glow: 'shadow-rose-500/5',
    },
    {
      label: 'Signatures Placed',
      value: stats?.totalSignatures ?? 0,
      icon: FiAward,
      gradient: 'from-cyan-500/20 to-teal-500/20 text-cyan-400 border-cyan-500/30',
      glow: 'shadow-cyan-500/5',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass rounded-2xl p-4 border border-surface-800/50 flex flex-col justify-between h-[100px]">
            <div className="flex justify-between items-start">
              <div className="h-4 w-1/2 bg-surface-800 rounded"></div>
              <div className="h-8 w-8 bg-surface-800 rounded-lg"></div>
            </div>
            <div className="h-6 w-1/3 bg-surface-800 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 stagger-children">
      {statItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <div
            key={index}
            className={`glass-card p-4 border flex flex-col justify-between h-[110px] relative overflow-hidden group hover:scale-[1.03] duration-300 shadow-lg ${item.glow}`}
          >
            {/* Ambient Background Gradient Glow on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

            <div className="flex justify-between items-start z-10">
              <span className="text-xs font-semibold text-surface-400 group-hover:text-white transition-colors duration-300">
                {item.label}
              </span>
              <div className={`p-2 rounded-lg bg-surface-900/80 border border-surface-800/80 text-lg group-hover:border-transparent group-hover:bg-transparent transition-all duration-300`}>
                <Icon className={`w-4 h-4 transition-transform duration-500 group-hover:scale-110`} />
              </div>
            </div>

            <div className="z-10">
              <span className="text-2xl font-extrabold text-white tracking-tight group-hover:scale-105 inline-block transition-transform duration-300">
                {item.value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
