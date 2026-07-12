import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";

import type { Vaga } from "../../../data/vagas";

type DashboardCards = {
  totalVagas: number;
  totalAdmitidos: number;
  totalPendentes: number;
  totalUnidadesEstaveis: number;
  totalPCD: number;
  totalAprendiz: number;
  totalADM: number;
  totalInventario: number;
  totalColaboradores: number;
};

type UnidadeGrafico = {
  nome: string;
  vagas: number;
  admitidos: number;
  pendentes: number;
  colaboradores: number;
};

type ItemGrafico = {
  nome: string;
  valor: number;
};

type ItemCargo = ItemGrafico & {
  unidades: ItemGrafico[];
};

type ItemRotacao = ItemGrafico & {
  vagas: number;
  admitidos: number;
  pendentes: number;
  taxa: number;
};

type TurnoverResumo = {
  vagas: number;
  admitidos: number;
  pendentes: number;
  colaboradores: number;
  demitidosMedios: number;
  taxa: number;
  cobertura: number;
};

type GraficosDashboardProps = {
  cards: DashboardCards;
  vagas: Vaga[];
  unidades: UnidadeGrafico[];
};

const CORES_TIPO = [
  "#2563eb",
  "#16a34a",
  "#7c3aed",
  "#dc2626",
  "#f59e0b",
  "#0891b2",
];

function normalizarTexto(valor: unknown) {
  return String(valor || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function numero(valor: unknown) {
  const convertido = Number(valor);
  return Number.isFinite(convertido)
    ? convertido
    : 0;
}

function nomeCurto(valor: string, limite = 18) {
  return valor.length > limite
    ? `${valor.slice(0, limite - 1)}.`
    : valor;
}

function labelTipo(valor: string) {
  const normalizado = normalizarTexto(valor);

  if (normalizado.includes("APRENDIZ")) {
    return "APRENDIZ";
  }

  if (normalizado.includes("OPER")) {
    return "OPERA\u00c7\u00c3O";
  }

  if (normalizado.includes("ESTAVEL")) {
    return "EST\u00c1VEL";
  }

  if (normalizado.includes("INVENT")) {
    return "INVENT\u00c1RIO";
  }

  return valor;
}

function somarPorCampo(
  vagas: Vaga[],
  campo: keyof Pick<
    Vaga,
    "tipo" | "setor" | "cargo" | "motivo"
  >,
  limite?: number
) {
  const mapa = new Map<string, number>();

  vagas.forEach((vaga) => {
    if (!vaga.ativo) {
      return;
    }

    const chave =
      String(vaga[campo] || "").trim().toUpperCase() ||
      "NÃO INFORMADO";

    const nomeAgrupado =
      campo === "tipo" ? labelTipo(chave) : chave;
    const pendentes = Math.max(
      numero(vaga.quantidade) - numero(vaga.admissoes),
      0
    );

    if (pendentes <= 0) {
      return;
    }

    mapa.set(
      nomeAgrupado,
      numero(mapa.get(nomeAgrupado)) + pendentes
    );
  });

  const dados = Array.from(mapa.entries())
    .map(([nome, valor]) => ({
      nome,
      valor,
    }))
    .sort((a, b) => b.valor - a.valor);

  return typeof limite === "number"
    ? dados.slice(0, limite)
    : dados;
}

function somarPendenciasPorCargo(vagas: Vaga[]): ItemCargo[] {
  const agrupamento = new Map<
    string,
    {
      total: number;
      unidades: Map<string, number>;
    }
  >();

  vagas.forEach((vaga) => {
    if (!vaga.ativo) {
      return;
    }

    const cargo =
      String(vaga.cargo || "").trim().toUpperCase() ||
      "NÃO INFORMADO";

    const unidade =
      String(vaga.unidade || "").trim().toUpperCase() ||
      "UNIDADE NÃO INFORMADA";

    const quantidade = Math.max(
      numero(vaga.quantidade) -
        numero(vaga.admissoes),
      0
    );

    if (quantidade <= 0) {
      return;
    }

    const item =
      agrupamento.get(cargo) || {
        total: 0,
        unidades: new Map<string, number>(),
      };

    item.total += quantidade;
    item.unidades.set(
      unidade,
      numero(item.unidades.get(unidade)) + quantidade
    );

    agrupamento.set(cargo, item);
  });

  return Array.from(agrupamento.entries())
    .map(([nome, item]) => ({
      nome,
      valor: item.total,
      unidades: Array.from(item.unidades.entries())
        .map(([unidade, valor]) => ({
          nome: unidade,
          valor,
        }))
        .sort((a, b) => b.valor - a.valor),
    }))
    .sort((a, b) => b.valor - a.valor)
    .filter((item) => item.valor > 0);
}

function obterDadosTipo(cards: DashboardCards) {
  return [
    {
      nome: "PCD",
      valor: cards.totalPCD,
    },
    {
      nome: "Aprendiz",
      valor: cards.totalAprendiz,
    },
    {
      nome: "ADM",
      valor: cards.totalADM,
    },
    {
      nome: "Inventário",
      valor: cards.totalInventario,
    },
  ].filter((item) => item.valor > 0);
}

function GraficoVazio() {
  return (
    <div className="grafico-vazio">
      Sem dados no período
    </div>
  );
}

function RankingCircular({ dados }: { dados: ItemRotacao[] }) {
  const maiorValor = Math.max(
    1,
    ...dados.map((item) => item.taxa)
  );

  return (
    <div className="ranking-circular">
      {dados.map((item, index) => {
        const percentual = Math.min(
          100,
          Math.max(6, (item.taxa / maiorValor) * 100)
        );

        return (
          <div
            className="ranking-circular-item"
            key={item.nome}
            title={`${item.nome} | Vagas: ${item.vagas} | Admitidos: ${item.admitidos} | Pendentes: ${item.pendentes}`}
            data-tooltip={`${item.nome}\A Vagas: ${item.vagas}\A Admitidos: ${item.admitidos}\A Pendentes: ${item.pendentes}`}
          >
            <span>{index + 1}</span>
            <div>
              <strong title={item.nome}>
                {nomeCurto(item.nome, 14)}
              </strong>
              <small>
                {item.pendentes} pend. / {item.admitidos} adm.
              </small>
            </div>
            <i>
              <em
                style={{
                  width: `${percentual}%`,
                  background:
                    CORES_TIPO[index % CORES_TIPO.length],
                }}
              />
            </i>
            <b>{item.valor}%</b>
          </div>
        );
      })}
    </div>
  );
}

function PainelTurnover({
  dados,
}: {
  dados: TurnoverResumo;
}) {
  const indicadores = [
    {
      nome: "Vagas",
      valor: dados.vagas,
      cor: "#2563eb",
    },
    {
      nome: "Admitidos",
      valor: dados.admitidos,
      cor: "#16a34a",
    },
    {
      nome: "Pendentes",
      valor: dados.pendentes,
      cor: "#7c3aed",
    },
    {
      nome: "Média demitidos",
      valor: dados.demitidosMedios,
      cor: "#dc2626",
    },
  ];

  const totalIndicadores = Math.max(
    1,
    indicadores.reduce(
      (total, item) => total + item.valor,
      0
    )
  );

  const percentualVagas =
    (dados.vagas / totalIndicadores) * 100;

  const percentualAdmitidos =
    (dados.admitidos / totalIndicadores) * 100;

  const percentualPendentes =
    (dados.pendentes / totalIndicadores) * 100;

  const limiteVagas =
    percentualVagas;

  const limiteAdmitidos =
    limiteVagas + percentualAdmitidos;

  const limitePendentes =
    limiteAdmitidos + percentualPendentes;

  const fundoGrafico = `conic-gradient(
    #2563eb 0% ${limiteVagas}%,
    #16a34a ${limiteVagas}% ${limiteAdmitidos}%,
    #7c3aed ${limiteAdmitidos}% ${limitePendentes}%,
    #dc2626 ${limitePendentes}% 100%
  )`;

  return (
    <div className="turnover-moderno">
      <div className="turnover-grafico-bloco">
        <div
          className="turnover-medidor"
          style={{
            background: fundoGrafico,
          }}
        >
          <div className="turnover-centro">
            <span>{dados.taxa}%</span>
          </div>
        </div>

        <small className="turnover-legenda">
          Turnover Estimado
        </small>
      </div>

      <div className="turnover-metricas">
        {indicadores.map((item) => (
          <div key={item.nome}>
            <i style={{ background: item.cor }} />
            <span>{item.nome}</span>
            <strong>{item.valor}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function GraficosDashboard({
  cards,
  vagas,
  unidades,
}: GraficosDashboardProps) {
  const dados = useMemo(() => {
    const demandasPendencias = [
      {
        nome: "Demanda",
        valor: numero(cards.totalVagas),
        fill: "#2563eb",
      },
      {
        nome: "Admitidos",
        valor: numero(cards.totalAdmitidos),
        fill: "#16a34a",
      },
      {
        nome: "Pendentes",
        valor: numero(cards.totalPendentes),
        fill: "#7c3aed",
      },
    ];

    const porTipo = somarPorCampo(vagas, "tipo");
    const porTipoEspecial = obterDadosTipo(cards);
    const porCargo = somarPendenciasPorCargo(vagas);
    const porMotivo = somarPorCampo(vagas, "motivo", 5);
    const coberturaAdmissao = 95;
    const demitidosMedios = Math.round(
      (numero(cards.totalVagas) * coberturaAdmissao) / 100
    );
    const colaboradores = Math.max(
      numero(cards.totalColaboradores),
      1
    );
    const taxaTurnover = Number(
      (
        ((numero(cards.totalAdmitidos) + demitidosMedios) /
          2 /
          colaboradores) *
        100
      ).toFixed(1)
    );

    const turnover = {
      vagas: numero(cards.totalVagas),
      admitidos: numero(cards.totalAdmitidos),
      pendentes: numero(cards.totalPendentes),
      colaboradores: numero(cards.totalColaboradores),
      demitidosMedios,
      taxa: taxaTurnover,
      cobertura: coberturaAdmissao,
    };

    const rotacaoUnidades = unidades
      .map((unidade) => {
        const vagasUnidade = numero(unidade.vagas);
        const admitidosUnidade = numero(unidade.admitidos);
        const pendentesUnidade = numero(unidade.pendentes);
        const baseUnidade = Math.max(
          vagasUnidade,
          admitidosUnidade + pendentesUnidade,
          1
        );
        const taxa = Number(
          (
            (pendentesUnidade / baseUnidade) *
            100
          ).toFixed(1)
        );

        return {
          nome: unidade.nome,
          valor: pendentesUnidade,
          taxa,
          vagas: vagasUnidade,
          admitidos: admitidosUnidade,
          pendentes: pendentesUnidade,
        };
      })
      .filter((item) => item.valor > 0)
      .sort((a, b) => b.taxa - a.taxa);

    const situacao = [
      {
        nome: "Preenchidas",
        valor: numero(cards.totalAdmitidos),
      },
      {
        nome: "Em aberto",
        valor: numero(cards.totalPendentes),
      },
    ];

    const resumo = [
      {
        nome: "Colaboradores",
        valor: numero(cards.totalColaboradores),
      },
      {
        nome: "Unidades estáveis",
        valor: numero(cards.totalUnidadesEstaveis),
      },
      {
        nome: "Vagas ativas",
        valor: numero(cards.totalPendentes),
      },
    ];

    return {
      demandasPendencias,
      porTipo,
      porTipoEspecial,
      porCargo,
      porMotivo,
      rotacaoUnidades,
      situacao,
      resumo,
      turnover,
    };
  }, [cards, vagas, unidades]);

  const totalTipo = dados.porTipo.reduce(
    (total, item) => total + item.valor,
    0
  );

  const totalCargo = dados.porCargo.reduce(
    (total, item) => total + item.valor,
    0
  );

  const taxaPreenchimento =
    cards.totalVagas > 0
      ? Math.round(
          (cards.totalAdmitidos / cards.totalVagas) * 100
        )
      : 0;

  const [cargoAberto, setCargoAberto] = useState("");

  const cargoSelecionado =
    dados.porCargo.find(
      (item) => item.nome === cargoAberto
    ) || dados.porCargo[0];

  return (
    <section className="dashboard-graficos">
      <div className="grafico-card borda-verde grafico-destaque">
        <header>
          <h2>Demanda x Admitidos x Pendentes</h2>
          <span>Tempo real</span>
        </header>

        <div className="grafico-corpo grafico-kpi-triplo">
          <ResponsiveContainer width="100%" height={156}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="30%"
              outerRadius="96%"
              data={dados.demandasPendencias}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis
                type="number"
                domain={[
                  0,
                  Math.max(
                    1,
                    ...dados.demandasPendencias.map(
                      (item) => item.valor
                    )
                  ),
                ]}
                tick={false}
              />
              <RadialBar
                dataKey="valor"
                cornerRadius={10}
                background
              >
                {dados.demandasPendencias.map((item) => (
                  <Cell
                    key={item.nome}
                    fill={item.fill}
                  />
                ))}
              </RadialBar>
              <Tooltip
                cursor={false}
              />
            </RadialBarChart>
          </ResponsiveContainer>

          <div className="kpi-triplo-legenda">
            {dados.demandasPendencias.map((item) => (
              <div key={item.nome}>
                <i
                  style={{
                    background: item.fill,
                  }}
                />
                <span>{item.nome}</span>
                <strong>{item.valor}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grafico-card borda-azul">
        <header>
          <h2>Vagas por Tipo</h2>
          <span>{totalTipo}</span>
        </header>

        <div className="grafico-corpo grafico-tipo-moderno">
          {dados.porTipo.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={132}>
                <PieChart>
                  <Pie
                    data={dados.porTipo}
                    dataKey="valor"
                    nameKey="nome"
                    innerRadius={40}
                    outerRadius={64}
                    paddingAngle={4}
                  >
                    {dados.porTipo.map((item, index) => (
                      <Cell
                        key={item.nome}
                        fill={
                          CORES_TIPO[index % CORES_TIPO.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="tipo-legenda-moderna">
                {dados.porTipo.map((item, index) => (
                  <span key={item.nome}>
                    <i
                      style={{
                        background:
                          CORES_TIPO[
                            index % CORES_TIPO.length
                          ],
                      }}
                    />
                    {item.nome}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <GraficoVazio />
          )}
        </div>
      </div>

      <div className="grafico-card borda-laranja grafico-card-cargo">
        <header>
          <h2>Pendências por Cargo</h2>
          <span>{totalCargo}</span>
        </header>

        <div className="grafico-corpo grafico-pendencias-cargo">
          {dados.porCargo.length > 0 ? (
            <>
              <div className="pendencias-cargo-lista">
                {dados.porCargo.map((item, index) => {
                  const maiorValor = Math.max(
                    1,
                    ...dados.porCargo.map(
                      (cargo) => cargo.valor
                    )
                  );

                  const ativo =
                    cargoSelecionado?.nome === item.nome;

                  return (
                    <button
                      className={`pendencia-cargo-item ${
                        ativo ? "ativo" : ""
                      }`}
                      key={item.nome}
                      type="button"
                      onClick={() =>
                        setCargoAberto(item.nome)
                      }
                    >
                      <strong title={item.nome}>
                        {nomeCurto(item.nome, 18)}
                      </strong>
                      <div>
                        <i
                          style={{
                            width: `${Math.max(
                              10,
                              (item.valor / maiorValor) *
                                100
                            )}%`,
                            background:
                              CORES_TIPO[
                                index % CORES_TIPO.length
                              ],
                          }}
                        />
                      </div>
                      <b>{item.valor}</b>
                    </button>
                  );
                })}
              </div>

              {cargoSelecionado && (
                <section className="pendencias-cargo-detalhe">
                  <h4>
                    {nomeCurto(cargoSelecionado.nome, 22)}
                  </h4>

                  {cargoSelecionado.unidades.map((unidade) => (
                    <p key={unidade.nome}>
                      <span>
                        {nomeCurto(unidade.nome, 18)}
                      </span>
                      <strong>{unidade.valor}</strong>
                    </p>
                  ))}
                </section>
              )}
            </>
          ) : (
            <GraficoVazio />
          )}
        </div>
      </div>

      <div className="grafico-card borda-roxa grafico-card-rotacao">
        <header>
          <h2>Rotatividades</h2>
        </header>

        <div className="grafico-corpo grafico-corpo-rotacao">
          {dados.rotacaoUnidades.length > 0 ? (
            <RankingCircular dados={dados.rotacaoUnidades} />
          ) : (
            <GraficoVazio />
          )}
        </div>
      </div>

      <div className="grafico-card borda-azul">
        <header>
          <h2>Turnover</h2>
        </header>

        <div className="grafico-corpo grafico-turnover">
          <PainelTurnover dados={dados.turnover} />
        </div>
      </div>

      <div className="grafico-card borda-verde">
        <header>
          <h2>Situação das Vagas</h2>
          <span>{taxaPreenchimento}%</span>
        </header>

        <div className="grafico-corpo">
          <ResponsiveContainer width="100%" height={168}>
            <AreaChart
              data={dados.situacao}
              margin={{
                top: 10,
                right: 10,
                left: -18,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient
                  id="situacaoVagas"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#16a34a"
                    stopOpacity={0.7}
                  />
                  <stop
                    offset="95%"
                    stopColor="#16a34a"
                    stopOpacity={0.04}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="#e2e8f0"
                vertical={false}
              />
              <XAxis
                dataKey="nome"
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 11,
                  fontWeight: 700,
                  fill: "#334155",
                }}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 11,
                  fill: "#64748b",
                }}
              />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="valor"
                stroke="#16a34a"
                strokeWidth={3}
                fill="url(#situacaoVagas)"
                animationDuration={450}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grafico-card borda-roxa">
        <header>
          <h2>Principais Motivos</h2>
        </header>

        <div className="grafico-corpo">
          {dados.porMotivo.length > 0 ? (
            <ResponsiveContainer width="100%" height={168}>
              <LineChart
                data={dados.porMotivo}
                margin={{
                  top: 10,
                  right: 12,
                  left: -18,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  stroke="#e2e8f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="nome"
                  tickFormatter={(valor: string) =>
                    nomeCurto(valor, 8)
                  }
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 10,
                    fontWeight: 800,
                    fill: "#334155",
                  }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 10,
                    fill: "#64748b",
                  }}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="#7c3aed"
                  strokeWidth={3}
                  dot={{
                    r: 5,
                    fill: "#ffffff",
                    stroke: "#7c3aed",
                    strokeWidth: 3,
                  }}
                  activeDot={{
                    r: 7,
                  }}
                  animationDuration={450}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <GraficoVazio />
          )}
        </div>
      </div>

      <div className="grafico-card borda-laranja">
        <header>
          <h2>Resumo Executivo</h2>
          <span>RH</span>
        </header>

        <div className="grafico-corpo resumo-executivo-grafico">
          {dados.resumo.map((item) => (
            <div key={normalizarTexto(item.nome)}>
              <span>{item.nome}</span>
              <strong>{item.valor}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default GraficosDashboard;