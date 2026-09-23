import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Users,
  Utensils,
  Receipt,
  Percent,
  CreditCard,
  Building2,
  Calendar,
  Check,
  Sparkles,
  ChevronDown,
  Info,
  Upload,
  Image as ImageIcon,
  QrCode,
  RotateCcw,
} from 'lucide-react';
import {
  SplitBill,
  SplitMethod,
  SplitBillMember,
  SplitBillItem,
  BankAccountInfo,
} from '../types/expense';
import { VIETNAM_BANKS, MEMBER_AVATAR_COLORS } from '../utils/vietqr';
import { useExpense } from '../context/ExpenseContext';
import { triggerHaptic } from '../utils/formatters';

interface SplitBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingBill?: SplitBill | null;
}

export const SplitBillModal: React.FC<SplitBillModalProps> = ({
  isOpen,
  onClose,
  editingBill,
}) => {
  const { addSplitBill, updateSplitBill, wallets, formatMoney } = useExpense();

  // Basic info
  const [title, setTitle] = useState(editingBill?.title || '');
  const [date, setDate] = useState(
    editingBill?.date || new Date().toISOString().split('T')[0]
  );
  const [splitMethod, setSplitMethod] = useState<SplitMethod>(
    editingBill?.splitMethod || 'equal'
  );
  const [note, setNote] = useState(editingBill?.note || '');
  const [roundTo1k, setRoundTo1k] = useState(true);

  // Financial fields
  const [totalAmountInput, setTotalAmountInput] = useState(
    editingBill ? editingBill.totalAmount.toString() : ''
  );
  const [taxPercent, setTaxPercent] = useState<number>(editingBill?.taxPercent || 0);
  const [tipAmountInput, setTipAmountInput] = useState(
    editingBill?.tipAmount ? editingBill.tipAmount.toString() : ''
  );
  const [discountAmountInput, setDiscountAmountInput] = useState(
    editingBill?.discountAmount ? editingBill.discountAmount.toString() : ''
  );

  // Members state
  const [members, setMembers] = useState<SplitBillMember[]>(
    editingBill?.members || [
      {
        id: 'mem_me',
        name: 'Tôi',
        amount: 0,
        isPaid: true,
        isPayer: true,
        avatarColor: MEMBER_AVATAR_COLORS[0],
      },
      {
        id: 'mem_2',
        name: 'Bạn 1',
        amount: 0,
        isPaid: false,
        avatarColor: MEMBER_AVATAR_COLORS[1],
      },
      {
        id: 'mem_3',
        name: 'Bạn 2',
        amount: 0,
        isPaid: false,
        avatarColor: MEMBER_AVATAR_COLORS[2],
      },
    ]
  );

  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');

  // Itemized state (theo từng món)
  const [items, setItems] = useState<SplitBillItem[]>(
    editingBill?.items || [
      {
        id: 'item_1',
        name: 'Món ăn chính',
        price: 0,
        assignedMemberIds: ['mem_me', 'mem_2', 'mem_3'],
      },
    ]
  );
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  // Payer & Wallet
  const [payerMemberId, setPayerMemberId] = useState(
    editingBill?.payerMemberId || 'mem_me'
  );
  const [payerWalletId, setPayerWalletId] = useState(
    editingBill?.payerWalletId || wallets[0]?.id || ''
  );

  // Bank Info for VietQR
  const [bankCode, setBankCode] = useState(
    editingBill?.bankInfo?.bankCode || 'VCB'
  );
  const [accountNo, setAccountNo] = useState(
    editingBill?.bankInfo?.accountNo || ''
  );
  const [accountName, setAccountName] = useState(
    editingBill?.bankInfo?.accountName || ''
  );
  const [customQrImage, setCustomQrImage] = useState<string | undefined>(
    editingBill?.bankInfo?.customQrImage
  );
  const [qrType, setQrType] = useState<'vietqr' | 'custom'>(
    editingBill?.bankInfo?.customQrImage ? 'custom' : 'vietqr'
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-fill bank info from selected payer wallet if available
  const handleSelectWallet = (wId: string) => {
    setPayerWalletId(wId);
    const chosen = wallets.find(w => w.id === wId);
    if (chosen) {
      if (chosen.customQrImage) {
        setCustomQrImage(chosen.customQrImage);
        setQrType('custom');
      }
      if (chosen.accountNumber && !accountNo) {
        setAccountNo(chosen.accountNumber);
      }
      if (chosen.bankName) {
        const matchedBank = VIETNAM_BANKS.find(
          b => b.shortName.toLowerCase() === chosen.bankName?.toLowerCase() ||
               chosen.name.toLowerCase().includes(b.shortName.toLowerCase())
        );
        if (matchedBank) {
          setBankCode(matchedBank.code);
        }
      }
    }
  };

  const handleQrUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh (PNG, JPG, WebP)!');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước ảnh không được vượt quá 5MB!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setCustomQrImage(base64);
      setQrType('custom');
      triggerHaptic('success');
    };
    reader.readAsDataURL(file);
  };

  // Calculation helpers
  const baseTotal = useMemo(() => {
    if (splitMethod === 'itemized') {
      return items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    }
    return Number(totalAmountInput) || 0;
  }, [splitMethod, items, totalAmountInput]);

  const taxAmount = useMemo(() => (baseTotal * (taxPercent || 0)) / 100, [baseTotal, taxPercent]);
  const tipAmount = useMemo(() => Number(tipAmountInput) || 0, [tipAmountInput]);
  const discountAmount = useMemo(() => Number(discountAmountInput) || 0, [discountAmountInput]);

  const grandTotal = useMemo(() => {
    return Math.max(0, baseTotal + taxAmount + tipAmount - discountAmount);
  }, [baseTotal, taxAmount, tipAmount, discountAmount]);

  // Compute calculated members
  const calculatedMembers: SplitBillMember[] = useMemo(() => {
    if (members.length === 0) return [];

    if (splitMethod === 'equal') {
      const share = grandTotal / members.length;
      const finalShare = roundTo1k ? Math.round(share / 1000) * 1000 : Math.round(share);
      return members.map(m => ({
        ...m,
        amount: finalShare,
        isPayer: m.id === payerMemberId,
      }));
    }

    if (splitMethod === 'itemized') {
      // Calculate per member from shared items
      const memberSubtotals: Record<string, number> = {};
      members.forEach(m => (memberSubtotals[m.id] = 0));

      items.forEach(item => {
        const itemPrice = Number(item.price) || 0;
        const validAssigned = item.assignedMemberIds.filter(id =>
          members.some(m => m.id === id)
        );
        if (validAssigned.length > 0) {
          const splitItemPrice = itemPrice / validAssigned.length;
          validAssigned.forEach(mId => {
            memberSubtotals[mId] = (memberSubtotals[mId] || 0) + splitItemPrice;
          });
        }
      });

      // Factor in surcharge / tax / tip ratio
      const ratio = baseTotal > 0 ? grandTotal / baseTotal : 1;

      return members.map(m => {
        const subtotal = memberSubtotals[m.id] || 0;
        const totalShare = subtotal * ratio;
        const finalShare = roundTo1k ? Math.round(totalShare / 1000) * 1000 : Math.round(totalShare);
        return {
          ...m,
          amount: finalShare,
          isPayer: m.id === payerMemberId,
        };
      });
    }

    if (splitMethod === 'percentage') {
      return members.map(m => {
        const pct = m.customPercentage || 100 / members.length;
        const share = (grandTotal * pct) / 100;
        const finalShare = roundTo1k ? Math.round(share / 1000) * 1000 : Math.round(share);
        return {
          ...m,
          amount: finalShare,
          isPayer: m.id === payerMemberId,
        };
      });
    }

    // Default custom
    return members.map(m => ({
      ...m,
      isPayer: m.id === payerMemberId,
    }));
  }, [members, splitMethod, grandTotal, roundTo1k, payerMemberId, items, baseTotal]);

  if (!isOpen) return null;

  // Add member handler
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const newId = `mem_${Date.now()}`;
    const nextColorIndex = members.length % MEMBER_AVATAR_COLORS.length;
    const newMember: SplitBillMember = {
      id: newId,
      name: newMemberName.trim(),
      phoneNumber: newMemberPhone.trim() || undefined,
      amount: 0,
      isPaid: false,
      avatarColor: MEMBER_AVATAR_COLORS[nextColorIndex],
    };

    setMembers(prev => [...prev, newMember]);
    setNewMemberName('');
    setNewMemberPhone('');
    triggerHaptic('light');
  };

  const handleRemoveMember = (id: string) => {
    if (members.length <= 1) return;
    setMembers(prev => prev.filter(m => m.id !== id));
    if (payerMemberId === id) {
      const remaining = members.filter(m => m.id !== id);
      if (remaining[0]) setPayerMemberId(remaining[0].id);
    }
    // Clean from items
    setItems(prev =>
      prev.map(item => ({
        ...item,
        assignedMemberIds: item.assignedMemberIds.filter(mId => mId !== id),
      }))
    );
    triggerHaptic('light');
  };

  // Add item handler (for itemized)
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice) return;

    const newItem: SplitBillItem = {
      id: `item_${Date.now()}`,
      name: newItemName.trim(),
      price: Number(newItemPrice) || 0,
      assignedMemberIds: members.map(m => m.id), // default all members
    };

    setItems(prev => [...prev, newItem]);
    setNewItemName('');
    setNewItemPrice('');
    triggerHaptic('light');
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    triggerHaptic('light');
  };

  const toggleMemberForItem = (itemId: string, memberId: string) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item;
        const exists = item.assignedMemberIds.includes(memberId);
        return {
          ...item,
          assignedMemberIds: exists
            ? item.assignedMemberIds.filter(id => id !== memberId)
            : [...item.assignedMemberIds, memberId],
        };
      })
    );
    triggerHaptic('light');
  };

  // Quick title templates
  const quickTitles = ['Ăn lẩu nướng', 'Cà phê & Trà sữa', 'Ăn trưa công ty', 'Tiệc sinh nhật', 'Du lịch cuối tuần'];

  // Save handler
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Vui lòng nhập tên hóa đơn');
      return;
    }

    if (calculatedMembers.length === 0) {
      alert('Vui lòng thêm ít nhất 1 thành viên');
      return;
    }

    const selectedBank = VIETNAM_BANKS.find(b => b.code === bankCode);

    const bankInfo: BankAccountInfo | undefined = (accountNo.trim() || customQrImage)
      ? {
          bankCode: bankCode || 'VCB',
          bankName: selectedBank?.shortName || bankCode,
          accountNo: accountNo.trim(),
          accountName: accountName.trim().toUpperCase(),
          customQrImage: customQrImage || undefined,
        }
      : undefined;

    const billPayload: Omit<SplitBill, 'id' | 'createdAt'> = {
      title: title.trim(),
      date,
      totalAmount: grandTotal,
      tipAmount: tipAmount > 0 ? tipAmount : undefined,
      taxPercent: taxPercent > 0 ? taxPercent : undefined,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      splitMethod,
      members: calculatedMembers,
      items: splitMethod === 'itemized' ? items : undefined,
      payerMemberId,
      payerWalletId,
      bankInfo,
      note: note.trim() || undefined,
      status: calculatedMembers.every(m => m.isPaid || m.isPayer) ? 'settled' : 'pending',
    };

    if (editingBill) {
      updateSplitBill({
        ...billPayload,
        id: editingBill.id,
        createdAt: editingBill.createdAt,
      });
    } else {
      addSplitBill(billPayload);
    }

    triggerHaptic('success');
    onClose();
  };

  const selectedBankObj = VIETNAM_BANKS.find(b => b.code === bankCode);

  return (
    <div
      id="split-bill-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="split-bill-modal-container"
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100 dark:border-slate-800"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {editingBill ? 'Chỉnh Sửa Hóa Đơn Chia Tiền' : 'Tạo Bill Chia Tiền & VietQR'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tự động chia tiền, tạo mã VietQR thanh toán 1 chạm
              </p>
            </div>
          </div>
          <button
            id="close-split-bill-modal-btn"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Bill Title & Date */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Tên sự kiện / Hóa đơn *
              </label>
              <input
                id="split-bill-title-input"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ví dụ: Ăn lẩu Haidilao cuối tuần, Cà phê T2..."
                required
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Quick Title Chips */}
            <div className="flex flex-wrap gap-1.5">
              {quickTitles.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTitle(t)}
                  className="px-2.5 py-1 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Ngày thanh toán
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    id="split-bill-date-input"
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Ví đã chi tiền
                </label>
                <select
                  id="split-bill-wallet-select"
                  value={payerWalletId}
                  onChange={e => handleSelectWallet(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatMoney(w.balance)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Split Method Tabs */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Phương thức chia tiền
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
              <button
                type="button"
                onClick={() => setSplitMethod('equal')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  splitMethod === 'equal'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Chia đều</span>
              </button>
              <button
                type="button"
                onClick={() => setSplitMethod('itemized')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  splitMethod === 'itemized'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Theo món</span>
              </button>
              <button
                type="button"
                onClick={() => setSplitMethod('percentage')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  splitMethod === 'percentage'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                <Percent className="w-3.5 h-3.5" />
                <span>Tỷ lệ %</span>
              </button>
            </div>
          </div>

          {/* Amount inputs depending on method */}
          {splitMethod !== 'itemized' ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tổng tiền hóa đơn (VNĐ) *
                </label>
                <input
                  id="split-bill-total-amount-input"
                  type="number"
                  value={totalAmountInput}
                  onChange={e => setTotalAmountInput(e.target.value)}
                  placeholder="0"
                  required
                  min="0"
                  step="1000"
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-lg font-black text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Surcharges (VAT, Tip, Discount) */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    VAT (%)
                  </label>
                  <input
                    type="number"
                    value={taxPercent || ''}
                    onChange={e => setTaxPercent(Number(e.target.value) || 0)}
                    placeholder="8%"
                    className="w-full px-2.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Phụ thu / Tip
                  </label>
                  <input
                    type="number"
                    value={tipAmountInput}
                    onChange={e => setTipAmountInput(e.target.value)}
                    placeholder="0đ"
                    className="w-full px-2.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Giảm giá (Voucher)
                  </label>
                  <input
                    type="number"
                    value={discountAmountInput}
                    onChange={e => setDiscountAmountInput(e.target.value)}
                    placeholder="0đ"
                    className="w-full px-2.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={roundTo1k}
                    onChange={e => setRoundTo1k(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Làm tròn tiền mỗi người (1.000đ)</span>
                </label>
                <div className="text-right">
                  <span className="text-xs text-slate-500">Tổng thanh toán: </span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatMoney(grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Itemized section */
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Danh sách món ăn & Đồ uống
                </h3>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {formatMoney(baseTotal)}
                </span>
              </div>

              {/* Add item mini form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  placeholder="Tên món (vd: Lẩu bò, Bia x10...)"
                  className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                />
                <input
                  type="number"
                  value={newItemPrice}
                  onChange={e => setNewItemPrice(e.target.value)}
                  placeholder="Giá (VNĐ)"
                  className="w-28 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                />
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {items.map(item => (
                  <div
                    key={item.id}
                    className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/70 dark:border-slate-700/70 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {item.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {formatMoney(item.price)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Member chips for this item */}
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 self-center">Ai dùng:</span>
                      {members.map(m => {
                        const isAssigned = item.assignedMemberIds.includes(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => toggleMemberForItem(item.id, m.id)}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors ${
                              isAssigned
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-400 border border-transparent'
                            }`}
                          >
                            {m.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pro-rated VAT & Tip */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    VAT (%)
                  </label>
                  <input
                    type="number"
                    value={taxPercent || ''}
                    onChange={e => setTaxPercent(Number(e.target.value) || 0)}
                    placeholder="8%"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Phụ thu / Tip
                  </label>
                  <input
                    type="number"
                    value={tipAmountInput}
                    onChange={e => setTipAmountInput(e.target.value)}
                    placeholder="0đ"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Members List & Allocation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Thành viên tham gia ({members.length})
              </label>
              <span className="text-xs text-slate-500">Chọn 👑 người đã thanh toán</span>
            </div>

            {/* Members items */}
            <div className="space-y-2">
              {calculatedMembers.map(m => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                      style={{ backgroundColor: m.avatarColor || '#0f766e' }}
                    >
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {m.name}
                        </span>
                        {m.id === payerMemberId && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                            👑 Người trả bill
                          </span>
                        )}
                      </div>
                      {m.phoneNumber && (
                        <p className="text-[10px] text-slate-400 font-mono">{m.phoneNumber}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* Amount share */}
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {formatMoney(m.amount)}
                      </div>
                      <button
                        type="button"
                        onClick={() => setPayerMemberId(m.id)}
                        className={`text-[10px] font-medium hover:underline ${
                          m.id === payerMemberId
                            ? 'text-amber-600 font-semibold'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {m.id === payerMemberId ? 'Đã thanh toán trước' : 'Đặt làm người trả'}
                      </button>
                    </div>

                    {members.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add member inputs */}
            <div className="flex gap-2 pt-1">
              <input
                id="new-member-name-input"
                type="text"
                value={newMemberName}
                onChange={e => setNewMemberName(e.target.value)}
                placeholder="Tên thành viên mới..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              />
              <input
                id="new-member-phone-input"
                type="tel"
                value={newMemberPhone}
                onChange={e => setNewMemberPhone(e.target.value)}
                placeholder="Số ĐT (tùy chọn)"
                className="w-32 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              />
              <button
                id="add-member-btn"
                type="button"
                onClick={handleAddMember}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm
              </button>
            </div>
          </div>

          {/* VietQR Bank Setup Section */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent border border-emerald-200/60 dark:border-emerald-800/40 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Mã QR Nhận Tiền
                </h3>
              </div>
              {/* Toggle VietQR vs Tự upload ảnh QR */}
              <div className="flex items-center p-0.5 bg-slate-200/70 dark:bg-slate-800 rounded-xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setQrType('vietqr')}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    qrType === 'vietqr'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  <QrCode className="w-3 h-3" />
                  <span>Tự động (VietQR)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQrType('custom')}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    qrType === 'custom'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  <span>Tự tải ảnh QR</span>
                </button>
              </div>
            </div>

            {/* TAB 1: AUTO VIETQR */}
            {qrType === 'vietqr' && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Bank selector */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Ngân hàng thụ hưởng
                    </label>
                    <select
                      id="vietqr-bank-select"
                      value={bankCode}
                      onChange={e => setBankCode(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {VIETNAM_BANKS.map(b => (
                        <option key={b.code} value={b.code}>
                          {b.shortName} - {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Account Number */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Số tài khoản nhận tiền
                    </label>
                    <input
                      id="vietqr-account-no-input"
                      type="text"
                      value={accountNo}
                      onChange={e => setAccountNo(e.target.value)}
                      placeholder="Ví dụ: 0071001234567"
                      className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Account Owner Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Tên chủ tài khoản (In hoa không dấu)
                  </label>
                  <input
                    id="vietqr-account-name-input"
                    type="text"
                    value={accountName}
                    onChange={e => setAccountName(e.target.value.toUpperCase())}
                    placeholder="Ví dụ: NGUYEN VAN A"
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: CUSTOM UPLOAD QR */}
            {qrType === 'custom' && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleQrUpload(file);
                  }}
                />

                {customQrImage ? (
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 flex items-center justify-center">
                        <img
                          src={customQrImage}
                          alt="Mã QR đã tải lên"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                          <span>Đã tải lên mã QR riêng</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Mã QR này sẽ hiển thị khi bạn bè quét thanh toán.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-600 text-xs font-semibold"
                        title="Đổi ảnh khác"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomQrImage(undefined);
                          triggerHaptic('light');
                        }}
                        className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 text-xs font-semibold"
                        title="Xóa mã QR"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-5 border-2 border-dashed border-emerald-300 dark:border-emerald-700/60 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer flex flex-col items-center justify-center text-center group"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Chạm để tải ảnh mã QR nhận tiền của bạn
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Hỗ trợ chụp màn hình QR từ MoMo, ZaloPay, MBBank, Techcombank, VCB...
                    </p>
                  </div>
                )}

                {/* Optional Account Owner / Bank note alongside custom QR */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Tên chủ tài khoản (hiển thị kèm)
                    </label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={e => setAccountName(e.target.value.toUpperCase())}
                      placeholder="VD: NGUYEN VAN A"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold uppercase text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Số TK / SĐT Ví (tùy chọn)
                    </label>
                    <input
                      type="text"
                      value={accountNo}
                      onChange={e => setAccountNo(e.target.value)}
                      placeholder="VD: 0988777666"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Ghi chú thêm
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ghi chú chi tiết cho cuộc hẹn..."
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              id="save-split-bill-submit-btn"
              type="submit"
              className="flex-2 py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{editingBill ? 'Cập Nhật Hóa Đơn' : 'Lưu & Tạo Mã VietQR'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
