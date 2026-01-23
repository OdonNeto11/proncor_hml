// Esse arquivo define os "formatos" dos dados para o TypeScript não reclamar
export type NovoAgendamento = {
  data_agendamento: string;
  hora_agendamento: string;
  nome_paciente: string;
  telefone_paciente: string;
  diagnostico: string;
  medico_responsavel: string;
};