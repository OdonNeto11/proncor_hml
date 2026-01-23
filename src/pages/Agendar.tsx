import { useState, useEffect, FormEvent } from 'react';
import { Calendar, Clock, User, Phone, FileText, Stethoscope } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Card } from '../components/ui/Card';
import { Toast } from '../components/ui/Toast';
import { supabase } from '../lib/supabase';

type Medico = {
  id: number;
  nome: string;
  especialidade: string;
};

const gerarHorarios = () => {
  const horarios = [];
  let hora = 8;
  let minuto = 0;
  
  while (hora <= 18) {
    const horaFormatada = String(hora).padStart(2, '0');
    const minutoFormatado = String(minuto).padStart(2, '0');
    horarios.push(`${horaFormatada}:${minutoFormatado}`);
    
    minuto += 30;
    if (minuto === 60) {
      minuto = 0;
      hora += 1;
    }
  }
  return horarios;
};

export function Agendar() {
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const horariosDisponiveis = gerarHorarios();

  const [formData, setFormData] = useState({
    medico_id: '',
    data_agendamento: '',
    hora_agendamento: '',
    nome_paciente: '',
    telefone_paciente: '',
    diagnostico: '',
  });

  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchMedicos() {
      try {
        const { data, error } = await supabase
          .from('medicos')
          .select('id, nome, especialidade')
          .eq('ativo', true)
          .order('nome');

        if (error) throw error;
        if (data) setMedicos(data);
      } catch (error) {
        console.error('Erro ao buscar médicos:', error);
      }
    }
    fetchMedicos();
  }, []);

  const formatarTelefone = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 11) {
      return numeros
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d)(\d{4})$/, '$1-$2');
    }
    return valor;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'telefone_paciente') {
      setFormData({ ...formData, [name]: formatarTelefone(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const validarFormulario = () => {
    const novosErros: Record<string, string> = {};
    if (!formData.medico_id) novosErros.medico_id = 'Selecione um médico';
    if (!formData.data_agendamento) novosErros.data_agendamento = 'Data é obrigatória';
    if (!formData.hora_agendamento) novosErros.hora_agendamento = 'Hora é obrigatória';
    if (!formData.nome_paciente.trim()) novosErros.nome_paciente = 'Nome é obrigatório';
    if (!formData.telefone_paciente) novosErros.telefone_paciente = 'Telefone é obrigatório';
    setErrors(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setLoading(true);

    try {
      const agendamentoParaSalvar = {
        ...formData,
        medico_id: Number(formData.medico_id)
      };

      const { error } = await supabase.from('agendamentos').insert([agendamentoParaSalvar]);

      if (error) throw error;

      setShowToast(true);
      setFormData({
        medico_id: '',
        data_agendamento: '',
        hora_agendamento: '',
        nome_paciente: '',
        telefone_paciente: '',
        diagnostico: '',
      });

    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao realizar agendamento: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Novo Agendamento</h1>
        <p className="text-gray-600">Preencha os dados do paciente e selecione o profissional</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-semibold text-slate-700">Médico Responsável *</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Stethoscope size={20} />
              </div>
              <select
                name="medico_id"
                value={formData.medico_id}
                onChange={handleChange}
                className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pl-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none ${errors.medico_id ? 'border-red-500' : ''}`}
              >
                <option value="">Selecione um profissional...</option>
                {medicos.map((med) => (
                  <option key={med.id} value={med.id}>
                    {med.nome} - {med.especialidade}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">▼</div>
            </div>
            {errors.medico_id && <span className="text-xs text-red-500 font-medium">{errors.medico_id}</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Data da Consulta" type="date" name="data_agendamento" value={formData.data_agendamento} onChange={handleChange} required error={errors.data_agendamento} icon={<Calendar size={20} />} />
            
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-semibold text-slate-700">Horário *</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Clock size={20} />
                </div>
                <select name="hora_agendamento" value={formData.hora_agendamento} onChange={handleChange} className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pl-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none ${errors.hora_agendamento ? 'border-red-500' : ''}`}>
                  <option value="">Selecione...</option>
                  {horariosDisponiveis.map((horario) => (<option key={horario} value={horario}>{horario}</option>))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">▼</div>
              </div>
              {errors.hora_agendamento && <span className="text-xs text-red-500 font-medium">{errors.hora_agendamento}</span>}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 mt-2">
            <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">Dados do Paciente</h3>
            <div className="space-y-4">
              <Input label="Nome Completo" name="nome_paciente" value={formData.nome_paciente} onChange={handleChange} required error={errors.nome_paciente} icon={<User size={20} />} />
              <Input label="Telefone / WhatsApp" type="tel" name="telefone_paciente" value={formData.telefone_paciente} onChange={handleChange} placeholder="(00) 00000-0000" required maxLength={15} error={errors.telefone_paciente} icon={<Phone size={20} />} />
              <Textarea label="Motivo / Diagnóstico" name="diagnostico" value={formData.diagnostico} onChange={handleChange} placeholder="Descreva o motivo do retorno..." rows={3} icon={<FileText size={20} />} />
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={loading} fullWidth>
              {loading ? 'Confirmando Agendamento...' : 'Salvar Agendamento'}
            </Button>
          </div>
        </form>
      </Card>
      {showToast && <Toast message="Agendamento salvo com sucesso!" onClose={() => setShowToast(false)} />}
    </div>
  );
}