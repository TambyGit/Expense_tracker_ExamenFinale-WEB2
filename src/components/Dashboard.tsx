import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { useAuth } from '../contexts/AuthContext';
import { DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { format, startOfWeek } from 'date-fns';
import toast from 'react-hot-toast';
import { Expense } from '../../backend/src/types';

interface CategoryTotal {
  name: string;
  value: number;
}

interface WeeklyData {
  day: string;
  amount: number;
}

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuth();
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const pieChartRef = useRef<HTMLCanvasElement>(null);
  const chartInstances = useRef<{ bar?: Chart; pie?: Chart }>({});

  // Fetch data depuis API
const fetchExpenses = async () => {
  if (!user || !token) return;

  console.log('Fetching expenses with token:', token);

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/expenses`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-cache'
    });

    console.log('GET response status:', res.status);
    const data = await res.json();
    console.log('Raw response data:', data);

    if (!res.ok) throw new Error('Failed to fetch expenses');
    const parsed: Expense[] = data.map((exp: any) => ({
      ...exp,
      amount: parseFloat(exp.amount),
    }));
    console.log('Parsed expenses:', parsed);
    setExpenses(parsed);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    toast.error('Failed to load expenses');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchExpenses();
  }, [user, token]);

  // Charts
  useEffect(() => {
    if (!loading) {
      if (chartInstances.current.bar) chartInstances.current.bar.destroy();
      if (chartInstances.current.pie) chartInstances.current.pie.destroy();

      if (barChartRef.current && weeklyData.length > 0) {
        chartInstances.current.bar = new Chart(barChartRef.current, {
          type: 'bar',
          data: {
            labels: weeklyData.map(d => d.day),
            datasets: [{
              label: 'Amount',
              data: weeklyData.map(d => d.amount),
              backgroundColor: '#3B82F6',
              borderRadius: 4,
            }],
          },
          options: {
            responsive: true,
            scales: { y: { beginAtZero: true } },
            plugins: { tooltip: { callbacks: { label: (context) => {
              const value = context.raw as number;
              return `$${value.toFixed(2)}`;
            }}}},
          },
        });
      }

      if (pieChartRef.current && categoryTotals.length > 0) {
        chartInstances.current.pie = new Chart(pieChartRef.current, {
          type: 'pie',
          data: {
            labels: categoryTotals.map(c => c.name),
            datasets: [{
              data: categoryTotals.map(c => c.value),
              backgroundColor: COLORS,
            }],
          },
          options: {
            responsive: true,
            plugins: { tooltip: { callbacks: { label: (context) => {
              const value = context.raw as number;
              return `$${value.toFixed(2)}`;
            }}}},
          },
        });
      }
    }

    return () => {
      if (chartInstances.current.bar) chartInstances.current.bar.destroy();
      if (chartInstances.current.pie) chartInstances.current.pie.destroy();
    };
  }, [loading, expenses]);

  // Statistiques
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const thisMonth = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const now = new Date();
    return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
  });
  const thisMonthTotal = thisMonth.reduce((sum, expense) => sum + expense.amount, 0);

  const lastMonth = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    return expenseDate.getMonth() === lastMonthDate.getMonth() && expenseDate.getFullYear() === lastMonthDate.getFullYear();
  });
  const lastMonthTotal = lastMonth.reduce((sum, expense) => sum + expense.amount, 0);

  const monthlyChange = lastMonthTotal === 0 ? 0 : ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;

  // Données pour les charts
  const categoryTotals: CategoryTotal[] = expenses.reduce((acc, expense) => {
    const existingCategory = acc.find(cat => cat.name === expense.category);
    if (existingCategory) {
      existingCategory.value += expense.amount;
    } else {
      acc.push({ name: expense.category, value: expense.amount });
    }
    return acc;
  }, [] as CategoryTotal[]);

  const weeklyData: WeeklyData[] = [];
  const startOfThisWeek = startOfWeek(new Date());

  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfThisWeek);
    date.setDate(date.getDate() + i);
    const dayExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.toDateString() === date.toDateString();
    });
    const totalAmount = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    weeklyData.push({
      day: format(date, 'EEE'),
      amount: totalAmount
    });
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  if (loading) {
    return <p className="text-center text-gray-500">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="w-4 h-4 mr-1" />
          {format(new Date(), 'MMMM yyyy')}
        </div>
      </div>

       {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:-translate-y-3 transition duration-500 hover:shadow-lg hover:shadow-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">${totalExpenses.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:-translate-y-3 transition duration-500 hover:shadow-lg hover:shadow-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">This Month</p>
              <p className="text-2xl font-bold text-gray-900">${thisMonthTotal.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:-translate-y-3 transition duration-500 hover:shadow-lg hover:shadow-red-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Monthly Change</p>
              <p className={`text-2xl font-bold ${monthlyChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {monthlyChange >= 0 ? '+' : ''}{monthlyChange.toFixed(1)}%
              </p>
            </div>
            <div className={`p-3 rounded-lg ${monthlyChange >= 0 ? 'bg-red-100' : 'bg-green-100'}`}>
              {monthlyChange >= 0 ? (
                <TrendingUp className="w-6 h-6 text-red-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-green-600" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Expenses</h3>
          <canvas ref={barChartRef} height={300}></canvas>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h3>
          {categoryTotals.length > 0 ? (
            <canvas ref={pieChartRef} height={300}></canvas>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <p>No expenses to display</p>
            </div>
          )}
        </div>
      </div>

      {/* dépenses récentes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {expenses.slice(0, 5).map((expense) => (
            <div key={expense.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{expense.title}</p>
                <p className="text-sm text-gray-500">{expense.category}</p>
                {expense.description && (
                  <p className="text-xs text-gray-400 italic">{expense.description}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">${expense.amount.toFixed(2)}</p>
                <p className="text-sm text-gray-500">{format(new Date(expense.date), 'MMM dd, yyyy')}</p>
              </div>
            </div>
          ))}
          {expenses.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500">
              <p>No expenses recorded yet. Start by adding your first expense!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}