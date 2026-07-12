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
  subGerente?: ValorPainel;
  estrutura?: EstruturaUnidade;
  alertas?: AlertasUnidade;
};

interface Props {
  unidade: UnidadeMapaInfo;
}

function valor(valor: ValorPainel): string | number {
  if (valor === undefined || valor === null || valor === "") return "-";
  if (Number.isNaN(valor)) return 0;
  return valor;
}

function numero(valor: ValorPainel) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
}

export default function MapaInfo({ unidade }: Props) {
  const estrutura = unidade.estrutura || {};
  const alertas = unidade.alertas || {};
  const isConsolidado = unidade.tipoPainel === "consolidado";

const aprendiz = isConsolidado
  ? 24
  : numero(unidade.jovemAprendiz ?? unidade.aprendiz ?? estrutura.jovemAprendiz);

const pcd = isConsolidado
  ? 0
  : numero(unidade.pcd ?? estrutura.pcd);

const adm = isConsolidado
  ? 0
  : numero(unidade.adm ?? estrutura.adm);

const inventario = isConsolidado
  ? 0
  : numero(unidade.inventario ?? estrutura.inventario);

const subGerente = numero(estrutura.subGerente ?? unidade.subGerente);

  const status =
    unidade.risco === "Alto"
      ? "Prioridade"
      : unidade.risco === "Médio"
      ? "Em atenção"
      : "Normal";

  return (
    <aside className="painel-unidade-selecionada">
      <div className="info-item"><span>Status Operacional</span><strong>{status}</strong></div>
      <div className="info-item"><span>Risco</span><strong>{unidade.risco ?? "-"}</strong></div>

      <hr />

      <h4>{isConsolidado ? "Resumo Geral CRAJUBAR" : "Resumo Executivo"}</h4>

      <div className="info-item"><span>{isConsolidado ? "Abrangência" : "Bairro"}</span><strong>{unidade.bairro}</strong></div>
      <div className="info-item"><span>Cidade / Região</span><strong>{unidade.cidade}</strong></div>
      <div className="info-item"><span>Potencial</span><strong>{unidade.potencial?.toLocaleString("pt-BR") ?? "-"}</strong></div>
      <div className="info-item"><span>Colaboradores</span><strong>{valor(unidade.colaboradores)}</strong></div>
      <div className="info-item"><span>Solicitações</span><strong>{unidade.vagas ?? 0}</strong></div>
      <div className="info-item"><span>Admissões</span><strong>{unidade.admitidos ?? 0}</strong></div>
      <div className="info-item"><span>Pendências</span><strong>{unidade.pendentes ?? 0}</strong></div>

      <hr />

      <h4>Indicadores</h4>

      <div className="mini-cards">
        <div className="mini-card mini-azul">
          <small>PCD</small>
          <strong>{pcd}</strong>
        </div>

        <div className="mini-card mini-verde">
          <small>Aprendiz</small>
          <strong>{aprendiz}</strong>
        </div>

        <div className="mini-card mini-roxo">
          <small>ADM</small>
          <strong>{adm}</strong>
        </div>

        <div className="mini-card mini-laranja">
          <small>Inventário</small>
          <strong>{inventario}</strong>
        </div>
      </div>

      <hr />

      <h4>{isConsolidado ? "Estrutura Consolidada" : "Estrutura da Loja"}</h4>

      <div className="info-item"><span>Gerente</span><strong>{valor(estrutura.gerente)}</strong></div>
      <div className="info-item"><span>Subgerente</span><strong>{subGerente}</strong></div>
      <div className="info-item"><span>Fiscal de Caixa</span><strong>{valor(estrutura.fiscalCaixa)}</strong></div>
      <div className="info-item"><span>Frente de Loja</span><strong>{valor(estrutura.frenteLoja)}</strong></div>
      <div className="info-item"><span>Operador de Caixa</span><strong>{valor(estrutura.operadorCaixa)}</strong></div>
      <div className="info-item"><span>Repositor</span><strong>{valor(estrutura.repositor)}</strong></div>
      <div className="info-item"><span>Reposição Noturna</span><strong>{valor(estrutura.reposicaoNoturna)}</strong></div>
      <div className="info-item"><span>Açougue</span><strong>{valor(estrutura.acougue)}</strong></div>
      <div className="info-item"><span>Hortifruti</span><strong>{valor(estrutura.horti)}</strong></div>
      <div className="info-item"><span>Padaria</span><strong>{valor(estrutura.padaria)}</strong></div>
      <div className="info-item"><span>Restaurante / Cozinha</span><strong>{valor(estrutura.cozinha)}</strong></div>
      <div className="info-item"><span>E-commerce / Aplicativo</span><strong>{valor(estrutura.ecommerce)}</strong></div>
      <div className="info-item"><span>Recebimento</span><strong>{valor(estrutura.recebimento)}</strong></div>
      <div className="info-item"><span>Estoque</span><strong>{valor(estrutura.estoque)}</strong></div>
      <div className="info-item"><span>Prevenção</span><strong>{valor(estrutura.prevencao)}</strong></div>
      <div className="info-item"><span>Serviços Gerais</span><strong>{valor(estrutura.servicosGerais)}</strong></div>
      <div className="info-item"><span>Entregadores</span><strong>{valor(estrutura.entregadores)}</strong></div>
      <div className="info-item"><span>Cartazista</span><strong>{valor(estrutura.cartazista)}</strong></div>
      <div className="info-item"><span>Atacado</span><strong>{valor(estrutura.atacado)}</strong></div>
      <div className="info-item"><span>Separadores</span><strong>{valor(estrutura.separadores)}</strong></div>
      <div className="info-item"><span>Empilhadores</span><strong>{valor(estrutura.empilhadores)}</strong></div>
      <div className="info-item"><span>Estagiário</span><strong>{valor(estrutura.estagiario)}</strong></div>

      <hr />

      <h4>Alertas Operacionais</h4>

      <div className="info-item"><span>Retorno de Férias</span><strong>{alertas.retornoFerias ?? 0}</strong></div>
      <div className="info-item"><span>Inclusão / Admissões Previstas</span><strong>{alertas.admissoesPrevistas ?? 0}</strong></div>
      <div className="info-item"><span>Situação Atual</span><strong>{status}</strong></div>
    </aside>
  );
}
