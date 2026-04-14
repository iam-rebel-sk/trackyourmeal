import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { supabase, Member } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface MemberAmount {
  id: string;
  name: string;
  amount: number;
  totalDue: number;
  remaining: number;
}

interface PaymentDrawerProps {
  members: Member[];
  splits: { id: string; name: string; count: number; total: number; paid: number; remaining: number }[];
  onClose: () => void;
  onSuccess: () => void;
  notify: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
  onAutoArchive?: () => Promise<void>;
}

export default function PaymentDrawer({ members, splits, onClose, onSuccess, notify, onAutoArchive }: PaymentDrawerProps) {
  const { user } = useAuth();
  const [memberPayments, setMemberPayments] = useState<MemberAmount[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'individual' | 'combined'>('individual');
  const [overpaymentAlert, setOverpaymentAlert] = useState<{ show: boolean; memberId: string; memberName: string; remaining: number; amount: number } | null>(null);
  const [combinedAlert, setCombinedAlert] = useState<{ show: boolean; totalAmount: number; perMemberAmount: number; exceedingMembers: { name: string; remaining: number }[] } | null>(null);

  useEffect(() => {
    initializeMemberPayments();
  }, [members, splits]);

  const initializeMemberPayments = () => {
    const initialized = members.map((member) => {
      const split = splits.find((s) => s.id === member.id);
      return {
        id: member.id,
        name: member.name,
        amount: 0,
        totalDue: split?.total || 0,
        remaining: split?.remaining || 0,
      };
    });
    setMemberPayments(initialized);
  };

  const updateMemberAmount = (memberId: string, amount: number) => {
    const member = memberPayments.find((m) => m.id === memberId);
    if (member && amount > member.remaining && amount > 0) {
      // Show overpayment alert
      setOverpaymentAlert({
        show: true,
        memberId,
        memberName: member.name,
        remaining: member.remaining,
        amount: amount,
      });
      return;
    }
    
    setOverpaymentAlert(null);
    setMemberPayments((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, amount: Math.max(0, amount) } : m))
    );
  };

  const totalPaid = memberPayments.reduce((sum, m) => sum + m.amount, 0);

  const handlePayFull = (memberId: string) => {
    const member = memberPayments.find((m) => m.id === memberId);
    if (member) {
      updateMemberAmount(memberId, member.remaining);
    }
  };

  const handleCorrectAmount = (correctedAmount: number) => {
    if (overpaymentAlert && correctedAmount <= overpaymentAlert.remaining) {
      setMemberPayments((prev) =>
        prev.map((m) =>
          m.id === overpaymentAlert.memberId ? { ...m, amount: correctedAmount } : m
        )
      );
      setOverpaymentAlert(null);
    }
  };

  const handleCorrectedCombinedPayment = (correctedTotal: number) => {
    const membersWithDues = memberPayments.filter((m) => m.remaining > 0).length;
    if (membersWithDues > 0) {
      const perMember = correctedTotal / membersWithDues;
      const exceedingMembers = memberPayments
        .filter((m) => m.remaining > 0 && perMember > m.remaining);
      
      if (exceedingMembers.length === 0) {
        handleCombinedPayment(perMember);
        setCombinedAlert(null);
      }
    }
  };

  const handleCombinedPayment = (amount: number) => {
    setMemberPayments((prev) => prev.map((m) => ({ ...m, amount })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalPaid === 0) {
      notify('info', 'Payment Required', 'Please enter an amount to pay');
      return;
    }

    setLoading(true);

    try {
      const breakdown = memberPayments
        .filter((m) => m.amount > 0)
        .reduce(
          (acc, m) => {
            acc[m.id] = { name: m.name, amount: m.amount };
            return acc;
          },
          {} as { [key: string]: { name: string; amount: number } }
        );

      const { error } = await supabase.from('payments').insert({
        user_id: user!.id,
        total_paid: totalPaid,
        payment_breakdown: breakdown,
        description: `Payment for meals`,
      });

      if (error) throw error;

      // Check if all members have paid their full remaining amount
      const allFullyPaid = memberPayments.every((member) => {
        const amountPaid = member.amount || 0;
        const newRemaining = Math.max(0, member.remaining - amountPaid);
        return newRemaining === 0 || amountPaid === 0; // Either fully paid or no payment made
      });

      // Check if this payment covers all remaining amounts
      const totalRemaining = memberPayments.reduce((sum, m) => sum + m.remaining, 0);
      const totalAfterPayment = Math.max(0, totalRemaining - totalPaid);

      if (totalAfterPayment === 0 && totalPaid >= totalRemaining) {
        // Auto-archive when full payment is made
        notify('success', 'Full Payment Complete', 'All meals will be archived automatically!');
        onSuccess();
        onClose();
        
        if (onAutoArchive) {
          await onAutoArchive();
        }
      } else {
        notify('success', 'Payment Recorded', `₹${totalPaid.toFixed(2)} payment recorded successfully!`);
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Error recording payment:', err);
      notify('error', 'Payment Failed', 'Could not record payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end">
      <div className="w-full bg-neutral-900 rounded-t-3xl p-6 space-y-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white">Add Payment</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Payment Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPaymentMode('individual');
                  initializeMemberPayments();
                }}
                className={`py-3 px-4 rounded-2xl font-semibold transition-all ${
                  paymentMode === 'individual'
                    ? 'bg-emerald-500 text-black'
                    : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                }`}
              >
                Individual
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMode('combined');
                  initializeMemberPayments();
                }}
                className={`py-3 px-4 rounded-2xl font-semibold transition-all ${
                  paymentMode === 'combined'
                    ? 'bg-emerald-500 text-black'
                    : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                }`}
              >
                Combined
              </button>
            </div>
          </div>

          {paymentMode === 'individual' ? (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">Pay individual members</p>
              {memberPayments.map((member) => (
                <div key={member.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-gray-400">{member.name}</label>
                    <div className="text-xs text-gray-500 text-right">
                      <div>Total: ₹{member.totalDue.toFixed(2)}</div>
                      <div className="text-yellow-400">Remaining: ₹{member.remaining.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={member.amount || ''}
                      onChange={(e) => updateMemberAmount(member.id, parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => handlePayFull(member.id)}
                      className="bg-white/5 text-gray-400 px-3 py-2 rounded-2xl text-xs font-medium hover:bg-white/10 transition-colors"
                    >
                      Full Remaining
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">Distribute payment equally among all members with remaining dues</p>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Total amount to distribute"
                onChange={(e) => {
                  const amount = parseFloat(e.target.value) || 0;
                  const membersWithDues = memberPayments.filter((m) => m.remaining > 0);
                  if (membersWithDues.length > 0) {
                    const perMember = amount / membersWithDues.length;
                    
                    // Check for overpayment
                    const exceedingMembers = membersWithDues.filter((m) => perMember > m.remaining);
                    
                    if (exceedingMembers.length > 0) {
                      setCombinedAlert({
                        show: true,
                        totalAmount: amount,
                        perMemberAmount: perMember,
                        exceedingMembers: exceedingMembers.map(m => ({ name: m.name, remaining: m.remaining })),
                      });
                      return;
                    }
                    
                    setCombinedAlert(null);
                    handleCombinedPayment(perMember);
                  }
                }}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400">
                Will distribute equally to {memberPayments.filter((m) => m.remaining > 0).length} member(s) with remaining dues
              </p>
            </div>
          )}

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
            <p className="text-sm text-emerald-400">Total Payment: ₹{totalPaid.toFixed(2)}</p>
          </div>

          <button
            type="submit"
            disabled={loading || totalPaid === 0}
            className="w-full bg-emerald-500 text-black font-semibold py-4 px-6 rounded-2xl hover:bg-emerald-400 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Recording...' : 'Record Payment'}
          </button>
        </form>

        {/* Overpayment Alert Modal */}
        {overpaymentAlert?.show && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center px-4">
            <div className="bg-neutral-900 rounded-3xl p-6 max-w-sm border border-white/10 space-y-6">
              <div className="flex items-start gap-3">
                <div className="bg-red-500/10 p-3 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Amount Exceeds Due</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {overpaymentAlert.memberName}'s current due is ₹{overpaymentAlert.remaining.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 space-y-3">
                <p className="text-xs text-gray-400">You entered: <span className="text-red-400 font-semibold">₹{overpaymentAlert.amount.toFixed(2)}</span></p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={overpaymentAlert.remaining}
                    defaultValue={overpaymentAlert.remaining}
                    id="corrected-amount"
                    placeholder="0.00"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setOverpaymentAlert(null)}
                  className="flex-1 py-3 px-4 rounded-2xl font-semibold bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const input = document.getElementById('corrected-amount') as HTMLInputElement;
                    if (input) {
                      handleCorrectAmount(parseFloat(input.value) || 0);
                    }
                  }}
                  className="flex-1 py-3 px-4 rounded-2xl font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition-all"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Combined Payment Overpayment Alert Modal */}
        {combinedAlert?.show && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center px-4">
            <div className="bg-neutral-900 rounded-3xl p-6 max-w-sm border border-white/10 space-y-6">
              <div className="flex items-start gap-3">
                <div className="bg-red-500/10 p-3 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Amount Too High</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Per-member share exceeds limit for:
                  </p>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 space-y-3 max-h-[150px] overflow-y-auto">
                {combinedAlert.exceedingMembers.map((member, idx) => (
                  <div key={idx} className="text-sm">
                    <p className="text-gray-300"><span className="font-semibold">{member.name}</span> - Due: ₹{member.remaining.toFixed(2)}</p>
                    <p className="text-xs text-red-400">Your share: ₹{combinedAlert.perMemberAmount.toFixed(2)}</p>
                  </div>
                ))}
                <div className="border-t border-red-500/30 pt-3 mt-3">
                  <p className="text-xs text-gray-400">Total entered: <span className="text-red-400 font-semibold">₹{combinedAlert.totalAmount.toFixed(2)}</span></p>
                  <p className="text-xs text-gray-500 mt-1">Max total allowed: ₹{(combinedAlert.exceedingMembers[0]?.remaining * (memberPayments.filter(m => m.remaining > 0).length) || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs text-gray-400">Enter corrected total:</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  id="corrected-combined"
                  placeholder="0.00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCombinedAlert(null)}
                  className="flex-1 py-3 px-4 rounded-2xl font-semibold bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const input = document.getElementById('corrected-combined') as HTMLInputElement;
                    if (input) {
                      handleCorrectedCombinedPayment(parseFloat(input.value) || 0);
                    }
                  }}
                  className="flex-1 py-3 px-4 rounded-2xl font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition-all"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
