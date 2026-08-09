import type { Vaga } from "../data/vagas";
import unidadesDetalhes from "../data/unidadesDetalhes";

type DetalheUnidade = {
  colaboradores?: unknown;
  estrutura?: Record<string, unknown>;
};

function numero(valor: unknown) {
  const convertido = Number(valor);

  return Number.isFinite(convertido)
    ? convertido
    : 0;
}

function normalizarTexto(
  valor: unknown
) {
  return String(valor || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizarUnidade(
  valor: unknown
) {
  const unidade =
    normalizarTexto(valor);

  const aliases: Record<
    string,
    string
  > = {
    "CRATO OSSIAN":
      "CRATO OSSIAN ARARIPE",
    "CRATO OSSIAN ARARIPE":
      "CRATO OSSIAN ARARIPE",
    "CRATO SIQUEIRA":
      "CRATO SIQUEIRA CAMPOS",
    "CRATO SIQUEIRA CAMPOS":
      "CRATO SIQUEIRA CAMPOS",
    "CRATO CENTRO":
      "CRATO CENTRO",
    "SALESIANOS":
      "SALESIANO",
    "SALESIANO":
      "SALESIANO",
  };

  return aliases[unidade] || unidade;
}

function filtrarPorUnidade(
  vagas: Vaga[],
  unidadeSelecionada?:
    | string
    | null
) {
  if (!unidadeSelecionada) {
    return vagas;
  }

  const unidadeNormalizada =
    normalizarUnidade(
      unidadeSelecionada
    );

  return vagas.filter(
    (vaga) =>
      normalizarUnidade(
        vaga.unidade
      ) === unidadeNormalizada
  );
}

function calcularSolicitacoes(
  vagas: Vaga[],
  admitidos: Vaga[] = []
) {
  const demandaAtiva = vagas.reduce(
    (total, vaga) => {
      if (vaga.ativo === false) {
        return total;
      }

      return (
        total +
        Math.max(
          0,
          numero(vaga.quantidade)
        )
      );
    },
    0
  );

  const demandaAdmitida = admitidos.reduce(
    (total, vaga) =>
      total +
      Math.max(
        numero(vaga.quantidade),
        numero(vaga.admissoes),
        0
      ),
    0
  );

  return demandaAtiva + demandaAdmitida;
}

function calcularAdmissoes(
  vagas: Vaga[]
) {
  return vagas.reduce(
    (total, vaga) => {
      if (vaga.ativo === false) {
        return total;
      }

      return (
        total +
        Math.max(
          0,
          Math.min(
            numero(vaga.admissoes),
            Math.max(
              0,
              numero(vaga.quantidade)
            )
          )
        )
      );
    },
    0
  );
}

function calcularPendencias(
  vagas: Vaga[],
  admitidos: Vaga[] = []
) {
  const demanda = calcularSolicitacoes(
    vagas,
    admitidos
  );

  const admissoes = calcularAdmissoesOficiais(
    admitidos
  );

  return Math.max(
    demanda - admissoes,
    0
  );
}

function calcularAdmissoesOficiais(
  admitidos: Vaga[]
) {
  return admitidos.reduce(
    (total, vaga) =>
      total +
      Math.max(
        numero(vaga.admissoes),
        numero(vaga.quantidade),
        0
      ),
    0
  );
}

function tipoCombina(
  tipoVaga: string,
  tipoProcurado: string
) {
  const vaga = normalizarTexto(tipoVaga);
  const procurado = normalizarTexto(tipoProcurado);

  if (procurado === "J APRENDIZ") {
    return vaga.includes("APRENDIZ");
  }

  if (procurado.includes("INVENTARIO")) {
    return vaga.includes("INVENTARIO");
  }

  return vaga === procurado;
}

function calcularPorTipo(
  vagas: Vaga[],
  tipoProcurado: string
) {
  return vagas.reduce(
    (total, vaga) => {
      if (!tipoCombina(String(vaga.tipo || ""), tipoProcurado)) {
        return total;
      }

      const quantidade = Math.max(
        numero(vaga.admissoes),
        numero(vaga.quantidade),
        0
      );

      return total + quantidade;
    },
    0
  );
}

function somarColaboradores(
  unidadeSelecionada?:
    | string
    | null
) {
  const unidadeNormalizada =
    unidadeSelecionada
      ? normalizarUnidade(
          unidadeSelecionada
        )
      : "";

  return Object.entries(
    unidadesDetalhes as Record<
      string,
      DetalheUnidade
    >
  ).reduce(
    (
      total,
      [nomeUnidade, unidade]
    ) => {
      if (
        unidadeNormalizada &&
        normalizarUnidade(
          nomeUnidade
        ) !== unidadeNormalizada
      ) {
        return total;
      }

      return (
        total +
        numero(
          unidade?.colaboradores
        )
      );
    },
    0
  );
}

function calcularUnidadesEstaveis(
  vagas: Vaga[]
) {
  return new Set(
    vagas
      .filter(
        (vaga) =>
          vaga.ativo !== false &&
          normalizarTexto(vaga.tipo) === "ESTAVEL"
      )
      .map((vaga) => normalizarUnidade(vaga.unidade))
      .filter(Boolean)
  ).size;
}

export function getDashboardCards(
  vagasBase: Vaga[] = [],
  indicadoresBase?: Vaga[]
) {
  const vagas = vagasBase;
  const admitidos = indicadoresBase || [];

  const totalAdmitidos =
    indicadoresBase
      ? calcularAdmissoesOficiais(admitidos)
      : calcularAdmissoes(vagas);

  const totalPendentes =
    calcularPendencias(
      vagas,
      admitidos
    );

  const totalVagas =
    calcularSolicitacoes(
      vagas,
      admitidos
    );

  const totalUnidadesEstaveis =
    calcularUnidadesEstaveis(
      vagas
    );

  const vagasIndicadores =
    indicadoresBase || vagas;

  const totalPCD =
    calcularPorTipo(
      vagasIndicadores,
      "PCD"
    );

  const totalAprendiz =
    calcularPorTipo(
      vagasIndicadores,
      "J. APRENDIZ"
    );

  const totalADM =
    calcularPorTipo(
      vagasIndicadores,
      "ADM"
    );

  const totalInventario =
    calcularPorTipo(
      vagasIndicadores,
      "INVENTÁRIO"
    );

  const totalColaboradores =
    somarColaboradores();

  return {
    totalVagas,
    totalAdmitidos,
    totalPendentes,
    totalUnidadesEstaveis,
    totalPCD,
    totalAprendiz,
    totalADM,
    totalInventario,
    totalColaboradores,
  };
}

export function getPainelExecutivo(
  vagas: Vaga[],
  unidadeSelecionada?:
    | string
    | null,
  indicadoresBase?: Vaga[]
) {
  const vagasFiltradas =
    filtrarPorUnidade(
      vagas,
      unidadeSelecionada
    );

  const indicadoresFiltrados =
    filtrarPorUnidade(
      indicadoresBase || vagas,
      unidadeSelecionada
    );

  const solicitacoes =
    calcularSolicitacoes(
      vagasFiltradas,
      indicadoresFiltrados
    );

  const admissoes =
    indicadoresBase
      ? calcularAdmissoesOficiais(
          indicadoresFiltrados
        )
      : calcularAdmissoes(
          vagasFiltradas
        );

  const pendencias =
    calcularPendencias(
      vagasFiltradas,
      indicadoresFiltrados
    );

  const colaboradores =
    somarColaboradores(
      unidadeSelecionada
    );

  const pcd =
    calcularPorTipo(
      indicadoresFiltrados,
      "PCD"
    );

  const aprendiz =
    calcularPorTipo(
      indicadoresFiltrados,
      "J. APRENDIZ"
    );

  const adm =
    calcularPorTipo(
      indicadoresFiltrados,
      "ADM"
    );

  const inventario =
    calcularPorTipo(
      indicadoresFiltrados,
      "INVENTÁRIO"
    );

  return {
    titulo:
      unidadeSelecionada ||
      "CONSOLIDADO GERAL",
    colaboradores,
    solicitacoes,
    admissoes,
    pendencias,
    pcd,
    aprendiz,
    adm,
    inventario,
  };
}

