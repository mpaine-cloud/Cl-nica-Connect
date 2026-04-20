/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DataProvider, useData } from './context/DataContext';
import { Dashboard } from './components/Dashboard';
import { CampaignForm } from './components/CampaignForm';
import { Chatbot } from './components/Chatbot';
import { Login } from './components/Login';
import { auth } from './firebase';
import { LayoutDashboard, MessageSquare, Activity, FileSpreadsheet, LogOut, Menu, X } from 'lucide-react';
import { cn } from './utils/cn';

function AppContent() {
  const { user, isAuthReady } = useData();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'data' | 'chatbot'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Activity className="w-8 h-8 text-indigo-600 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handleTabSwitch = (tab: 'dashboard' | 'data' | 'chatbot') => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <Activity className="w-5 h-5" />
          </div>
          <h1 className="font-bold text-slate-800 text-lg">Clínica Connect</h1>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-300 ease-in-out",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-6 flex items-center justify-between md:justify-start gap-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 leading-tight">Clínica<br/>Connect</h1>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="md:hidden p-2 text-slate-400 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => handleTabSwitch('dashboard')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
              activeTab === 'dashboard' 
                ? "bg-indigo-50 text-indigo-700" 
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <LayoutDashboard className="w-5 h-5" />
            Panel de Control
          </button>
          <button
            onClick={() => handleTabSwitch('data')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
              activeTab === 'data' 
                ? "bg-indigo-50 text-indigo-700" 
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <FileSpreadsheet className="w-5 h-5" />
            Ingreso de Datos
          </button>
          <button
            onClick={() => handleTabSwitch('chatbot')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
              activeTab === 'chatbot' 
                ? "bg-indigo-50 text-indigo-700" 
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <MessageSquare className="w-5 h-5" />
            Asistente IA
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-3">
          <button 
            onClick={() => auth.signOut()}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-500 font-medium text-center">
              Desarrollado con Gemini
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto relative bg-slate-50 w-full min-h-0">
        <div className={cn(activeTab === 'dashboard' ? 'block' : 'hidden')}>
          <Dashboard />
        </div>
        <div className={cn(activeTab === 'data' ? 'block' : 'hidden')}>
          <CampaignForm />
        </div>
        <div className={cn("h-full", activeTab === 'chatbot' ? 'block' : 'hidden')}>
          <Chatbot />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}
