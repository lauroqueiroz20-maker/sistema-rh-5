export type ItemMetricaRecrutamento = {
  nome: string;
  valor: number;
};

export type MetricasRecrutamento = {
  funil: ItemMetricaRecrutamento[];
  fontes: ItemMetricaRecrutamento[];
  recusaGestao: ItemMetricaRecrutamento[];
  desistencias: ItemMetricaRecrutamento[];
  divisaoDesistencia: ItemMetricaRecrutamento[];
};

export type RegistroSemanalRecrutamento = {
  id: string;
  data: string;
  curriculosRecebidos: number;
  entrevistasRh: number;
  enviadosGestores: number;
  aprovadosGestores: number;
  emProcesso: number;
  asoFinalizados: number;
};

export const CHAVE_METRICAS_RECRUTAMENTO =
  "sistema-rh-metricas-recrutamento";

export const EVENTO_METRICAS_RECRUTAMENTO =
  "sistema-rh-metricas-recrutamento-atualizadas";

export const CHAVE_HISTORICO_RECRUTAMENTO =
  "sistema-rh-historico-recrutamento";

const motivosPerdaPadrao: ItemMetricaRecrutamento[] = [
  { nome: "Remuneração e benefícios", valor: 0 },
  { nome: "Aderência à vaga", valor: 0 },
  { nome: "Experiência e qualificação", valor: 0 },
  { nome: "Disponibilidade e localização", valor: 0 },
  { nome: "Condução do processo", valor: 0 },
];

export const metricasRecrutamentoPadrao: MetricasRecrutamento = {
  funil: [
    { nome: "Curriculos recebidos", valor: 0 },
    { nome: "Entrevista RH", valor: 0 },
    { nome: "Enviados aos gestores", valor: 0 },
    { nome: "Aprovados pelos gestores", valor: 0 },
    { nome: "Em processo", valor: 0 },
    { nome: "ASO finalizado", valor: 0 },
  ],
  fontes: [
    { nome: "Outros", valor: 58 },
    { nome: "Indicacao", valor: 46 },
    { nome: "Banco de curriculos", valor: 34 },
    { nome: "Agencia", valor: 10 },
  ],
  recusaGestao: motivosPerdaPadrao.map((item) => ({ ...item })),
  desistencias: motivosPerdaPadrao.map((item) => ({ ...item })),
  divisaoDesistencia: [
    { nome: "Gestão", valor: 0 },
    { nome: "Candidato", valor: 0 },
  ],
};

const numeroNaoNegativo = (valor: unknown) =>
  Math.max(0, Number(valor || 0));

function registroSemanalValido(
  registro: unknown
): registro is RegistroSemanalRecrutamento {
  if (typeof registro !== "object" || registro === null) {
    return false;
  }

  const candidato = registro as Partial<RegistroSemanalRecrutamento>;
  return typeof candidato.id === "string" && typeof candidato.data === "string";
}

export function carregarHistoricoRecrutamento(): RegistroSemanalRecrutamento[] {
  try {
    const salvo = localStorage.getItem(CHAVE_HISTORICO_RECRUTAMENTO);
    const dados: unknown = salvo ? JSON.parse(salvo) : [];

    if (!Array.isArray(dados)) {
      return [];
    }

    return dados
      .filter(registroSemanalValido)
      .map((registro) => {
        const registroLegado = registro as RegistroSemanalRecrutamento & {
          admissoesFinalizadas?: number;
        };

        return {
          id: registro.id,
          data: registro.data,
          curriculosRecebidos: numeroNaoNegativo(registro.curriculosRecebidos),
          entrevistasRh: numeroNaoNegativo(registro.entrevistasRh),
          enviadosGestores: numeroNaoNegativo(registro.enviadosGestores),
          aprovadosGestores: numeroNaoNegativo(registro.aprovadosGestores),
          emProcesso: numeroNaoNegativo(registro.emProcesso),
          asoFinalizados: numeroNaoNegativo(
            registro.asoFinalizados ?? registroLegado.admissoesFinalizadas
          ),
        };
      })
      .sort((a, b) => b.data.localeCompare(a.data));
  } catch {
    return [];
  }
}

export function salvarHistoricoRecrutamento(
  registros: RegistroSemanalRecrutamento[]
) {
  localStorage.setItem(
    CHAVE_HISTORICO_RECRUTAMENTO,
    JSON.stringify(registros)
  );
}

export function somarFunilRecrutamento(
  registros: RegistroSemanalRecrutamento[]
): ItemMetricaRecrutamento[] {
  const totais = registros.reduce(
    (acumulado, registro) => ({
      curriculosRecebidos: acumulado.curriculosRecebidos + registro.curriculosRecebidos,
      entrevistasRh: acumulado.entrevistasRh + registro.entrevistasRh,
      enviadosGestores: acumulado.enviadosGestores + registro.enviadosGestores,
      aprovadosGestores: acumulado.aprovadosGestores + registro.aprovadosGestores,
      emProcesso: acumulado.emProcesso + registro.emProcesso,
      asoFinalizados: acumulado.asoFinalizados + registro.asoFinalizados,
    }),
    {
      curriculosRecebidos: 0,
      entrevistasRh: 0,
      enviadosGestores: 0,
      aprovadosGestores: 0,
      emProcesso: 0,
      asoFinalizados: 0,
    }
  );

  return [
    { nome: "Curriculos recebidos", valor: totais.curriculosRecebidos },
    { nome: "Entrevista RH", valor: totais.entrevistasRh },
    { nome: "Enviados aos gestores", valor: totais.enviadosGestores },
    { nome: "Aprovados pelos gestores", valor: totais.aprovadosGestores },
    { nome: "Em processo", valor: totais.emProcesso },
    { nome: "ASO finalizado", valor: totais.asoFinalizados },
  ];
}

function normalizarItem(
  item: ItemMetricaRecrutamento,
  base: ItemMetricaRecrutamento
): ItemMetricaRecrutamento {
  return {
    nome: base.nome,
    valor: Math.max(0, Number(item.valor || 0)),
  };
}

function normalizarGrupo(
  grupo: unknown,
  base: ItemMetricaRecrutamento[]
) {
  if (!Array.isArray(grupo)) {
    return base;
  }

  return base.map((itemBase, indice) =>
    normalizarItem(
      (grupo[indice] || itemBase) as ItemMetricaRecrutamento,
      itemBase
    )
  );
}

function normalizarGrupoPorNome(
  grupo: unknown,
  base: ItemMetricaRecrutamento[]
) {
  if (!Array.isArray(grupo) || grupo.length !== base.length) {
    return base.map((item) => ({ ...item }));
  }

  const estruturaAtual = base.every((itemBase, indice) => {
    const itemSalvo = grupo[indice] as Partial<ItemMetricaRecrutamento>;
    return itemSalvo.nome === itemBase.nome;
  });

  return estruturaAtual
    ? normalizarGrupo(grupo, base)
    : base.map((item) => ({ ...item }));
}

export function calcularDivisaoPerdas(
  recusaGestao: ItemMetricaRecrutamento[],
  desistencias: ItemMetricaRecrutamento[]
): ItemMetricaRecrutamento[] {
  const totalGestao = recusaGestao.reduce(
    (total, item) => total + numeroNaoNegativo(item.valor),
    0
  );
  const totalCandidato = desistencias.reduce(
    (total, item) => total + numeroNaoNegativo(item.valor),
    0
  );
  const totalPerdas = totalGestao + totalCandidato;

  if (totalPerdas === 0) {
    return [
      { nome: "Gestão", valor: 0 },
      { nome: "Candidato", valor: 0 },
    ];
  }

  const percentualGestao = Math.round(
    (totalGestao / totalPerdas) * 100
  );

  return [
    { nome: "Gestão", valor: percentualGestao },
    { nome: "Candidato", valor: 100 - percentualGestao },
  ];
}

export function carregarMetricasRecrutamento(): MetricasRecrutamento {
  try {
    const salvo = localStorage.getItem(
      CHAVE_METRICAS_RECRUTAMENTO
    );

    if (!salvo) {
      return metricasRecrutamentoPadrao;
    }

    const dados = JSON.parse(salvo) as Partial<MetricasRecrutamento>;
    const historico = carregarHistoricoRecrutamento();
    const funilSalvoCompativel =
      Array.isArray(dados.funil) &&
      dados.funil.length === metricasRecrutamentoPadrao.funil.length;

    const recusaGestao = normalizarGrupoPorNome(
      dados.recusaGestao,
      metricasRecrutamentoPadrao.recusaGestao
    );
    const desistencias = normalizarGrupoPorNome(
      dados.desistencias,
      metricasRecrutamentoPadrao.desistencias
    );

    return {
      funil:
        funilSalvoCompativel
          ? normalizarGrupo(dados.funil, metricasRecrutamentoPadrao.funil)
          : historico.length > 0
            ? somarFunilRecrutamento(historico)
            : metricasRecrutamentoPadrao.funil,
      fontes: normalizarGrupo(dados.fontes, metricasRecrutamentoPadrao.fontes),
      recusaGestao,
      desistencias,
      divisaoDesistencia: calcularDivisaoPerdas(
        recusaGestao,
        desistencias
      ),
    };
  } catch {
    return metricasRecrutamentoPadrao;
  }
}

export function salvarMetricasRecrutamento(
  metricas: MetricasRecrutamento
) {
  const metricasSincronizadas: MetricasRecrutamento = {
    ...metricas,
    divisaoDesistencia: calcularDivisaoPerdas(
      metricas.recusaGestao,
      metricas.desistencias
    ),
  };

  localStorage.setItem(
    CHAVE_METRICAS_RECRUTAMENTO,
    JSON.stringify(metricasSincronizadas)
  );

  window.dispatchEvent(
    new CustomEvent(EVENTO_METRICAS_RECRUTAMENTO)
  );
}
