export type TelaGestor =
  | "HOME"
  | "SOLICITACAO"
  | "CONFIRMACAO"
  | "HISTORICO"
  | "SEM_SOLICITACAO";

export type Emergencia =
  | "SIM"
  | "NÃO";

export type ItemSolicitacao = {
  id: string;
  tipo: string;
  cargo: string;
  quantidade: number;
  turno: string;
  motivo: string;
  emergencia: Emergencia;
};

export type SolicitacaoGestor = {
  id: string;
  protocolo: string;
  codigoGestor: string;
  gestor: string;
  unidade: string;
  itens: ItemSolicitacao[];
  totalVagas: number;
  dataResposta: string;
  status:
    | "RECEBIDA"
    | "PROCESSANDO"
    | "CADASTRADA";
};

export type RespostaSemSolicitacao = {
  id: string;
  codigoGestor: string;
  gestor: string;
  unidade: string;
  dataResposta: string;
  status: "SEM_SOLICITACAO";
};

export type GestorPortal = {
  codigo: string;
  nome: string;
  unidade: string;
  ativo: boolean;
};

export type StatusMonitor =
  | "RECEBIDA"
  | "PROCESSANDO"
  | "CADASTRADA"
  | "ARQUIVADA";

export type RegistroMonitor = {
  id: string;
  codigoGestor: string;
  gestor: string;
  unidade: string;
  tipo: string;
  cargo: string;
  quantidade: number;
  turno: string;
  motivo: string;
  emergencia: string;
  dataResposta: string;
  atualizado?: boolean;
  status?: StatusMonitor;
};
