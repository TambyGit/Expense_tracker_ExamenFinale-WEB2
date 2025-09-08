import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Edit, Trash2, Search, Filter, Calendar, Download } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Expense } from '../../backend/src/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExpenseListProps {
  onEditExpense: (expense: Expense) => void;
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

export default function ExpenseList({ onEditExpense }: ExpenseListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { user, token } = useAuth();

  useEffect(() => {
    fetchExpenses();
  }, [user, token]);

  useEffect(() => {
    filterAndSortExpenses();
  }, [expenses, searchTerm, selectedCategory, sortBy, sortOrder]);

  const fetchExpenses = async () => {
    if (!user || !token) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/expenses`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-cache'
      });

      if (!res.ok) throw new Error('Échec de la récupération des dépenses');
      const data = await res.json();
      const parsed: Expense[] = data.map((exp: any) => ({
        ...exp,
        amount: parseFloat(exp.amount),
      }));
      setExpenses(parsed);
    } catch (error) {
      console.error('Erreur lors de la récupération des dépenses :', error);
      toast.error('Échec du chargement des dépenses');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortExpenses = () => {
    let filtered = [...expenses];

    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(expense => expense.category === selectedCategory);
    }

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        default:
          aValue = new Date(a.date);
          bValue = new Date(b.date);
      }
      return sortOrder === 'asc' ? (aValue < bValue ? -1 : 1) : (aValue > bValue ? -1 : 1);
    });

    setFilteredExpenses(filtered);
  };

  const handleDeleteExpense = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/expenses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Échec de la suppression de la dépense');

      setExpenses(expenses.filter(expense => expense.id !== id));
      toast.success('Dépense supprimée avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression de la dépense :', error);
      toast.error('Échec de la suppression de la dépense');
    }
  };

  const generatePDF = async (expense: Expense) => {
  const input = document.createElement('div');
  input.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif; color: #000; background-color: #ffffff; border: 2px solid #4a90e2; border-radius: 8px; width: 400px; center">
      <header style="text-align: center; background-color: blue; color: #ffffff; padding: 10px; border-radius: 6px">
        <h1 style="margin-bottom: 4vh; font-size: 24px; text-align: center;">Reçu de Dépense</h1>
      </header>
      <div style="padding: 15px;">
        <p style="margin: 10px 0; font-size: 16px;"><strong>Titre :</strong> ${expense.title}</p>
        <p style="margin: 10px 0; font-size: 16px;"><strong>Montant :</strong> <span style="color: #2ecc71;">$${expense.amount.toFixed(2)}</span></p>
        <p style="margin: 10px 0; font-size: 16px;"><strong>Catégorie :</strong> ${expense.category}</p>
        <p style="margin: 10px 0; font-size: 16px;"><strong>Date :</strong> ${format(new Date(expense.date), 'dd/MM/yyyy')}</p>
        ${expense.description ? `<p style="margin: 10px 0; font-size: 16px;"><strong>Description :</strong> ${expense.description}</p>` : ''}
        <p style="margin: 10px 0; font-size: 16px;"><strong>Utilisateur :</strong> ${user?.full_name || user?.email}</p>
        <hr style="border: 0; border-top: 1px dashed #4a90e2; margin: 15px 0;" />
        <p style="text-align: center; margin: 10px 0; font-size: 14px; color: #7f8c8d;">Télécharger le : ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
      </div>
    </div>
  `;
  document.body.appendChild(input);

  const canvas = await html2canvas(input, { scale: 2 }); // Améliore la qualité avec scale
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = 667; // Largeur A4 en mm
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(`receipt_${expense.id}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`);

  document.body.removeChild(input);
};

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse dark:bg-gray-800 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32 dark:bg-gray-600"></div>
                <div className="h-3 bg-gray-200 rounded w-24 dark:bg-gray-600"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-16 dark:bg-gray-600"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Expenses</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Total : <span className="font-semibold text-gray-900 dark:text-gray-100">${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'title')}
            className="input px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          >
           <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
            <option value="title">Sort by Title</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="input px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredExpenses.map((expense) => (
          <div key={expense.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition hover:-translate-y-2 duration-500">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{expense.title}</h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full dark:bg-blue-900 dark:text-blue-100">
                    {expense.category}
                  </span>
                </div>
                {expense.description && <p className="text-gray-600 mb-2 dark:text-gray-400">{expense.description}</p>}
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4 mr-1" />
                  {format(new Date(expense.date), 'MMMM dd, yyyy')}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${expense.amount.toFixed(2)}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onEditExpense(expense)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-md transition-colors"
                    title="Modifier la dépense"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteExpense(expense.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900 rounded-md transition-colors"
                    title="Supprimer la dépense"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => generatePDF(expense)}
                    className="p-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900 rounded-md transition-colors"
                    title="Télécharger le reçu"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredExpenses.length === 0 && (
          <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 text-center">
            <div className="max-w-md mx-auto">
              <Filter className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Aucune dépense trouvée</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || selectedCategory
                  ? 'Try adjusting your search criteria or filters.'
                  : 'Start by adding your first expense to track your spending.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}