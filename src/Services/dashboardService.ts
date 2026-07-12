import type { Vaga } from "../data/vagas";
import vagasIniciais from "../data/vagas";
import unidadesDetalhes from "../data/unidadesDetalhes";
import { carregarVagas } from "./storageService";

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
  vagas: Vaga[]
) {
  return vagas.reduce(
    (total, vaga) =>
      total +
      Math.max(
        0,
        numero(vaga.quantidade)
      ),
    0
  );
}

function calcularAdmissoes(
  vagas: Vaga[]
) {
  return vagas.reduce(
    (total, vaga) =>
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
      ),
    0
  );
}

function calcularPendencias(
  vagas: Vaga[]
) {
  return vagas.reduce(
    (total, vaga) => {
      const quantidade =
        Math.max(
          0,
          numero(vaga.quantidade)
        );

      const admissoes =
        Math.max(
          0,
          numero(vaga.admissoes)
        );

      return (
        total +
        Math.max(
          0,
          quantidade - admissoes
        )
      );
    },
    0
  );
}

function calcularPorTipo(
  vagas: Vaga[],
  tipoProcurado: string
) {
  const tipoNormalizado =
    normalizarTexto(
      tipoProcurado
    );

  return vagas.reduce(
    (total, vaga) => {
      const tipoVaga =
        normalizarTexto(
          vaga.tipo
        );

      if (
        tipoVaga !==
        tipoNormalizado
      ) {
        return total;
      }

      const quantidade =
        Math.max(
          0,
          numero(vaga.quantidade)
        );

      const admissoes =
        Math.max(
          0,
          numero(vaga.admissoes)
        );

      return (
        total +
        Math.max(
          0,
          quantidade - admissoes
        )
      );
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
  const unidades =
    Array.from(
      new Set(
        vagas
          .map((vaga) =>
            normalizarUnidade(
              vaga.unidade
            )
          )
          .filter(Boolean)
      )
    );

  return unidades.reduce(
    (total, unidade) => {
      const vagasDaUnidade =
        filtrarPorUnidade(
          vagas,
          unidade
        );

      const pendentes =
        calcularPendencias(
          vagasDaUnidade
        );

      return pendentes === 0
        ? total + 1
        : total;
    },
    0
  );
}

export function getDashboardCards(
  vagasBase?: Vaga[]
) {
  const vagas =
    vagasBase ||
    carregarVagas(
      vagasIniciais
    );

  const totalAdmitidos =
    calcularAdmissoes(vagas);

  const totalPendentes =
    calcularPendencias(vagas);

  const totalVagas =
    calcularSolicitacoes(vagas);

  const totalUnidadesEstaveis =
    calcularUnidadesEstaveis(
      vagas
    );

  const totalPCD =
    calcularPorTipo(
      vagas,
      "PCD"
    );

  const totalAprendiz =
    calcularPorTipo(
      vagas,
      "J. APRENDIZ"
    );

  const totalADM =
    calcularPorTipo(
      vagas,
      "ADM"
    );

  const totalInventario =
    calcularPorTipo(
      vagas,
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
    | null
) {
  const vagasFiltradas =
    filtrarPorUnidade(
      vagas,
      unidadeSelecionada
    );

  const solicitacoes =
    calcularSolicitacoes(
      vagasFiltradas
    );

  const admissoes =
    calcularAdmissoes(
      vagasFiltradas
    );

  const pendencias =
    calcularPendencias(
      vagasFiltradas
    );

  const colaboradores =
    somarColaboradores(
      unidadeSelecionada
    );

  const pcd =
    calcularPorTipo(
      vagasFiltradas,
      "PCD"
    );

  const aprendiz =
    calcularPorTipo(
      vagasFiltradas,
      "J. APRENDIZ"
    );

  const adm =
    calcularPorTipo(
      vagasFiltradas,
      "ADM"
    );

  const inventario =
    calcularPorTipo(
      vagasFiltradas,
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