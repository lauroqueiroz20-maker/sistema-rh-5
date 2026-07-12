import { useMemo, useState } from "react";
import "./DashboardRH.css";

import { type Vaga } from "../../data/vagas";
import { type RegistroAdmitido } from "../Admitidos/Admitidos";
import unidades from "../../data/unidades";

import {
  getDashboardCards,
  getPainelExecutivo,
} from "../../Services/dashboardService";
import { buscarDetalhesUnidade } from "../../Services/unidadesDetalhesService";

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
  risco: "Alto" | "MÃ©dio" | "Médio" | "Baixo";
  pcd: number;
  jovemAprendiz: number;
  adm: number;
  inventario: number;
  colaboradores: number;
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

function getIcon(regiao: string) {
  const cor =
    regiao === "juazeiro"
      ? "#2563eb"
      : regiao === "crato"
        ? "#16a34a"
        : regiao === "barbalha"
          ? "#f59e0b"
          : "#9333ea";

  return L.divIcon({
    className: "",
    html: `
      <div
        style="
          width:18px;
          height:18px;
          background:${cor};
          border:3px solid white;
          border-radius:50%;
          box-shadow:0 0 8px rgba(0,0,0,.35);
        "
      ></div>
    `,
    iconSize: [18, 18],
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
        ■
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
  const vagasCadastro: Vaga[] = [
    ...vagas,
    ...admitidos,
  ];

  const cards = getDashboardCards(vagasCadastro);

  const [tipoIndicadorAberto, setTipoIndicadorAberto] =
    useState<TipoIndicador | null>(null);

  const unidadesPorIndicador = useMemo<UnidadeIndicador[]>(() => {
    if (!tipoIndicadorAberto) return [];

    const tipoProcurado = normalizarTexto(tipoIndicadorAberto);
    const agrupamento: Record<string, number> = {};

    vagasCadastro.forEach((vaga) => {
      if (!vaga.ativo) return;

      const tipoVaga = normalizarTexto(vaga.tipo);

      if (tipoVaga !== tipoProcurado) return;

      const unidade =
        String(vaga.unidade || "").trim().toUpperCase() ||
        "UNIDADE NÃO INFORMADA";

      const quantidade = Math.max(
        0,
        numero(vaga.quantidade) -
          numero(vaga.admissoes)
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
  }, [tipoIndicadorAberto, vagasCadastro]);

  const totalIndicadorAberto = unidadesPorIndicador.reduce(
    (total, item) => total + item.quantidade,
    0
  );

  const unidadesDashboard = useMemo<UnidadeDashboard[]>(() => {
    return unidadesMapaBase.map((unidade) => {
      const indicadores = getPainelExecutivo(
        vagasCadastro,
        unidade.nome
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
        colaboradores: indicadores.colaboradores,
      };
    });
  }, [vagasCadastro]);

  const consolidadoDiniz = useMemo(() => {
    const painel = getPainelExecutivo(vagasCadastro);

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
      colaboradores:
        painel.colaboradores || COLABORADORES,
      estrutura: estruturaConsolidada.estrutura,
      alertas: estruturaConsolidada.alertas,
      tipoPainel: "consolidado",
    } satisfies UnidadeDashboard;
  }, [vagasCadastro, unidadesDashboard, cards]);

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
  };

  const ranking = [...unidadesDashboard]
    .sort((a, b) => b.vagas - a.vagas)
    .slice(0, 4);

  return (
    <div className="dashboard-rh">
      <section className="cards-indicadores">
        <div className="card demanda">
          <span>Demanda Acumulada</span>
          <strong>{cards.totalVagas}</strong>
          <small>Total do ciclo</small>
        </div>

        <div className="card sucesso">
          <span>Admitidos</span>
          <strong>{cards.totalAdmitidos}</strong>
          <small>No ciclo</small>
        </div>

        <div className="card alerta">
          <span>Pendentes</span>
          <strong>{cards.totalPendentes}</strong>
          <small>Aguardando</small>
        </div>

        <div className="card perigo">
          <span>Unidades Estáveis</span>
          <strong>{cards.totalUnidadesEstaveis}</strong>
          <small>Sem pendências</small>
        </div>

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
            <strong>{cards.totalPCD}</strong>
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
            <strong>{cards.totalAprendiz}</strong>
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
            <strong>{cards.totalADM}</strong>
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
            <strong>{cards.totalInventario}</strong>
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
              {unidadesPorIndicador.length > 0 ? (
                unidadesPorIndicador.map((item) => (
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
              <strong>{totalIndicadorAberto}</strong>
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
                    icon={getIcon(unidade.regiao)}
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
        cards={cards}
        vagas={vagasCadastro}
        unidades={unidadesDashboard}
      />

      <section className="grid-dashboard">
        <div className="painel painel-largo">
          <h2>Central de Inteligência RH</h2>

          <div className="painel-inteligencia">
            <div className="alerta-card vermelho">
              <h3>⚠ Prioridade Alta</h3>
              <p>
                {ranking[0]?.nome || "Unidade"} apresenta
                maior demanda de contratação.
              </p>
            </div>

            <div className="alerta-card amarelo">
              <h3>⏳ Pendências</h3>
              <p>
                Total atual de pendências:{" "}
                <strong>{cards.totalPendentes}</strong>.
              </p>
            </div>

            <div className="alerta-card verde">
              <h3>✔ Admissões</h3>
              <p>
                Total de admissões no ciclo:{" "}
                <strong>{cards.totalAdmitidos}</strong>.
              </p>
            </div>

            <div className="alerta-card azul">
              <h3>📊 Cobertura Regional</h3>
              <p>
                {unidadesDashboard.length} unidades
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