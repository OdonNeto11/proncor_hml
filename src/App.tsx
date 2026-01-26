import { Routes, Route, Navigate } from 'react-router-dom';

// IMPORTS DE CONTEXTO E PROTEÇÃO
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Layout } from './components/Layout'; 

import { Login } from './pages/Login';
import { Agenda } from './pages/Agenda';
import { Agendar } from './pages/Agendar';
import { Home } from './pages/Home'; // <--- IMPORTANTE: Importar a Home aqui

function App() {
  return (
    <AuthProvider>
      <Routes>
        
        {/* Rota Pública (Login) */}
        <Route path="/login" element={<Login />} />

        {/* --- ROTAS PROTEGIDAS --- */}
        
        {/* Rota Raiz (Início) - Agora aponta para HOME de verdade */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
               <Home /> {/* <--- TROCAMOS Agenda POR Home */}
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* Rota Agenda */}
        <Route path="/agenda" element={
          <ProtectedRoute>
            <Layout>
              <Agenda />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Rota Novo Agendamento */}
        <Route path="/novo" element={
          <ProtectedRoute>
            <Layout>
              <Agendar />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Rota Coringa */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </AuthProvider>
  );
}

export default App;