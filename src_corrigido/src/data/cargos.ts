export interface Cargo {
  id: number;
  cargo: string;
  setor: string;
  ativo: boolean;
}

const cargos: Cargo[] = [
  { id: 1, cargo: "AÇOUGUEIRO", setor: "PERECÍVEIS", ativo: true },
  { id: 2, cargo: "ATEND. REST.", setor: "RESTAURANTE", ativo: true },
  { id: 3, cargo: "AUX SERV. GER.", setor: "ZELADORIA", ativo: true },
  { id: 4, cargo: "AUX. COZINHA", setor: "RESTAURANTE", ativo: true },
  { id: 5, cargo: "B. PADARIA", setor: "PERECÍVEIS", ativo: true },
  { id: 6, cargo: "B. AÇOUGUE", setor: "PERECÍVEIS", ativo: true },
  { id: 7, cargo: "COMERCIAL", setor: "ADMINIST.", ativo: true },
  { id: 8, cargo: "DP", setor: "ADMINIST.", ativo: true },
  { id: 9, cargo: "ENTREGADOR", setor: "AT. CLIENTE", ativo: true },
  { id: 10, cargo: "ESTOQUISTA", setor: "DEPÓSITO", ativo: true },
  { id: 11, cargo: "INVENTÁRIO", setor: "AB. NOTURNO", ativo: true },
  { id: 12, cargo: "J. APRENDIZ", setor: "REPOSITOR", ativo: true },
  { id: 13, cargo: "MOTORISTA", setor: "AT. CLIENTE", ativo: true },
  { id: 14, cargo: "OPERADOR CX.", setor: "CHECKOUT", ativo: true },
  { id: 15, cargo: "PREV. PERDAS", setor: "FISC. DE LOJA", ativo: true },
  { id: 16, cargo: "REPOS. MERC.", setor: "ABASTECIMENTO", ativo: true },
  { id: 17, cargo: "RH", setor: "ADMINIST.", ativo: true },
  { id: 18, cargo: "SEPAR. DE MERC.", setor: "AT. CLIENTE", ativo: true }
];

export default cargos;