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

type GraficosDashboardProps = {
  cards: DashboardCards;
  vagas: Vaga[];
  unidades: UnidadeGrafico[];
  funil: Array<{
    nome: string;
    valor: number;
    cor: string;
  }>;
  conversaoFunil: number;
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

function corTipoGrafico(nome: string, indice: number) {
  const normalizado = normalizarTexto(nome);

  if (normalizado.includes("EXPERIENCIA")) {
    return "#f97316";
  }

  return CORES_TIPO[indice % CORES_TIPO.length];
}

function labelTipo(valor: string) {
  const normalizado = normalizarTexto(valor);

  if (normalizado.includes("EXPERIENCIA")) {
    return "EM EXPERIÊNCIA";
  }

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
  limite?: number,
  base: "pendentes" | "demanda" = "pendentes"
) {
  const mapa = new Map<string, number>();

  vagas.forEach((vaga) => {
    if (vaga.ativo === false) {
      return;
    }

    const chave =
      String(vaga[campo] || "").trim().toUpperCase() ||
      "NÃO INFORMADO";

    const nomeAgrupado =
      campo === "tipo" ? labelTipo(chave) : chave;
    const valor =
      base === "demanda"
        ? Math.max(numero(vaga.quantidade), 0)
        : Math.max(
            numero(vaga.quantidade) - numero(vaga.admissoes),
            0
          );

    if (valor <= 0) {
      return;
    }

    mapa.set(
      nomeAgrupado,
      numero(mapa.get(nomeAgrupado)) + valor
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
    if (vaga.ativo === false) {
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
                  background: corTipoGrafico(item.nome, index),
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

function GraficosDashboard({
  cards,
  vagas,
  unidades,
  funil,
  conversaoFunil,
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
        fill: "#f97316",
      },
    ];

    const porTipo = somarPorCampo(vagas, "tipo");
    const porTipoEspecial = obterDadosTipo(cards);
    const porCargo = somarPendenciasPorCargo(vagas);
    const porMotivo = somarPorCampo(
      vagas,
      "motivo",
      5,
      "demanda"
    );
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
    const unidadeMaiorSolicitacoes = [...unidades]
      .sort((a, b) => numero(b.vagas) - numero(a.vagas))[0];

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

    const totalPendentes = numero(cards.totalPendentes);
    const resumo = [
      {
        nome: "Cargo crítico",
        valor: porCargo[0]?.nome || "Sem alerta",
        detalhe: `${porCargo[0]?.valor || 0} vagas abertas`,
      },
      {
        nome: "Motivo principal",
        valor: porMotivo[0]?.nome || "Sem alerta",
        detalhe: `${porMotivo[0]?.valor || 0} ocorrências`,
      },
      {
        nome: "Mais solicitações",
        valor: (unidadeMaiorSolicitacoes?.nome || "Sem alerta").toUpperCase(),
        detalhe: `${numero(unidadeMaiorSolicitacoes?.vagas)} solicitações`,
      },
      {
        nome: "Prioridade atual",
        valor: totalPendentes > 50 ? "Alta" : totalPendentes > 20 ? "Média" : "Controlada",
        detalhe: "leitura automática",
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
  const coberturaTurnover = 95;
  const demitidosMedios = Math.round((numero(cards.totalVagas) * coberturaTurnover) / 100);
  const taxaTurnover = Number((
    ((numero(cards.totalAdmitidos) + demitidosMedios) / 2 /
      Math.max(numero(cards.totalColaboradores), 1)) * 100
  ).toFixed(1));
  const indicadoresTurnover = [
    { nome: "Vagas", valor: numero(cards.totalVagas), cor: "#2563eb" },
    { nome: "Admitidos", valor: numero(cards.totalAdmitidos), cor: "#16a34a" },
    { nome: "Pendentes", valor: numero(cards.totalPendentes), cor: "#f97316" },
    { nome: "Média demitidos", valor: demitidosMedios, cor: "#dc2626" },
  ];
  const totalTurnover = Math.max(1, indicadoresTurnover.reduce((total, item) => total + item.valor, 0));
  let inicioTurnover = 0;
  const fatiasTurnover = indicadoresTurnover.map((item) => {
    const inicio = inicioTurnover;
    const percentual = (item.valor / totalTurnover) * 100;
    inicioTurnover += percentual;
    return { ...item, inicio, fim: inicioTurnover, percentual };
  });
  const fundoTurnover = `conic-gradient(${fatiasTurnover
    .map((item) => `${item.cor} ${item.inicio}% ${item.fim}%`)
    .join(", ")})`;
  const pendenciaTurnover = numero(cards.totalVagas) > 0
    ? Math.min(100, Math.round((numero(cards.totalPendentes) / numero(cards.totalVagas)) * 100))
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
                        fill={corTipoGrafico(item.nome, index)}
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
                        background: corTipoGrafico(item.nome, index),
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
                            background: corTipoGrafico(item.nome, index),
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

      <div className="grafico-card borda-azul grafico-card-turnover-compacto">
        <header>
          <h2>Turnover Estimado</h2>
        </header>

        <div className="grafico-corpo grafico-turnover">
          <div className="turnover-moderno">
            <div className="turnover-grafico-bloco">
              <div className="turnover-medidor" style={{ background: fundoTurnover }}>
                <div className="turnover-centro"><span>{taxaTurnover}%</span></div>
              </div>
              <div className="turnover-indices">
                {fatiasTurnover.map((item) => (
                  <div key={item.nome}>
                    <i style={{ background: item.cor }} />
                    <span>{item.nome}</span>
                    <strong>{Math.round(item.percentual)}%</strong>
                  </div>
                ))}
                <div>
                  <span>Preenchimento</span><strong>{taxaPreenchimento}%</strong>
                  <i><b style={{ width: `${taxaPreenchimento}%` }} /></i>
                </div>
                <div>
                  <span>Pendência</span><strong>{pendenciaTurnover}%</strong>
                  <i><b style={{ width: `${pendenciaTurnover}%` }} /></i>
                </div>
              </div>
            </div>
            <div className="turnover-metricas">
              {indicadoresTurnover.map((item) => (
                <div key={item.nome} title={item.nome === "Média demitidos" ? `Valor estimado: ${coberturaTurnover}% das solicitações.` : undefined}>
                  <i style={{ background: item.cor }} /><span>{item.nome}</span><strong>{item.valor}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grafico-card borda-azul grafico-card-funil-executivo">
        <header>
          <h2>Funil de Recrutamento</h2>
          <span>{conversaoFunil}%</span>
        </header>

        <div className="grafico-corpo funil-executivo-card">
          {funil.map((item, indice) => (
            <div key={item.nome}>
              <i
                style={{
                  background: item.cor,
                  width: `${Math.max(
                    18,
                    100 - indice * (68 / Math.max(funil.length - 1, 1)),
                  )}%`,
                }}
              >
                <strong>{item.valor}</strong>
              </i>
              <span>{item.nome}</span>
            </div>
          ))}
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
          <h2>Principais Causas</h2>
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
                  stroke="#f97316"
                  strokeWidth={3}
                  dot={{
                    r: 5,
                    fill: "#ffffff",
                    stroke: "#f97316",
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
          <h2>Pontos de Atenção</h2>
          <span>Dinâmico</span>
        </header>

        <div className="grafico-corpo resumo-executivo-grafico">
          {dados.resumo.map((item) => (
            <div key={normalizarTexto(item.nome)}>
              <span>
                {item.nome}
                <small>{item.detalhe}</small>
              </span>
              <strong>{item.valor}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default GraficosDashboard;
