import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, User, Loader2 } from 'lucide-react'; // Troquei Mail por User

export function Login() {
  const navigate = useNavigate();
  
  // Renomeei para loginInput pois pode receber tanto email quanto usuário
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    // --- LÓGICA DO EMAIL FANTASMA ---
    // Remove espaços em branco extras
    let emailParaEnviar = loginInput.trim();

    // Se NÃO tiver @, assumimos que é um usuário interno (ex: plantonista)
    // e adicionamos o sufixo configurado no Supabase
    if (!emailParaEnviar.includes('@')) {
      emailParaEnviar = `${emailParaEnviar}@proncor.com.br`;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: emailParaEnviar,
      password,
    });

    if (error) {
      setErrorMsg('Usuário ou senha incorretos.');
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 border border-slate-100">
        
        <div className="text-center mb-8">
          <img 
            src="/logo.png" 
            alt="Hospital Proncor" 
            className="h-20 mx-auto mb-6 object-contain" 
          />
          
          <h1 className="text-2xl font-bold text-slate-800">Sistema de Teleconsultas</h1>
          <p className="text-slate-500">Agendamento de Teleconsultas e Retornos</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            {/* Label Atualizada */}
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Usuário ou Email
            </label>
            <div className="relative">
              {/* Ícone de Usuário */}
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text"  // MUDANÇA IMPORTANTE: type="text" para aceitar nomes sem @
                value={loginInput}
                onChange={e => setLoginInput(e.target.value)}
                className="w-full h-12 pl-10 pr-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                placeholder="Ex: plantonista ou seu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-12 pl-10 pr-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium">
              {errorMsg}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Entrar no Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}