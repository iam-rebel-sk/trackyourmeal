import { useState, useEffect } from 'react';
import { Archive as ArchiveIcon, ChevronDown, ChevronUp, Trash2, CreditCard, AlertCircle, Check } from 'lucide-react';
import { supabase, Archive } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../components/Toast';

interface Payment {
  id: string;
  payment_date: string;
  total_paid: number;
  payment_breakdown: { [key: string]: { name: string; amount: number } };
}

export default function History() {
  const { user } = useAuth();
  const { notifications, notify, dismiss } = useNotification();
  const [archives, setArchives] = useState<Archive[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'payments' | 'archives'>('payments');
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; action: () => void; type: 'delete' | 'delete-all' } | null>(null);

  // Helper function to get payments for a specific period (between two archives)
  const getPaymentsForPeriod = (currentArchiveDate: string, previousArchiveDate?: string): Payment[] => {
    const currentTime = new Date(currentArchiveDate).getTime();
    const previousTime = previousArchiveDate ? new Date(previousArchiveDate).getTime() : 0;

    return payments.filter((payment: Payment) => {
      const paymentTime = new Date(payment.payment_date).getTime();
      return paymentTime < currentTime && paymentTime >= previousTime;
    });
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const { data: archivesData } = await supabase
      .from('archives')
      .select('*')
      .eq('user_id', user.id)
      .order('archived_at', { ascending: false });

    const { data: paymentsData } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .order('payment_date', { ascending: false });

    setArchives(archivesData || []);
    setPayments(paymentsData || []);
    setLoading(false);
  };

  const handleDeleteArchive = async (archiveId: string) => {
    setConfirmDialog({
      open: true,
      title: 'Delete this archive? This action cannot be undone.',
      action: async () => {
        const { error } = await supabase
          .from('archives')
          .delete()
          .eq('id', archiveId);

        if (error) {
          notify('error', 'Delete Failed', 'Could not delete archive. Please try again.');
        } else {
          notify('success', 'Deleted', 'Archive deleted successfully.');
          loadData();
        }
        setConfirmDialog(null);
      },
      type: 'delete',
    });
  };

  const handleDeletePayment = async (paymentId: string) => {
    setConfirmDialog({
      open: true,
      title: 'Delete this payment? This action cannot be undone.',
      action: async () => {
        const { error } = await supabase
          .from('payments')
          .delete()
          .eq('id', paymentId);

        if (error) {
          notify('error', 'Delete Failed', 'Could not delete payment. Please try again.');
        } else {
          notify('success', 'Deleted', 'Payment deleted successfully.');
          loadData();
        }
        setConfirmDialog(null);
      },
      type: 'delete',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="space-y-4 text-center">
          {/* Spinner Animation */}
          <div className="flex justify-center">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-400">Loading payment history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col pb-24 px-4 sm:px-6 pt-6 mx-auto w-full max-w-7xl">
      {/* Header with Delete Button for Large Screens */}
      <div className="flex items-center justify-between gap-3 pb-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-2 rounded-xl">
            <ArchiveIcon className="w-5 h-5 text-emerald-500" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Payment History</h2>
        </div>

        {/* Delete All Button - Large Screens Only */}
        {((activeTab === 'payments' && payments.length > 0) || (activeTab === 'archives' && archives.length > 0)) && (
          <button
            onClick={() => setConfirmDialog({
              open: true,
              title: activeTab === 'payments' 
                ? `Delete all ${payments.length} payment records? This action cannot be undone.`
                : `Delete all ${archives.length} archive records? This action cannot be undone.`,
              action: async () => {
                if (activeTab === 'payments') {
                  for (const payment of payments) {
                    await supabase.from('payments').delete().eq('id', payment.id);
                  }
                  notify('success', 'Deleted', 'All payment records have been deleted.');
                } else {
                  for (const archive of archives) {
                    await supabase.from('archives').delete().eq('id', archive.id);
                  }
                  notify('success', 'Deleted', 'All archive records have been deleted.');
                }
                loadData();
                setConfirmDialog(null);
              },
              type: 'delete-all',
            })}
            className="hidden lg:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500/30 to-red-600/20 text-red-400 rounded-2xl text-sm font-semibold hover:from-red-500/40 hover:to-red-600/30 transition-all duration-300 border border-red-500/30 shadow-lg shadow-red-500/10 active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            Delete All
          </button>
        )}
      </div>

      {/* Top Toggle Buttons - All Screens */}
      <div className="flex gap-2 pb-6">
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-3 py-3 px-4 rounded-2xl font-medium transition-all duration-300 ${
            activeTab === 'payments'
              ? 'bg-gradient-to-r from-emerald-500/30 to-emerald-600/20 text-emerald-400 shadow-lg shadow-emerald-500/20 border border-emerald-500/30'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold">Payments</span>
            <span className="text-xs text-gray-500">{payments.length}</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('archives')}
          className={`flex items-center gap-3 py-3 px-4 rounded-2xl font-medium transition-all duration-300 ${
            activeTab === 'archives'
              ? 'bg-gradient-to-r from-emerald-500/30 to-emerald-600/20 text-emerald-400 shadow-lg shadow-emerald-500/20 border border-emerald-500/30'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
          }`}
        >
          <ArchiveIcon className="w-5 h-5" />
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold">Archives</span>
            <span className="text-xs text-gray-500">{archives.length}</span>
          </div>
        </button>
      </div>

      {/* Content Area - Full Height */}
      <div className="flex-1 overflow-y-auto mb-6 space-y-3">
        {/* Tab-based View - All Screens */}
        <div>

          {/* Payments Content */}
          {activeTab === 'payments' && (
        payments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No payment transactions yet
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment, idx) => {
              const cumulativeTotal = payments
                .slice(0, idx + 1)
                .reduce((sum, p) => sum + Number(p.total_paid), 0);

              return (
                <div
                  key={payment.id}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-white font-semibold">
                        ₹{Number(payment.total_paid).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(payment.payment_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(payment.payment_date).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeletePayment(payment.id)}
                      className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
                      title="Delete payment"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3 space-y-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Member Contributions</p>
                    {Object.values(payment.payment_breakdown).map((item: any, itemIdx: number) => (
                      <div key={itemIdx} className="flex justify-between text-sm">
                        <span className="text-gray-300">{item.name}</span>
                        <span className="text-emerald-400 font-medium">₹{Number(item.amount).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2">
                    <p className="text-xs text-emerald-400">
                      Cumulative paid: ₹{cumulativeTotal.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}

            <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-4 mt-4">
              <p className="text-sm text-emerald-300 font-semibold">
                Total Payments: ₹{payments.reduce((sum, p) => sum + Number(p.total_paid), 0).toFixed(2)}
              </p>
            </div>
          </div>
        )
            )}

          {/* Archives Content */}
          {activeTab === 'archives' && (
        archives.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No payment history yet
          </div>
        ) : (
        <div className="space-y-3">
          {archives.map((archive) => (
            <div
              key={archive.id}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden"
            >
              <div className="p-4 flex items-center justify-between">
                <button
                  onClick={() => setExpandedId(expandedId === archive.id ? null : archive.id)}
                  className="flex-1 text-left flex items-center justify-between hover:opacity-80 transition-opacity"
                >
                  <div>
                    <p className="text-white font-semibold">
                      {new Date(archive.archived_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-gray-400">{archive.meal_count} meals</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xl font-bold text-emerald-500">
                      ₹{Number(archive.total_amount).toFixed(2)}
                    </p>
                    {expandedId === archive.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>
                <button
                  onClick={() => handleDeleteArchive(archive.id)}
                  className="text-red-400 hover:text-red-300 transition-colors ml-4"
                  title="Delete archive"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {expandedId === archive.id && (
                <div className="border-t border-white/10 p-4 space-y-4">
                  {(() => {
                    try {
                      // Safely get snapshot_data with fallbacks
                      const snapshotData = archive.snapshot_data || { members: [], meals: [] };
                      const members = Array.isArray(snapshotData.members) ? snapshotData.members : [];
                      const meals = Array.isArray(snapshotData.meals) ? snapshotData.meals : [];

                      const previousArchive = archives.find(a => new Date(a.archived_at) < new Date(archive.archived_at));
                      const periodPayments = getPaymentsForPeriod(archive.archived_at, previousArchive?.archived_at);

                      return (
                        <>
                          {/* Previous Payments Section */}
                          {periodPayments.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs text-gray-400 uppercase tracking-wide">💳 Payments Before Archiving</p>
                              {periodPayments.map((payment, idx) => (
                                <div key={idx} className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 space-y-2">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="text-white font-semibold">₹{Number(payment.total_paid).toFixed(2)}</p>
                                      <p className="text-xs text-gray-400">
                                        {new Date(payment.payment_date).toLocaleDateString('en-IN', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric',
                                        })} 
                                        {' • '}
                                        {new Date(payment.payment_date).toLocaleTimeString('en-IN', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-xs space-y-1 border-t border-blue-500/20 pt-2">
                                    {Object.values(payment.payment_breakdown || {}).map((item: any, itemIdx: number) => (
                                      <div key={itemIdx} className="flex justify-between text-gray-300">
                                        <span>{item.name}</span>
                                        <span className="text-blue-300">₹{Number(item.amount).toFixed(2)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Total Amount Left to Pay at Time of Mark as Paid */}
                          {(() => {
                            const totalMealsAmount = members.reduce((sum: number, m: any) => sum + (m.total || 0), 0);
                            const totalPaidAmount = periodPayments.reduce((sum: number, p: Payment) => sum + Number(p.total_paid), 0);
                            const remainingAmount = totalMealsAmount - totalPaidAmount;

                            return (
                              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 space-y-3">
                                <p className="text-xs text-yellow-400 uppercase tracking-wide font-semibold">⏱️ Status at Time of Archiving</p>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-yellow-300 text-sm">Total Meals:</span>
                                    <span className="text-yellow-300 font-semibold">₹{totalMealsAmount.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-yellow-300 text-sm">Total Paid:</span>
                                    <span className="text-emerald-300 font-semibold">₹{totalPaidAmount.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between items-center bg-yellow-500/10 rounded p-2 border border-yellow-500/20">
                                    <span className="text-yellow-300 text-sm font-semibold">Amount Left to Pay:</span>
                                    <span className="text-2xl font-bold text-yellow-300">₹{remainingAmount.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Individual Member Payment Summary */}
                          {members.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs text-gray-400 uppercase tracking-wide">👥 Individual Member Details</p>
                              {members.map((member: any, idx: number) => {
                                // Find payments made by this member by name
                                const memberPaymentHistory: any[] = [];
                                
                                periodPayments.forEach((payment: Payment) => {
                                  const breakdown = payment.payment_breakdown || {};
                                  // Check if any breakdown item matches this member by name
                                  Object.values(breakdown).forEach((item: any) => {
                                    if (item.name === member.name) {
                                      memberPaymentHistory.push({
                                        amount: item.amount || 0,
                                        date: payment.payment_date,
                                      });
                                    }
                                  });
                                });

                                return (
                                  <div
                                    key={idx}
                                    className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="text-white text-sm font-semibold">{member.name}</p>
                                        <p className="text-xs text-gray-400">{member.count} meals • Total: ₹{Number(member.total || 0).toFixed(2)}</p>
                                      </div>
                                    </div>

                                    {/* Payments Made by This Member */}
                                    {memberPaymentHistory.length > 0 ? (
                                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 space-y-2">
                                        <p className="text-xs text-emerald-400 font-medium">Payments Made:</p>
                                        {memberPaymentHistory.map((payment, pIdx) => (
                                          <div key={pIdx} className="flex justify-between items-center text-sm">
                                            <span className="text-emerald-300">
                                              ₹{Number(payment.amount).toFixed(2)} on{' '}
                                              {new Date(payment.date).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                              })}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                              {new Date(payment.date).toLocaleTimeString('en-IN', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                              })}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-xs text-gray-500 italic">No payments made before archiving</div>
                                    )}

                                    {/* Amount Left to Pay */}
                                    <div className="flex justify-between items-center bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-2">
                                      <span className="text-yellow-300 text-sm font-semibold">Amount Left to Pay:</span>
                                      <span className="text-yellow-300 font-bold">₹{Number(member.remaining || 0).toFixed(2)}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Meals Details */}
                          {meals.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs text-gray-400 uppercase tracking-wide">🍽️ Meal Details</p>
                              <div className="max-h-60 overflow-y-auto space-y-2">
                                {meals.map((meal, idx) => (
                                  <div
                                    key={idx}
                                    className="flex justify-between items-center bg-white/5 rounded-xl p-3"
                                  >
                                    <div>
                                      <p className="text-white text-sm">{meal.member}</p>
                                      <p className="text-xs text-gray-400 capitalize">
                                        {meal.type} • {new Date(meal.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                      </p>
                                    </div>
                                    <p className="text-emerald-500 text-sm font-semibold">₹{Number(meal.price || 0).toFixed(2)}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                            <p className="text-xs text-emerald-400">
                              Locked price: ₹{Number(archive.price_at_archive).toFixed(2)} per meal
                            </p>
                          </div>
                        </>
                      );
                    } catch (error) {
                      console.error('Error rendering archive details:', error);
                      return (
                        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                          <p className="text-red-400 text-sm">Error loading archive details. Please try again later.</p>
                        </div>
                      );
                    }
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>
        )
            )}
        </div>
        {/* End of Tab-based View */}
      </div>

      {/* Bottom Delete All Button - Mobile & Tablet Only */}
      {((activeTab === 'payments' && payments.length > 0) || (activeTab === 'archives' && archives.length > 0) || ((payments.length > 0 || archives.length > 0))) && (
        <div className="lg:hidden flex justify-end pt-4 border-t border-white/10">
          <button
            onClick={() => setConfirmDialog({
              open: true,
              title: activeTab === 'payments' 
                ? `Delete all ${payments.length} payment records? This action cannot be undone.`
                : `Delete all ${archives.length} archive records? This action cannot be undone.`,
              action: async () => {
                if (activeTab === 'payments') {
                  for (const payment of payments) {
                    await supabase.from('payments').delete().eq('id', payment.id);
                  }
                  notify('success', 'Deleted', 'All payment records have been deleted.');
                } else {
                  for (const archive of archives) {
                    await supabase.from('archives').delete().eq('id', archive.id);
                  }
                  notify('success', 'Deleted', 'All archive records have been deleted.');
                }
                loadData();
                setConfirmDialog(null);
              },
              type: 'delete-all',
            })}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500/30 to-red-600/20 text-red-400 rounded-2xl text-sm font-semibold hover:from-red-500/40 hover:to-red-600/30 transition-all duration-300 border border-red-500/30 shadow-lg shadow-red-500/10 active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            Delete All
          </button>
        </div>
      )}
      {/* End of Main Layout */}

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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed top-6 right-6 z-40 space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start gap-3 p-4 rounded-2xl backdrop-blur-lg border animate-slide-in ${
              notification.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : notification.type === 'error'
                ? 'bg-red-500/10 border-red-500/30'
                : notification.type === 'warning'
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-blue-500/10 border-blue-500/30'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                notification.type === 'success'
                  ? 'bg-emerald-500 text-white'
                  : notification.type === 'error'
                  ? 'bg-red-500 text-white'
                  : notification.type === 'warning'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-blue-500 text-white'
              }`}
            >
              {notification.type === 'success' && <Check className="w-3 h-3" />}
              {notification.type === 'error' && <AlertCircle className="w-3 h-3" />}
            </div>
            <div className="flex-1">
              <p
                className={`font-semibold ${
                  notification.type === 'success'
                    ? 'text-emerald-300'
                    : notification.type === 'error'
                    ? 'text-red-300'
                    : notification.type === 'warning'
                    ? 'text-yellow-300'
                    : 'text-blue-300'
                }`}
              >
                {notification.title}
              </p>
              {notification.message && (
                <p className="text-sm text-gray-400">{notification.message}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(notification.id)}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
