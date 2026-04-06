import { useState } from 'react';
import { Users, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface MemberSetupProps {
  onComplete: () => void;
}

export default function MemberSetup({ onComplete }: MemberSetupProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<string[]>(['', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const addMember = () => {
    if (members.length < 4) {
      setMembers([...members, '']);
    }
  };

  const removeMember = (index: number) => {
    if (members.length > 2) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const updateMember = (index: number, value: string) => {
    const updated = [...members];
    updated[index] = value;
    setMembers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validMembers = members.filter((m) => m.trim() !== '');

    if (validMembers.length < 2) {
      setError('Please add at least 2 members');
      return;
    }

    setLoading(true);

    try {
      const memberInserts = validMembers.map((name) => ({
        user_id: user!.id,
        name: name.trim(),
      }));

      const { error: memberError } = await supabase.from('members').insert(memberInserts);
      if (memberError) throw memberError;

      const { error: settingsError } = await supabase.from('settings').insert({
        user_id: user!.id,
        global_meal_price: 60,
      });
      if (settingsError) throw settingsError;

      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to set up members');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-emerald-500/10 p-6 rounded-3xl backdrop-blur-sm border border-emerald-500/20">
              <Users className="w-12 h-12 text-emerald-500" strokeWidth={1.5} />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white">Add Members</h2>
          <p className="text-gray-400">Who's sharing meals in your household?</p>
          <p className="text-sm text-gray-500">Add 2 to 4 members</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            {members.map((member, index) => (
              <div key={index} className="relative">
                <input
                  type="text"
                  value={member}
                  onChange={(e) => updateMember(index, e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent backdrop-blur-sm"
                  placeholder={`Member ${index + 1} name`}
                  required={index < 2}
                />
                {members.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeMember(index)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {members.length < 4 && (
            <button
              type="button"
              onClick={addMember}
              className="w-full bg-white/5 border border-white/10 text-white py-3 px-6 rounded-2xl hover:bg-white/10 transition-all duration-200 backdrop-blur-sm"
            >
              + Add Another Member
            </button>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 text-black font-semibold py-4 px-6 rounded-2xl hover:bg-emerald-400 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Setting up...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
