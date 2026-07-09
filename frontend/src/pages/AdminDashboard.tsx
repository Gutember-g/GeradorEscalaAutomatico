import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import GerenciarUsuariosAdmin from './GerenciarUsuariosAdmin';
import GerenciarDelegadosAdmin from './GerenciarDelegadosAdmin';
import ConsultarAuditoriaAdmin from './ConsultarAuditoriaAdmin';
import DashboardMetricasAdmin from './DashboardMetricasAdmin';
import {
  LogOut,
  Building,
  Shield,
  Activity,
  FileText,
  BarChart3
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'metrics' | 'orgs' | 'delegates' | 'audit'>('metrics');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'metrics':
        return <DashboardMetricasAdmin />;
      case 'orgs':
        return <GerenciarUsuariosAdmin />;
      case 'delegates':
        return <GerenciarDelegadosAdmin />;
      case 'audit':
        return <ConsultarAuditoriaAdmin />;
      default:
        return <DashboardMetricasAdmin />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Admin Header */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 p-2.5 rounded-2xl text-slate-950 shadow-md">
              <Shield size={20} />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight">
                Escala<span className="text-amber-500 font-bold">Fácil</span>
              </span>
              <span className="ml-2 text-[9px] font-extrabold bg-slate-850 text-amber-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Super Admin
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition cursor-pointer ${
                activeTab === 'metrics'
                  ? 'bg-slate-800 text-amber-500 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <BarChart3 size={15} /> Métricas
            </button>
            <button
              onClick={() => setActiveTab('orgs')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition cursor-pointer ${
                activeTab === 'orgs'
                  ? 'bg-slate-800 text-amber-500 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Building size={15} /> Organizações
            </button>
            <button
              onClick={() => setActiveTab('delegates')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition cursor-pointer ${
                activeTab === 'delegates'
                  ? 'bg-slate-800 text-amber-500 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Shield size={15} /> Delegados
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-slate-800 text-amber-500 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <FileText size={15} /> Auditoria
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-[10px] font-semibold text-slate-550">Logado como</p>
              <p className="text-xs font-bold text-slate-350">{user?.nome || 'Administrador'}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-red-950 hover:text-red-300 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition cursor-pointer"
            >
              <LogOut size={14} /> Sair
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden bg-slate-950 border-b border-slate-800 p-2 flex justify-around">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-bold ${
            activeTab === 'metrics' ? 'text-amber-500' : 'text-slate-400'
          }`}
        >
          <BarChart3 size={16} /> Métricas
        </button>
        <button
          onClick={() => setActiveTab('orgs')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-bold ${
            activeTab === 'orgs' ? 'text-amber-500' : 'text-slate-400'
          }`}
        >
          <Building size={16} /> Organizações
        </button>
        <button
          onClick={() => setActiveTab('delegates')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-bold ${
            activeTab === 'delegates' ? 'text-amber-500' : 'text-slate-400'
          }`}
        >
          <Shield size={16} /> Delegados
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-bold ${
            activeTab === 'audit' ? 'text-amber-500' : 'text-slate-400'
          }`}
        >
          <FileText size={16} /> Auditoria
        </button>
      </div>

      {/* Main Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;
