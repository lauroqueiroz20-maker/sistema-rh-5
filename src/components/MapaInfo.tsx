type ValorPainel = string | number | null | undefined;

type EstruturaUnidade = Record<string, ValorPainel>;

type AlertasUnidade = {
  retornoFerias?: ValorPainel;
  admissoesPrevistas?: ValorPainel;
};

type UnidadeMapaInfo = {
  bairro: string;
  cidade: string;
  potencial?: number;
  colaboradores?: ValorPainel;
  vagas?: ValorPainel;
  admitidos?: ValorPainel;
  pendentes?: ValorPainel;
  risco?: string;
  tipoPainel?: string;
  pcd?: ValorPainel;
  jovemAprendiz?: ValorPainel;
  aprendiz?: ValorPainel;
  adm?: ValorPainel;
  inventario?: ValorPainel;
  unidadesMonitoradas?: ValorPainel;
  estrutura?: EstruturaUnidade;
  alertas?: AlertasUnidade;
};

interface Props {
  unidade: UnidadeMapaInfo;
}

function numero(valor: ValorPainel) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
}

function normalizarTexto(valor: ValorPainel) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

function formatarNomeCargo(cargo: string) {
  return cargo
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letra) => letra.toUpperCase())
    .replace("Pcd", "PCD")
    .replace("Adm", "ADM")
    .trim();
}

export default function MapaInfo({ unidade }: Props) {
  const estrutura = unidade.estrutura || {};
  const alertas = unidade.alertas || {};
  const isConsolidado = unidade.tipoPainel === "consolidado";
  const totalColaboradores = Math.round(numero(unidade.colaboradores));
  const totalVagas = numero(unidade.vagas);
  const totalAdmitidos = numero(unidade.admitidos);
  const totalPendentes = numero(unidade.pendentes);
  const totalPcd = numero(estrutura.pcd ?? unidade.pcd);
  const totalAprendiz = numero(
    estrutura.jovemAprendiz ?? unidade.jovemAprendiz ?? unidade.aprendiz,
  );
  const totalAdm = numero(estrutura.adm ?? unidade.adm);
  const totalInventario = numero(estrutura.inventario ?? unidade.inventario);
  const unidadesMonitoradas = Math.max(1, numero(unidade.unidadesMonitoradas));
  const mediaColaboradoresFormatada = Math.round(
    totalColaboradores / unidadesMonitoradas,
  ).toLocaleString("pt-BR");
  const cobertura =
    totalVagas > 0 ? Math.round((totalAdmitidos / totalVagas) * 100) : 0;
  const demandaPor100 =
    totalColaboradores > 0
      ? Number(((totalPendentes / totalColaboradores) * 100).toFixed(1))
      : 0;
  const riscoNormalizado = normalizarTexto(unidade.risco);
  const status =
    riscoNormalizado === "ALTO"
      ? "Prioridade"
      : riscoNormalizado === "MEDIO"
        ? "Em atencao"
        : "Normal";

  const estruturaRanking = Object.entries(estrutura)
    .map(([cargo, quantidade]) => ({
      cargo,
      quantidade: numero(quantidade),
    }))
    .filter((item) => item.quantidade > 0)
    .sort((a, b) => b.quantidade - a.quantidade);

  const maiorEstrutura = Math.max(
    1,
    ...estruturaRanking.map((item) => item.quantidade),
  );

  const indicadoresResumo = [
    {
      nome: "PCD",
      valor: totalPcd,
      cor: "#2563eb",
    },
    {
      nome: "J.Aprendiz",
      valor: totalAprendiz,
      cor: "#16a34a",
    },
    {
      nome: "ADM",
      valor: totalAdm,
      cor: "#7c3aed",
    },
    {
      nome: "Inventario",
      valor: totalInventario,
      cor: "#f97316",
    },
  ];

  const maiorIndicador = Math.max(
    1,
    ...indicadoresResumo.map((item) => item.valor),
  );

  return (
    <aside className="painel-unidade-selecionada">
      <h4>{isConsolidado ? "Indicadores Internos" : "Indicadores da Unidade"}</h4>

      <div className="indices-internos indices-internos-expandido">
        <div>
          <span>Status</span>
          <strong>{status}</strong>
        </div>

        <div>
          <span>Cobertura</span>
          <strong>{cobertura}%</strong>
        </div>

        <div>
          <span>Pend. / 100 colab.</span>
          <strong>{demandaPor100}</strong>
        </div>

        <div>
          <span>Base interna</span>
          <strong>{Math.round(totalColaboradores)}</strong>
        </div>

        <div>
          <span>Solicitacoes</span>
          <strong>{totalVagas}</strong>
        </div>

        <div>
          <span>Admissoes</span>
          <strong>{totalAdmitidos}</strong>
        </div>

        <div>
          <span>Pendencias</span>
          <strong>{totalPendentes}</strong>
        </div>

        <div>
          <span>Media func. / unidade</span>
          <strong>{mediaColaboradoresFormatada}</strong>
        </div>
      </div>

      <div className="estrutura-ranking">
        {estruturaRanking.map((item) => (
          <div key={item.cargo}>
            <span>{formatarNomeCargo(item.cargo)}</span>
            <i>
              <b
                style={{
                  width: `${Math.max(8, (item.quantidade / maiorEstrutura) * 100)}%`,
                }}
              />
            </i>
            <strong>{item.quantidade}</strong>
          </div>
        ))}
      </div>

      <div className="indicadores-ranking">
        {indicadoresResumo.map((item) => (
          <div key={item.nome}>
            <span>{item.nome}</span>
            <i>
              <b
                style={{
                  width: `${Math.max(8, (item.valor / maiorIndicador) * 100)}%`,
                  background: item.cor,
                }}
              />
            </i>
            <strong>{item.valor}</strong>
          </div>
        ))}
      </div>

      <div className="alertas-compactos">
        <div>
          <span>Retorno ferias</span>
          <strong>{alertas.retornoFerias ?? 0}</strong>
        </div>

        <div>
          <span>Admissoes previstas</span>
          <strong>{alertas.admissoesPrevistas ?? 0}</strong>
        </div>
      </div>
    </aside>
  );
}
