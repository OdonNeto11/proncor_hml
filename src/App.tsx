import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Agendar } from './pages/Agendar';
import { Agenda } from './pages/Agenda';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* AQUI ESTAVA O ERRO: Mudamos de /agendar para /novo para bater com o menu */}
        <Route path="/novo" element={<Agendar />} /> 
        <Route path="/agenda" element={<Agenda />} />
      </Routes>
    </Layout>
  );
}

export default App;