import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Trash2,
  Edit2,
  Plus,
  ArrowDownUp,
  X,
  Calendar,
  Layers,
  ChevronDown,
  Camera,
  Image as ImageIcon,
  RotateCcw
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { formatDateVietnamese, triggerHaptic } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import { Transaction, TransactionType } from '../types/expense';
import { ConfirmModal } from './ConfirmModal';

export const TransactionsView: React.FC = () => {
  const {
    transactions,
    selectedMonth,
    categories,
    wallets,
    deleteTransaction,
    setEditingTransaction,
    setIsAddModalOpen,
    getCategoryById,
    getWalletById,
    formatMoney,
  } = useExpense();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all'); // 'all', 'expense', 'income', 'transfer'
  const [filterWallet, setFilterWallet] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [dateRangePreset, setDateRangePreset] = useState<'month' | 'today' | '7days' | 'last_month' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Receipt Preview Lightbox Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    // Compute 7 days ago
    const d7 = new Date();
    d7.setDate(d7.getDate() - 7);
    const d7Str = d7.toISOString().split('T')[0];

    // Compute last month
    const curYear = parseInt(selectedMonth.split('-')[0]);
    const curMonth = parseInt(selectedMonth.split('-')[1]);
    let lastM = curMonth - 1;
    let lastY = curYear;
    if (lastM === 0) {
      lastM = 12;
      lastY -= 1;
    }
    const lastMonthStr = `${lastY}-${String(lastM).padStart(2, '0')}`;

    return transactions.filter(t => {
      // Date filter
      if (dateRangePreset === 'month') {
        if (!t.date.startsWith(selectedMonth)) return false;
      } else if (dateRangePreset === 'today') {
        if (t.date !== todayStr) return false;
      } else if (dateRangePreset === '7days') {
        if (t.date < d7Str || t.date > todayStr) return false;
      } else if (dateRangePreset === 'last_month') {
        if (!t.date.startsWith(lastMonthStr)) return false;
      } else if (dateRangePreset === 'custom') {
        if (customStartDate && t.date < customStartDate) return false;
        if (customEndDate && t.date > customEndDate) return false;
      }

      // Type filter
      if (filterType !== 'all' && t.type !== filterType) return false;

      // Wallet filter
      if (filterWallet !== 'all' && t.walletId !== filterWallet && t.toWalletId !== filterWallet) return false;

      // Category filter
      if (filterCategory !== 'all' && t.categoryId !== filterCategory) return false;

      // Amount filter
      if (minAmount && t.amount < parseFloat(minAmount)) return false;
      if (maxAmount && t.amount > parseFloat(maxAmount)) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const noteMatch = (t.note || '').toLowerCase().includes(term);
        const cat = getCategoryById(t.categoryId);
        const catMatch = cat?.name.toLowerCase().includes(term);
        const wallet = getWalletById(t.walletId);
        const walletMatch = wallet?.name.toLowerCase().includes(term);
        const amountMatch = t.amount.toString().includes(term);
        if (!noteMatch && !catMatch && !walletMatch && !amountMatch) return false;
      }

      return true;
    });
  }, [
    transactions,
    selectedMonth,
    dateRangePreset,
    customStartDate,
    customEndDate,
    filterType,
    filterWallet,
    filterCategory,
    minAmount,
    maxAmount,
    searchTerm,
    getCategoryById,
    getWalletById,
  ]);

  // Group by date
  const groupedTransactions = useMemo(() => {
    const groups: { [date: string]: Transaction[] } = {};
    filteredTransactions.forEach(t => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });

    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    return sortedDates.map(date => ({
      date,
      items: groups[date],
      totalExpense: groups[date].filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      totalIncome: groups[date].filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    }));
  }, [filteredTransactions]);

  const resetFilters = () => {
    setFilterType('all');
    setFilterWallet('all');
    setFilterCategory('all');
    setDateRangePreset('month');
    setCustomStartDate('');
    setCustomEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setSearchTerm('');
    triggerHaptic('light');
  };

  const hasActiveFilters =
    filterType !== 'all' ||
    filterWallet !== 'all' ||
    filterCategory !== 'all' ||
    dateRangePreset !== 'month' ||
    !!minAmount ||
    !!maxAmount;

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingTxId(id);
  };

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsAddModalOpen(true);
  };

  return (
    <div className="flex-1 pb-10 space-y-3">
      {/* Search & Filter Header */}
      <div className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-md px-4 pt-3 pb-2 space-y-2 border-b border-slate-200/80">
        {/* Search Bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl px-3 py-2 flex items-center gap-2 shadow-2xs">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Tìm theo ghi chú, danh mục, số tiền..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full text-xs text-slate-800 bg-transparent focus:outline-hidden"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              setShowFilters(!showFilters);
            }}
            className={`p-2.5 rounded-2xl border transition relative shrink-0 ${
              showFilters || hasActiveFilters
                ? 'bg-teal-600 border-teal-600 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
            )}
          </button>
        </div>

        {/* Quick Filter Pill Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'expense', label: 'Khoản Chi' },
            { id: 'income', label: 'Khoản Thu' },
            { id: 'transfer', label: 'Chuyển Khoản' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('light');
                setFilterType(tab.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                filterType === tab.id
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Advanced Filter Drawer */}
        {showFilters && (
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3 shadow-sm animate-in fade-in-50 duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Bộ lọc nâng cao</span>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-[11px] text-teal-700 font-semibold hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Đặt lại bộ lọc
                </button>
              )}
            </div>

            {/* Time Presets */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                Khoảng thời gian
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'month', label: `Tháng ${selectedMonth}` },
                  { id: 'today', label: 'Hôm nay' },
                  { id: '7days', label: '7 ngày qua' },
                  { id: 'last_month', label: 'Tháng trước' },
                  { id: 'custom', label: 'Tùy chọn ngày' },
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setDateRangePreset(p.id as any)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold text-center border transition ${
                      dateRangePreset === p.id
                        ? 'bg-teal-50 border-teal-600 text-teal-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Range if chosen */}
            {dateRangePreset === 'custom' && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Từ ngày</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={e => setCustomStartDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Đến ngày</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={e => setCustomEndDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {/* Wallet Filter */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Ví tài khoản</label>
                <select
                  value={filterWallet}
                  onChange={e => setFilterWallet(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
                >
                  <option value="all">Tất cả các ví</option>
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Danh mục</label>
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
                >
                  <option value="all">Tất cả danh mục</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.type === 'expense' ? '🔴' : '🟢'} {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Amount range */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Khoảng số tiền (VNĐ)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Tối thiểu..."
                  value={minAmount}
                  onChange={e => setMinAmount(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-mono"
                />
                <input
                  type="number"
                  placeholder="Tối đa..."
                  value={maxAmount}
                  onChange={e => setMaxAmount(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-mono"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction List by Day */}
      <div className="px-4 space-y-4">
        {groupedTransactions.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500">
            <Layers className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold">Không tìm thấy giao dịch nào</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchTerm || hasActiveFilters
                ? 'Hãy thử thay đổi điều kiện tìm kiếm hoặc bộ lọc.'
                : 'Nhấn nút dấu (+) để ghi chép chi tiêu đầu tiên!'}
            </p>
            <button
              onClick={() => {
                setEditingTransaction(null);
                setIsAddModalOpen(true);
              }}
              className="mt-4 px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl shadow inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Thêm giao dịch
            </button>
          </div>
        ) : (
          groupedTransactions.map(group => (
            <div key={group.date} className="space-y-1.5">
              {/* Daily Group Header */}
              <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-medium select-none">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-bold text-slate-700">{formatDateVietnamese(group.date)}</span>
                  <span className="text-[11px] text-slate-400">({group.date})</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  {group.totalIncome > 0 && (
                    <span className="text-emerald-600">+{formatMoney(group.totalIncome)}</span>
                  )}
                  {group.totalExpense > 0 && (
                    <span className="text-slate-700">-{formatMoney(group.totalExpense)}</span>
                  )}
                </div>
              </div>

              {/* Items Card */}
              <div className="bg-white rounded-2xl divide-y divide-slate-100 shadow-xs border border-slate-200 overflow-hidden">
                {group.items.map(tx => {
                  const cat = getCategoryById(tx.categoryId);
                  const wallet = getWalletById(tx.walletId);
                  const toWallet = tx.toWalletId ? getWalletById(tx.toWalletId) : null;
                  const isExpense = tx.type === 'expense';
                  const isIncome = tx.type === 'income';

                  return (
                    <div
                      key={tx.id}
                      onClick={() => handleEdit(tx)}
                      className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition active:bg-slate-100 group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                            isExpense
                              ? cat?.bgColor || 'bg-orange-50 text-orange-600'
                              : isIncome
                              ? cat?.bgColor || 'bg-emerald-50 text-emerald-600'
                              : 'bg-blue-50 text-blue-600'
                          }`}
                        >
                          <CategoryIcon
                            name={tx.type === 'transfer' ? 'ArrowRightLeft' : cat?.icon || 'Coins'}
                            size={18}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-800 truncate flex items-center gap-1.5">
                            <span className="truncate">
                              {tx.note || cat?.name || (tx.type === 'transfer' ? 'Chuyển khoản' : 'Giao dịch')}
                            </span>
                            {tx.recurringId && (
                              <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 text-[9px] font-extrabold rounded-sm uppercase shrink-0">
                                Định kỳ
                              </span>
                            )}
                            {tx.receiptImage && (
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  setPreviewImage(tx.receiptImage || null);
                                }}
                                className="p-0.5 rounded bg-slate-100 hover:bg-teal-100 text-teal-700 transition"
                                title="Xem ảnh hóa đơn"
                              >
                                <Camera className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            {cat && <span className="text-slate-600 font-medium">{cat.name}</span>}
                            <span>•</span>
                            <span className="truncate">
                              {wallet?.name}
                              {toWallet ? ` → ${toWallet.name}` : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right side: Amount and actions */}
                      <div className="flex items-center gap-2 shrink-0 pl-2">
                        <div className="text-right">
                          <div
                            className={`text-xs font-bold font-mono ${
                              isExpense
                                ? 'text-slate-800'
                                : isIncome
                                ? 'text-emerald-600'
                                : 'text-blue-600'
                            }`}
                          >
                            {isExpense
                              ? `-${formatMoney(tx.amount)}`
                              : isIncome
                              ? `+${formatMoney(tx.amount)}`
                              : formatMoney(tx.amount)}
                          </div>
                          {tx.time && <div className="text-[10px] text-slate-400 font-mono">{tx.time}</div>}
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={e => handleDelete(e, tx.id)}
                          className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                          title="Xóa giao dịch"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Receipt Image Lightbox Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 cursor-pointer"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="relative max-w-md w-full bg-slate-900 rounded-3xl p-3 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between text-white pb-2 border-b border-slate-800">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-teal-400" />
                Ảnh hóa đơn đính kèm
              </span>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1 text-slate-400 hover:text-white rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-2 flex justify-center">
              <img
                src={previewImage}
                alt="Hóa đơn"
                className="max-h-[75vh] w-auto object-contain rounded-2xl"
              />
            </div>
          </div>
        </div>
      )}
      {/* Confirm Delete Transaction Modal */}
      <ConfirmModal
        isOpen={!!deletingTxId}
        title="Xóa giao dịch"
        message="Bạn có chắc chắn muốn xóa giao dịch này? Số dư ví sẽ được tự động hoàn lại tương ứng."
        confirmText="Xóa giao dịch"
        type="danger"
        onConfirm={() => {
          if (deletingTxId) {
            deleteTransaction(deletingTxId);
            setDeletingTxId(null);
          }
        }}
        onCancel={() => setDeletingTxId(null)}
      />
    </div>
  );
};
