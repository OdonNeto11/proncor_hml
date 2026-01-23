import { useState, FormEvent } from 'react';
import { Calendar, Clock, User, Phone, FileText, Stethoscope } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Card } from '../components/ui/Card';
import { Toast } from '../components/ui/Toast';

// 1. SOLUÇÃO DO VERMELHO: Definimos o tipo AQUI dentro, sem depender de arquivo externo
type NovoAgendamento = {
  data_agendamento: string;
  hora_agendamento: string;
  nome_paciente: string;
  telefone_paciente: string;
  diagnostico: string;
  medico_responsavel: string;
};

export function Agendar() {
  const [formData, setFormData] = useState<NovoAgendamento>({
    data_agendamento: '',
    hora_agendamento: '',
    nome_paciente: '',
    telefone_paciente: '',
    diagnostico: '',
    medico_responsavel: '',
  });

  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatarTelefone = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 11) {
      return numeros
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d)(\d{4})$/, '$1-$2');
    }
    return valor;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'telefone_paciente') {
      setFormData({ ...formData, [name]: formatarTelefone(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validarFormulario = () => {
    const novosErros: Record<string, string> = {};
    if (!formData.data_agendamento) novosErros.data_agendamento = 'Data é obrigatória';
    if (!formData.hora_agendamento) novosErros.hora_agendamento = 'Hora é obrigatória';
    if (!formData.nome_paciente.trim()) novosErros.nome_paciente = 'Nome do paciente é obrigatório';
    if (!formData.telefone_paciente) {
      novosErros.telefone_paciente = 'Telefone é obrigatório';
    } else {
      const numeros = formData.telefone_paciente.replace(/\D/g, '');
      if (numeros.length < 10 || numeros.length > 11) {
        novosErros.telefone_paciente = 'Telefone inválido';
      }
    }
    if (!formData.diagnostico.trim()) novosErros.diagnostico = 'Diagnóstico é obrigatório';
    if (!formData.medico_responsavel.trim()) novosErros.medico_responsavel = 'Médico responsável é obrigatório';

    setErrors(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setLoading(true);

    try {
      // --- MOCK ATIVADO (Simulação para teste visual) ---
      console.log('Enviando dados:', formData);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Espera 1.5s fingindo salvar

      setShowToast(true);
      setFormData({
        data_agendamento: '',
        hora_agendamento: '',
        nome_paciente: '',
        telefone_paciente: '',
        diagnostico: '',
        medico_responsavel: '',
      });
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao criar agendamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Novo Agendamento</h1>
        <p className="text-gray-600">Registre um novo retorno médico para o paciente</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Data do Agendamento"
              type="date"
              name="data_agendamento"
              value={formData.data_agendamento}
              onChange={handleChange}
              required
              error={errors.data_agendamento}
              icon={<Calendar size={20} />}
            />
            <Input
              label="Hora do Agendamento"
              type="time"
              name="hora_agendamento"
              value={formData.hora_agendamento}
              onChange={handleChange}
              required
              error={errors.hora_agendamento}
              icon={<Clock size={20} />}
            />
          </div>

          <Input
            label="Nome do Paciente"
            name="nome_paciente"
            value={formData.nome_paciente}
            onChange={handleChange}
            placeholder="Digite o nome completo"
            required
            error={errors.nome_paciente}
            icon={<User size={20} />}
          />

          <Input
            label="Telefone do Paciente"
            type="tel"
            name="telefone_paciente"
            value={formData.telefone_paciente}
            onChange={handleChange}
            placeholder="(00) 00000-0000"
            required
            maxLength={15}
            error={errors.telefone_paciente}
            icon={<Phone size={20} />}
          />

          <Textarea
            label="Diagnóstico"
            name="diagnostico"
            value={formData.diagnostico}
            onChange={handleChange}
            placeholder="Descreva o diagnóstico..."
            required
            rows={4}
            error={errors.diagnostico}
            icon={<FileText size={20} />}
          />

          <Input
            label="Médico Responsável"
            name="medico_responsavel"
            value={formData.medico_responsavel}
            onChange={handleChange}
            placeholder="Nome do médico"
            required
            error={errors.medico_responsavel}
            icon={<Stethoscope size={20} />}
          />

          <div className="pt-4">
            <Button type="submit" disabled={loading} fullWidth>
              {loading ? 'Salvando...' : 'Salvar Agendamento'}
            </Button>
          </div>
        </form>
      </Card>

      {showToast && (
        <Toast
          message="Agendamento criado com sucesso!"
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}