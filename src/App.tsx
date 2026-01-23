import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Agendar } from './pages/Agendar';
import { Agenda } from './pages/Agenda';

function App() {
  return (
    // O BrowserRouter já está no main.tsx, então aqui usamos apenas Routes
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/agendar" element={<Agendar />} />
        <Route path="/agenda" element={<Agenda />} />
      </Routes>
    </Layout>
  );
}

export default App;