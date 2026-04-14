import { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { supabase, Member } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AddMealDrawerProps {
  members: Member[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddMealDrawer({ members, onClose, onSuccess }: AddMealDrawerProps) {
  const { user } = useAuth();
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [mealDate, setMealDate] = useState(new Date().toISOString().split('T')[0]);
  const [mealTypes, setMealTypes] = useState<('lunch' | 'dinner')[]>(['lunch']);
  const [loading, setLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(true);
  const [price, setPrice] = useState(60);

  useEffect(() => {
    loadPrice();
  }, [user]);

  const loadPrice = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('settings')
      .select('global_meal_price')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setPrice(Number(data.global_meal_price));
    }
    setPriceLoading(false);
  };

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const toggleMealType = (type: 'lunch' | 'dinner') => {
    setMealTypes((prev) => 
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMembers.length === 0) {
      alert('Please select at least one member');
      return;
    }
    if (mealTypes.length === 0) {
      alert('Please select at least one meal type');
      return;
    }

    setLoading(true);

    try {
      const mealsToAdd = selectedMembers.flatMap((memberId) =>
        mealTypes.map((type) => ({
          user_id: user!.id,
          member_id: memberId,
          meal_date: mealDate,
          meal_type: type,
          price_at_time: price,
          archived: false,
        }))
      );

      const { error } = await supabase.from('meals').insert(mealsToAdd);

      if (error) throw error;

      setSelectedMembers([]);
      setMealTypes(['lunch']);
      onSuccess();
    } catch (err) {
      console.error('Error adding meal:', err);
      alert('Failed to add meal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end">
      <div className="w-full bg-neutral-900 rounded-t-3xl p-6 space-y-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white">Add Meal</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {priceLoading ? (
          <div className="space-y-4">
            <div className="h-6 bg-gradient-to-r from-white/10 to-white/5 rounded-full w-40 animate-pulse" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-gradient-to-r from-white/10 to-white/5 rounded-2xl animate-pulse" />
              ))}
            </div>
            <div className="h-4 bg-gradient-to-r from-white/10 to-white/5 rounded-full w-32 animate-pulse" />
            <div className="h-10 bg-gradient-to-r from-white/10 to-white/5 rounded-lg w-full animate-pulse" />
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Select Members (Multiple)</label>
            <div className="grid grid-cols-2 gap-3">
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggleMember(member.id)}
                  className={`py-4 px-4 rounded-2xl font-semibold transition-all ${
                    selectedMembers.includes(member.id)
                      ? 'bg-emerald-500 text-black'
                      : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {member.name}
                </button>
              ))}
            </div>
            {selectedMembers.length > 0 && (
              <p className="text-xs text-emerald-400">Selected: {selectedMembers.length} member(s)</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Meal Date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="date"
                value={mealDate}
                onChange={(e) => setMealDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Meal Type (Select one or both)</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => toggleMealType('lunch')}
                className={`py-4 px-4 rounded-2xl font-semibold transition-all ${
                  mealTypes.includes('lunch')
                    ? 'bg-emerald-500 text-black'
                    : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                }`}
              >
                Lunch
              </button>
              <button
                type="button"
                onClick={() => toggleMealType('dinner')}
                className={`py-4 px-4 rounded-2xl font-semibold transition-all ${
                  mealTypes.includes('dinner')
                    ? 'bg-emerald-500 text-black'
                    : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                }`}
              >
                Dinner
              </button>
            </div>
            {mealTypes.length > 0 && (
              <p className="text-xs text-emerald-400">Selected: {mealTypes.join(' + ')}</p>
            )}
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
            <p className="text-sm text-emerald-400">Price: ₹{price.toFixed(2)}</p>
          </div>

          <button
            type="submit"
            disabled={loading || selectedMembers.length === 0 || mealTypes.length === 0}
            className="w-full bg-emerald-500 text-black font-semibold py-4 px-6 rounded-2xl hover:bg-emerald-400 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : `Add Meal${(selectedMembers.length * mealTypes.length) > 1 ? 's' : ''} (${selectedMembers.length * mealTypes.length} total)`}
          </button>
        </form>
        )}
      </div>
    </div>
  );
}
