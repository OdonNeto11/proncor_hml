import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, ClipboardList, Home as HomeIcon, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth(); // Pega a função de sair do contexto
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  
  // Função que fecha o menu mobile e rola para o topo
  const handleNavigation = () => {
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Função de Logout
  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* LOGO */}
            <div className="flex items-center gap-3">
              <Link 
                to="/" 
                className="flex-shrink-0 hover:opacity-90 transition-opacity"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <img 
                  src="/logo.png" 
                  alt="Hospital Proncor" 
                  className="h-12 w-auto object-contain" 
                />
              </Link>
            </div>
            
            {/* MENU DESKTOP */}
            <nav className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-600">
              <Link 
                to="/" 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${isActive('/') ? 'text-blue-700 bg-blue-50 font-semibold' : 'hover:text-blue-600 hover:bg-gray-50'}`}
              >
                <HomeIcon size={18} /> Início
              </Link>
              <Link 
                to="/novo" 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${isActive('/novo') ? 'text-blue-700 bg-blue-50 font-semibold' : 'hover:text-blue-600 hover:bg-gray-50'}`}
              >
                <Calendar size={18} /> Novo Agendamento
              </Link>
              <Link 
                to="/agenda" 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${isActive('/agenda') ? 'text-blue-700 bg-blue-50 font-semibold' : 'hover:text-blue-600 hover:bg-gray-50'}`}
              >
                <ClipboardList size={18} /> Ver Agenda
              </Link>

              {/* Divisória Vertical */}
              <div className="h-6 w-px bg-gray-200 mx-2"></div>

              {/* Botão Sair Desktop */}
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                title="Sair do sistema"
              >
                <LogOut size={18} /> Sair
              </button>
            </nav>

            {/* BOTÃO MOBILE (Hamburguer) */}
            <button 
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

          </div>
        </div>

        {/* --- MENU MOBILE FLUTUANTE (CORRIGIDO) --- */}
        {isMobileMenuOpen && (
          <>
            {/* Overlay transparente para fechar ao clicar fora */}
            <div 
                className="fixed inset-0 z-40 bg-transparent" 
                onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* O Menu Flutuante (Card no canto direito) */}
            <div className="md:hidden absolute top-20 right-4 z-50 w-auto min-w-[220px] bg-white rounded-xl shadow-2xl border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex flex-col p-2 space-y-1">
                <Link to="/" onClick={handleNavigation} className={`flex items-center gap-3 px-4 py-3 rounded-lg whitespace-nowrap transition-colors ${isActive('/') ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <HomeIcon size={18} /> Início
                </Link>
                <Link to="/novo" onClick={handleNavigation} className={`flex items-center gap-3 px-4 py-3 rounded-lg whitespace-nowrap transition-colors ${isActive('/novo') ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <Calendar size={18} /> Novo Agendamento
                </Link>
                <Link to="/agenda" onClick={handleNavigation} className={`flex items-center gap-3 px-4 py-3 rounded-lg whitespace-nowrap transition-colors ${isActive('/agenda') ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <ClipboardList size={18} /> Ver Agenda
                </Link>
                
                <hr className="border-gray-100 my-1" />
                
                {/* Botão Sair Mobile */}
                <button 
                    onClick={handleLogout} 
                    className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left text-red-500 hover:bg-red-50 font-semibold transition-colors"
                >
                    <LogOut size={18} /> Sair do Sistema
                </button>
              </div>
            </div>
          </>
        )}
      </header>

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}