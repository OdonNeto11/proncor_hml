import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Clock, CheckCircle2, 
  Search, MessageCircle, AlertTriangle, X, ListChecks, Edit, Save, RefreshCw, AlertCircle, FileDown, Paperclip,
  Hash, Activity 
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, isSameDay, endOfMonth, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DatePicker, { registerLocale } from 'react-datepicker'; 
import "react-datepicker/dist/react-datepicker.css"; 
import { supabase } from '../lib/supabase';
import { Toast } from '../components/ui/Toast';

registerLocale('pt-BR', ptBR); 

// LISTA DE HORÁRIOS
const HORARIOS_FIXOS = [
  "07:30", "08:00", "08:30", "09:00",
  "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:30",
  "19:00", "19:30", "20:00", "20:30", "21:00"
];

const OPCOES_PROCEDIMENTOS = ["Exames", "RX", "Tomografia"];

type Anexo = { nome: string; url: string; };

type Agendamento = {
  id: number;
  data_agendamento: string;
  hora_agendamento: string;
  numero_atendimento: string; 
  nome_paciente: string;
  telefone_paciente: string;
  diagnostico: string;
  procedimentos: string[] | null; 
  status: string;
  anexos: Anexo[] | null;
  medico_id: number | null;
};

type ModalView = 'details' | 'edit' | 'reschedule' | 'confirm_conclude' | 'confirm_cancel';

export function Agenda() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('agendado'); 
  
  const [dataInicio, setDataInicio] = useState<Date | null>(new Date()); 
  const [dataFim, setDataFim] = useState<Date | null>(endOfMonth(new Date())); 
  
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null);
  const [viewMode, setViewMode] = useState<ModalView>('details');
  const [showToast, setShowToast] = useState({ visible: false, message: '' });

  // States para Reagendamento
  const [reagendarDate, setReagendarDate] = useState<Date | null>(null);
  const [reagendarTime, setReagendarTime] = useState<Date | null>(null);
  const [reagendarMotivo, setReagendarMotivo] = useState('');
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  
  const [editForm, setEditForm] = useState({ 
    numero_atendimento: '',
    nome: '', 
    telefone: '', 
    diagnostico: '',
    procedimentos: [] as string[]
  });

  // --- FETCHING ---
  const fetchAgendamentos = async () => {
    setLoading(true);
    try {
      const inicioStr = dataInicio ? format(dataInicio, 'yyyy-MM-dd') : '';
      const fimStr = dataFim ? format(dataFim, 'yyyy-MM-dd') : '';

      let query = supabase
        .from('agendamentos')
        .select('*') 
        .neq('status', 'cancelado')
        .order('data_agendamento', { ascending: true })
        .order('hora_agendamento', { ascending: true });

      if (inicioStr) query = query.gte('data_agendamento', inicioStr);
      if (fimStr) query = query.lte('data_agendamento', fimStr);

      const { data, error } = await query;
      if (error) throw error;
      if (data) setAgendamentos(data as any);
    } catch (error) { console.error('Erro:', error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchAgendamentos(); }, [dataInicio, dataFim]);

  // --- DISPONIBILIDADE ---
  useEffect(() => {
    const fetchBookedTimesForReschedule = async () => {
      if (!reagendarDate) return;
      const dateStr = format(reagendarDate, 'yyyy-MM-dd');
      const { data, error } = await supabase.from('agendamentos').select('hora_agendamento').eq('data_agendamento', dateStr).eq('status', 'agendado');
      if (error) { console.error(error); return; }
      if (data) setBookedTimes(data.map(item => item.hora_agendamento.substring(0, 5)));
    };
    if (viewMode === 'reschedule') {
        setBookedTimes([]);
        setReagendarTime(null);
        fetchBookedTimesForReschedule();
    }
  }, [reagendarDate]);

  const checkIsDisabled = (timeStr: string) => {
    if (!reagendarDate) return true; 
    if (bookedTimes.includes(timeStr)) return true;
    if (isSameDay(reagendarDate, new Date())) {
      const [hora, minuto] = timeStr.split(':').map(Number);
      const dataHoraOpcao = new Date(reagendarDate);
      dataHoraOpcao.setHours(hora, minuto, 0, 0);
      const agora = new Date();
      if (dataHoraOpcao.getTime() < agora.getTime() - 60000) return true;
    }
    return false;
  };

  const handleSelectRescheduleTime = (timeStr: string) => {
    if (!reagendarDate) return;
    const [h, m] = timeStr.split(':').map(Number);
    const newTime = setHours(setMinutes(new Date(reagendarDate), m), h);
    setReagendarTime(newTime);
  };

  // --- FILTROS (ATUALIZADO AQUI) ---
  const agendamentosFiltrados = agendamentos.filter(ag => {
    const termo = busca.toLowerCase();
    
    // 1. Match Nome
    const matchNome = ag.nome_paciente?.toLowerCase().includes(termo);
    
    // 2. Match Telefone
    const telefoneLimpoBanco = ag.telefone_paciente?.replace(/\D/g, '') || '';
    const termoLimpoBusca = termo.replace(/\D/g, '');
    const matchTelefone = ag.telefone_paciente?.includes(termo) || (termoLimpoBusca.length > 0 && telefoneLimpoBanco.includes(termoLimpoBusca));
    
    // 3. Match Número Atendimento (NOVO)
    const matchNumero = ag.numero_atendimento?.toLowerCase().includes(termo);

    const matchStatus = filtroStatus ? (ag.status?.toLowerCase() || 'agendado') === filtroStatus.toLowerCase() : true;
    
    // Retorna se der match em QUALQUER UM dos campos E o status estiver correto
    return (matchNome || matchTelefone || matchNumero) && matchStatus;
  });

  const grupos = agendamentosFiltrados.reduce((acc, curr) => {
    (acc[curr.data_agendamento] = acc[curr.data_agendamento] || []).push(curr);
    return acc;
  }, {} as Record<string, Agendamento[]>);

  const handlePhoneEditChange = (valor: string) => {
    let value = valor.replace(/\D/g, "").substring(0, 11);
    if (value.length > 10) value = value.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    else if (value.length > 6) value = value.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    else if (value.length > 2) value = value.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    else if (value.length > 0) value = value.replace(/^(\d*)/, "($1");
    setEditForm(prev => ({ ...prev, telefone: value }));
  };

  const handleNumeroAtendimentoEditChange = (valor: string) => {
    const value = valor.replace(/\D/g, ""); 
    setEditForm(prev => ({ ...prev, numero_atendimento: value }));
  };

  const toggleProcedimentoEdit = (opcao: string) => {
    setEditForm(prev => {
        const jaExiste = prev.procedimentos.includes(opcao);
        let novosProcedimentos;
        if (jaExiste) {
            novosProcedimentos = prev.procedimentos.filter(p => p !== opcao);
        } else {
            novosProcedimentos = [...prev.procedimentos, opcao];
        }
        return { ...prev, procedimentos: novosProcedimentos };
    });
  };

  const executarAtualizacaoStatus = async (id: number, novoStatus: string) => {
    try {
        const { error } = await supabase.from('agendamentos').update({ status: novoStatus }).eq('id', id);
        if (error) throw error;
        setShowToast({ visible: true, message: `Status atualizado!` });
        setSelectedAgendamento(null);
        fetchAgendamentos();
    } catch (e) { alert('Erro ao atualizar status'); }
  };

  const confirmarReagendamento = async () => {
    if (!reagendarDate || !reagendarTime) return alert("Preencha data e hora!");
    try {
      const dataStr = format(reagendarDate, 'yyyy-MM-dd');
      const horaStr = format(reagendarTime, 'HH:mm');
      const novoDiagnostico = (selectedAgendamento?.diagnostico || '') + 
        `\n[Reagendado em ${format(new Date(), 'dd/MM')}]: ${reagendarMotivo || 'Sem motivo informado.'}`;
      
      const { error } = await supabase.from('agendamentos').update({
        data_agendamento: dataStr,
        hora_agendamento: horaStr,
        diagnostico: novoDiagnostico,
        status: 'agendado'
      }).eq('id', selectedAgendamento!.id);
      
      if (error) throw error;
      setShowToast({ visible: true, message: 'Reagendado com sucesso!' });
      setSelectedAgendamento(null);
      fetchAgendamentos();
    } catch (error) { alert("Erro ao reagendar, tente novamente."); }
  };

  const confirmarEdicao = async () => {
     if (!selectedAgendamento) return;
     try {
        const { error } = await supabase.from('agendamentos').update({
            numero_atendimento: editForm.numero_atendimento,
            nome_paciente: editForm.nome,
            telefone_paciente: editForm.telefone,
            diagnostico: editForm.diagnostico,
            procedimentos: editForm.procedimentos
        }).eq('id', selectedAgendamento.id);
        
        if (error) throw error;
        setShowToast({ visible: true, message: 'Dados atualizados!' });
        
        setSelectedAgendamento({
            ...selectedAgendamento, 
            ...editForm,
            numero_atendimento: editForm.numero_atendimento,
            nome_paciente: editForm.nome,
            telefone_paciente: editForm.telefone,
            procedimentos: editForm.procedimentos
        });
        
        setViewMode('details');
        fetchAgendamentos();
     } catch (e) { alert('Erro ao editar'); }
  };

  const abrirModal = (item: Agendamento) => {
    setSelectedAgendamento(item);
    setViewMode('details');
    setReagendarDate(null);
    setReagendarTime(null);
    setReagendarMotivo('');
    setEditForm({ 
        numero_atendimento: item.numero_atendimento || '',
        nome: item.nome_paciente, 
        telefone: item.telefone_paciente, 
        diagnostico: item.diagnostico || '',
        procedimentos: item.procedimentos || []
    });
  };

  const getStatusColor = (status: string) => {
      const s = status?.toLowerCase();
      if (s === 'realizado') return '#16a34a'; 
      return '#2563eb'; 
  };

  const limparFiltros = () => {
    setDataInicio(new Date()); 
    setDataFim(endOfMonth(new Date())); 
    setFiltroStatus('agendado');
    setBusca('');
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div><h1 className="text-2xl font-bold text-gray-800">Agenda de Consultas</h1><p className="text-gray-500 text-sm">Gerencie os atendimentos</p></div>
          <div className="w-full md:w-80 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            {/* Placeholder atualizado */}
            <input type="text" placeholder="Buscar por nome, telefone ou nº..." value={busca} onChange={e => setBusca(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm" />
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-4 pt-4 border-t border-gray-50">
          <div className="flex items-center gap-2 lg:w-1/3">
            <div className="relative flex-1">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={16} />
                <DatePicker selected={dataInicio} onChange={(date: Date | null) => setDataInicio(date)} locale="pt-BR" dateFormat="dd/MM/yyyy" placeholderText="Início" className="custom-datepicker-input !h-10 !text-sm !pl-10" onFocus={(e) => e.target.blur()} />
            </div>
            <span className="text-gray-400 text-sm">até</span>
            <div className="relative flex-1">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={16} />
                <DatePicker selected={dataFim} onChange={(date: Date | null) => setDataFim(date)} locale="pt-BR" dateFormat="dd/MM/yyyy" placeholderText="Fim" className="custom-datepicker-input !h-10 !text-sm !pl-10" onFocus={(e) => e.target.blur()} />
            </div>
          </div>
          <div className="relative flex-1"><ListChecks className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="w-full pl-9 pr-8 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none appearance-none bg-white h-10"><option value="">Todos os Status</option><option value="agendado">A Realizar</option><option value="realizado">Realizados</option></select></div>
        </div>
      </div>

      {/* LISTAGEM */}
      {loading ? <div className="text-center py-20 text-gray-500">Carregando...</div> : 
        agendamentosFiltrados.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <h3 className="text-gray-600 font-medium">Nenhum agendamento encontrado</h3>
            <button onClick={limparFiltros} className="text-blue-600 font-medium hover:underline flex items-center justify-center gap-2 mx-auto mt-2"><RefreshCw size={16} /> Limpar Filtros</button>
          </div>
        ) : (
        <div className="space-y-8">
          {Object.entries(grupos).map(([data, itens]) => (
            <div key={data} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3 mb-4 bg-blue-50 p-2 rounded-lg w-full border border-blue-100 shadow-sm">
                <CalendarIcon className="text-blue-600" size={18} />
                <h2 className="font-bold text-gray-800 capitalize text-sm">
                    {isToday(parseISO(data)) ? 'Hoje' : isTomorrow(parseISO(data)) ? 'Amanhã' : format(parseISO(data), "EEEE, d 'de' MMMM", { locale: ptBR })}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {itens.map((item) => (
                  <div key={item.id} onClick={() => abrirModal(item)} className="bg-white rounded-xl border p-4 shadow-sm hover:shadow-md cursor-pointer relative overflow-hidden group transition-all">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: getStatusColor(item.status) }} />
                    <div className="pl-3">
                      <div className="flex justify-between mb-2">
                        <span className="flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded text-xs"><Clock size={12} /> {item.hora_agendamento}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${item.status?.toLowerCase() === 'realizado' ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>{item.status?.toLowerCase() === 'realizado' ? 'Realizado' : 'A Realizar'}</span>
                      </div>
                      
                      {item.numero_atendimento && (
                         <span className="text-[10px] font-semibold text-gray-500 mb-1 block">#{item.numero_atendimento}</span>
                      )}

                      <h3 className="font-bold text-gray-800 truncate">{item.nome_paciente}</h3>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-2"><MessageCircle size={10} /> {item.telefone_paciente}</p>
                      
                      {item.procedimentos && item.procedimentos.length > 0 && (
                         <div className="flex flex-wrap gap-1 mt-2">
                             {item.procedimentos.slice(0, 2).map((proc, i) => (
                                 <span key={i} className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md border border-emerald-100">{proc}</span>
                             ))}
                             {item.procedimentos.length > 2 && <span className="text-[9px] text-gray-400">+{item.procedimentos.length - 2}</span>}
                         </div>
                      )}

                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL --- */}
      {selectedAgendamento && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`bg-white rounded-2xl shadow-2xl w-full ${viewMode === 'reschedule' ? 'max-w-2xl' : 'max-w-md'} overflow-visible animate-in zoom-in-95 duration-200`}>
            
            <div className="bg-gray-50 rounded-t-2xl px-6 py-4 border-b flex justify-between items-center">
              <div className="flex-1">
                {viewMode === 'edit' ? <h3 className="text-lg font-bold text-blue-600">Editando dados</h3> : 
                 viewMode === 'reschedule' ? <h3 className="text-lg font-bold text-orange-600">Reagendamento</h3> :
                 viewMode === 'confirm_cancel' ? <h3 className="text-lg font-bold text-red-600">Confirmar Cancelamento</h3> :
                 viewMode === 'confirm_conclude' ? <h3 className="text-lg font-bold text-green-600">Confirmar Conclusão</h3> :
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{selectedAgendamento.nome_paciente}</h3>
                    {selectedAgendamento.status?.toLowerCase() !== 'realizado' && (
                      <button onClick={() => setViewMode('edit')} title="Editar dados" className="p-1.5 bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600 rounded-lg transition-colors"><Edit size={18} /></button>
                    )}
                  </div>
                }
              </div>
              <button onClick={() => setSelectedAgendamento(null)}><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="p-6 rounded-b-2xl bg-white">
              
              {/* --- DETALHES --- */}
              {viewMode === 'details' && (
                <div className="space-y-5">
                   <div className="flex gap-2 text-center">
                    <div className="flex-1 bg-blue-50 p-2 rounded-xl border border-blue-100"><span className="text-[10px] text-blue-600 font-bold uppercase block">Data</span><div className="font-bold text-blue-900 text-sm">{format(parseISO(selectedAgendamento.data_agendamento), 'dd/MM')}</div></div>
                    <div className="flex-1 bg-blue-50 p-2 rounded-xl border border-blue-100"><span className="text-[10px] text-blue-600 font-bold uppercase block">Hora</span><div className="font-bold text-blue-900 text-sm">{selectedAgendamento.hora_agendamento}</div></div>
                    <div className="flex-1 bg-slate-100 p-2 rounded-xl border border-slate-200"><span className="text-[10px] text-slate-500 font-bold uppercase block">Atendimento</span><div className="font-bold text-slate-700 text-sm">#{selectedAgendamento.numero_atendimento}</div></div>
                  </div>

                  {selectedAgendamento.procedimentos && selectedAgendamento.procedimentos.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                          {selectedAgendamento.procedimentos.map(proc => (
                              <span key={proc} className="flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full border border-emerald-100">
                                  <Activity size={12} /> {proc}
                              </span>
                          ))}
                      </div>
                  )}
                  
                  {selectedAgendamento.anexos && Array.isArray(selectedAgendamento.anexos) && selectedAgendamento.anexos.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase">Anexos ({selectedAgendamento.anexos.length})</p>
                        {selectedAgendamento.anexos.map((anexo, idx) => (
                            <a key={idx} href={anexo.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 hover:bg-blue-100 transition-colors group">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <FileDown size={18} className="flex-shrink-0" />
                                    <span className="text-sm font-semibold truncate">{anexo.nome}</span>
                                </div>
                                <span className="text-xs bg-white px-2 py-1 rounded text-blue-500 font-medium group-hover:text-blue-700">Baixar</span>
                            </a>
                        ))}
                    </div>
                  )}

                  <button onClick={() => window.open(`https://wa.me/55${selectedAgendamento.telefone_paciente.replace(/\D/g, '')}`, '_blank')} className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold flex justify-center gap-2 transition-transform active:scale-95 shadow-sm">
                    <MessageCircle /> WhatsApp
                  </button>
                  
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Diagnóstico / Condutas</p>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{selectedAgendamento.diagnostico || 'Sem observações.'}</p>
                  </div>

                  {selectedAgendamento.status?.toLowerCase() !== 'realizado' && (
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => setViewMode('confirm_conclude')} className="flex-1 bg-blue-600 text-white font-medium py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"><CheckCircle2 size={18} /> Concluir</button>
                      
                      <button 
                        onClick={() => {
                            setViewMode('reschedule');
                            setReagendarDate(new Date()); 
                        }} 
                        className="flex-1 bg-orange-50 text-orange-700 border border-orange-200 font-medium py-3 rounded-xl hover:bg-orange-100 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <AlertTriangle size={18} /> Reagendar
                      </button>
                    </div>
                  )}
                  {selectedAgendamento.status?.toLowerCase() !== 'realizado' && (
                     <button onClick={() => setViewMode('confirm_cancel')} className="w-full text-xs text-red-400 hover:text-red-600 py-2 mt-2 font-medium">Cancelar agendamento</button>
                  )}
                </div>
              )}

              {/* --- EDIÇÃO --- */}
              {viewMode === 'edit' && (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                   
                   <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Hash size={14} /> Nº Atendimento</label>
                        <input type="text" className="w-full h-11 border border-gray-200 bg-gray-50 rounded-xl px-3 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-mono" value={editForm.numero_atendimento} onChange={e => handleNumeroAtendimentoEditChange(e.target.value)} maxLength={10} />
                   </div>

                   <div><label className="text-sm font-medium text-gray-700 mb-1 block">Nome do Paciente</label><input type="text" className="w-full h-11 border border-gray-200 bg-gray-50 rounded-xl px-3 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" value={editForm.nome} onChange={e => setEditForm({...editForm, nome: e.target.value})} /></div>
                   <div><label className="text-sm font-medium text-gray-700 mb-1 block">Telefone</label><input type="tel" placeholder="(xx) xxxxx-xxxx" className="w-full h-11 border border-gray-200 bg-gray-50 rounded-xl px-3 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" value={editForm.telefone} onChange={e => handlePhoneEditChange(e.target.value)} maxLength={15} /></div>
                   
                   <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Diagnóstico / Condutas</label>
                        <textarea className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all text-sm" rows={3} value={editForm.diagnostico} onChange={e => setEditForm({...editForm, diagnostico: e.target.value})} />
                   </div>

                   <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Procedimentos</label>
                        <div className="flex flex-wrap gap-2">
                            {OPCOES_PROCEDIMENTOS.map((proc) => {
                                const isSelected = editForm.procedimentos.includes(proc);
                                return (
                                    <button
                                        key={proc}
                                        onClick={() => toggleProcedimentoEdit(proc)}
                                        className={`
                                            px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5
                                            ${isSelected 
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm' 
                                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                            }
                                        `}
                                    >
                                        <Activity size={14} className={isSelected ? 'text-emerald-500' : 'text-slate-400'} />
                                        {proc}
                                    </button>
                                )
                            })}
                        </div>
                   </div>

                   <div className="flex gap-2 pt-2"><button onClick={() => setViewMode('details')} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm font-medium">Cancelar</button><button onClick={confirmarEdicao} className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm hover:bg-blue-700 flex items-center justify-center gap-2 font-medium"><Save size={18} /> Salvar</button></div>
                </div>
              )}

              {/* --- REAGENDAMENTO --- */}
              {viewMode === 'reschedule' && (
                 <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100"><p className="text-sm text-orange-800 text-center font-medium">Selecione a nova data e horário</p></div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Nova Data</label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={20} />
                                <DatePicker
                                    selected={reagendarDate}
                                    onChange={(d: Date | null) => setReagendarDate(d)}
                                    minDate={new Date()}
                                    locale="pt-BR"
                                    dateFormat="dd/MM/yyyy"
                                    placeholderText="Selecione o dia"
                                    popperPlacement="bottom-start"
                                    className="custom-datepicker-input"
                                    onFocus={(e) => e.target.blur()} 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Novo Horário</label>
                            {!reagendarDate ? (
                                <div className="h-10 flex items-center text-gray-400 text-sm italic">Selecione uma data primeiro.</div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                                    {HORARIOS_FIXOS.map((horario) => {
                                        const isDisabled = checkIsDisabled(horario);
                                        const isSelected = reagendarTime && format(reagendarTime, 'HH:mm') === horario;

                                        return (
                                            <button
                                                key={horario}
                                                type="button"
                                                disabled={isDisabled}
                                                onClick={() => handleSelectRescheduleTime(horario)}
                                                className={`
                                                    py-1.5 px-1 rounded-md text-xs font-semibold border transition-all
                                                    ${isDisabled 
                                                        ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed decoration-slate-300' 
                                                        : isSelected
                                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm transform scale-105'
                                                            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600 hover:shadow-sm'
                                                    }
                                                `}
                                            >
                                                {horario}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Motivo</label>
                        <textarea className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 outline-none focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-300 transition-all text-sm placeholder:text-gray-400" rows={2} placeholder="Ex.: Paciente pediu para remarcar." value={reagendarMotivo} onChange={e => setReagendarMotivo(e.target.value)} />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button onClick={() => setViewMode('details')} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl text-sm font-medium">Voltar</button>
                        <button onClick={confirmarReagendamento} className="flex-1 bg-orange-600 text-white py-3 rounded-xl text-sm hover:bg-orange-700 font-medium">Confirmar</button>
                    </div>
                 </div>
              )}

              {(viewMode === 'confirm_cancel' || viewMode === 'confirm_conclude') && (
                <div className="text-center space-y-4 animate-in zoom-in-95 duration-200">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${viewMode === 'confirm_cancel' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {viewMode === 'confirm_cancel' ? <AlertCircle size={32} /> : <CheckCircle2 size={32} />}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">{viewMode === 'confirm_cancel' ? 'Tem certeza?' : 'Finalizar Atendimento?'}</h3>
                  <p className="text-gray-500 text-sm">{viewMode === 'confirm_cancel' ? 'Você está prestes a cancelar este agendamento.' : 'O status será alterado para "Realizado".'}</p>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setViewMode('details')} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200">Voltar</button>
                    <button onClick={() => executarAtualizacaoStatus(selectedAgendamento.id, viewMode === 'confirm_cancel' ? 'cancelado' : 'realizado')} className={`flex-1 text-white py-3 rounded-xl font-semibold ${viewMode === 'confirm_cancel' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                        {viewMode === 'confirm_cancel' ? 'Sim, Cancelar' : 'Confirmar'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
      {showToast.visible && <Toast message={showToast.message} onClose={() => setShowToast({ visible: false, message: '' })} />}
    </div>
  );
}