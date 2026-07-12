export type TipoContato =
  | "GESTOR"
  | "DIRETORIA"
  | "RH"
  | "DP"
  | "OPERAÇÕES"
  | "FINANCEIRO"
  | "OUTRO";

export type Gestor = {
  id: string;
  codigo: string;
  unidade: string;
  nome: string;
  cargo: string;
  tipoContato: TipoContato;
  telefone: string;
  email: string;
  ativo: boolean;
  recebeDisparoDiario: boolean;
  criadoEm: string;
  atualizadoEm: string;
};

const DATA_BASE = "2026-07-09T17:30:00.000-03:00";

const gestoresIniciais: Gestor[] = [
  {
    id: "gestor-001",
    codigo: "001",
    unidade: "AEROPORTO",
    nome: "LUIZ",
    cargo: "GERENTE DE LOJA",
    tipoContato: "GESTOR",
    telefone: "88993495676",
    email: "",
    ativo: true,
    recebeDisparoDiario: true,
    criadoEm: DATA_BASE,
    atualizadoEm: DATA_BASE,
  },
  {
    id: "gestor-002",
    codigo: "002",
    unidade: "AILTON GOMES",
    nome: "SABRINA",
    cargo: "GERENTE DE LOJA",
    tipoContato: "GESTOR",
    telefone: "88997837520",
    email: "",
    ativo: true,
    recebeDisparoDiario: true,
    criadoEm: DATA_BASE,
    atualizadoEm: DATA_BASE,
  },
  {
    id: "gestor-003",
    codigo: "003",
    unidade: "BARBALHA",
    nome: "FRAN",
    cargo: "GERENTE DE LOJA",
    tipoContato: "GESTOR",
    telefone: "88992206704",
    email: "",
    ativo: true,
    recebeDisparoDiario: true,
    criadoEm: DATA_BASE,
    atualizadoEm: DATA_BASE,
  },
  {
    id: "gestor-004",
    codigo: "004",
    unidade: "BETOLÂNDIA",
    nome: "REGINALDO",
    cargo: "GERENTE DE LOJA",
    tipoContato: "GESTOR",
    telefone: "88988867889",
    email: "",
    ativo: true,
    recebeDisparoDiario: true,
    criadoEm: DATA_BASE,
    atualizadoEm: DATA_BASE,
  },
  {
    id: "gestor-005",
    codigo: "005",
    unidade: "CRATO – OSSIAN ARARIPE",
    nome: "ANA KAROLINY",
    cargo: "GERENTE DE LOJA",
    tipoContato: "GESTOR",
    telefone: "88999113258",
    email: "",
    ativo: true,
    recebeDisparoDiario: true,
    criadoEm: DATA_BASE,
    atualizadoEm: DATA_BASE,
  },
  {
    id: "gestor-006",
    codigo: "006",
    unidade: "CRATO – CENTRO",
    nome: "LEONARDO",
    cargo: "GERENTE DE LOJA",
    tipoContato: "GESTOR",
    telefone: "88996942949",
    email: "",
    ativo: true,
    recebeDisparoDiario: true,
    criadoEm: DATA_BASE,
    atualizadoEm: DATA_BASE,
  },
  {
    id: "gestor-007",
    codigo: "007",
    unidade: "CRATO – SIQUEIRA CAMPOS",
    nome: "ROBERLANHA",
    cargo: "GERENTE DE LOJA",
    tipoContato: "GESTOR",
    telefone: "88992876242",
    email: "",
    ativo: true,
    recebeDisparoDiario: true,
    criadoEm: DATA_BASE,
    atualizadoEm: DATA_BASE,
  },
  {
    id: "gestor-008",
    codigo: "008",
    unidade: "FREI DAMIÃO",
    nome: "GABRIEL",
    cargo: "GERENTE DE LOJA",
    tipoContato: "GESTOR",
    telefone: "88981060116",
    email: "",
    ativo: true,
    recebeDisparoDiario: true,
    criadoEm: DATA_BASE,
    atualizadoEm: DATA_BASE,
  },
  {
    id: "gestor-009",
    codigo: "009",
    unidade: "MISSÃO VELHA",
    nome: "MATHEUS",
    cargo: "GERENTE DE LOJA",
    tipoContato: "GESTOR",
    telefone: "88982311714",
    email: "",
    ativo: true,
    recebeDisparoDiario: true,
    criadoEm: DATA_BASE,
    atualizadoEm: DATA_BASE,
  },
  {
    id: "gestor-010",
    codigo: "010",
    unidade: "PIRAJÁ",
    nome: "JESSICA",
    cargo: "GERENTE DE LOJA",
    tipoContato: "GESTOR",
    telefone: "88992096660",
    email: "",
    ativo: true,
    recebeDisparoDiario: true,
    criadoEm: DATA_BASE,
    atualizadoEm: DATA_BASE,
  },
  {
    id: "gestor-011",
    codigo: "011",
    unidade: "SALESIANO",
    nome: "EDUARDO",
    cargo: "GERENTE DE LOJA",
    tipoContato: "GESTOR",
    telefone: "88997140024",
    email: "",
    ativo: true,
    recebeDisparoDiario: true,
    criadoEm: DATA_BASE,
    atualizadoEm: DATA_BASE,
  },
  {
    id: "gestor-012",
    codigo: "012",
    unidade: "TIRADENTES",
    nome: "JERLANE",
    cargo: "GERENTE DE LOJA",
    tipoContato: "GESTOR",
    telefone: "88999224070",
    email: "",
    ativo: true,
    recebeDisparoDiario: true,
    criadoEm: DATA_BASE,
    atualizadoEm: DATA_BASE,
  },
  {
    id: "gestor-013",
    codigo: "013",
    unidade: "VILA TRÊS MARIAS",
    nome: "ÂNGELO",
    cargo: "GERENTE DE LOJA",
    tipoContato: "GESTOR",
    telefone: "88981749927",
    email: "",
    ativo: true,
    recebeDisparoDiario: true,
    criadoEm: DATA_BASE,
    atualizadoEm: DATA_BASE,
  },
];

export default gestoresIniciais;