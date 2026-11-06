import React from 'react';
import { 
  LayoutDashboard, 
  Files, 
  Search, 
  Database, 
  GraduationCap,
  Layers,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'documents', label: 'Documents', icon: Files },
    { id: 'search', label: 'Search Engine', icon: Search },
    { id: 'index-status', label: 'Index Status', icon: Database },
  ];

  return (
    <aside className="w-64 bg-[#0F3D3A] text-white flex flex-col justify-between shrink-0 min-h-screen border-r border-[#0A2927] select-none">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-[#18534F]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#6C151E] flex items-center justify-center shadow-md border border-[#881F2A]/40 text-[#F5DABF]">
              <Search className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5 font-editorial">
                DocuFind
              </h1>
              <p className="text-[11px] font-medium tracking-wide uppercase text-[#F5DABF]/70">
                Information Retrieval
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-3 py-6">
          <p className="px-3 mb-2 text-[10px] font-semibold tracking-wider uppercase text-emerald-200/50">
            Core Navigation
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-[#6C151E] text-white shadow-sm font-semibold border-l-4 border-[#F5DABF]'
                      : 'text-stone-300 hover:text-white hover:bg-[#18534F]/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#F5DABF]' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Academic WSM Footer */}
      <div className="p-4 m-3 rounded-xl bg-[#0A2927]/80 border border-[#18534F] text-xs">
        <div className="flex items-center gap-2 mb-1.5 text-[#F5DABF]">
          <GraduationCap className="w-4 h-4 shrink-0" />
          <span className="font-semibold tracking-tight">WSM Project</span>
        </div>
        <p className="text-stone-400 text-[11px] leading-relaxed">
          Web Search & Mining academic inverted index & wildcard IR system.
        </p>
        <div className="mt-2.5 pt-2 border-t border-[#18534F]/60 flex items-center justify-between text-[10px] text-stone-400">
          <span>Engine v1.0</span>
          <span className="px-1.5 py-0.5 rounded bg-[#18534F] text-[#F5DABF] font-mono">MVP</span>
        </div>
      </div>
    </aside>
  );
}

