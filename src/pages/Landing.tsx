import { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import SignIn from './SignIn';
import SignUp from './SignUp';

export default function Landing() {
  const [view, setView] = useState<'landing' | 'signin' | 'signup'>('landing');

  if (view === 'signin') return <SignIn onBack={() => setView('landing')} />;
  if (view === 'signup') return <SignUp onBack={() => setView('landing')} />;

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="bg-emerald-500/10 p-6 rounded-3xl backdrop-blur-sm border border-emerald-500/20">
              <UtensilsCrossed className="w-16 h-16 text-emerald-500" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Meal Tracker
          </h1>
          <p className="text-gray-400 text-lg">
            Share meals, split costs, track together
          </p>
        </div>

        <div className="space-y-3 pt-8">
          <button
            onClick={() => setView('signin')}
            className="w-full bg-emerald-500 text-black font-semibold py-4 px-6 rounded-2xl hover:bg-emerald-400 transition-all duration-200 active:scale-[0.98]"
          >
            Sign In
          </button>
          <button
            onClick={() => setView('signup')}
            className="w-full bg-white/5 text-white font-semibold py-4 px-6 rounded-2xl hover:bg-white/10 transition-all duration-200 backdrop-blur-sm border border-white/10 active:scale-[0.98]"
          >
            Create Household Account
          </button>
        </div>

        <p className="text-gray-500 text-sm pt-4">
          One account, one household, shared tracking
        </p>
      </div>
    </div>
  );
}
