interface HomeGestorProps {
  saudacao: string;
  dataHoje: string;
  gestor: {
    nome: string;
    unidade: string;
  };
  onNovaSolicitacao: () => void;
  onSemSolicitacao: () => void;
  onHistorico: () => void;
}

function HomeGestor({
  saudacao,
  dataHoje,
  gestor,
  onNovaSolicitacao,
  onSemSolicitacao,
  onHistorico,
}: HomeGestorProps) {
  return (
    <>
      <section className="diniz-rh-card">
        <h2>
          {saudacao}, {gestor.nome}!
        </h2>

        <p>
          Hoje, {dataHoje}, existe
          alguma necessidade de
          contratação para sua
          unidade?
        </p>

        <div className="diniz-rh-info">
          <div className="diniz-rh-info-box">
            <span>
              Unidade
            </span>

            <strong>
              {gestor.unidade}
            </strong>
          </div>

          <div className="diniz-rh-info-box">
            <span>
              Gestor
            </span>

            <strong>
              {gestor.nome}
            </strong>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: "12px",
            marginTop: "22px",
          }}
        >
          <button
            type="button"
            className="diniz-rh-botao diniz-rh-botao-verde"
            onClick={onNovaSolicitacao}
          >
            SIM, FAZER SOLICITAÇÃO
          </button>

          <button
            type="button"
            className="diniz-rh-botao diniz-rh-botao-cinza"
            onClick={onSemSolicitacao}
          >
            NÃO TENHO SOLICITAÇÕES
            HOJE
          </button>
        </div>
      </section>

      <section className="diniz-rh-card">
        <h2>
          Histórico
        </h2>

        <p>
          Consulte todas as
          solicitações enviadas pela
          sua unidade.
        </p>

        <button
          type="button"
          className="diniz-rh-botao diniz-rh-botao-primario"
          onClick={onHistorico}
          style={{
            marginTop: "20px",
          }}
        >
          CONSULTAR HISTÓRICO
        </button>
      </section>
    </>
  );
}

export default HomeGestor;