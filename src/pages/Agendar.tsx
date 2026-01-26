import React, { useState, FormEvent, useEffect } from 'react';
import { Calendar, Clock, User, Phone, FileText, Upload, Paperclip, Trash2 } from 'lucide-react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ptBR } from 'date-fns/locale';
import "react-datepicker/dist/react-datepicker.css";
import { format, isSameDay } from 'date-fns';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Card } from '../components/ui/Card';
import { Toast } from '../components/ui/Toast';
import { supabase } from '../lib/supabase';

registerLocale('pt-BR', ptBR);

export function Agendar() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    nome_paciente: '',
    telefone_paciente: '',
    diagnostico: '',
  });

  const [arquivos, setArquivos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // --- 1. BUSCAR HORÁRIOS OCUPADOS (APENAS 'AGENDADO') ---
  useEffect(() => {
    const fetchBookedTimes = async () => {
      if (!selectedDate) return;

      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('agendamentos')
        .select('hora_agendamento')
        .eq('data_agendamento', dateStr)
        .eq('status', 'agendado'); // <--- ALTERAÇÃO AQUI: Só bloqueia se estiver 'agendado'

      if (error) {
        console.error('Erro ao buscar horários:', error);
        return;
      }

      if (data) {
        const times = data.map(item => item.hora_agendamento);
        setBookedTimes(times);
      }
    };

    fetchBookedTimes();
  }, [selectedDate]);

  // --- 2. VALIDAR DISPONIBILIDADE ---
  const isTimeAvailable = (time: Date) => {
    const timeStr = format(time, 'HH:mm');
    const currentDate = new Date();

    // Regra 1: Horário passado (se for hoje)
    if (selectedDate && isSameDay(selectedDate, currentDate)) {
      if (time < currentDate) return false;
    }

    // Regra 2: Horário já agendado
    if (bookedTimes.includes(timeStr)) {
      return false; 
    }

    return true;
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
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
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
    if (!selectedDate) novosErros.data_agendamento = 'Data obrigatória';
    if (!selectedTime) novosErros.hora_agendamento = 'Hora obrigatória';
    if (!formData.nome_paciente) novosErros.nome_paciente = 'Nome obrigatório';
    if (!formData.telefone_paciente || formData.telefone_paciente.length < 14) novosErros.telefone_paciente = 'Telefone inválido';
    
    // Validação extra de segurança
    if (selectedTime) {
        const timeStr = format(selectedTime, 'HH:mm');
        if (bookedTimes.includes(timeStr)) {
            novosErros.hora_agendamento = 'Este horário acabou de ser ocupado.';
        }
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

      const dataFormatada = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
      const horaFormatada = selectedTime ? format(selectedTime, 'HH:mm') : '';

      const { error } = await supabase.from('agendamentos').insert([{
        data_agendamento: dataFormatada,
        hora_agendamento: horaFormatada,
        nome_paciente: formData.nome_paciente,
        telefone_paciente: formData.telefone_paciente,
        diagnostico: formData.diagnostico,
        status: 'agendado',
        anexos: listaAnexos
      }]);
      
      if (error) throw error;
      
      setShowToast(true);
      setFormData({ nome_paciente: '', telefone_paciente: '', diagnostico: '' });
      setSelectedDate(new Date()); 
      setSelectedTime(null);
      setArquivos([]);
      // Atualiza lista localmente para refletir o novo bloqueio
      setBookedTimes([...bookedTimes, horaFormatada]);
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
            
            {/* DATA */}
            <div className="w-full">
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Data <span className="text-red-500">*</span></label>
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10"><Calendar size={20} /></div>
                    <DatePicker
                        selected={selectedDate}
                        onChange={(date: Date | null) => {
                           setSelectedDate(date);
                           setSelectedTime(null); 
                           if(errors.data_agendamento) setErrors({...errors, data_agendamento: ''});
                        }}
                        minDate={new Date()}
                        locale="pt-BR"
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Selecione o dia"
                        className={`custom-datepicker-input ${errors.data_agendamento ? '!border-red-500' : ''}`}
                        onFocus={(e) => e.target.blur()}
                    />
                </div>
                {errors.data_agendamento && <span className="text-xs text-red-500 mt-1">{errors.data_agendamento}</span>}
            </div>

            {/* HORA (Com intervalo de 30min e filtro de ocupados) */}
            <div className="w-full">
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Horário <span className="text-red-500">*</span></label>
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10"><Clock size={20} /></div>
                    <DatePicker
                        selected={selectedTime}
                        onChange={(time: Date | null) => {
                            setSelectedTime(time);
                            if(errors.hora_agendamento) setErrors({...errors, hora_agendamento: ''});
                        }}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={30}
                        timeCaption="Hora"
                        dateFormat="HH:mm"
                        locale="pt-BR"
                        placeholderText="Selecione a hora"
                        filterTime={isTimeAvailable}
                        className={`custom-datepicker-input ${errors.hora_agendamento ? '!border-red-500' : ''}`}
                    />
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