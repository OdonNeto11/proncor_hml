import { useState, FormEvent } from 'react';
import { Calendar, Clock, User, Phone, FileText, Upload, Paperclip } from 'lucide-react';
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

  const [arquivo, setArquivo] = useState<File | null>(null); // Estado para o arquivo
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // Função para lidar com a seleção do arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArquivo(e.target.files[0]);
    }
  };

  const uploadArquivo = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`; // Nome único para não sobrescrever
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('anexos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Pega a URL pública para salvar no banco
    const { data } = supabase.storage.from('anexos').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Validações
    const novosErros: Record<string, string> = {};
    if (!formData.data_agendamento) novosErros.data_agendamento = 'Data obrigatória';
    if (!formData.hora_agendamento) novosErros.hora_agendamento = 'Hora obrigatória';
    if (!formData.nome_paciente) novosErros.nome_paciente = 'Nome obrigatório';
    if (!formData.telefone_paciente || formData.telefone_paciente.length < 14) novosErros.telefone_paciente = 'Telefone inválido';
    
    if (Object.keys(novosErros).length > 0) {
      setErrors(novosErros);
      setLoading(false);
      return;
    }

    try {
      let anexoUrl = null;

      // 1. Se tiver arquivo, faz upload primeiro
      if (arquivo) {
        anexoUrl = await uploadArquivo(arquivo);
      }

      // 2. Salva no banco com a URL do anexo
      const { error } = await supabase.from('agendamentos').insert([{
        data_agendamento: formData.data_agendamento,
        hora_agendamento: formData.hora_agendamento,
        nome_paciente: formData.nome_paciente,
        telefone_paciente: formData.telefone_paciente,
        diagnostico: formData.diagnostico,
        status: 'agendado',
        anexo_url: anexoUrl // Campo novo
      }]);
      
      if (error) throw error;
      
      setShowToast(true);
      setFormData({ data_agendamento: '', hora_agendamento: '', nome_paciente: '', telefone_paciente: '', diagnostico: '' });
      setArquivo(null); // Limpa o arquivo
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
        <p className="text-gray-600">Preencha os dados e anexe exames se necessário</p>
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

          {/* CAMPO DE UPLOAD MODERNO */}
          <div className="w-full">
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Anexo (Exame/Documento)</label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 p-4 hover:bg-white hover:border-blue-400 transition-colors cursor-pointer relative">
               <input 
                  type="file" 
                  onChange={handleFileChange} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,image/*" // Aceita PDF e Imagens
               />
               <div className="flex items-center justify-center gap-2 text-slate-500">
                  {arquivo ? (
                    <>
                      <Paperclip className="text-blue-600" size={20} />
                      <span className="text-blue-600 font-medium">{arquivo.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      <span>Clique para anexar um arquivo</span>
                    </>
                  )}
               </div>
            </div>
          </div>

          <Button type="submit" disabled={loading} fullWidth>
            {loading ? 'Enviando...' : 'Salvar Agendamento'}
          </Button>
        </form>
      </Card>
      {showToast && <Toast message="Salvo com sucesso!" onClose={() => setShowToast(false)} />}
    </div>
  );
}