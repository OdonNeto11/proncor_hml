import { useState, FormEvent } from 'react';
import { Calendar, Clock, User, Phone, FileText, Upload, Paperclip, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Card } from '../components/ui/Card';
import { Toast } from '../components/ui/Toast';
import { supabase } from '../lib/supabase';

export function Agendar() {
  const [formData, setFormData] = useState({
    data_agendamento: '',
    hora_agendamento: '',
    nome_paciente: '',
    telefone_paciente: '',
    diagnostico: '',
  });

  const [arquivos, setArquivos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // --- VALIDAÇÃO DE DATA E HORA RETROATIVA ---
  const validarDataHora = (data: string, hora: string) => {
    if (!data) return null;

    const agora = new Date();
    const hojeStr = agora.toISOString().split('T')[0]; // YYYY-MM-DD

    // 1. Valida Data Passada
    if (data < hojeStr) {
      return "A data não pode ser anterior a hoje.";
    }

    // 2. Valida Horário Passado (se for hoje)
    if (data === hojeStr && hora) {
      const [horaSel, minSel] = hora.split(':').map(Number);
      const horaAtual = agora.getHours();
      const minAtual = agora.getMinutes();

      if (horaSel < horaAtual || (horaSel === horaAtual && minSel < minAtual)) {
        return "O horário já passou.";
      }
    }
    return null;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "").substring(0, 11);
    if (value.length > 10) value = value.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    else if (value.length > 6) value = value.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    else if (value.length > 2) value = value.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    else if (value.length > 0) value = value.replace(/^(\d*)/, "($1");
    setFormData(prev => ({ ...prev, telefone_paciente: value }));
    if (errors.telefone_paciente) setErrors(prev => ({ ...prev, telefone_paciente: '' }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const novoForm = { ...formData, [name]: value };
    setFormData(novoForm);

    // Limpa erro genérico do campo
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));

    // Validação em Tempo Real para Data e Hora
    if (name === 'data_agendamento' || name === 'hora_agendamento') {
      const erroDataHora = validarDataHora(
        name === 'data_agendamento' ? value : formData.data_agendamento,
        name === 'hora_agendamento' ? value : formData.hora_agendamento
      );

      if (erroDataHora) {
        // Define o erro no campo que está sendo alterado (ou na data se for genérico)
        setErrors(prev => ({ ...prev, [name]: erroDataHora }));
      } else {
        // Se corrigiu, limpa os erros de data e hora
        setErrors(prev => ({ ...prev, data_agendamento: '', hora_agendamento: '' }));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const novosArquivos = Array.from(e.target.files);
      const total = arquivos.length + novosArquivos.length;
      if (total > 5) { alert("Máximo de 5 arquivos permitidos."); return; }
      setArquivos(prev => [...prev, ...novosArquivos]);
    }
  };

  const removerArquivo = (index: number) => {
    setArquivos(prev => prev.filter((_, i) => i !== index));
  };

  const uploadArquivoUnico = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error } = await supabase.storage.from('anexos').upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('anexos').getPublicUrl(fileName);
    return { nome: file.name, url: data.publicUrl };
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const novosErros: Record<string, string> = {};
    if (!formData.data_agendamento) novosErros.data_agendamento = 'Data obrigatória';
    if (!formData.hora_agendamento) novosErros.hora_agendamento = 'Hora obrigatória';
    if (!formData.nome_paciente) novosErros.nome_paciente = 'Nome obrigatório';
    if (!formData.telefone_paciente || formData.telefone_paciente.length < 14) novosErros.telefone_paciente = 'Telefone inválido';
    
    // Validação Final de Retroativo
    const erroRetroativo = validarDataHora(formData.data_agendamento, formData.hora_agendamento);
    if (erroRetroativo) {
        novosErros.data_agendamento = erroRetroativo;
    }

    if (Object.keys(novosErros).length > 0) {
      setErrors(novosErros);
      setLoading(false);
      return;
    }

    try {
      const listaAnexos = [];
      if (arquivos.length > 0) {
        const uploads = await Promise.all(arquivos.map(file => uploadArquivoUnico(file)));
        listaAnexos.push(...uploads);
      }

      const { error } = await supabase.from('agendamentos').insert([{
        data_agendamento: formData.data_agendamento,
        hora_agendamento: formData.hora_agendamento,
        nome_paciente: formData.nome_paciente,
        telefone_paciente: formData.telefone_paciente,
        diagnostico: formData.diagnostico,
        status: 'agendado',
        anexos: listaAnexos
      }]);
      
      if (error) throw error;
      
      setShowToast(true);
      setFormData({ data_agendamento: '', hora_agendamento: '', nome_paciente: '', telefone_paciente: '', diagnostico: '' });
      setArquivos([]);
    } catch (error: any) {
      alert('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Novo Agendamento</h1>
        <p className="text-gray-600">Preencha os dados e anexe até 5 exames</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="w-full">
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Data <span className="text-red-500">*</span></label>
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Calendar size={20} /></div>
                    <input type="date" name="data_agendamento" value={formData.data_agendamento} onChange={handleChange} className={`w-full h-12 pl-10 pr-3 rounded-xl border bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all ${errors.data_agendamento ? 'border-red-500' : 'border-slate-200'}`} />
                </div>
                {errors.data_agendamento && <span className="text-xs text-red-500 mt-1">{errors.data_agendamento}</span>}
            </div>

            <div className="w-full">
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Horário <span className="text-red-500">*</span></label>
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Clock size={20} /></div>
                    <input type="time" name="hora_agendamento" value={formData.hora_agendamento} onChange={handleChange} className={`w-full h-12 pl-10 pr-3 rounded-xl border bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all ${errors.hora_agendamento ? 'border-red-500' : 'border-slate-200'}`} />
                </div>
                {errors.hora_agendamento && <span className="text-xs text-red-500 mt-1">{errors.hora_agendamento}</span>}
            </div>
          </div>

          <Input label="Paciente" name="nome_paciente" value={formData.nome_paciente} onChange={handleChange} required icon={<User size={20} />} error={errors.nome_paciente} />
          <Input label="Telefone / WhatsApp" name="telefone_paciente" value={formData.telefone_paciente} onChange={handlePhoneChange} required placeholder="(xx) xxxxx-xxxx" maxLength={15} icon={<Phone size={20} />} error={errors.telefone_paciente} />
          <Textarea label="Diagnóstico / Motivo" name="diagnostico" value={formData.diagnostico} onChange={handleChange} rows={3} icon={<FileText size={20} />} />

          <div className="w-full">
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Anexos (Máx: 5)</label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 p-6 hover:bg-white hover:border-blue-400 transition-colors relative text-center">
               <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,image/*" />
               <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                  <Upload size={32} className="text-blue-400" />
                  <p className="text-sm font-medium">Clique ou arraste arquivos aqui</p>
                  <p className="text-xs text-slate-400">PDF ou Imagens</p>
               </div>
            </div>
            {arquivos.length > 0 && (
              <div className="mt-3 space-y-2">
                {arquivos.map((arq, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Paperclip size={16} className="text-blue-600 flex-shrink-0" />
                      <span className="text-sm text-slate-700 truncate">{arq.name}</span>
                    </div>
                    <button type="button" onClick={() => removerArquivo(index)} className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" disabled={loading} fullWidth>
            {loading ? 'Salvando...' : 'Salvar Agendamento'}
          </Button>
        </form>
      </Card>
      {showToast && <Toast message="Salvo com sucesso!" onClose={() => setShowToast(false)} />}
    </div>
  );
}