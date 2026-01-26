import { Calendar, ClipboardList, ArrowRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useNavigate } from 'react-router-dom';

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto py-10">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Sistema de Teleconsultas
        </h1>
        <p className="text-xl text-gray-600">
          Agendamento de Teleconsultas e Retornos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card
          onClick={() => navigate('/novo')}
          className="cursor-pointer group hover:shadow-lg transition-shadow border-t-4 border-t-blue-500"
        >
          <div className="flex flex-col items-center text-center p-8">
            <div className="bg-blue-100 p-6 rounded-full mb-6 group-hover:bg-blue-200 transition-colors">
              <Calendar className="text-blue-600" size={48} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Novo Agendamento
            </h2>
            <p className="text-gray-600 mb-6">
              Registre um novo retorno médico para um paciente
            </p>
            <div className="flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-4 transition-all">
              Acessar
              <ArrowRight size={20} />
            </div>
          </div>
        </Card>

        <Card
          onClick={() => navigate('/agenda')}
          className="cursor-pointer group hover:shadow-lg transition-shadow border-t-4 border-t-green-500"
        >
          <div className="flex flex-col items-center text-center p-8">
            <div className="bg-green-100 p-6 rounded-full mb-6 group-hover:bg-green-200 transition-colors">
              <ClipboardList className="text-green-600" size={48} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Ver Agenda
            </h2>
            <p className="text-gray-600 mb-6">
              Visualize e gerencie todos os agendamentos registrados
            </p>
            <div className="flex items-center gap-2 text-green-600 font-semibold group-hover:gap-4 transition-all">
              Acessar
              <ArrowRight size={20} />
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-16 text-center">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-none">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Sistema de Teleconsulta e Retornos
            </h3>
            <p className="text-gray-600">
              Gerencie retornos médicos online após exames de forma centralizada e eficiente.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}