import { useEffect, useMemo, useState } from "react";
import "./DashboardRH.css";

import { type Vaga } from "../../data/vagas";
import { type RegistroAdmitido } from "../Admitidos/Admitidos";
import unidades from "../../data/unidades";

import {
  getDashboardCards,
  getPainelExecutivo,
} from "../../Services/dashboardService";
import { buscarDetalhesUnidade } from "../../Services/unidadesDetalhesService";
import {
  calcularDivisaoPerdas,
  carregarMetricasRecrutamento,
  EVENTO_METRICAS_RECRUTAMENTO,
} from "../../Services/recrutamentoMetricasService";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import MapaInfo from "../MapaInfo";
import GraficosDashboard from "./Graficos";

type TipoIndicador = "PCD" | "J. APRENDIZ" | "ADM" | "INVENTÁRIO";

type UnidadeIndicador = {
  unidade: string;
  quantidade: number;
};

type TipoResumoDashboard =
  | "contratacoes"
  | "pendentes";

type UnidadeMapaBase = {
  nome: string;
  bairro: string;
  cidade: string;
  regiao: string;
  potencial: number;
  lat: number;
  lng: number;
};

type EstruturaTotal = Record<string, number>;

type UnidadeDashboard = UnidadeMapaBase & {
  vagas: number;
  admitidos: number;
  pendentes: number;
  risco: "Alto" | "Médio" | "Médio" | "Baixo";
  pcd: number;
  jovemAprendiz: number;
  adm: number;
  inventario: number;
  colaboradores: number;
  unidadesMonitoradas?: number;
  estrutura?: Record<string, string | number>;
  alertas?: {
    retornoFerias?: number;
    admissoesPrevistas?: number;
  };
  tipoPainel?: "consolidado";
};

const COLABORADORES = unidades.reduce(
  (total, unidade) => total + unidade.colaboradores,
  0
);

const CONSOLIDADO_NOME = "DINIZ SUPERMERCADOS";

function tipoIndicadorCombina(
  tipoVaga: string,
  tipoIndicador: TipoIndicador
) {
  const vaga = normalizarTexto(tipoVaga);
  const indicador = normalizarTexto(tipoIndicador);

  if (indicador === "J APRENDIZ") {
    return vaga.includes("APRENDIZ");
  }

  if (indicador.includes("INVENTARIO")) {
    return vaga.includes("INVENTARIO");
  }

  return vaga === indicador;
}

const unidadesMapaBase: UnidadeMapaBase[] = [
  {
    nome: "Aeroporto",
    bairro: "Aeroporto",
    cidade: "Juazeiro do Norte",
    regiao: "juazeiro",
    potencial: 22000,
    lat: -7.213056,
    lng: -39.280481,
  },
  {
    nome: "Ailton Gomes",
    bairro: "Romeirão / Novo Juazeiro",
    cidade: "Juazeiro do Norte",
    regiao: "juazeiro",
    potencial: 30000,
    lat: -7.230935,
    lng: -39.312002,
  },
  {
    nome: "Barbalha",
    bairro: "Centro",
    cidade: "Barbalha",
    regiao: "barbalha",
    potencial: 80000,
    lat: -7.31765,
    lng: -39.30011,
  },
  {
    nome: "Betolândia",
    bairro: "Betolândia",
    cidade: "Juazeiro do Norte",
    regiao: "juazeiro",
    potencial: 27000,
    lat: -7.230894,
    lng: -39.281188,
  },
  {
    nome: "Crato Centro",
    bairro: "Centro",
    cidade: "Crato",
    regiao: "crato",
    potencial: 35000,
    lat: -7.2342,
    lng: -39.4093,
  },
  {
    nome: "Crato Ossian Araripe",
    bairro: "Ossian Araripe",
    cidade: "Crato",
    regiao: "crato",
    potencial: 18000,
    lat: -7.2418,
    lng: -39.4212,
  },
  {
    nome: "Crato Siqueira Campos",
    bairro: "Siqueira Campos",
    cidade: "Crato",
    regiao: "crato",
    potencial: 20000,
    lat: -7.2299,
    lng: -39.4035,
  },
  {
    nome: "Frei Damião",
    bairro: "Frei Damião",
    cidade: "Juazeiro do Norte",
    regiao: "juazeiro",
    potencial: 24000,
    lat: -7.24076,
    lng: -39.33643,
  },
  {
    nome: "Missão Velha",
    bairro: "Centro",
    cidade: "Missão Velha",
    regiao: "missao",
    potencial: 39000,
    lat: -7.25278,
    lng: -39.145,
  },
  {
    nome: "Pirajá",
    bairro: "Pirajá",
    cidade: "Juazeiro do Norte",
    regiao: "juazeiro",
    potencial: 40000,
    lat: -7.2229,
    lng: -39.316,
  },
  {
    nome: "Salesianos",
    bairro: "Salesianos",
    cidade: "Juazeiro do Norte",
    regiao: "juazeiro",
    potencial: 26000,
    lat: -7.2158,
    lng: -39.3238,
  },
  {
    nome: "Tiradentes",
    bairro: "Tiradentes",
    cidade: "Juazeiro do Norte",
    regiao: "juazeiro",
    potencial: 23000,
    lat: -7.2298,
    lng: -39.29715,
  },
  {
    nome: "Vila Três Marias",
    bairro: "Vila Três Marias",
    cidade: "Juazeiro do Norte",
    regiao: "juazeiro",
    potencial: 18000,
    lat: -7.183,
    lng: -39.3104,
  },
];

function numero(valor: unknown) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

function normalizarTexto(valor: unknown) {
  return String(valor || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizarChaveUnidade(valor: unknown) {
  return normalizarTexto(valor).replace(/[^A-Z0-9]/g, "");
}

function tipoCorModal(tipo: TipoIndicador) {
  if (tipo === "PCD") return "azul";
  if (tipo === "J. APRENDIZ") return "verde";
  if (tipo === "ADM") return "roxo";
  return "vinho";
}

function tituloIndicador(tipo: TipoIndicador) {
  if (tipo === "J. APRENDIZ") return "JOVEM APRENDIZ";
  return tipo;
}

function somarEstruturas(unidadesBase: UnidadeMapaBase[]) {
  const estruturaTotal: EstruturaTotal = {};

  const alertasTotal = {
    retornoFerias: 0,
    admissoesPrevistas: 0,
  };

  unidadesBase.forEach((unidade) => {
    const detalhes = buscarDetalhesUnidade(unidade.nome);
    const estrutura = detalhes?.estrutura || {};
    const alertas = detalhes?.alertas || {};

    Object.entries(estrutura).forEach(([cargo, valor]) => {
      estruturaTotal[cargo] =
        numero(estruturaTotal[cargo]) + numero(valor);
    });

    alertasTotal.retornoFerias += numero(alertas.retornoFerias);
    alertasTotal.admissoesPrevistas += numero(
      alertas.admissoesPrevistas
    );
  });

  return {
    estrutura: estruturaTotal,
    alertas: alertasTotal,
  };
}

function getIcon(unidade: UnidadeDashboard) {
  const pendentes = numero(unidade.pendentes);
  const cor =
    pendentes > 10
      ? "#dc2626"
      : pendentes > 5
        ? "#f97316"
        : pendentes > 0
          ? "#2563eb"
          : "#16a34a";
  const tamanho = Math.min(34, Math.max(18, 18 + pendentes));

  return L.divIcon({
    className: "",
    html: `
      <div
        style="
          width:${tamanho}px;
          height:${tamanho}px;
          background:${cor};
          border:3px solid white;
          border-radius:50%;
          box-shadow:0 0 8px rgba(0,0,0,.35);
        "
      ></div>
    `,
    iconSize: [tamanho + 6, tamanho + 6],
    iconAnchor: [(tamanho + 6) / 2, (tamanho + 6) / 2],
  });
}

function getIconConsolidado() {
  return L.divIcon({
    className: "",
    html: `
      <div
        style="
          width:22px;
          height:22px;
          background:#0f172a;
          border:3px solid white;
          box-shadow:0 0 10px rgba(0,0,0,.45);
          display:flex;
          align-items:center;
          justify-content:center;
          color:white;
          font-size:14px;
          font-weight:900;
        "
      >
        â– 
      </div>
    `,
    iconSize: [22, 22],
  });
}

interface DashboardRHProps {
  vagas: Vaga[];
  admitidos: RegistroAdmitido[];
}

function DashboardRH({
  vagas,
  admitidos,
}: DashboardRHProps) {
  const vagasCadastro: Vaga[] = vagas;

  const cards = getDashboardCards(
    vagasCadastro,
    admitidos
  );

  const [tipoIndicadorAberto, setTipoIndicadorAberto] =
    useState<TipoIndicador | null>(null);
  const [
    mostrarUnidadesEstaveis,
    setMostrarUnidadesEstaveis,
  ] = useState(false);
  const [
    resumoDashboardAberto,
    setResumoDashboardAberto,
  ] = useState<TipoResumoDashboard | null>(null);
  const [cardTurnoverAberto, setCardTurnoverAberto] = useState<string | null>(null);
  const [grupoTurnoverAberto, setGrupoTurnoverAberto] = useState<string | null>(null);

  const resumoPorUnidade = useMemo(() => {
    const agrupar = (
      lista: Vaga[],
      calcular: (vaga: Vaga) => number
    ) => {
      const agrupamento =
        new Map<string, number>();

      lista.forEach((vaga) => {
        const quantidade = Math.max(
          0,
          calcular(vaga)
        );

        if (quantidade <= 0) {
          return;
        }

        const unidade =
          String(vaga.unidade || "")
            .trim()
            .toUpperCase() ||
          "UNIDADE NÃO INFORMADA";

        agrupamento.set(
          unidade,
          numero(
            agrupamento.get(unidade)
          ) + quantidade
        );
      });

      return Array.from(
        agrupamento.entries()
      )
        .map(([unidade, quantidade]) => ({
          unidade,
          quantidade,
        }))
        .sort((a, b) =>
          a.unidade.localeCompare(
            b.unidade,
            "pt-BR"
          )
        );
    };

    return {
      contratacoes:
        admitidos.length > 0
          ? agrupar(
              admitidos as Vaga[],
              (vaga) =>
                Math.max(
                  numero(vaga.admissoes),
                  numero(vaga.quantidade)
                )
            )
          : agrupar(
              vagasCadastro,
              (vaga) =>
                numero(vaga.admissoes)
            ),
      pendentes: agrupar(
        vagasCadastro,
        (vaga) =>
          Math.max(
            numero(vaga.quantidade) -
              numero(vaga.admissoes),
            0
          )
      ),
    };
  }, [admitidos, vagasCadastro]);

  const unidadesEstaveisDashboard = useMemo(() => {
    return Array.from(
      new Set(
        vagasCadastro
          .filter(
            (vaga) =>
              normalizarTexto(vaga.tipo) ===
              "ESTAVEL"
          )
          .map((vaga) =>
            String(vaga.unidade || "")
              .trim()
              .toUpperCase()
          )
          .filter(Boolean)
      )
    ).sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );
  }, [vagasCadastro]);

  const unidadesPorIndicador = useMemo<UnidadeIndicador[]>(() => {
    if (!tipoIndicadorAberto) return [];    const agrupamento: Record<string, number> = {};

    admitidos.forEach((vaga) => {      if (!tipoIndicadorCombina(String(vaga.tipo || ""), tipoIndicadorAberto)) return;

      const unidade =
        String(vaga.unidade || "").trim().toUpperCase() ||
        "UNIDADE NÃO INFORMADA";

      const quantidade =
        Math.max(
          numero(vaga.admissoes),
          numero(vaga.quantidade),
          0
        );

      if (quantidade <= 0) return;

      agrupamento[unidade] =
        numero(agrupamento[unidade]) + quantidade;
    });

    return Object.entries(agrupamento)
      .map(([unidade, quantidade]) => ({
        unidade,
        quantidade,
      }))
      .sort((a, b) =>
        a.unidade.localeCompare(b.unidade, "pt-BR")
      );
  }, [tipoIndicadorAberto, admitidos]);

  const unidadesMapaDinamicas = useMemo<UnidadeMapaBase[]>(() => {
    const chavesExistentes = new Set(
      unidadesMapaBase.map((unidade) => normalizarChaveUnidade(unidade.nome))
    );
    const nomesNovos = Array.from(
      new Set(
        [...vagasCadastro, ...admitidos]
          .map((registro) => String(registro.unidade || "").trim())
          .filter(Boolean)
      )
    ).filter((nome) => !chavesExistentes.has(normalizarChaveUnidade(nome)));

    const novasUnidades = nomesNovos.map((nome, indice) => ({
      nome,
      bairro: nome,
      cidade: "Nova unidade",
      regiao: "expansao",
      potencial: 0,
      lat: -7.25 + indice * 0.008,
      lng: -39.32 + indice * 0.008,
    }));

    return [...unidadesMapaBase, ...novasUnidades];
  }, [vagasCadastro, admitidos]);

  const unidadesDashboard = useMemo<UnidadeDashboard[]>(() => {
    return unidadesMapaDinamicas.map((unidade) => {
      const indicadores = getPainelExecutivo(
        vagasCadastro,
        unidade.nome,
        admitidos
      );

      return {
        ...unidade,
        vagas: indicadores.solicitacoes,
        admitidos: indicadores.admissoes,
        pendentes: indicadores.pendencias,
        risco:
          indicadores.pendencias > 10
            ? "Alto"
            : indicadores.pendencias > 5
              ? "Médio"
              : "Baixo",
        pcd: indicadores.pcd,
        jovemAprendiz: indicadores.aprendiz,
        adm: indicadores.adm,
        inventario: indicadores.inventario,
        colaboradores: Math.round(indicadores.colaboradores),
        unidadesMonitoradas: 1,
      };
    });
  }, [vagasCadastro, admitidos, unidadesMapaDinamicas]);

  const consolidadoDiniz = useMemo(() => {
    const painel = getPainelExecutivo(
      vagasCadastro,
      null,
      admitidos
    );

    const totalPotencial = unidadesDashboard.reduce(
      (total, unidade) => total + unidade.potencial,
      0
    );

    const estruturaConsolidada =
      somarEstruturas(unidadesDashboard);

    return {
      nome: CONSOLIDADO_NOME,
      bairro: "Consolidado Geral",
      cidade: "Região CRAJUBAR",
      regiao: "consolidado",
      potencial: totalPotencial,
      lat: -7.245,
      lng: -39.31,
      vagas: painel.solicitacoes,
      admitidos: painel.admissoes,
      pendentes: painel.pendencias,
      risco:
        painel.pendencias > 10
          ? "Alto"
          : painel.pendencias > 5
            ? "Médio"
            : "Baixo",
      pcd: cards.totalPCD,
      jovemAprendiz: cards.totalAprendiz,
      adm: cards.totalADM,
      inventario: cards.totalInventario,
      colaboradores: Math.round(
        painel.colaboradores || COLABORADORES,
      ),
      unidadesMonitoradas: unidadesDashboard.length,
      estrutura: estruturaConsolidada.estrutura,
      alertas: estruturaConsolidada.alertas,
      tipoPainel: "consolidado",
    } satisfies UnidadeDashboard;
  }, [vagasCadastro, admitidos, unidadesDashboard, cards]);

  const [
    unidadeSelecionadaNome,
    setUnidadeSelecionadaNome,
  ] = useState(CONSOLIDADO_NOME);

  const unidadeSelecionadaBase =
    unidadeSelecionadaNome === CONSOLIDADO_NOME
      ? consolidadoDiniz
      : unidadesDashboard.find(
          (unidade) =>
            unidade.nome === unidadeSelecionadaNome
        ) || consolidadoDiniz;

  const detalhesUnidade =
    unidadeSelecionadaNome === CONSOLIDADO_NOME
      ? null
      : buscarDetalhesUnidade(
          unidadeSelecionadaBase.nome
        );

  const unidadeSelecionada = {
    ...unidadeSelecionadaBase,
    ...(detalhesUnidade || {}),
    vagas: unidadeSelecionadaBase.vagas,
    admitidos: unidadeSelecionadaBase.admitidos,
    pendentes: unidadeSelecionadaBase.pendentes,
    pcd: unidadeSelecionadaBase.pcd,
    jovemAprendiz:
      unidadeSelecionadaBase.jovemAprendiz,
    adm: unidadeSelecionadaBase.adm,
    inventario: unidadeSelecionadaBase.inventario,
    colaboradores: Math.round(unidadeSelecionadaBase.colaboradores),
  };

  const exibindoConsolidado = unidadeSelecionadaNome === CONSOLIDADO_NOME;
  const chaveUnidadeSelecionada = normalizarChaveUnidade(unidadeSelecionadaBase.nome);
  const pertenceAoPainelSelecionado = (registro: Vaga) =>
    exibindoConsolidado ||
    normalizarChaveUnidade(String(registro.unidade || "")) === chaveUnidadeSelecionada;
  const vagasPainel = exibindoConsolidado
    ? vagasCadastro
    : vagasCadastro.filter(pertenceAoPainelSelecionado);
  const admitidosPainel = exibindoConsolidado
    ? admitidos
    : admitidos.filter((registro) => pertenceAoPainelSelecionado(registro as Vaga));
  const unidadesPainel = exibindoConsolidado
    ? unidadesDashboard
    : [unidadeSelecionadaBase];
  const cardsPainel = {
    ...getDashboardCards(vagasPainel, admitidosPainel),
    totalColaboradores: unidadeSelecionada.colaboradores,
  };
  const resumoPorUnidadePainel = exibindoConsolidado
    ? resumoPorUnidade
    : {
        contratacoes: resumoPorUnidade.contratacoes.filter(
          (item) => normalizarChaveUnidade(item.unidade) === chaveUnidadeSelecionada,
        ),
        pendentes: resumoPorUnidade.pendentes.filter(
          (item) => normalizarChaveUnidade(item.unidade) === chaveUnidadeSelecionada,
        ),
      };
  const dadosResumoDashboardPainel = resumoDashboardAberto === "contratacoes"
    ? {
        titulo: `Contratações Efetivadas - ${unidadeSelecionada.nome}`,
        total: cardsPainel.totalAdmitidos,
        itens: resumoPorUnidadePainel.contratacoes,
        vazio: "Nenhuma contratação registrada.",
      }
    : resumoDashboardAberto === "pendentes"
      ? {
          titulo: `Vagas Pendentes - ${unidadeSelecionada.nome}`,
          total: cardsPainel.totalPendentes,
          itens: resumoPorUnidadePainel.pendentes,
          vazio: "Nenhuma pendência registrada.",
        }
      : null;
  const unidadesEstaveisPainel = exibindoConsolidado
    ? unidadesEstaveisDashboard
    : unidadesEstaveisDashboard.filter(
        (unidade) => normalizarChaveUnidade(unidade) === chaveUnidadeSelecionada,
      );
  const unidadesPorIndicadorPainel = exibindoConsolidado
    ? unidadesPorIndicador
    : unidadesPorIndicador.filter(
        (item) => normalizarChaveUnidade(item.unidade) === chaveUnidadeSelecionada,
      );
  const totalIndicadorAbertoPainel = unidadesPorIndicadorPainel.reduce(
    (total, item) => total + item.quantidade,
    0,
  );

  const ranking = [...unidadesPainel]
    .sort((a, b) => b.vagas - a.vagas)
    .slice(0, 4);

  const funilInteligencia = [
    {
      nome: "Demanda",
      valor: cardsPainel.totalVagas,
      cor: "#2563eb",
    },
    {
      nome: "Admitidos",
      valor: cardsPainel.totalAdmitidos,
      cor: "#16a34a",
    },
    {
      nome: "Pendentes",
      valor: cardsPainel.totalPendentes,
      cor: "#f97316",
    },
    {
      nome: "Estáveis",
      valor: cardsPainel.totalUnidadesEstaveis,
      cor: "#0f3d75",
    },
  ];

  const indicadoresEspeciais = [
    {
      nome: "Aprendiz",
      valor: cardsPainel.totalAprendiz,
      cor: "#16a34a",
    },
    {
      nome: "PCD",
      valor: cardsPainel.totalPCD,
      cor: "#2563eb",
    },
    {
      nome: "ADM",
      valor: cardsPainel.totalADM,
      cor: "#7c3aed",
    },
    {
      nome: "Inventário",
      valor: cardsPainel.totalInventario,
      cor: "#dc2626",
    },
  ];

  const coberturaInteligencia =
    cardsPainel.totalVagas > 0
      ? Math.round(
          (cardsPainel.totalAdmitidos /
            cardsPainel.totalVagas) *
            100
        )
      : 0;

  void funilInteligencia;
  void coberturaInteligencia;

  const [metricasRecrutamento, setMetricasRecrutamento] = useState(
    carregarMetricasRecrutamento,
  );

  useEffect(() => {
    function atualizarMetricas() {
      setMetricasRecrutamento(carregarMetricasRecrutamento());
    }

    window.addEventListener(EVENTO_METRICAS_RECRUTAMENTO, atualizarMetricas);
    window.addEventListener("storage", atualizarMetricas);

    return () => {
      window.removeEventListener(
        EVENTO_METRICAS_RECRUTAMENTO,
        atualizarMetricas,
      );
      window.removeEventListener("storage", atualizarMetricas);
    };
  }, []);

  const metricasRecrutamentoPainel = exibindoConsolidado
    ? metricasRecrutamento
    : {
        funil: metricasRecrutamento.funil.map((item) => ({ ...item, valor: 0 })),
        fontes: metricasRecrutamento.fontes.map((item) => ({
          ...item,
          valor: normalizarTexto(item.nome).includes("MEDIA DEMITIDOS")
            ? item.valor
            : 0,
        })),
        recusaGestao: metricasRecrutamento.recusaGestao.map((item) => ({ ...item, valor: 0 })),
        desistencias: metricasRecrutamento.desistencias.map((item) => ({ ...item, valor: 0 })),
      };

  const totalFunilRecrutamento = metricasRecrutamentoPainel.funil.reduce(
    (total, item) => total + Math.max(0, Number(item.valor || 0)),
    0,
  );
  const primeiraEtapaFunil = Math.max(
    0,
    Number(metricasRecrutamentoPainel.funil[0]?.valor || 0),
  );
  const ultimaEtapaFunil = Math.max(
    0,
    Number(
      metricasRecrutamentoPainel.funil[metricasRecrutamentoPainel.funil.length - 1]
        ?.valor || 0,
    ),
  );
  const conversaoFunilRecrutamento =
    primeiraEtapaFunil > 0
      ? Math.round((ultimaEtapaFunil / primeiraEtapaFunil) * 100)
      : 0;
  const coresFunil = ["#0057b8", "#0ea5e9", "#16a34a", "#f97316", "#0f766e"];
  const coresFontes = ["#f97316", "#fb923c", "#ea580c", "#c2410c"];
  const coresRecusa = ["#003f8f", "#0057b8", "#0ea5e9", "#38bdf8", "#bae6fd"];
  const coresDesistencia = ["#0f766e", "#14b8a6", "#22d3ee", "#67e8f9", "#ccfbf1"];
  const funilRecrutamento = metricasRecrutamentoPainel.funil.map((item, indice) => ({
    ...item,
    cor: coresFunil[indice] || "#0057b8",
  }));
  const maiorFunilRecrutamento = Math.max(
    1,
    ...funilRecrutamento.map((item) => Number(item.valor || 0)),
  );
  const percentualMediaDemitidos = Math.min(
    100,
    Math.max(
      0,
      Number(
        metricasRecrutamentoPainel.fontes.find(
          (item) => normalizarTexto(item.nome).includes("MEDIA DEMITIDOS"),
        )?.valor ?? 95,
      ),
    ),
  );
  const mediaDemitidos = Math.round(
    unidadeSelecionada.vagas * (percentualMediaDemitidos / 100),
  );
  const baseColaboradores = Math.max(unidadeSelecionada.colaboradores, 1);
  const taxaTurnoverPremium = Number(
    (
      ((unidadeSelecionada.admitidos + mediaDemitidos) / 2 / baseColaboradores) *
      100
    ).toFixed(1),
  );
  const nivelTurnover = taxaTurnoverPremium >= 10
    ? "Atenção"
    : taxaTurnoverPremium >= 5
      ? "Monitorar"
      : "Controlado";
  const taxaCoberturaTurnover = unidadeSelecionada.vagas > 0
    ? Math.round((unidadeSelecionada.admitidos / unidadeSelecionada.vagas) * 100)
    : 0;
  const taxaPendenciaTurnover = unidadeSelecionada.vagas > 0
    ? Math.round((unidadeSelecionada.pendentes / unidadeSelecionada.vagas) * 100)
    : 0;
  const colaboradoresPorVaga = unidadeSelecionada.pendentes > 0
    ? Math.max(1, Math.round(unidadeSelecionada.colaboradores / unidadeSelecionada.pendentes))
    : unidadeSelecionada.colaboradores;
  const cardsTurnover = [
    {
      id: "quadro",
      grupo: "quadro",
      linha: "superior",
      classe: "quadro",
      nome: "Quadro monitorado",
      valor: unidadeSelecionada.colaboradores,
      resumo: "colaboradores",
      explicacao: "a quantidade de colaboradores considerada no cálculo da unidade selecionada.",
    },
    {
      id: "demanda",
      grupo: "demanda",
      linha: "superior",
      classe: "demanda",
      nome: "Demanda Acumulada",
      valor: unidadeSelecionada.vagas,
      resumo: "total solicitado",
      explicacao: "o total de vagas solicitadas durante o ciclo para a unidade selecionada.",
    },
    {
      id: "entradas",
      grupo: "contratacoes",
      linha: "superior",
      classe: "entradas",
      nome: "Contratações Efetivadas",
      valor: unidadeSelecionada.admitidos,
      resumo: "total contratado",
      explicacao: "o total de candidatos admitidos e efetivamente contratados na unidade selecionada.",
    },
    {
      id: "pendentes",
      grupo: "pendencias",
      linha: "superior",
      classe: "pendentes",
      nome: "Vagas Pendentes",
      valor: unidadeSelecionada.pendentes,
      resumo: "aguardando conclusão",
      explicacao: "o total de vagas que continuam abertas porque o processo de contratação ainda não foi concluído.",
    },
    {
      id: "pressao-contratacao",
      grupo: "quadro",
      linha: "inferior",
      classe: "admissoes-quadro",
      nome: "Pressão de Contratação",
      valor: unidadeSelecionada.pendentes > 0 ? `1 : ${colaboradoresPorVaga}` : "Sem vagas",
      resumo: "vaga por colaboradores",
      explicacao: unidadeSelecionada.pendentes > 0
        ? `Existe uma vaga pendente para cada ${colaboradoresPorVaga} colaboradores da unidade.`
        : "A unidade não possui vagas pendentes neste ciclo.",
    },
    {
      id: "media-demitidos",
      grupo: "demanda",
      linha: "inferior",
      classe: "media-demitidos",
      nome: "Média Demitidos",
      valor: mediaDemitidos,
      resumo: "estimativa de reposições",
      explicacao: `vagas correspondem à média estimada de demissões, considerando ${percentualMediaDemitidos}% das solicitações.`,
    },
    {
      id: "cobertura",
      grupo: "contratacoes",
      linha: "inferior",
      classe: "cobertura",
      nome: "Índice de Cobertura",
      valor: `${taxaCoberturaTurnover}%`,
      resumo: "demanda preenchida",
      explicacao: "da demanda acumulada já foi atendida por contratações efetivadas.",
    },
    {
      id: "indice-pendencia",
      grupo: "pendencias",
      linha: "inferior",
      classe: "pressao-pendencias",
      nome: "Índice de Pendência",
      valor: `${taxaPendenciaTurnover}%`,
      resumo: "demanda ainda aberta",
      explicacao: "da demanda acumulada ainda permanece com vagas pendentes.",
    },
  ];
  const fontesRecrutamento = metricasRecrutamentoPainel.fontes
    .filter((item) => !normalizarTexto(item.nome).includes("MEDIA DEMITIDOS"))
    .map((item, indice) => ({
      ...item,
      cor: coresFontes[indice] || "#f97316",
    }));
  const totalRecusasGestao = metricasRecrutamentoPainel.recusaGestao.reduce(
    (total, item) => total + Number(item.valor || 0),
    0
  );
  const totalDesistenciasCandidato = metricasRecrutamentoPainel.desistencias.reduce(
    (total, item) => total + Number(item.valor || 0),
    0
  );
  const percentualMotivo = (valor: number, total: number) =>
    total > 0 ? Math.round((valor / total) * 1000) / 10 : 0;
  const motivosRecusaGestao = metricasRecrutamentoPainel.recusaGestao.map((item, indice) => ({
    ...item,
    valor: percentualMotivo(item.valor, totalRecusasGestao),
    cor: coresRecusa[indice] || "#0057b8",
  }));
  const motivosDesistencia = metricasRecrutamentoPainel.desistencias.map((item, indice) => ({
    ...item,
    valor: percentualMotivo(item.valor, totalDesistenciasCandidato),
    cor: coresDesistencia[indice] || "#0f766e",
  }));
  const divisaoDesistencia = calcularDivisaoPerdas(
    metricasRecrutamentoPainel.recusaGestao,
    metricasRecrutamentoPainel.desistencias
  ).map((item, indice) => ({
    ...item,
    cor: indice === 0 ? "#0057b8" : "#f97316",
  }));

  const barraPercentual = (valor: number) =>
    `${valor <= 0 ? 0 : Math.max(8, Math.min(100, valor))}%`;

  const fonteMaxima = Math.max(
    1,
    ...fontesRecrutamento.map(
      (item) => item.valor
    )
  );

  return (
    <div className="dashboard-rh">
      <section className="cards-indicadores">
        <div className="card demanda">
          <span>Demanda Acumulada</span>
          <strong>{cardsPainel.totalVagas}</strong>
          <small>{exibindoConsolidado ? "Total do ciclo" : unidadeSelecionada.nome}</small>
        </div>

        <button
          type="button"
          className="card sucesso card-clicavel"
          onClick={() =>
            setResumoDashboardAberto(
              "contratacoes"
            )
          }
          title="Ver contratações por unidade"
        >
          <span>Contratações Efetivadas</span>
          <strong>{cardsPainel.totalAdmitidos}</strong>
          <small>{exibindoConsolidado ? "No ciclo" : unidadeSelecionada.nome}</small>
        </button>

        <button
          type="button"
          className="card alerta card-clicavel"
          onClick={() =>
            setResumoDashboardAberto(
              "pendentes"
            )
          }
          title="Ver pendências por unidade"
        >
          <span>Vagas Pendentes</span>
          <strong>{cardsPainel.totalPendentes}</strong>
          <small>{exibindoConsolidado ? "Aguardando" : unidadeSelecionada.nome}</small>
        </button>

        <button
          type="button"
          className="card perigo card-clicavel"
          onClick={() =>
            setMostrarUnidadesEstaveis(true)
          }
          title="Ver unidades estáveis"
        >
          <span>Unidades Estáveis</span>
          <strong>{cardsPainel.totalUnidadesEstaveis}</strong>
          <small>{exibindoConsolidado ? "Sem pendências" : unidadeSelecionada.nome}</small>
        </button>

        <div className="mini-indicadores-dashboard">
          <button
            type="button"
            className="mini-card-dashboard azul"
            onClick={() =>
              setTipoIndicadorAberto("PCD")
            }
            title="Ver unidades com vagas PCD"
          >
            <span>PCD</span>
            <strong>{cardsPainel.totalPCD}</strong>
          </button>

          <button
            type="button"
            className="mini-card-dashboard verde"
            onClick={() =>
              setTipoIndicadorAberto("J. APRENDIZ")
            }
            title="Ver unidades com vagas de Jovem Aprendiz"
          >
            <span>Aprendiz</span>
            <strong>{cardsPainel.totalAprendiz}</strong>
          </button>

          <button
            type="button"
            className="mini-card-dashboard roxo"
            onClick={() =>
              setTipoIndicadorAberto("ADM")
            }
            title="Ver unidades com vagas ADM"
          >
            <span>ADM</span>
            <strong>{cardsPainel.totalADM}</strong>
          </button>

          <button
            type="button"
            className="mini-card-dashboard vinho"
            onClick={() =>
              setTipoIndicadorAberto("INVENTÁRIO")
            }
            title="Ver unidades com vagas de Inventário"
          >
            <span>Inventário</span>
            <strong>{cardsPainel.totalInventario}</strong>
          </button>
        </div>
      </section>

      {tipoIndicadorAberto && (
        <div
          className="modal-indicador-fundo"
          onClick={() =>
            setTipoIndicadorAberto(null)
          }
        >
          <div
            className={`modal-indicador ${tipoCorModal(
              tipoIndicadorAberto
            )}`}
            onClick={(evento) =>
              evento.stopPropagation()
            }
          >
            <div className="modal-indicador-cabecalho">
              <div>
                <span>Indicador</span>
                <h3>
                  {tituloIndicador(
                    tipoIndicadorAberto
                  )}
                </h3>
              </div>

              <button
                type="button"
                className="modal-indicador-fechar"
                onClick={() =>
                  setTipoIndicadorAberto(null)
                }
                title="Fechar"
              >
                ×
              </button>
            </div>

            <div className="modal-indicador-conteudo">
              {unidadesPorIndicadorPainel.length > 0 ? (
                unidadesPorIndicadorPainel.map((item) => (
                  <div
                    className="modal-indicador-unidade"
                    key={item.unidade}
                  >
                    <span>{item.unidade}</span>
                    <strong>{item.quantidade}</strong>
                  </div>
                ))
              ) : (
                <div className="modal-indicador-vazio">
                  Nenhuma unidade possui vagas deste
                  indicador.
                </div>
              )}
            </div>

            <div className="modal-indicador-total">
              <span>Total</span>
              <strong>{totalIndicadorAbertoPainel}</strong>
            </div>
          </div>
        </div>
      )}

      {dadosResumoDashboardPainel && (
        <div
          className="modal-indicador-fundo"
          onClick={() =>
            setResumoDashboardAberto(null)
          }
        >
          <div
            className="modal-indicador azul"
            onClick={(evento) =>
              evento.stopPropagation()
            }
          >
            <div className="modal-indicador-cabecalho">
              <div>
                <span>Resumo</span>
                <h3>
                  {dadosResumoDashboardPainel.titulo}
                </h3>
              </div>

              <button
                type="button"
                className="modal-indicador-fechar"
                onClick={() =>
                  setResumoDashboardAberto(null)
                }
                title="Fechar"
              >
                —
              </button>
            </div>

            <div className="modal-indicador-conteudo">
              {dadosResumoDashboardPainel.itens.length >
              0 ? (
                dadosResumoDashboardPainel.itens.map(
                  (item) => (
                    <div
                      className="modal-indicador-unidade"
                      key={item.unidade}
                    >
                      <span>{item.unidade}</span>
                      <strong>{item.quantidade}</strong>
                    </div>
                  )
                )
              ) : (
                <div className="modal-indicador-vazio">
                  {dadosResumoDashboardPainel.vazio}
                </div>
              )}
            </div>

            <div className="modal-indicador-total">
              <span>Total</span>
              <strong>
                {dadosResumoDashboardPainel.total}
              </strong>
            </div>
          </div>
        </div>
      )}

      {mostrarUnidadesEstaveis && (
        <div
          className="modal-indicador-fundo"
          onClick={() =>
            setMostrarUnidadesEstaveis(false)
          }
        >
          <div
            className="modal-indicador verde"
            onClick={(evento) =>
              evento.stopPropagation()
            }
          >
            <div className="modal-indicador-cabecalho">
              <div>
                <span>Indicador</span>
                <h3>Unidades Estáveis</h3>
              </div>

              <button
                type="button"
                className="modal-indicador-fechar"
                onClick={() =>
                  setMostrarUnidadesEstaveis(false)
                }
                title="Fechar"
              >
                ×
              </button>
            </div>

            <div className="modal-indicador-conteudo">
              {unidadesEstaveisPainel.length >
              0 ? (
                unidadesEstaveisPainel.map(
                  (unidade) => (
                    <div
                      className="modal-indicador-unidade"
                      key={unidade}
                    >
                      <span>{unidade}</span>
                      <strong>Estável</strong>
                    </div>
                  )
                )
              ) : (
                <div className="modal-indicador-vazio">
                  Nenhuma unidade estável.
                </div>
              )}
            </div>

            <div className="modal-indicador-total">
              <span>Total</span>
              <strong>
                {unidadesEstaveisPainel.length}
              </strong>
            </div>
          </div>
        </div>
      )}

      <section className="grid-dashboard">
        <div className="painel painel-mapa">
          <div className="mapa-titulos">
            <h2>
              Mapa Estratégico
              <strong>REGIÃO CRAJUBAR</strong>
            </h2>

            <h2>
              Painel Executivo
              <strong>
                {unidadeSelecionada.tipoPainel ===
                "consolidado"
                  ? "CONSOLIDADO GERAL"
                  : unidadeSelecionada.nome.toUpperCase()}
              </strong>
            </h2>
          </div>

          <div className="mapa-layout">
            <div className="mapa-coluna">
              <MapContainer
                center={[-7.233, -39.315]}
                zoom={10}
                scrollWheelZoom
                className="mapa-real"
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                <Marker
                  position={[
                    consolidadoDiniz.lat,
                    consolidadoDiniz.lng,
                  ]}
                  icon={getIconConsolidado()}
                  eventHandlers={{
                    click: () =>
                      setUnidadeSelecionadaNome(
                        CONSOLIDADO_NOME
                      ),
                  }}
                >
                  <Popup>
                    <div className="popup-diniz">
                      <div className="titulo">
                        DINIZ SUPERMERCADOS
                      </div>
                      <div className="popup-unidade">
                        CONSOLIDADO GERAL
                      </div>
                    </div>
                  </Popup>
                </Marker>

                {unidadesDashboard.map((unidade) => (
                  <Marker
                    key={unidade.nome}
                    position={[
                      unidade.lat,
                      unidade.lng,
                    ]}
                    icon={getIcon(unidade)}
                    eventHandlers={{
                      click: () =>
                        setUnidadeSelecionadaNome(
                          unidade.nome
                        ),
                    }}
                  >
                    <Popup>
                      <div className="popup-diniz">
                        <div className="titulo">
                          DINIZ SUPERMERCADOS
                        </div>

                        <div className="popup-unidade">
                          UNIDADE{" "}
                          {unidade.nome.toUpperCase()}
                        </div>

                        <div className="popup-metricas">
                          <span>Vagas <strong>{unidade.vagas}</strong></span>
                          <span>Adm. <strong>{unidade.admitidos}</strong></span>
                          <span>Pend. <strong>{unidade.pendentes}</strong></span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            <MapaInfo unidade={unidadeSelecionada} />
          </div>
        </div>
      </section>

      <GraficosDashboard
        cards={cardsPainel}
        vagas={vagasPainel}
        unidades={unidadesPainel}
        funil={funilRecrutamento}
        conversaoFunil={conversaoFunilRecrutamento}
      />

      <section className="grid-dashboard">
        <div className="painel painel-largo painel-turnover-premium">
          <div className="turnover-premium-cabecalho">
            <div>
              <span>Turnover Estimado</span>
              <h2>{unidadeSelecionada.nome.toUpperCase()}</h2>
            </div>
            <strong className={`turnover-premium-status status-${nivelTurnover.toLowerCase()}`}>
              {nivelTurnover}
            </strong>
          </div>

          <div className="turnover-premium-grid">
            <article className="turnover-premium-indice">
              <div
                className="turnover-premium-medidor"
                style={{
                  background: `conic-gradient(#dc2626 0% ${Math.min(taxaTurnoverPremium * 5, 100)}%, #fecaca ${Math.min(taxaTurnoverPremium * 5, 100)}% 100%)`,
                }}
              >
                <span>{taxaTurnoverPremium}%</span>
                <small>estimado</small>
              </div>
              <div>
                <b>Rotatividade da unidade</b>
                <p>Leitura simples baseada nas admissões, reposições e quadro atual.</p>
              </div>
            </article>

            {cardsTurnover.map((card) => (
              <article
                className={`turnover-premium-kpi ${card.classe} linha-${card.linha} ${cardTurnoverAberto === card.id || grupoTurnoverAberto === card.grupo ? "explicacao-aberta" : ""}`}
                key={card.id}
                role="button"
                tabIndex={0}
                aria-expanded={cardTurnoverAberto === card.id || grupoTurnoverAberto === card.grupo}
                onMouseEnter={() => setGrupoTurnoverAberto(card.grupo)}
                onMouseLeave={() => setGrupoTurnoverAberto(null)}
                onClick={() => setCardTurnoverAberto((atual) => atual === card.id ? null : card.id)}
                onKeyDown={(evento) => {
                  if (evento.key === "Enter" || evento.key === " ") {
                    evento.preventDefault();
                    setCardTurnoverAberto((atual) => atual === card.id ? null : card.id);
                  }
                }}
              >
                <span>{card.nome}</span>
                <strong>{card.valor}</strong>
                <small>{card.resumo}</small>
                <div className="turnover-card-explicacao">
                  {card.id === "pressao-contratacao" ? (
                    <>
                      Isso significa que existe <strong className="turnover-explicacao-valor">1</strong> vaga pendente para cada <strong className="turnover-explicacao-valor">{colaboradoresPorVaga}</strong> colaboradores da unidade.
                    </>
                  ) : (
                    <>
                      {card.linha === "inferior" ? "Isso significa que " : ""}
                      {String(card.valor).match(/\d/) ? (
                        <strong className="turnover-explicacao-valor">{card.valor}</strong>
                      ) : (
                        card.valor
                      )}
                      {card.linha === "inferior" ? " " : " representa "}
                      {card.explicacao}
                    </>
                  )}
                </div>
              </article>
            ))}

          </div>

          <div className="painel-recrutamento-premium painel-recrutamento-legado">
            <article className="recrutamento-card funil-ponta-a-ponta">
              <header>
                <h3>Funil de Recrutamento</h3>
                <strong>{conversaoFunilRecrutamento}%</strong>
              </header>

              <div className="funil-pontas">
                {funilRecrutamento.map((item, indice) => (
                  <div
                    className={`funil-etapa ${item.valor <= 0 ? "funil-etapa-zero" : ""}`}
                    key={item.nome}
                  >
                    <strong>{item.valor}</strong>
                    <i
                      style={{
                        background: item.cor,
                        height: `${Math.round(
                          (Math.max(0, item.valor) / maiorFunilRecrutamento) * 46,
                        )}px`,
                      }}
                    />
                    <span>{item.nome}</span>
                    {indice < funilRecrutamento.length - 1 && (
                      <b
                        className={
                          item.valor <= 0 &&
                          funilRecrutamento[indice + 1]?.valor <= 0
                            ? "funil-seta-zero"
                            : ""
                        }
                        aria-hidden="true"
                      />
                    )}
                  </div>
                ))}
              </div>
            </article>

            <article className="recrutamento-card fontes-bolhas">
              <header>
                <h3>Fontes de Recrutamento</h3>
              </header>

              <div className="fontes-bolhas-grid">
                {fontesRecrutamento.map((item) => (
                  <div
                    key={item.nome}
                    style={{
                      ["--fonte-cor" as string]: item.cor,
                      ["--fonte-escala" as string]: `${0.72 + (item.valor / fonteMaxima) * 0.38}`,
                    }}
                  >
                    <strong>{item.valor}</strong>
                    <span>{item.nome}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="recrutamento-card recusa-degraus">
              <header>
                <h3>Recusa da Gestão</h3>
              </header>

              <div className="degraus-premium">
                {motivosRecusaGestao.map((item, indice) => (
                  <div
                    key={item.nome}
                    style={{
                      ["--degrau" as string]: `${(indice + 1) * 10}px`,
                    }}
                  >
                    <span>{item.nome}</span>
                    <strong>{item.valor}%</strong>
                    <i>
                      <b style={{ width: barraPercentual(item.valor), background: item.cor }} />
                    </i>
                  </div>
                ))}
              </div>
            </article>

            <article className="recrutamento-card desistencia-linha">
              <header>
                <h3>Desistência do Candidato</h3>
              </header>

              <div className="linha-pontos-premium">
                {motivosDesistencia.map((item) => (
                  <div key={item.nome}>
                    <i style={{ background: item.cor }} />
                    <span>{item.nome}</span>
                    <strong>{item.valor}%</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="recrutamento-card donut-desistencia">
              <header>
                <h3>Perdas: Gestão x Candidato</h3>
              </header>

              <div
                className="donut-premium"
                style={{
                  background: `conic-gradient(${divisaoDesistencia[0].cor} 0% ${divisaoDesistencia[0].valor}%, ${divisaoDesistencia[1].cor} ${divisaoDesistencia[0].valor}% 100%)`,
                }}
              >
                <span>{divisaoDesistencia[1].valor}%</span>
              </div>

              <div className="donut-legenda">
                {divisaoDesistencia.map((item) => (
                  <span key={item.nome}>
                    <i style={{ background: item.cor }} />
                    {item.nome} {item.valor}%
                  </span>
                ))}
              </div>
            </article>
          </div>

          <div className="painel-inteligencia-graficos">
            <article className="grafico-inteligencia grafico-funil-rh">
              <header>
                <span>Fluxo RH</span>
                <strong>{totalFunilRecrutamento}</strong>
              </header>

              <div className="funil-rh-linhas">
                {funilRecrutamento.map((item) => (
                  <div key={item.nome}>
                    <span>{item.nome}</span>
                    <i>
                      <b
                        style={{
                          width: `${Math.max(
                            8,
                            (item.valor /
                              Math.max(totalFunilRecrutamento, 1)) *
                              100
                          )}%`,
                          background: item.cor,
                        }}
                      />
                    </i>
                    <strong>{item.valor}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="grafico-inteligencia grafico-cobertura-rh">
              <header>
                <span>Cobertura</span>
                <strong>{conversaoFunilRecrutamento}%</strong>
              </header>

              <div
                className="cobertura-rh-medidor"
                style={{
                  background: `conic-gradient(#16a34a 0% ${conversaoFunilRecrutamento}%, #e2e8f0 ${conversaoFunilRecrutamento}% 100%)`,
                }}
              >
                <span>{conversaoFunilRecrutamento}%</span>
              </div>
            </article>

            <article className="grafico-inteligencia grafico-ranking-rh">
              <header>
                <span>Maior Demanda</span>
                <strong>{ranking[0]?.vagas || 0}</strong>
              </header>

              <div className="ranking-rh-lista">
                {ranking.map((unidade, indice) => (
                  <div key={unidade.nome}>
                    <span>{indice + 1}</span>
                    <p>{unidade.nome}</p>
                    <strong>{unidade.vagas}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="grafico-inteligencia grafico-especial-rh">
              <header>
                <span>Indicadores</span>
                <strong>{unidadesPainel.length}</strong>
              </header>

              <div className="especial-rh-grid">
                {indicadoresEspeciais.map((item) => (
                  <div key={item.nome}>
                    <i style={{ background: item.cor }} />
                    <span>{item.nome}</span>
                    <strong>{item.valor}</strong>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="painel-inteligencia">
            <div className="alerta-card vermelho">
              <strong>{ranking[0]?.vagas || 0}</strong>
              <small>{ranking[0]?.nome || "Unidade"}</small>
              <h3>âš  Prioridade Alta</h3>
              <p>
                {ranking[0]?.nome || "Unidade"} apresenta
                maior demanda de contratação.
              </p>
            </div>

            <div className="alerta-card amarelo">
              <strong>{cardsPainel.totalPendentes}</strong>
              <small>Total atual de pendências</small>
              <h3>⏳ Pendências</h3>
              <p>
                Total atual de pendências:{" "}
                <strong>{cardsPainel.totalPendentes}</strong>.
              </p>
            </div>

            <div className="alerta-card verde">
              <strong>{cardsPainel.totalAdmitidos}</strong>
              <small>Total de admissões no ciclo</small>
              <h3>✓ Admissões</h3>
              <p>
                Total de admissões no ciclo:{" "}
                <strong>{cardsPainel.totalAdmitidos}</strong>.
              </p>
            </div>

            <div className="alerta-card azul">
              <strong>{unidadesPainel.length}</strong>
              <small>Unidades monitoradas</small>
              <h3>ðŸ“Š Cobertura Regional</h3>
              <p>
                {unidadesPainel.length} unidades
                monitoradas em tempo real.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default DashboardRH;

import "leaflet/dist/leaflet.css";
