import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Check, Sparkles, AlertCircle } from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { CategoryIcon } from './CategoryIcon';
import { Category, TransactionType } from '../types/expense';
import { triggerHaptic } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_ICONS = [
  'UtensilsCrossed',
  'Coffee',
  'ShoppingBag',
  'Car',
  'Receipt',
  'Home',
  'Gamepad2',
  'HeartPulse',
  'GraduationCap',
  'Gift',
  'Briefcase',
  'Award',
  'Laptop',
  'TrendingUp',
  'Coins',
  'CreditCard',
  'Plane',
  'Shirt',
  'Film',
  'Dumbbell',
  'Sparkles',
  'BookOpen',
  'Baby',
  'Wrench',
  'MoreHorizontal',
];

const AVAILABLE_COLORS = [
  '#ea580c', // Orange
  '#b45309', // Amber
  '#db2777', // Pink
  '#2563eb', // Blue
  '#ca8a04', // Yellow
  '#7c3aed', // Purple
  '#0891b2', // Cyan
  '#dc2626', // Red
  '#059669', // Emerald
  '#e11d48', // Rose
  '#4f46e5', // Indigo
  '#0d9488', // Teal
  '#475569', // Slate
  '#0284c7', // Sky
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ isOpen, onClose }) => {
  const { categories, addCategory, updateCategory, deleteCategory } = useExpense();
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  // Editing or adding
  const [isEditing, setIsEditing] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('UtensilsCrossed');
  const [catColor, setCatColor] = useState('#ea580c');
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredCategories = categories.filter(c => c.type === activeTab);

  const startAddCategory = () => {
    triggerHaptic('light');
    setIsEditing(true);
    setEditingCatId(null);
    setCatName('');
    setCatIcon(activeTab === 'expense' ? 'ShoppingBag' : 'Briefcase');
    setCatColor(activeTab === 'expense' ? '#ea580c' : '#059669');
  };

  const startEditCategory = (cat: Category) => {
    triggerHaptic('light');
    setIsEditing(true);
    setEditingCatId(cat.id);
    setCatName(cat.name);
    setCatIcon(cat.icon);
    setCatColor(cat.color);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    if (editingCatId) {
      updateCategory(editingCatId, {
        name: catName.trim(),
        icon: catIcon,
        color: catColor,
      });
    } else {
      addCategory({
        name: catName.trim(),
        type: activeTab,
        icon: catIcon,
        color: catColor,
        bgColor: 'bg-slate-100 text-slate-700',
      });
    }

    setIsEditing(false);
    setEditingCatId(null);
    setCatName('');
  };

  const handleDeleteCategory = (cat: Category) => {
    if (filteredCategories.length <= 1) {
      setMessage('Phải giữ lại ít nhất 1 danh mục!');
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    setDeletingCat(cat);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">Quản Lý Danh Mục</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Switcher */}
        {!isEditing && (
          <div className="bg-slate-100 p-1 rounded-2xl flex my-3 shrink-0">
            <button
              onClick={() => setActiveTab('expense')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition ${
                activeTab === 'expense' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Danh Mục Chi ({categories.filter(c => c.type === 'expense').length})
            </button>
            <button
              onClick={() => setActiveTab('income')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition ${
                activeTab === 'income' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Danh Mục Thu ({categories.filter(c => c.type === 'income').length})
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto py-2 space-y-3">
          {isEditing ? (
            /* Edit / Create Form */
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Tên danh mục ({activeTab === 'expense' ? 'Khoản Chi' : 'Khoản Thu'})
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Thú cưng, Du lịch, Thể thao..."
                  value={catName}
                  onChange={e => setCatName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                />
              </div>

              {/* Color Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                  Chọn màu sắc đại diện
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCatColor(color)}
                      className={`w-7 h-7 rounded-xl transition-all ${
                        catColor === color ? 'scale-115 ring-2 ring-teal-600 ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                  Chọn biểu tượng (Icon)
                </label>
                <div className="grid grid-cols-5 gap-2 max-h-44 overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-200">
                  {AVAILABLE_ICONS.map(iconName => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setCatIcon(iconName)}
                      className={`p-2 rounded-xl flex items-center justify-center transition ${
                        catIcon === iconName
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <CategoryIcon name={iconName} size={18} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow"
                >
                  {editingCatId ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          ) : (
            /* Category List */
            <div className="space-y-2">
              <button
                onClick={startAddCategory}
                className="w-full py-2.5 px-3 border border-dashed border-teal-500/60 hover:bg-teal-50/50 rounded-2xl text-xs font-bold text-teal-700 flex items-center justify-center gap-1.5 transition active:scale-98"
              >
                <Plus className="w-4 h-4" />
                Thêm danh mục mới
              </button>

              {filteredCategories.map(cat => (
                <div
                  key={cat.id}
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} size={18} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-800 truncate block">
                        {cat.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {cat.isDefault ? 'Mặc định' : 'Tùy chỉnh'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEditCategory(cat)}
                      className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg transition"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!cat.isDefault && (
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                        title="Xóa danh mục"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isEditing && (
          <button
            onClick={onClose}
            className="mt-3 w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow transition"
          >
            Đóng
          </button>
        )}
      </div>

      {/* Confirm Delete Category Modal */}
      <ConfirmModal
        isOpen={!!deletingCat}
        title="Xóa danh mục"
        message={deletingCat ? `Bạn có chắc muốn xóa danh mục "${deletingCat.name}" không?` : ''}
        confirmText="Xóa danh mục"
        type="danger"
        onConfirm={() => {
          if (deletingCat) {
            deleteCategory(deletingCat.id);
            setDeletingCat(null);
          }
        }}
        onCancel={() => setDeletingCat(null)}
      />
    </div>
  );
};
