import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import Landing from './pages/Landing';
import MemberSetup from './pages/MemberSetup';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Settings from './pages/Settings';
import BottomNav from './components/BottomNav';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'settings'>('dashboard');
  const [hasMembers, setHasMembers] = useState<boolean | null>(null);
  const [checkingMembers, setCheckingMembers] = useState(true);

  useEffect(() => {
    if (user) {
      checkMembers();
    } else {
      setCheckingMembers(false);
    }
  }, [user]);

  const checkMembers = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('members')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    setHasMembers((data && data.length > 0) || false);
    setCheckingMembers(false);
  };

  if (authLoading || checkingMembers) {
    console.log('⏳ Loading... (authLoading:', authLoading, 'checkingMembers:', checkingMembers, ')');
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  console.log('👤 User:', user ? '✅ Logged in' : '❌ Not logged in');
  console.log('👥 Has members:', hasMembers);

  if (!user) {
    console.log('📍 Showing Landing page');
    return <Landing />;
  }
  if (hasMembers === false) {
    return <MemberSetup onComplete={() => setHasMembers(true)} />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="h-screen flex flex-col">
        <div className="flex-1 overflow-hidden">
          <ErrorBoundary>
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'history' && <History />}
            {activeTab === 'settings' && <Settings />}
          </ErrorBoundary>
        </div>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
