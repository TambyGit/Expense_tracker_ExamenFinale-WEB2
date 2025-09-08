import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {LogOut,DollarSign,TrendingUp,PlusCircle,Moon,Sun,} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Layout({
  children,
  activeTab,
  onTabChange,
}: LayoutProps) {
  const { user, signOut } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: TrendingUp },
    { id: "expenses", label: "Expenses", icon: DollarSign },
    { id: "add", label: "Add Expense", icon: PlusCircle },
  ];

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: isDarkMode ? "#1a202c" : "#f7fafc",
        color: isDarkMode ? "#e2e8f0" : "#2d3748",
      }}
    >
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                ExpenseTracker
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 dark:text-gray-300">
                Welcome, {user?.full_name || user?.email}
              </span>
              <button
                onClick={toggleTheme}
                className="px-3 py-2 text-sm text-gray-500 dark:text-gray-300 rounded-md hover:text-blue-600 dark:hover:text-blue-400 flex items-center space-x-2"
              >
                {isDarkMode ? (<Sun className="w-5 h-5 hover:scale-125 transition duration-300" />) : (<Moon className="w-5 h-5 hover:scale-125 transition duration-300" />)}
              </button>
              <button
                onClick={signOut}
                className="SignOut flex items-center space-x-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-300 rounded-md hover:scale-110 transition duration-300"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
