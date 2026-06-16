import Navbar from './Navbar';

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-surface-950 text-surface-100">
      {/* Dynamic colorful blur spots in background */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/5 rounded-full blur-[150px] pointer-events-none -z-10"></div>

      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative z-10">
        {children}
      </main>

      <footer className="py-6 text-center text-xs text-surface-500 border-t border-surface-900/50">
        <p>© {new Date().getFullYear()} DocSign. All rights reserved. Secured with bank-grade encryption.</p>
      </footer>
    </div>
  );
}
