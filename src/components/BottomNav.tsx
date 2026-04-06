import { Home, Clock, Settings } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'dashboard' | 'history' | 'settings';
  onTabChange: (tab: 'dashboard' | 'history' | 'settings') => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'dashboard' as const, icon: Home, label: 'Dashboard' },
    { id: 'history' as const, icon: Clock, label: 'History' },
    { id: 'settings' as const, icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-neutral-900/95 backdrop-blur-lg border-t border-white/10 px-6 py-4 safe-area-bottom z-40">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center gap-2 transition-all duration-300 active:scale-95 group`}
            >
              {/* Icon Container */}
              <div
                className={`p-3 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 shadow-lg shadow-emerald-500/20 scale-110' 
                    : 'hover:bg-white/5'
                }`}
              >
                <Icon 
                  className={`w-6 h-6 transition-all duration-300 ${
                    isActive ? 'text-emerald-400' : 'text-gray-400 group-hover:text-gray-300'
                  }`} 
                  strokeWidth={2} 
                />
              </div>
              
              {/* Label */}
              <span className={`text-xs font-medium transition-all duration-300 ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-gray-400'
              }`}>{tab.label}</span>
              
              {/* Active Indicator Dot */}
              {isActive && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full shadow-lg shadow-emerald-500/50 animate-pulse"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
