type CabecalhoProps = {
  cicloInicio: string;
  cicloFim: string;
  onAlterarInicio?: (
    data: string,
  ) => void;
  onAlterarFim?: (
    data: string,
  ) => void;
};

function separarData(data: string) {
  const partes = data.split("-");

  if (partes.length !== 3) {
    return {
      dia: "dd/",
      mes: "mes/",
      ano: "ano",
    };
  }

  return {
    dia: `${partes[2]}/`,
    mes: `${partes[1]}/`,
    ano: partes[0],
  };
}

function DataPeriodo({
  data,
  onAlterar,
}: {
  data: string;
  onAlterar?: (data: string) => void;
}) {
  const dataSeparada = separarData(data);

  return (
    <label className="rpaisagem-data-wrapper">
      <span className="rpaisagem-data-visual">
        <strong>{dataSeparada.dia}</strong>
        <span>{dataSeparada.mes}</span>
        <small>{dataSeparada.ano}</small>
      </span>

      <input
        type="date"
        className="rpaisagem-data"
        value={data}
        disabled={!onAlterar}
        onChange={(e) =>
          onAlterar?.(
            e.target.value,
          )
        }
      />
    </label>
  );
}
export default function Cabecalho({
  cicloInicio,
  cicloFim,
  onAlterarInicio,
  onAlterarFim,
}: CabecalhoProps) {
  return (
    <header className="rpaisagem-cabecalho">
      <div className="rpaisagem-cabecalho-faixa">
        <div className="rpaisagem-cabecalho-identidade">
          <h1 className="rpaisagem-cabecalho-titulo">
            RELATÓRIO DE RECRUTAMENTO E SELEÇÃO
          </h1>
        </div>

        <div className="rpaisagem-cabecalho-assinatura">
          <strong>Tatyana Travassos</strong>

          <small>
            Coordenação de Recrutamento e Seleção
          </small>
        </div>
      </div>

      <div className="rpaisagem-cabecalho-periodos">
        <span>Data inicial do período</span>

        <DataPeriodo
          data={cicloInicio}
          onAlterar={onAlterarInicio}
        />

        <span className="rpaisagem-cabecalho-separador">
          -
        </span>

        <span>Data final do período</span>

        <DataPeriodo
          data={cicloFim}
          onAlterar={onAlterarFim}
        />
      </div>
    </header>
  );
}
