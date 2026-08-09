import * as XLSX from "xlsx";

import type { Vaga } from "../data/vagas";
import type { RegistroAdmitido } from "../components/Admitidos/Admitidos";

type LinhaExcel = Record<string, unknown>;

export type ResultadoImportacaoExcel = {
  vagas: Vaga[];
  admitidos: RegistroAdmitido[];
  totalLinhasLidas: number;
  totalVagasImportadas: number;
  totalAdmitidosImportados: number;
  avisos: string[];
};

const CODIGOS_UNIDADES: Record<string, string> = {
  AEROPORTO: "001",
  "AILTON GOMES": "002",
  BARBALHA: "003",
  BETOLANDIA: "004",
  "CRATO OSSIAN": "005",
  "CRATO OSSIAN ARARIPE": "005",
  "OSSIAN ARARIPE": "005",
  "CRATO CENTRO": "006",
  "CRATO SIQUEIRA CAMPOS": "007",
  "SIQUEIRA CAMPOS": "007",
  "FREI DAMIAO": "008",
  SALESIANO: "009",
  SALESIANOS: "009",
  TIRADENTES: "010",
  PIRAJA: "011",
  "MISSAO VELHA": "012",
  "VILA TRES MARIAS": "013",
  "VL TRES MARIAS": "013",
};

function normalizarTexto(valor: unknown) {
  return String(valor ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ");
}

function obterValor(
  linha: LinhaExcel,
  nomesPossiveis: string[],
) {
  const entradas = Object.entries(linha);

  for (const nome of nomesPossiveis) {
    const nomeNormalizado = normalizarTexto(nome);

    const encontrada = entradas.find(
      ([chave]) =>
        normalizarTexto(chave) === nomeNormalizado,
    );

    if (encontrada) {
      return encontrada[1];
    }
  }

  return undefined;
}

function formatarData(valor: unknown) {
  if (!valor) {
    return "";
  }

  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    return valor.toLocaleDateString("pt-BR");
  }

  if (typeof valor === "number") {
    const data = XLSX.SSF.parse_date_code(valor);

    if (data) {
      return `${String(data.d).padStart(2, "0")}/${String(
        data.m,
      ).padStart(2, "0")}/${data.y}`;
    }
  }

  const texto = String(valor).trim();

  const formatoBrasileiro = texto.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/,
  );

  if (formatoBrasileiro) {
    const [, dia, mes, ano] = formatoBrasileiro;

    return `${dia.padStart(2, "0")}/${mes.padStart(
      2,
      "0",
    )}/${ano}`;
  }

  const formatoIso = texto.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})/,
  );

  if (formatoIso) {
    const [, ano, mes, dia] = formatoIso;

    return `${dia.padStart(2, "0")}/${mes.padStart(
      2,
      "0",
    )}/${ano}`;
  }

  return texto;
}

function converterNumero(
  valor: unknown,
  valorPadrao = 0,
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return valorPadrao;
  }

  if (typeof valor === "number") {
    return Number.isFinite(valor)
      ? valor
      : valorPadrao;
  }

  const convertido = Number(
    String(valor)
      .replace(/\./g, "")
      .replace(",", ".")
      .trim(),
  );

  return Number.isFinite(convertido)
    ? convertido
    : valorPadrao;
}

function normalizarUnidade(valor: unknown) {
  const unidade = normalizarTexto(valor)
    .replace(/^LOJA\s+/, "")
    .replace(/^UNIDADE\s+/, "")
    .replace(/\s*-\s*/g, " ")
    .trim();

  if (unidade === "CRATO OSSIAN ARARIPE") {
    return "CRATO OSSIAN";
  }

  if (unidade === "CRATO SIQUEIRA CAMPOS") {
    return "CRATO SIQUEIRA";
  }

  if (unidade === "VILA TRES MARIAS") {
    return "VL. TRÊS MARIAS";
  }

  if (unidade === "MISSAO VELHA") {
    return "MISSÃO VELHA";
  }

  if (unidade === "FREI DAMIAO") {
    return "FREI DAMIÃO";
  }

  if (unidade === "PIRAJA") {
    return "PIRAJÁ";
  }

  if (unidade === "BETOLANDIA") {
    return "BETOLÂNDIA";
  }

  return String(valor ?? "")
    .trim()
    .toUpperCase();
}

function obterCodigoUnidade(unidade: string) {
  const chave = normalizarTexto(unidade)
    .replace(/[.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return CODIGOS_UNIDADES[chave] || "";
}

function normalizarTurno(
  valor: unknown,
): "D" | "N" | "ESTÁVEL" {
  const turno = normalizarTexto(valor);

  if (
    turno === "N" ||
    turno.includes("NOTURNO") ||
    turno.includes("NOITE")
  ) {
    return "N";
  }

  return "D";
}

function normalizarEmergencia(
  valor: unknown,
): "SIM" | "NÃO" {
  const texto = normalizarTexto(valor);

  return texto === "SIM" ||
    texto === "S" ||
    texto === "URGENTE"
    ? "SIM"
    : "NÃO";
}

function normalizarMotivo(valor: unknown) {
  const motivo = normalizarTexto(valor);

  const mapa: Record<string, string> = {
    DESLIGAMENTO: "DESLIG.",
    DEMISSAO: "DEMISSÃO",
    SUBSTITUICAO: "SUBST.",
    PROMOCAO: "PROMO.",
    REMANEJAMENTO: "REMANEJ.",
    EXPANSAO: "EXPANSÃO",
    AUMENTO: "A. QUADRO",
    "AUMENTO DE QUADRO": "A. QUADRO",
    AFASTAMENTO: "AFAST.",
    ESTAVEL: "ESTÁVEL",
  };

  return mapa[motivo] || motivo || "DESLIG.";
}

function normalizarCargo(valor: unknown) {
  const cargo = normalizarTexto(valor);

  const mapa: Record<string, string> = {
    "OPERADOR DE CAIXA": "OPERADOR CX.",
    "OPERADOR CAIXA": "OPERADOR CX.",
    REPOSITOR: "REPOS. MERC.",
    "REPOSITOR DE MERCADORIAS": "REPOS. MERC.",
    "AUXILIAR DE LIMPEZA": "AUX SERV. GER.",
    "AUXILIAR DE SERVICOS GERAIS": "AUX SERV. GER.",
    "BALCONISTA DE ACOUGUE": "B. AÇOUGUE",
    "BALCONISTA ACOUGUE": "B. AÇOUGUE",
    "BALCONISTA DE PADARIA": "B. PADARIA",
    "FISCAL DE LOJA": "PREV. PERDAS",
    "PREVENCAO DE PERDAS": "PREV. PERDAS",
    "JOVEM APRENDIZ": "J. APRENDIZ",
  };

  return mapa[cargo] || cargo;
}

function inferirTipo(
  tipoInformado: unknown,
  cargoInformado: unknown,
) {
  const tipo = normalizarTexto(tipoInformado);
  const cargo = normalizarTexto(cargoInformado);

  if (tipo) {
    if (tipo.includes("APRENDIZ")) {
      return "J. APRENDIZ";
    }

    if (tipo.includes("INVENTARIO")) {
      return "INVENTÁRIO";
    }

    if (tipo === "PCD") {
      return "PCD";
    }

    if (tipo === "ADM") {
      return "ADM";
    }

    if (tipo === "ESTAVEL") {
      return "ESTÁVEL";
    }

    return tipo;
  }

  if (cargo.includes("APRENDIZ")) {
    return "J. APRENDIZ";
  }

  if (cargo.includes("INVENTARIO")) {
    return "INVENTÁRIO";
  }

  if (cargo === "PCD") {
    return "PCD";
  }

  if (
    cargo.includes("ASSISTENTE") ||
    cargo.includes("AUXILIAR ADMINISTRATIVO") ||
    cargo.includes("ANALISTA") ||
    cargo === "RH" ||
    cargo === "DP" ||
    cargo === "COMERCIAL"
  ) {
    return "ADM";
  }

  return "OPERAC.";
}

function inferirSetor(
  setorInformado: unknown,
  cargoInformado: unknown,
) {
  const setor = normalizarTexto(setorInformado);

  if (setor) {
    return setor;
  }

  const cargo = normalizarCargo(cargoInformado);

  const mapa: Record<string, string> = {
    "OPERADOR CX.": "CHECKOUT",
    "REPOS. MERC.": "ABASTECIM.",
    "AUX SERV. GER.": "ZELADORIA",
    "B. AÇOUGUE": "PERECÍVEIS",
    "B. PADARIA": "PERECÍVEIS",
    "PREV. PERDAS": "FISC. DE LOJA",
    ESTOQUISTA: "DEPÓSITO",
    "J. APRENDIZ": "REPOSITOR",
    INVENTÁRIO: "INVENTÁRIO",
  };

  return mapa[cargo] || "";
}

function encontrarPlanilhaDados(
  workbook: XLSX.WorkBook,
) {
  const nomePreferencial =
    workbook.SheetNames.find(
      (nome) =>
        normalizarTexto(nome) === "DADOS",
    ) || workbook.SheetNames[0];

  const planilha =
    workbook.Sheets[nomePreferencial];

  if (!planilha) {
    throw new Error(
      "Nenhuma planilha foi encontrada no arquivo.",
    );
  }

  return planilha;
}

function localizarLinhaCabecalho(
  matriz: unknown[][],
) {
  const limite = Math.min(matriz.length, 20);

  for (let indice = 0; indice < limite; indice += 1) {
    const linha = matriz[indice] || [];
    const textoLinha = linha
      .map((valor) => normalizarTexto(valor))
      .join(" | ");

    const possuiUnidade =
      textoLinha.includes("LOJA") ||
      textoLinha.includes("UNIDADE") ||
      textoLinha.includes("O");

    const possuiCargo =
      textoLinha.includes("CARGO");

    const possuiQuantidade =
      textoLinha.includes("QTD VAGAS") ||
      textoLinha.includes("QUANTIDADE") ||
      textoLinha.includes("VAGAS");

    if (
      possuiUnidade &&
      possuiCargo &&
      possuiQuantidade
    ) {
      return indice;
    }
  }

  throw new Error(
    "Não foi possível localizar o cabeçalho da planilha.",
  );
}

function converterLinhaParaRegistros(
  linha: LinhaExcel,
  proximoIdInicial: number,
) {
  const unidade = normalizarUnidade(
    obterValor(linha, [
      "Loja",
      "Unidade",
      "o",
    ]),
  );

  const cargo = normalizarCargo(
    obterValor(linha, ["Cargo"]),
  );

  const quantidade = Math.max(
    0,
    Math.trunc(
      converterNumero(
        obterValor(linha, [
          "Qtd Vagas",
          "Quantidade",
          "Vagas",
        ]),
      ),
    ),
  );

  if (!unidade || !cargo || quantidade <= 0) {
    return {
      vagas: [] as Vaga[],
      admitidos: [] as RegistroAdmitido[],
      proximoId: proximoIdInicial,
      ignorada: true,
    };
  }

  const codigo = obterCodigoUnidade(unidade);

  if (!codigo) {
    return {
      vagas: [] as Vaga[],
      admitidos: [] as RegistroAdmitido[],
      proximoId: proximoIdInicial,
      ignorada: true,
      aviso: `Unidade não reconhecida: ${unidade}.`,
    };
  }

  const dataSolicitacao =
    formatarData(
      obterValor(linha, [
        "Data",
        "Data Solicitação",
        "Data Solicitacao",
      ]),
    ) ||
    new Date().toLocaleDateString("pt-BR");

  const dataAdmissao = formatarData(
    obterValor(linha, [
      "Data Fechamento",
      "Data Admissão",
      "Data Admissao",
    ]),
  );

  const totalAdmitidos = Math.min(
    quantidade,
    Math.max(
      0,
      Math.trunc(
        converterNumero(
          obterValor(linha, [
            "Admitidos Operacional",
            "Admitidos",
            "Admissões",
            "Admissoes",
          ]),
        ),
      ),
    ),
  );

  const tipo = inferirTipo(
    obterValor(linha, ["Tipo"]),
    cargo,
  );

  const setor = inferirSetor(
    obterValor(linha, ["Setor"]),
    cargo,
  );

  const turno = normalizarTurno(
    obterValor(linha, [
      "Horário",
      "Horario",
      "Turno",
    ]),
  );

  const motivo = normalizarMotivo(
    obterValor(linha, ["Motivo"]),
  );

  const emergencia = normalizarEmergencia(
    obterValor(linha, [
      "Prioridade Emergencial",
      "Emergência",
      "Emergencia",
    ]),
  );

  const vagas: Vaga[] = [];
  const admitidos: RegistroAdmitido[] = [];

  let proximoId = proximoIdInicial;

  for (
    let indice = 0;
    indice < quantidade;
    indice += 1
  ) {
    const foiAdmitida = indice < totalAdmitidos;

    const vaga: Vaga = {
      id: proximoId,
      codigo,
      unidade,
      data: dataSolicitacao,
      quantidade: 1,
      tipo,
      cargo,
      setor,
      turno,
      motivo,
      emergencia,
      admissoes: foiAdmitida ? 1 : 0,
      ativo: !foiAdmitida,
    };

    if (foiAdmitida) {
      admitidos.push({
        ...vaga,
        quantidade: 1,
        admissoes: 1,
        ativo: false,
        dataAdmissao:
          dataAdmissao || dataSolicitacao,
      });
    } else {
      vagas.push(vaga);
    }

    proximoId += 1;
  }

  return {
    vagas,
    admitidos,
    proximoId,
    ignorada: false,
  };
}

export async function importarPlanilhaExcel(
  arquivo: File,
  proximoIdInicial = 1,
): Promise<ResultadoImportacaoExcel> {
  const nomeArquivo =
    arquivo.name.toLowerCase();

  const extensaoValida =
    nomeArquivo.endsWith(".xlsx") ||
    nomeArquivo.endsWith(".xlsm") ||
    nomeArquivo.endsWith(".xls");

  if (!extensaoValida) {
    throw new Error(
      "Selecione um arquivo Excel válido (.xlsx, .xlsm ou .xls).",
    );
  }

  const buffer = await arquivo.arrayBuffer();

  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
  });

  const planilha =
    encontrarPlanilhaDados(workbook);

  const matriz = XLSX.utils.sheet_to_json<
    unknown[]
  >(planilha, {
    header: 1,
    defval: "",
    raw: true,
  });

  const linhaCabecalho =
    localizarLinhaCabecalho(matriz);

  const linhas = XLSX.utils.sheet_to_json<
    LinhaExcel
  >(planilha, {
    range: linhaCabecalho,
    defval: "",
    raw: true,
  });

  const vagas: Vaga[] = [];
  const admitidos: RegistroAdmitido[] = [];
  const avisos: string[] = [];

  let proximoId = Math.max(
    1,
    Math.trunc(proximoIdInicial),
  );

  let totalLinhasLidas = 0;

  for (const linha of linhas) {
    totalLinhasLidas += 1;

    const resultado =
      converterLinhaParaRegistros(
        linha,
        proximoId,
      );

    proximoId = resultado.proximoId;

    if (resultado.aviso) {
      avisos.push(resultado.aviso);
    }

    if (resultado.ignorada) {
      continue;
    }

    vagas.push(...resultado.vagas);
    admitidos.push(...resultado.admitidos);
  }

  if (
    vagas.length === 0 &&
    admitidos.length === 0
  ) {
    throw new Error(
      "Nenhuma vaga válida foi encontrada na planilha.",
    );
  }

  return {
    vagas,
    admitidos,
    totalLinhasLidas,
    totalVagasImportadas:
      vagas.length + admitidos.length,
    totalAdmitidosImportados:
      admitidos.length,
    avisos: Array.from(new Set(avisos)),
  };
}