import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, ClipboardList, Home as HomeIcon } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* --- CABEÇALHO (AGORA COM LIMITADOR DE LARGURA) --- */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        
        {/* Este container segura o conteúdo centralizado (max-w-6xl) */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Lado Esquerdo: Logo e Título */}
            <div className="flex items-center gap-3">
              <Link to="/" className="bg-blue-600 text-white p-2 rounded-lg font-bold w-10 h-10 flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm">
                P
              </Link>
              <div>
                <h1 className="font-bold text-slate-800 leading-tight text-lg">Hospital Proncor</h1>
                <p className="text-xs text-slate-500 font-medium">Sistema de Agendamento</p>
              </div>
            </div>
            
            {/* Lado Direito: Menu de Navegação */}
            <nav className="hidden md:flex gap-2 text-sm font-medium text-slate-600">
              <Link 
                to="/" 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${isActive('/') ? 'text-blue-700 bg-blue-50 font-semibold' : 'hover:text-blue-600 hover:bg-gray-50'}`}
              >
                <HomeIcon size={18} /> Início
              </Link>
              <Link 
                to="/novo" 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${isActive('/novo') ? 'text-blue-700 bg-blue-50 font-semibold' : 'hover:text-blue-600 hover:bg-gray-50'}`}
              >
                <Calendar size={18} /> Novo Agendamento
              </Link>
              <Link 
                to="/agenda" 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${isActive('/agenda') ? 'text-blue-700 bg-blue-50 font-semibold' : 'hover:text-blue-600 hover:bg-gray-50'}`}
              >
                <ClipboardList size={18} /> Ver Agenda
              </Link>
            </nav>

          </div>
        </div>
      </header>

      {/* --- CONTEÚDO --- */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      
    </div>
  );
}