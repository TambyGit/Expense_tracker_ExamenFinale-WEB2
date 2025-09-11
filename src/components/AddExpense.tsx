import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Expense } from '../../backend/src/types';

interface AddExpenseProps {
  editingExpense: Expense | null
  onExpenseAdded: () => void;
  onCancelEdit: () => void;
}

const categories = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Education',
  'Other'
];

export default function AddExpense({ editingExpense, onExpenseAdded, onCancelEdit }: AddExpenseProps) {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: categories[0],
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    if (editingExpense) {
      setFormData({
        title: editingExpense.title,
        amount: editingExpense.amount.toString(),
        category: editingExpense.category,
        description: editingExpense.description || '',
        date: editingExpense.date
      });
    } else {
      setFormData({
        title: '',
        amount: '',
        category: categories[0],
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
    }
  }, [editingExpense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) return;
    console.log('Ajout d\'une dépense avec token :', token);

    setLoading(true);

    try {
      const expenseData = {
        title: formData.title,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description || null,
        date: formData.date
      };

      let res;
      if (editingExpense) {
        res = await fetch(`${import.meta.env.VITE_API_URL}/expenses/${editingExpense.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(expenseData)
        });
        if (!res.ok) throw new Error('Failed to update expense');
        toast.success('Expense updated successfully!');
        onCancelEdit();
      } else {
        res = await fetch(`${import.meta.env.VITE_API_URL}/expenses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(expenseData)
        });
        if (!res.ok) throw new Error('Failed to add expense');
        toast.success('Expense added successfully!');
        setFormData({
          title: '',
          amount: '',
          category: categories[0],
          description: '',
          date: new Date().toISOString().split('T')[0]
        });
      }

      onExpenseAdded();
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error('Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {editingExpense ? 'Edit Expense' : 'Add New Expense'}
        </h1>
        {editingExpense && (
          <button
            onClick={onCancelEdit}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className=" textAddExpenses block text-sm font-medium  mb-2">
                Title <span className='importantc text-red-600'>*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Lunch at restaurant"
              />
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="amount" className="textAddExpenses block text-sm font-medium mb-2">
                Amount <span className='importantc text-red-600'>*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  required
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className=" input w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className=" textAddExpenses block text-sm font-medium mb-2">
                Category <span className='importantc text-red-600'>*</span>
              </label>
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleInputChange}
                className="input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="textAddExpenses block text-sm font-medium mb-2">
                Date <span className='importantc text-red-600'>*</span>
              </label>
              <input
                type="date"
                id="date"
                name="date"
                required
                value={formData.date}
                onChange={handleInputChange}
                className=" input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="textAddExpenses block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              className=" input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any additional notes about this expense..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-md hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span>{editingExpense ? 'Update Expense' : 'Add Expense'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Recent Expenses Preview */}
      {!editingExpense && (
        <div className="input bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips for tracking expenses</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Be specific with titles to easily identify expenses later</li>
            <li>• Choose the most appropriate category for better insights</li>
            <li>• Add descriptions for unusual or large expenses</li>
            <li>• Record expenses as soon as possible for accuracy</li>
          </ul>
        </div>
      )}
    </div>
  );
}