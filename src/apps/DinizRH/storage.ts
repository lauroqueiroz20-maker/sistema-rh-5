import {
  supabase,
} from "./supabase";

import type {
  RegistroMonitor,
  RespostaSemSolicitacao,
  SolicitacaoGestor,
  StatusMonitor,
} from "./types";

const CHAVE_SOLICITACOES =
  "diniz-rh-solicitacoes";

const CHAVE_SEM_SOLICITACAO =
  "diniz-rh-sem-solicitacao";

const CHAVE_MONITOR =
  "sistema-rh-monitor-gestores";

const CHAVE_MONITOR_ARQUIVADOS =
  "sistema-rh-monitor-gestores-arquivados";

type ItemSolicitacaoRemoto = {
  id?: unknown;
  tipo?: unknown;
  cargo?: unknown;
  quantidade?: unknown;
  turno?: unknown;
  motivo?: unknown;
  emergencia?: unknown;
};

type SolicitacaoRemota = {
  id: string;
  codigo_gestor: string | null;
  gestor: string | null;
  unidade: string | null;
  itens: unknown;
  data_resposta: string | null;
  status: StatusMonitor | null;
};

type SolicitacaoArquivamentoRemota = {
  id: string;
  itens: unknown;
};

type SolicitacaoLocal = {
  id: string;
  protocolo: string;
  codigoGestor: string;
  gestor: string;
  unidade: string;
  itens: unknown[];
  totalVagas: number;
  dataResposta: string;
  status: StatusMonitor;
};

function normalizarTexto(
  valor: string
): string {
  return String(valor || "")
    .trim()
    .toLocaleUpperCase(
      "pt-BR"
    );
}

function carregarLista<T>(
  chave: string
): T[] {
  try {
    const dadosSalvos =
      localStorage.getItem(
        chave
      );

    if (!dadosSalvos) {
      return [];
    }

    const dadosConvertidos:
      unknown =
      JSON.parse(
        dadosSalvos
      );

    return Array.isArray(
      dadosConvertidos
    )
      ? (
          dadosConvertidos as T[]
        )
      : [];
  } catch {
    return [];
  }
}

export function carregarSolicitacoes():
  SolicitacaoGestor[] {
  return carregarLista<
    SolicitacaoGestor
  >(
    CHAVE_SOLICITACOES
  );
}

export function carregarSolicitacoesPorGestor(
  codigoGestor: string,
  unidade?: string
): SolicitacaoGestor[] {
  const codigoNormalizado =
    normalizarTexto(
      codigoGestor
    );

  const unidadeNormalizada =
    normalizarTexto(
      unidade || ""
    );

  return carregarSolicitacoes()
    .filter(
      (solicitacao) => {
        const mesmoGestor =
          normalizarTexto(
            solicitacao.codigoGestor
          ) ===
          codigoNormalizado;

        if (
          !unidadeNormalizada
        ) {
          return mesmoGestor;
        }

        const mesmaUnidade =
          normalizarTexto(
            solicitacao.unidade
          ) ===
          unidadeNormalizada;

        return (
          mesmoGestor &&
          mesmaUnidade
        );
      }
    )
    .sort(
      (a, b) =>
        new Date(
          b.dataResposta
        ).getTime() -
        new Date(
          a.dataResposta
        ).getTime()
    );
}

export function salvarSolicitacoes(
  solicitacoes:
    SolicitacaoGestor[]
) {
  localStorage.setItem(
    CHAVE_SOLICITACOES,
    JSON.stringify(
      solicitacoes
    )
  );
}

export function carregarMonitor():
  RegistroMonitor[] {
  return carregarLista<
    RegistroMonitor
  >(
    CHAVE_MONITOR
  );
}

export function salvarMonitor(
  registros:
    RegistroMonitor[]
) {
  localStorage.setItem(
    CHAVE_MONITOR,
    JSON.stringify(
      registros
    )
  );

  window.dispatchEvent(
    new CustomEvent(
      "sistema-rh-monitor-atualizado",
      {
        detail:
          registros,
      }
    )
  );
}

function textoRemoto(
  valor: unknown
): string {
  return String(valor ?? "").trim();
}

function obterItensRemotos(
  itens: unknown
): ItemSolicitacaoRemoto[] {
  if (!Array.isArray(itens)) {
    return [];
  }

  return itens.filter(
    (item): item is ItemSolicitacaoRemoto =>
      typeof item === "object" &&
      item !== null
  );
}

function converterSolicitacaoRemota(
  solicitacao: SolicitacaoRemota
): RegistroMonitor[] {
  if (
    solicitacao.status ===
    "ARQUIVADA"
  ) {
    return [];
  }

  return obterItensRemotos(
    solicitacao.itens
  ).map((item, indice) => ({
    id:
      textoRemoto(item.id) ||
      `${solicitacao.id}-${indice}`,
    codigoGestor:
      textoRemoto(
        solicitacao.codigo_gestor
      ),
    gestor:
      textoRemoto(
        solicitacao.gestor
      ),
    unidade:
      textoRemoto(
        solicitacao.unidade
      ),
    tipo: textoRemoto(item.tipo),
    cargo: textoRemoto(item.cargo),
    quantidade:
      Number(item.quantidade) || 0,
    turno: textoRemoto(item.turno),
    motivo: textoRemoto(item.motivo),
    emergencia:
      textoRemoto(item.emergencia) ||
      "NÃO",
    dataResposta:
      textoRemoto(
        solicitacao.data_resposta
      ),
    atualizado:
      solicitacao.status !==
      "RECEBIDA",
    status:
      solicitacao.status ||
      "RECEBIDA",
  }));
}

function converterSolicitacaoLocal(
  solicitacao: SolicitacaoLocal
): RegistroMonitor[] {
  if (
    solicitacao.status ===
    "ARQUIVADA"
  ) {
    return [];
  }

  return obterItensRemotos(
    solicitacao.itens
  ).map((item, indice) => ({
    id:
      textoRemoto(item.id) ||
      `${solicitacao.id}-${indice}`,
    codigoGestor:
      textoRemoto(
        solicitacao.codigoGestor
      ),
    gestor:
      textoRemoto(
        solicitacao.gestor
      ),
    unidade:
      textoRemoto(
        solicitacao.unidade
      ),
    tipo: textoRemoto(item.tipo),
    cargo: textoRemoto(item.cargo),
    quantidade:
      Number(item.quantidade) || 0,
    turno: textoRemoto(item.turno),
    motivo: textoRemoto(item.motivo),
    emergencia:
      textoRemoto(item.emergencia) ||
      "NÃO",
    dataResposta:
      textoRemoto(
        solicitacao.dataResposta
      ),
    atualizado:
      solicitacao.status !==
      "RECEBIDA",
    status:
      solicitacao.status ||
      "RECEBIDA",
  }));
}

function mesclarMonitorRemoto(
  remotos: RegistroMonitor[]
): RegistroMonitor[] {
  const locais = carregarMonitor();
  const idsArquivados =
    new Set(
      carregarLista<string>(
        CHAVE_MONITOR_ARQUIVADOS
      )
    );

  const locaisPorId =
    new Map(
      locais.map((registro) => [
        registro.id,
        registro,
      ])
    );

  const idsRemotos =
    new Set(
      remotos.map(
        (registro) => registro.id
      )
    );

  const remotosMesclados =
    remotos.map((registro) => {
      const local =
        locaisPorId.get(
          registro.id
        );

      if (!local) {
        return registro;
      }

      return {
        ...registro,
        atualizado:
          local.atualizado ??
          registro.atualizado,
        status:
          local.status ??
          registro.status,
      };
    });

  const apenasLocais =
    locais.filter(
      (registro) =>
        !idsRemotos.has(
          registro.id
        )
    );

  const registros = [
    ...remotosMesclados,
    ...apenasLocais,
  ].filter(
    (registro) =>
      !idsArquivados.has(
        registro.id
      )
  );

  salvarMonitor(registros);

  return registros;
}

function salvarIdsArquivados(
  ids: string[]
) {
  localStorage.setItem(
    CHAVE_MONITOR_ARQUIVADOS,
    JSON.stringify(ids)
  );
}

function removerRegistroLocal(
  id: string
) {
  const idsArquivados =
    new Set(
      carregarLista<string>(
        CHAVE_MONITOR_ARQUIVADOS
      )
    );

  idsArquivados.add(id);

  salvarIdsArquivados([
    ...idsArquivados,
  ]);

  salvarMonitor(
    carregarMonitor().filter(
      (registro) =>
        registro.id !== id
    )
  );
}

async function arquivarNoSupabase(
  id: string
): Promise<void> {
  const { data, error: erroBusca } =
    await supabase
      .from("solicitacoes")
      .select("id,itens");

  if (erroBusca) {
    throw new Error(
      erroBusca.message
    );
  }

  const solicitacao =
    (
      (data ?? []) as SolicitacaoArquivamentoRemota[]
    ).find((item) =>
      obterItensRemotos(item.itens)
        .some(
          (registro) =>
            textoRemoto(
              registro.id
            ) === id
        )
    );

  if (!solicitacao) {
    return;
  }

  const { error } =
    await supabase
      .from("solicitacoes")
      .update({
        status: "ARQUIVADA",
      })
      .eq("id", solicitacao.id);

  if (error) {
    throw new Error(
      error.message
    );
  }
}

export async function arquivarRegistroMonitor(
  id: string
): Promise<void> {
  removerRegistroLocal(id);

  try {
    await arquivarNoSupabase(id);
  } catch (erro) {
    console.warn(
      "Falha ao arquivar no Supabase:",
      erro
    );
  }
}

export async function carregarMonitorRemoto():
  Promise<RegistroMonitor[]> {
  const registrosLocais =
    await carregarMonitorServidorLocal()
      .catch(() => []);

  const { data, error } =
    await supabase
      .from("solicitacoes")
      .select(
        "id,codigo_gestor,gestor,unidade,itens,data_resposta,status"
      )
      .order("data_resposta", {
        ascending: false,
      });

  if (error) {
    throw new Error(error.message);
  }

  const registros =
    [
      ...registrosLocais,
      ...((data ?? []) as SolicitacaoRemota[])
        .flatMap(
          converterSolicitacaoRemota
        ),
    ];

  return mesclarMonitorRemoto(
    registros
  );
}

async function carregarMonitorServidorLocal():
  Promise<RegistroMonitor[]> {
  const resposta =
    await fetch(
      "/api/solicitacoes",
      {
        method: "GET",
        cache: "no-store",
      }
    );

  if (!resposta.ok) {
    return [];
  }

  const dados: unknown =
    await resposta.json();

  if (!Array.isArray(dados)) {
    return [];
  }

  return (
    dados as SolicitacaoLocal[]
  ).flatMap(
    converterSolicitacaoLocal
  );
}

async function salvarNoServidorLocal(
  solicitacao:
    SolicitacaoGestor
): Promise<void> {
  const resposta =
    await fetch(
      "/api/solicitacoes",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(
          solicitacao
        ),
      }
    );

  if (!resposta.ok) {
    throw new Error(
      "Falha ao salvar no servidor local"
    );
  }
}

function enviarParaMonitor(
  solicitacao:
    SolicitacaoGestor
) {
  const monitorAtual =
    carregarMonitor();

  const novosRegistros:
    RegistroMonitor[] =
    solicitacao.itens.map(
      (item) => ({
        id: item.id,
        codigoGestor:
          solicitacao.codigoGestor,
        gestor:
          solicitacao.gestor,
        unidade:
          solicitacao.unidade,
        tipo:
          item.tipo,
        cargo:
          item.cargo,
        quantidade:
          Number(
            item.quantidade
          ),
        turno:
          item.turno,
        motivo:
          item.motivo,
        emergencia:
          item.emergencia,
        dataResposta:
          solicitacao.dataResposta,
        atualizado:
          false,
      })
    );

  const idsExistentes =
    new Set(
      monitorAtual.map(
        (item) =>
          item.id
      )
    );

  const registrosSemDuplicar =
    novosRegistros.filter(
      (item) =>
        !idsExistentes.has(
          item.id
        )
    );

  salvarMonitor([
    ...monitorAtual,
    ...registrosSemDuplicar,
  ]);
}

async function salvarNoSupabase(
  solicitacao:
    SolicitacaoGestor
): Promise<void> {
  const {
    error,
  } = await supabase
    .from(
      "solicitacoes"
    )
    .insert({
      id:
        solicitacao.id,
      protocolo:
        solicitacao.protocolo,
      codigo_gestor:
        solicitacao.codigoGestor,
      gestor:
        solicitacao.gestor,
      unidade:
        solicitacao.unidade,
      itens:
        solicitacao.itens,
      total_vagas:
        solicitacao.totalVagas,
      data_resposta:
        solicitacao.dataResposta,
      status:
        solicitacao.status,
    });

  if (error) {
    console.error(
      "Erro ao salvar no Supabase:",
      error
    );

    throw new Error(
      error.message
    );
  }
}

export async function adicionarSolicitacao(
  solicitacao:
    SolicitacaoGestor
): Promise<void> {
  const lista =
    carregarSolicitacoes();

  const jaExiste =
    lista.some(
      (item) =>
        item.id ===
        solicitacao.id
    );

  if (jaExiste) {
    return;
  }

  salvarSolicitacoes([
    solicitacao,
    ...lista,
  ]);

  enviarParaMonitor(
    solicitacao
  );

  try {
    await salvarNoServidorLocal(
      solicitacao
    );
  } catch {
    await salvarNoSupabase(
      solicitacao
    );
    return;
  }

  salvarNoSupabase(
    solicitacao
  ).catch((erro: unknown) => {
    console.warn(
      "Falha ao sincronizar Supabase:",
      erro
    );
  });
}

export function carregarRespostasSemSolicitacao():
  RespostaSemSolicitacao[] {
  return carregarLista<
    RespostaSemSolicitacao
  >(
    CHAVE_SEM_SOLICITACAO
  );
}

export function carregarRespostasSemSolicitacaoPorGestor(
  codigoGestor: string,
  unidade?: string
): RespostaSemSolicitacao[] {
  const codigoNormalizado =
    normalizarTexto(
      codigoGestor
    );

  const unidadeNormalizada =
    normalizarTexto(
      unidade || ""
    );

  return carregarRespostasSemSolicitacao()
    .filter(
      (resposta) => {
        const mesmoGestor =
          normalizarTexto(
            resposta.codigoGestor
          ) ===
          codigoNormalizado;

        if (
          !unidadeNormalizada
        ) {
          return mesmoGestor;
        }

        const mesmaUnidade =
          normalizarTexto(
            resposta.unidade
          ) ===
          unidadeNormalizada;

        return (
          mesmoGestor &&
          mesmaUnidade
        );
      }
    )
    .sort(
      (a, b) =>
        new Date(
          b.dataResposta
        ).getTime() -
        new Date(
          a.dataResposta
        ).getTime()
    );
}

export function salvarRespostasSemSolicitacao(
  respostas:
    RespostaSemSolicitacao[]
) {
  localStorage.setItem(
    CHAVE_SEM_SOLICITACAO,
    JSON.stringify(
      respostas
    )
  );
}

export function registrarSemSolicitacao(
  resposta:
    RespostaSemSolicitacao
): Promise<void> {
  const lista =
    carregarRespostasSemSolicitacao();

  const jaExiste =
    lista.some(
      (item) =>
        item.id ===
        resposta.id
    );

  if (jaExiste) {
    return Promise.resolve();
  }

  salvarRespostasSemSolicitacao([
    resposta,
    ...lista,
  ]);

  return adicionarSolicitacao({
    id: resposta.id,
    protocolo: resposta.id,
    codigoGestor:
      resposta.codigoGestor,
    gestor: resposta.gestor,
    unidade: resposta.unidade,
    itens: [
      {
        id: `${resposta.id}-sem-vaga`,
        tipo: "SEM SOLICITAÇÃO",
        cargo: "SEM SOLICITAÇÃO",
        quantidade: 0,
        turno: "NÃO SE APLICA",
        motivo: "SEM SOLICITAÇÃO",
        emergencia: "NÃO",
      },
    ],
    totalVagas: 0,
    dataResposta:
      resposta.dataResposta,
    status: "RECEBIDA",
  });
}
