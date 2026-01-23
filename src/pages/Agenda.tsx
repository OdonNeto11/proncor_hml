import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Clock, User, CheckCircle2, 
  XCircle, Search, MessageCircle, AlertTriangle, X, Filter, CalendarDays, ListChecks, Edit, Save 
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { Toast } from '../components/ui/Toast';

// Tipos
type Medico = { id: number; nome: string; };

type Agendamento = {
  id: number;
  data_agendamento: string;
  hora_agendamento: string;
  nome_paciente: string;
  telefone_paciente: string;
  diagnostico: string;
  status: 'agendado' | 'realizado' | 'cancelado';
  medicos: { nome: string; especialidade: string; cor_agenda: string; id: number };
};

const gerarHorarios = () => {
  const horarios = [];
  let hora = 8;
  let minuto = 0;
  while (hora <= 18) {
    const h = String(hora).padStart(2, '0');
    const m = String(minuto).padStart(2, '0');
    horarios.push(`${h}:${m}`);
    minuto += 30;
    if (minuto === 60) { minuto = 0; hora += 1; }
  }
  return horarios;
};

export function Agenda() {
  // Dados Principais
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroMedico, setFiltroMedico] = useState(''); 
  const [filtroStatus, setFiltroStatus] = useState('agendado');
  const [dataInicio, setDataInicio] = useState(format(new Date(), 'yyyy-MM-dd')); 
  const [dataFim, setDataFim] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd')); 
  
  // Controle de Modal e Ações
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null);
  const [isReagendando, setIsReagendando] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // NOVO: Controla modo edição
  const [showToast, setShowToast] = useState({ visible: false, message: '' });

  // Estado dos Formulários (Reagendar e Editar)
  const [reagendarForm, setReagendarForm] = useState({ novaData: '', novaHora: '', motivo: '' });
  const [editForm, setEditForm] = useState({ nome: '', telefone: '', diagnostico: '' }); // NOVO: Form de edição

  const horariosDisponiveis = gerarHorarios();

  // 1. Busca Médicos
  useEffect(() => {
    async function carregarMedicos() {
      const { data } = await supabase.from('medicos').select('id, nome').eq('ativo', true);
      if (data) setMedicos(data);
    }
    carregarMedicos();
  }, []);

  // 2. Busca Agendamentos
  const fetchAgendamentos = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('agendamentos')
        .select(`*, medicos (id, nome, especialidade, cor_agenda)`)
        .neq('status', 'cancelado') 
        .gte('data_agendamento', dataInicio)
        .lte('data_agendamento', dataFim)
        .order('data_agendamento', { ascending: true })
        .order('hora_agendamento', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      if (data) setAgendamentos(data as any);
    } catch (error) {
      console.error('Erro ao buscar agenda:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgendamentos();
  }, [dataInicio, dataFim]);

  // Filtros
  const agendamentosFiltrados = agendamentos.filter(ag => {
    const termo = busca.toLowerCase();
    const matchTexto = ag.nome_paciente.toLowerCase().includes(termo) || ag.telefone_paciente.includes(termo);
    const matchMedico = filtroMedico ? String(ag.medicos.id) === filtroMedico : true;
    const matchStatus = filtroStatus ? ag.status === filtroStatus : true;
    return matchTexto && matchMedico && matchStatus;
  });

  const grupos = agendamentosFiltrados.reduce((acc, curr) => {
    (acc[curr.data_agendamento] = acc[curr.data_agendamento] || []).push(curr);
    return acc;
  }, {} as Record<string, Agendamento[]>);

  // Ações Principais
  const atualizarStatus = async (id: number, novoStatus: string) => {
    await supabase.from('agendamentos').update({ status: novoStatus }).eq('id', id);
    setShowToast({ visible: true, message: `Status atualizado!` });
    setSelectedAgendamento(null);
    fetchAgendamentos();
  };

  const confirmarReagendamento = async () => {
    if (!selectedAgendamento || !reagendarForm.novaData || !reagendarForm.novaHora) {
      alert("Preencha data e hora!"); return;
    }
    try {
      const novoDiagnostico = selectedAgendamento.diagnostico + 
        `\n[Reagendado em ${format(new Date(), 'dd/MM')}]: ${reagendarForm.motivo || 'Sem motivo'}`;

      const { error } = await supabase.from('agendamentos').update({
        data_agendamento: reagendarForm.novaData,
        hora_agendamento: reagendarForm.novaHora,
        diagnostico: novoDiagnostico,
        status: 'agendado'
      }).eq('id', selectedAgendamento.id);

      if (error) throw error;
      setShowToast({ visible: true, message: 'Reagendado com sucesso!' });
      setSelectedAgendamento(null);
      fetchAgendamentos();
    } catch (error) { alert("Erro ao reagendar"); }
  };

  // NOVA FUNÇÃO: Confirmar Edição de Dados
  const confirmarEdicao = async () => {
    if (!selectedAgendamento || !editForm.nome || !editForm.telefone) {
      alert("Nome e Telefone são obrigatórios!"); return;
    }
    try {
      const { error } = await supabase.from('agendamentos').update({
        nome_paciente: editForm.nome,
        telefone_paciente: editForm.telefone,
        diagnostico: editForm.diagnostico
      }).eq('id', selectedAgendamento.id);

      if (error) throw error;
      setShowToast({ visible: true, message: 'Dados corrigidos com sucesso!' });
      
      // Atualiza o modal localmente para refletir a mudança sem fechar abruptamente
      setSelectedAgendamento({
        ...selectedAgendamento,
        nome_paciente: editForm.nome,
        telefone_paciente: editForm.telefone,
        diagnostico: editForm.diagnostico
      });
      setIsEditing(false);
      fetchAgendamentos();
    } catch (error) { alert("Erro ao salvar edição"); }
  };

  const abrirModal = (item: Agendamento) => {
    setSelectedAgendamento(item);
    setIsReagendando(false);
    setIsEditing(false); // Resetar modo edição
    
    // Preparar formulários
    setReagendarForm({ novaData: '', novaHora: '', motivo: '' });
    setEditForm({ nome: item.nome_paciente, telefone: item.telefone_paciente, diagnostico: item.diagnostico });
  };

  const formatarTelefoneInput = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 11) {
      return numeros.replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2');
    }
    return valor;
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 pb-20">
      
      {/* Header e Filtros (Inalterado) */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div><h1 className="text-2xl font-bold text-gray-800">Agenda de Consultas</h1><p className="text-gray-500 text-sm">Gerencie os atendimentos</p></div>
          <div className="w-full md:w-80 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Buscar por nome ou telefone..." value={busca} onChange={e => setBusca(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm" />
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-4 pt-4 border-t border-gray-50">
          <div className="flex items-center gap-2 lg:w-1/3">
            <div className="relative flex-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><CalendarDays size={16} /></span><input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="w-full pl-9 pr-2 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
            <span className="text-gray-400 text-sm">até</span>
            <div className="relative flex-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><CalendarDays size={16} /></span><input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="w-full pl-9 pr-2 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
          </div>
          <div className="relative flex-1"><Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><select value={filtroMedico} onChange={e => setFiltroMedico(e.target.value)} className="w-full pl-9 pr-8 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none bg-white"><option value="">Todos os Médicos</option>{medicos.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}</select></div>
          <div className="relative flex-1"><ListChecks className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="w-full pl-9 pr-8 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none bg-white"><option value="agendado">A Realizar</option><option value="realizado">Realizados</option><option value="">Todos os Status</option></select></div>
        </div>
      </div>

      {/* Listagem (Inalterado) */}
      {loading ? <div className="text-center py-20 text-gray-500">Carregando...</div> : 
        agendamentosFiltrados.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300"><h3 className="text-gray-600 font-medium">Nenhum agendamento encontrado</h3><p className="text-sm text-gray-500">Verifique os filtros</p></div>
        ) : (
        <div className="space-y-8">
          {Object.entries(grupos).map(([data, itens]) => (
            <div key={data} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3 mb-4 bg-blue-50/50 p-2 rounded-lg w-fit border border-blue-100"><CalendarIcon className="text-blue-600" size={18} /><h2 className="font-bold text-gray-700 capitalize text-sm">{isToday(parseISO(data)) ? 'Hoje' : isTomorrow(parseISO(data)) ? 'Amanhã' : format(parseISO(data), "EEEE, d 'de' MMMM", { locale: ptBR })}</h2></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {itens.map((item) => (
                  <div key={item.id} onClick={() => abrirModal(item)} className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md cursor-pointer relative overflow-hidden group transition-all ${item.status === 'realizado' ? 'opacity-60 bg-gray-50' : ''}`}>
                    <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: item.medicos?.cor_agenda || '#ccc' }} />
                    <div className="pl-3">
                      <div className="flex justify-between mb-2">
                        <span className="flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded text-xs"><Clock size={12} /> {item.hora_agendamento.slice(0, 5)}</span>
                        {item.status === 'realizado' && <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full uppercase tracking-wide">Realizado</span>}
                        {item.status === 'agendado' && <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full uppercase tracking-wide">A Realizar</span>}
                      </div>
                      <h3 className="font-bold text-gray-800 truncate">{item.nome_paciente}</h3>
                      <p className="text-xs text-gray-500 mb-2 truncate">{item.medicos?.nome}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1"><MessageCircle size={10} /> {item.telefone_paciente}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL UNIFICADO --- */}
      {selectedAgendamento && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header Modal */}
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <div className="flex-1">
                {isEditing ? (
                  <h3 className="text-lg font-bold text-blue-600">Editando dados</h3>
                ) : (
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{selectedAgendamento.nome_paciente}</h3>
                    {/* Botão de Editar (Lápis) */}
                    {!isReagendando && selectedAgendamento.status !== 'realizado' && (
                      <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Editar dados">
                        <Edit size={16} />
                      </button>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  {isReagendando ? 'Reagendamento' : isEditing ? 'Corrija as informações abaixo' : 'Detalhes do agendamento'}
                </p>
              </div>
              <button onClick={() => setSelectedAgendamento(null)} className="p-2 hover:bg-gray-200 rounded-full text-gray-400 transition-colors"><X size={20} /></button>
            </div>

            <div className="p-6">
              
              {/* CENÁRIO 1: REAGENDAMENTO */}
              {isReagendando ? (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                  <div><label className="text-sm font-medium text-gray-700 mb-1 block">Nova Data</label><input type="date" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-orange-500" value={reagendarForm.novaData} onChange={e => setReagendarForm({...reagendarForm, novaData: e.target.value})} /></div>
                  <div><label className="text-sm font-medium text-gray-700 mb-1 block">Novo Horário</label><select className="w-full border border-gray-300 rounded-lg p-2.5 outline-none bg-white focus:border-orange-500" value={reagendarForm.novaHora} onChange={e => setReagendarForm({...reagendarForm, novaHora: e.target.value})}>{horariosDisponiveis.map(h => <option key={h} value={h}>{h}</option>)}</select></div>
                  <div><label className="text-sm font-medium text-gray-700 mb-1 block">Motivo</label><textarea className="w-full border border-gray-300 rounded-lg p-2.5 outline-none text-sm focus:border-orange-500" rows={2} value={reagendarForm.motivo} onChange={e => setReagendarForm({...reagendarForm, motivo: e.target.value})} /></div>
                  <div className="flex gap-2 pt-2"><button onClick={() => setIsReagendando(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm">Voltar</button><button onClick={confirmarReagendamento} className="flex-1 bg-orange-600 text-white py-2 rounded-lg text-sm hover:bg-orange-700">Confirmar</button></div>
                </div>
              
              /* CENÁRIO 2: EDIÇÃO DE DADOS */
              ) : isEditing ? (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                   <div><label className="text-sm font-medium text-gray-700 mb-1 block">Nome do Paciente</label><input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500" value={editForm.nome} onChange={e => setEditForm({...editForm, nome: e.target.value})} /></div>
                   <div><label className="text-sm font-medium text-gray-700 mb-1 block">Telefone</label><input type="tel" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500" value={editForm.telefone} onChange={e => setEditForm({...editForm, telefone: formatarTelefoneInput(e.target.value)})} maxLength={15} /></div>
                   <div><label className="text-sm font-medium text-gray-700 mb-1 block">Diagnóstico</label><textarea className="w-full border border-gray-300 rounded-lg p-2.5 outline-none text-sm focus:border-blue-500" rows={3} value={editForm.diagnostico} onChange={e => setEditForm({...editForm, diagnostico: e.target.value})} /></div>
                   <div className="flex gap-2 pt-2"><button onClick={() => setIsEditing(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm">Cancelar</button><button onClick={confirmarEdicao} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center justify-center gap-2"><Save size={16} /> Salvar Correção</button></div>
                </div>

              /* CENÁRIO 3: DETALHES (PADRÃO) */
              ) : (
                <div className="space-y-5">
                  <div className="flex gap-3">
                    <div className="flex-1 bg-blue-50 p-3 rounded-lg text-center border border-blue-100"><span className="block text-[10px] font-bold text-blue-600 uppercase">Data</span><span className="text-base font-bold text-blue-900">{format(parseISO(selectedAgendamento.data_agendamento), 'dd/MM/yyyy')}</span></div>
                    <div className="flex-1 bg-blue-50 p-3 rounded-lg text-center border border-blue-100"><span className="block text-[10px] font-bold text-blue-600 uppercase">Hora</span><span className="text-base font-bold text-blue-900">{selectedAgendamento.hora_agendamento.slice(0, 5)}</span></div>
                  </div>
                  <button onClick={() => { const num = selectedAgendamento.telefone_paciente.replace(/\D/g, ''); window.open(`https://wa.me/55${num}`, '_blank'); }} className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95"><MessageCircle size={18} /> Conversar no WhatsApp</button>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100"><p className="text-xs font-bold text-gray-400 uppercase mb-1">Diagnóstico / Obs</p><p className="text-sm text-gray-700 whitespace-pre-line">{selectedAgendamento.diagnostico || 'Sem observações.'}</p></div>
                  {selectedAgendamento.status !== 'realizado' && (
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => atualizarStatus(selectedAgendamento.id, 'realizado')} className="flex-1 bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"><CheckCircle2 size={16} /> Concluir</button>
                      <button onClick={() => setIsReagendando(true)} className="flex-1 bg-orange-50 text-orange-700 border border-orange-200 font-medium py-2 rounded-lg hover:bg-orange-100 transition-colors flex items-center justify-center gap-2 text-sm"><AlertTriangle size={16} /> Reagendar</button>
                    </div>
                  )}
                  {selectedAgendamento.status !== 'realizado' && (
                     <button onClick={() => { if(confirm('Cancelar agendamento?')) atualizarStatus(selectedAgendamento.id, 'cancelado') }} className="w-full text-xs text-red-400 hover:text-red-600 py-2">Cancelar agendamento</button>
                  )}
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