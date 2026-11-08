import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { isSupabaseConfigured, supabase } from './lib/supabase';
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
    // console.log('⏳ Loading... (authLoading:', authLoading, 'checkingMembers:', checkingMembers, ')');
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  // console.log('👤 User:', user ? '✅ Logged in' : '❌ Not logged in');
  // console.log('👥 Has members:', hasMembers);

  if (!user) {
    // console.log('📍 Showing Landing page');
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
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white/5 border border-emerald-500/30 rounded-3xl p-8 space-y-5">
          <h1 className="text-2xl font-bold text-emerald-400">Supabase configuration required</h1>
          <p className="text-gray-300">
            Add your Supabase project URL and public anon key to a <code>.env.local</code> file
            in the project folder, then restart the development server.
          </p>
          <pre className="bg-black/60 rounded-2xl p-4 text-sm text-gray-300 overflow-x-auto">{`VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_public_anon_key`}</pre>
          <p className="text-sm text-gray-500">
            Find both values in Supabase: Project Settings → API. Never use or share the service role key.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
