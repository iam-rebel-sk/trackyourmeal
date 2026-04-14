import { useState, useEffect } from 'react';
import { Plus, Check, Trash2, UtensilsCrossed, CreditCard, AlertCircle } from 'lucide-react';
import { supabase, Member, Meal } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AddMealDrawer from '../components/AddMealDrawer';
import PaymentDrawer from '../components/PaymentDrawer';
import { useNotification, Toast } from '../components/Toast';
import SuccessAnimation from '../components/SuccessAnimation';
import { SkeletonMealGroup, SkeletonList } from '../components/Skeleton';

export default function Dashboard() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [currentPeriodPayments, setCurrentPeriodPayments] = useState<any[]>([]);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; action: () => Promise<void>; type: 'archive' | 'delete'; actionLoading?: boolean } | null>(null);
  const { notifications, notify, dismiss } = useNotification();
  const [successAnimation, setSuccessAnimation] = useState<{ show: boolean; message: string } | null>(null);
  
  useEffect(() => {
    loadData();
    subscribeToChanges();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const { data: membersData } = await supabase
      .from('members')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at');

    const { data: mealsData } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .eq('archived', false)
      .order('meal_date', { ascending: false });

    const { data: paymentsData } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .order('payment_date', { ascending: false });

    // Get the most recent archive to filter payments for current period only
    const { data: archivesData } = await supabase
      .from('archives')
      .select('archived_at')
      .eq('user_id', user.id)
      .order('archived_at', { ascending: false })
      .limit(1);

    // Filter payments to only those from current period (after most recent archive)
    let filteredPayments = paymentsData || [];
    if (archivesData && archivesData.length > 0) {
      const mostRecentArchiveTime = new Date(archivesData[0].archived_at).getTime();
      filteredPayments = filteredPayments.filter((payment: any) => {
        const paymentTime = new Date(payment.payment_date).getTime();
        // Only include payments made AFTER the archive (add 1ms to ensure it's after, not equal)
        return paymentTime >= mostRecentArchiveTime + 1000; // 1 second buffer to account for processing time
      });
    }

    setMembers(membersData || []);
    setMeals(mealsData || []);
    setPayments(paymentsData || []);
    setCurrentPeriodPayments(filteredPayments);
    setLoading(false);
  };

  const subscribeToChanges = () => {
    const mealsSubscription = supabase
      .channel('meals-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meals' },
        () => loadData()
      )
      .subscribe();

    const paymentsSubscription = supabase
      .channel('payments-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        () => loadData()
      )
      .subscribe();

    return () => {
      mealsSubscription.unsubscribe();
      paymentsSubscription.unsubscribe();
    };
  };

  const handleAutoArchive = async () => {
    if (!user || meals.length === 0) return;

    try {
      const { data: settings } = await supabase
        .from('settings')
        .select('global_meal_price')
        .eq('user_id', user.id)
        .single();

      const { data: archivesData } = await supabase
        .from('archives')
        .select('archived_at')
        .eq('user_id', user.id)
        .order('archived_at', { ascending: false })
        .limit(1);

      let filteredPayments = payments;
      if (archivesData && archivesData.length > 0) {
        const mostRecentArchiveTime = new Date(archivesData[0].archived_at).getTime();
        filteredPayments = payments.filter((payment: any) => {
          const paymentTime = new Date(payment.payment_date).getTime();
          // Only include payments made AFTER the archive (add 1 second buffer)
          return paymentTime >= mostRecentArchiveTime + 1000;
        });
      }

      const memberStats = members.map((member) => {
        const memberMeals = meals.filter((m) => m.member_id === member.id);
        const mealTotal = memberMeals.reduce((sum, m) => sum + Number(m.price_at_time), 0);
        
        const paidAmount = filteredPayments.reduce((sum, payment: any) => {
          const breakdown = payment.payment_breakdown || {};
          if (breakdown[member.id]) {
            return sum + Number(breakdown[member.id].amount || 0);
          }
          return sum;
        }, 0);

        return {
          name: member.name,
          count: memberMeals.length,
          total: mealTotal,
          paid: paidAmount,
          remaining: Math.max(0, mealTotal - paidAmount),
        };
      });

      const mealSnapshot = meals.map((meal) => {
        const member = members.find((m) => m.id === meal.member_id);
        return {
          member: member?.name || 'Unknown',
          date: meal.meal_date,
          type: meal.meal_type,
          price: Number(meal.price_at_time),
        };
      });

      const grandTotal = meals.reduce((sum, m) => sum + Number(m.price_at_time), 0);

      const { error: archiveError } = await supabase.from('archives').insert({
        user_id: user.id,
        total_amount: grandTotal,
        meal_count: meals.length,
        snapshot_data: {
          members: memberStats,
          meals: mealSnapshot,
        },
        price_at_archive: settings?.global_meal_price || 60,
      });

      if (archiveError) throw archiveError;

      const mealIds = meals.map((m) => m.id);
      const { error: updateError } = await supabase
        .from('meals')
        .update({ archived: true })
        .in('id', mealIds);

      if (updateError) throw updateError;

      loadData();
    } catch (err) {
      console.error('Error auto-archiving meals:', err);
      notify('error', 'Auto-Archive Failed', 'Failed to complete auto-archive. Please try again.');
    }
  };

  const handleMarkAsPaidConfirm = async () => {
    if (!user || meals.length === 0) return;

    setLoading(true);

    try {
      const { data: settings } = await supabase
        .from('settings')
        .select('global_meal_price')
        .eq('user_id', user.id)
        .single();

      // Get the most recent archive to filter payments for current period only
      const { data: archivesData } = await supabase
        .from('archives')
        .select('archived_at')
        .eq('user_id', user.id)
        .order('archived_at', { ascending: false })
        .limit(1);

      // Filter payments to only those from current period (after most recent archive)
      let filteredPayments = payments;
      if (archivesData && archivesData.length > 0) {
        const mostRecentArchiveTime = new Date(archivesData[0].archived_at).getTime();
        filteredPayments = payments.filter((payment: any) => {
          const paymentTime = new Date(payment.payment_date).getTime();
          // Only include payments made AFTER the archive (add 1 second buffer)
          return paymentTime >= mostRecentArchiveTime + 1000;
        });
      }

      // Calculate full split stats for archive
      const memberStats = members.map((member) => {
        const memberMeals = meals.filter((m) => m.member_id === member.id);
        const mealTotal = memberMeals.reduce((sum, m) => sum + Number(m.price_at_time), 0);
        
        const paidAmount = filteredPayments.reduce((sum, payment: any) => {
          const breakdown = payment.payment_breakdown || {};
          if (breakdown[member.id]) {
            return sum + Number(breakdown[member.id].amount || 0);
          }
          return sum;
        }, 0);

        return {
          name: member.name,
          count: memberMeals.length,
          total: mealTotal,
          paid: paidAmount,
          remaining: Math.max(0, mealTotal - paidAmount),
        };
      });

      const mealSnapshot = meals.map((meal) => {
        const member = members.find((m) => m.id === meal.member_id);
        return {
          member: member?.name || 'Unknown',
          date: meal.meal_date,
          type: meal.meal_type,
          price: Number(meal.price_at_time),
        };
      });

      const grandTotal = meals.reduce((sum, m) => sum + Number(m.price_at_time), 0);

      const { error: archiveError } = await supabase.from('archives').insert({
        user_id: user.id,
        total_amount: grandTotal,
        meal_count: meals.length,
        snapshot_data: {
          members: memberStats,
          meals: mealSnapshot,
        },
        price_at_archive: settings?.global_meal_price || 60,
      });

      if (archiveError) throw archiveError;

      const mealIds = meals.map((m) => m.id);
      const { error: updateError } = await supabase
        .from('meals')
        .update({ archived: true })
        .in('id', mealIds);

      if (updateError) throw updateError;

      // Calculate current splits to get remaining amounts for each member
      const currentSplits = members.map((member) => {
        const memberMeals = meals.filter((m) => m.member_id === member.id);
        const mealTotal = memberMeals.reduce((sum, m) => sum + Number(m.price_at_time), 0);

        const paidAmount = payments.reduce((sum, payment: any) => {
          const breakdown = payment.payment_breakdown || {};
          if (breakdown[member.id]) {
            return sum + Number(breakdown[member.id].amount || 0);
          }
          return sum;
        }, 0);

        const remaining = Math.max(0, mealTotal - paidAmount);

        return {
          id: member.id,
          name: member.name,
          remaining,
        };
      });

      const paymentBreakdown: { [key: string]: { name: string; amount: number } } = {};
      currentSplits.forEach((split) => {
        if (split.remaining > 0) {
          paymentBreakdown[split.id] = {
            name: split.name,
            amount: split.remaining,
          };
        }
      });

      const totalPayment = Object.values(paymentBreakdown).reduce((sum, item: any) => sum + item.amount, 0);

      if (totalPayment > 0) {
        const { error: paymentError } = await supabase.from('payments').insert({
          user_id: user.id,
          total_paid: totalPayment,
          payment_breakdown: paymentBreakdown,
          description: 'Marked as paid - all meals archived',
        });

        if (paymentError) throw paymentError;
      }

      loadData();
      setSuccessAnimation({ show: true, message: 'All Meals Archived!' });
    } catch (err) {
      console.error('Error archiving meals:', err);
      notify('error', 'Archive Failed', 'Failed to archive meals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = () => {
    setConfirmDialog({
      open: true,
      title: 'Mark all current meals as paid and archive them?',
      action: handleMarkAsPaidConfirm,
      type: 'archive',
    });
  };

  const getMemberName = (memberId: string) => {
    return members.find((m) => m.id === memberId)?.name || 'Unknown';
  };

  const handleDeleteMeal = async (mealId: string) => {
    setConfirmDialog({
      open: true,
      title: 'Delete this meal?',
      action: async () => {
        try {
          const { error } = await supabase
            .from('meals')
            .delete()
            .eq('id', mealId);

          if (error) {
            notify('error', 'Delete Failed', 'Failed to delete meal. Please try again.');
          } else {
            setSuccessAnimation({ show: true, message: 'Meal Deleted!' });
            await loadData();
          }
        } catch (err) {
          console.error('Error deleting meal:', err);
          notify('error', 'Delete Failed', 'Failed to delete meal. Please try again.');
        }
      },
      type: 'delete',
    });
  };

  const calculateSplits = () => {
    return members.map((member) => {
      const memberMeals = meals.filter((m) => m.member_id === member.id);
      const mealTotal = memberMeals.reduce((sum, m) => sum + Number(m.price_at_time), 0);

      // Use only current period payments (after most recent archive)
      const paidAmount = currentPeriodPayments.reduce((sum, payment: any) => {
        const breakdown = payment.payment_breakdown || {};
        if (breakdown[member.id]) {
          return sum + Number(breakdown[member.id].amount || 0);
        }
        return sum;
      }, 0);

      const remaining = Math.max(0, mealTotal - paidAmount);

      return {
        id: member.id,
        name: member.name,
        count: memberMeals.length,
        total: mealTotal,
        paid: paidAmount,
        remaining,
      };
    });
  };

  const organizeMealsByDateAndType = () => {
    const grouped: { [key: string]: { lunch: Meal[]; dinner: Meal[] } } = {};

    meals.forEach((meal) => {
      const date = meal.meal_date;
      if (!grouped[date]) {
        grouped[date] = { lunch: [], dinner: [] };
      }
      if (meal.meal_type === 'lunch') {
        grouped[date].lunch.push(meal);
      } else {
        grouped[date].dinner.push(meal);
      }
    });

    return Object.keys(grouped)
      .sort()
      .reverse()
      .map((date) => ({
        date,
        lunch: grouped[date].lunch,
        dinner: grouped[date].dinner,
      }));
  };

  const grandTotal = meals.reduce((sum, m) => sum + Number(m.price_at_time), 0);
  const splits = calculateSplits();
  const totalRemaining = splits.reduce((sum, split) => sum + split.remaining, 0);
  const totalPaid = splits.reduce((sum, split) => sum + split.paid, 0);
  const originalTotal = grandTotal ; // Total before any payments in current period

  if (loading && meals.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto pb-24 px-4 sm:px-6 pt-6 space-y-6 mx-auto w-full max-w-7xl">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 p-2 rounded-xl">
              <div className="w-5 h-5 bg-gradient-to-r from-white/10 to-white/5 rounded animate-pulse" />
            </div>
            <div className="h-8 bg-gradient-to-r from-white/10 to-white/5 rounded-full w-40 animate-pulse" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-emerald-500/20 backdrop-blur-sm border border-white/20 rounded-3xl p-4 sm:p-6 space-y-4">
              <div className="h-4 bg-gradient-to-r from-white/10 to-white/5 rounded-full w-32 animate-pulse" />
              <div className="space-y-4">
                <div className="h-6 bg-gradient-to-r from-white/10 to-white/5 rounded-full w-48 animate-pulse" />
                <div className="h-6 bg-gradient-to-r from-white/10 to-white/5 rounded-full w-40 animate-pulse" />
                <div className="h-8 bg-gradient-to-r from-white/10 to-white/5 rounded-full w-44 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="h-4 bg-gradient-to-r from-white/10 to-white/5 rounded-full w-32 animate-pulse px-2" />
            <SkeletonList count={3} />
          </div>

          <div className="space-y-6">
            <SkeletonMealGroup />
            <SkeletonMealGroup />
            <SkeletonMealGroup />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto pb-24 px-4 sm:px-6 pt-6 space-y-6 mx-auto w-full max-w-7xl">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-2 rounded-xl">
            <UtensilsCrossed className="w-5 h-5 text-emerald-500" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Dashboard</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-emerald-500/20 backdrop-blur-sm border border-white/20 rounded-3xl p-4 sm:p-6 space-y-4">
            <h3 className="text-sm text-gray-400 uppercase tracking-wide">Payment Breakdown</h3>
            
            {originalTotal > 0 ? (
              <div className="space-y-4">
                {/* Original Total */}
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <span className="text-gray-400">Original Total:</span>
                  <p className="text-lg font-semibold text-gray-300">₹{originalTotal.toFixed(2)}</p>
                </div>
              
              {/* Amount Paid */}
              {totalPaid > 0 && (
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <span className="text-emerald-400">Amount Paid:</span>
                  <p className="text-lg font-semibold text-emerald-400">₹{totalPaid.toFixed(2)}</p>
                </div>
              )}
              
              {/* Remaining Amount - Focused */}
              <div className="flex justify-between items-center bg-yellow-500/20 border border-yellow-500/40 rounded-2xl p-3 mt-4">
                <span className="text-yellow-400 font-semibold">Remaining to Pay:</span>
                <p className="text-2xl font-bold text-yellow-300">₹{totalRemaining.toFixed(2)}</p>
              </div>
              
              {/* Meals Count */}
              <p className="text-xs text-gray-500 pt-2">{meals.length} active meal{meals.length !== 1 ? 's' : ''}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-5xl font-bold text-white">₹0.00</p>
              <p className="text-gray-400">No active meals</p>
            </div>
          )}
          </div>
        </div>

        {meals.length > 0 && (
          <>
          <div className="space-y-3">
            <h3 className="text-sm text-gray-400 uppercase tracking-wide px-2">Individual Splits</h3>
            {splits.map((split) => (
              <div
                key={split.id}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-white font-semibold">{split.name}</p>
                    <p className="text-sm text-gray-400">{split.count} meals</p>
                  </div>
                  <p className="text-xl font-bold text-emerald-500">₹{split.total.toFixed(2)}</p>
                </div>
                {split.paid > 0 && (
                  <div className="flex justify-between text-xs border-t border-white/10 pt-2">
                  <span className="text-gray-400">Paid: ₹{split.paid.toFixed(2)}</span>
                  <span className="text-yellow-400">Remaining: ₹{split.remaining.toFixed(2)}</span>
                </div>
              )}
            </div>
          ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-2 gap-2 md:gap-4">
              <h3 className="text-sm text-gray-400 uppercase tracking-wide">Active Meals</h3>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setShowPayment(true)}
                  className="flex items-center gap-2 bg-blue-500/20 text-blue-400 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium hover:bg-blue-500/30 transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  Add Payment
                </button>
                <button
                  onClick={handleMarkAsPaid}
                  disabled={loading}
                  className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin"></div>
                      Archiving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Mark as Paid
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {organizeMealsByDateAndType().map(({ date, lunch, dinner }) => (
                <div key={date} className="space-y-3">
                  <h4 className="text-sm font-semibold text-emerald-400 px-2">
                    {new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </h4>

                  {lunch.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 px-2 uppercase tracking-wider">Lunch</p>
                      {lunch.map((meal) => (
                        <div
                          key={meal.id}
                          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-white font-semibold">{getMemberName(meal.member_id)}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="text-emerald-500 font-bold">₹{Number(meal.price_at_time).toFixed(2)}</p>
                              <button
                                onClick={() => handleDeleteMeal(meal.id)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                                title="Delete meal"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {dinner.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 px-2 uppercase tracking-wider">Dinner</p>
                      {dinner.map((meal) => (
                        <div
                          key={meal.id}
                          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-white font-semibold">{getMemberName(meal.member_id)}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="text-emerald-500 font-bold">₹{Number(meal.price_at_time).toFixed(2)}</p>
                              <button
                                onClick={() => handleDeleteMeal(meal.id)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                                title="Delete meal"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {meals.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No active meals yet. Tap + to add one!
          </div>
        )}
      </div>

      <button
        onClick={() => setShowAddMeal(true)}
        className="fixed bottom-24 right-6 bg-emerald-500 text-black p-5 rounded-full shadow-lg shadow-emerald-500/50 hover:bg-emerald-400 transition-all duration-200 active:scale-95"
      >
        <Plus className="w-7 h-7" strokeWidth={2.5} />
      </button>

      {showAddMeal && (
        <AddMealDrawer
          members={members}
          onClose={() => setShowAddMeal(false)}
          onSuccess={() => {
            setShowAddMeal(false);
            loadData();
          }}
        />
      )}

      {showPayment && (
        <PaymentDrawer
          members={members}
          splits={splits}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            setShowPayment(false);
            loadData();
          }}
          notify={notify}
          onAutoArchive={handleAutoArchive}
        />
      )}
    </div>

    {/* Confirmation Dialog */}
    {confirmDialog?.open && (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-neutral-900 rounded-3xl p-6 max-w-sm border border-white/10">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
              confirmDialog.type === 'archive' ? 'text-emerald-400' : 'text-red-400'
            }`} />
            <h3 className="text-lg font-bold text-white">{confirmDialog.title}</h3>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmDialog(null)}
              disabled={confirmDialog.actionLoading}
              className="flex-1 py-3 px-4 rounded-2xl font-semibold bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                setConfirmDialog(prev => prev ? { ...prev, actionLoading: true } : null);
                try {
                  await confirmDialog.action();
                } finally {
                  setConfirmDialog(null);
                }
              }}
              disabled={confirmDialog.actionLoading}
              className={`flex-1 py-3 px-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                confirmDialog.type === 'archive'
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {confirmDialog.actionLoading ? (
                <>
                  <div className={`w-4 h-4 border-2 rounded-full animate-spin ${
                    confirmDialog.type === 'archive'
                      ? 'border-black/20 border-t-black'
                      : 'border-white/20 border-t-white'
                  }`}></div>
                  {confirmDialog.type === 'archive' ? 'Archiving...' : 'Deleting...'}
                </>
              ) : (
                <>
                  {confirmDialog.type === 'archive' ? (
                    <>
                      <Check className="w-4 h-4" />
                      Archive
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}

    <Toast notifications={notifications} dismiss={dismiss} />
    {successAnimation?.show && (
      <SuccessAnimation
        message={successAnimation.message}
        onComplete={() => setSuccessAnimation(null)}
      />
    )}
    </>
  );
}
