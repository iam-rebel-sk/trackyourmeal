import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, DollarSign, Users, LogOut, Plus, Trash2, AlertCircle } from 'lucide-react';
import { supabase, Member, Settings as SettingsType } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification, Toast } from '../components/Toast';

export default function Settings() {
  const { user, signOut } = useAuth();
  const { notifications, notify, dismiss } = useNotification();
  const [members, setMembers] = useState<Member[]>([]);
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [newPrice, setNewPrice] = useState('60');
  const [loading, setLoading] = useState(true);
  const [newMemberName, setNewMemberName] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; action: () => void; type: 'delete' } | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const { data: membersData } = await supabase
      .from('members')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at');

    const { data: settingsData } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    setMembers(membersData || []);
    setSettings(settingsData);
    setNewPrice(settingsData?.global_meal_price?.toString() || '60');
    setLoading(false);
  };

  const handleUpdatePrice = async () => {
    if (!user || !settings) return;

    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) {
      notify('info', 'Invalid Price', 'Please enter a valid price greater than 0');
      return;
    }

    const { error } = await supabase
      .from('settings')
      .update({ global_meal_price: price, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (error) {
      notify('error', 'Update Failed', 'Could not update price. Please try again.');
    } else {
      notify('success', 'Price Updated', `Global meal price updated to ₹${price.toFixed(2)}`);
      loadData();
    }
  };

  const handleAddMember = async () => {
    if (!user || !newMemberName.trim()) {
      notify('info', 'Name Required', 'Please enter a member name');
      return;
    }

    if (members.length >= 4) {
      notify('warning', 'Limit Reached', 'Maximum 4 members allowed');
      return;
    }

    setAddingMember(true);

    const { error } = await supabase.from('members').insert({
      user_id: user.id,
      name: newMemberName.trim(),
    });

    if (error) {
      notify('error', 'Add Failed', 'Could not add member. Please try again.');
    } else {
      notify('success', 'Member Added', `${newMemberName.trim()} has been added successfully!`);
      setNewMemberName('');
      loadData();
    }

    setAddingMember(false);
  };

  const handleDeleteMember = async (memberId: string) => {
    const memberName = members.find(m => m.id === memberId)?.name || 'Member';
    setConfirmDialog({
      open: true,
      title: `Delete ${memberName}? Their meals will be deleted too.`,
      action: async () => {
        const { error } = await supabase
          .from('members')
          .delete()
          .eq('id', memberId);

        if (error) {
          notify('error', 'Delete Failed', 'Could not delete member. Please try again.');
        } else {
          notify('success', 'Member Deleted', `${memberName} has been removed.`);
          loadData();
        }
        setConfirmDialog(null);
      },
      type: 'delete',
    });
  };

  const handleSignOut = async () => {
    setConfirmDialog({
      open: true,
      title: 'Sign out of this household account?',
      action: async () => {
        await signOut();
        setConfirmDialog(null);
      },
      type: 'delete',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pb-24 px-4 sm:px-6 pt-6 space-y-6 mx-auto w-full max-w-7xl">
      <div className="flex items-center gap-3">
        <div className="bg-emerald-500/10 p-2 rounded-xl">
          <SettingsIcon className="w-5 h-5 text-emerald-500" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Settings</h2>
      </div>

      <div className="space-y-6">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <h3 className="text-white font-semibold">Global Meal Price</h3>
          </div>
          <p className="text-sm text-gray-400">
            Default price for new meals (won't affect existing meals)
          </p>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-8 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="60"
              />
            </div>
            <button
              onClick={handleUpdatePrice}
              className="bg-emerald-500 text-black font-semibold px-6 rounded-2xl hover:bg-emerald-400 transition-colors"
            >
              Update
            </button>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-emerald-500" />
            <h3 className="text-white font-semibold">Household Members</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between"
              >
                <p className="text-white text-sm sm:text-base">{member.name}</p>
                <button
                  onClick={() => handleDeleteMember(member.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                  title="Delete member"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {members.length < 4 && (
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
                placeholder="Add new member..."
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm sm:text-base"
              />
              <button
                onClick={handleAddMember}
                disabled={addingMember}
                className="bg-emerald-500 text-black font-semibold px-4 sm:px-6 py-3 rounded-2xl hover:bg-emerald-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 space-y-4">
          <h3 className="text-white font-semibold">Account</h3>
          <p className="text-sm text-gray-400">{user?.email}</p>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 font-semibold py-3 px-6 rounded-2xl hover:bg-red-500/20 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog?.open && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-neutral-900 rounded-3xl p-6 max-w-sm border border-white/10">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <h3 className="text-lg font-bold text-white">{confirmDialog.title}</h3>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-3 px-4 rounded-2xl font-semibold bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.action}
                className="flex-1 py-3 px-4 rounded-2xl font-semibold bg-red-500 text-white hover:bg-red-600 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <Toast notifications={notifications} dismiss={dismiss} />
    </div>
  );
}
