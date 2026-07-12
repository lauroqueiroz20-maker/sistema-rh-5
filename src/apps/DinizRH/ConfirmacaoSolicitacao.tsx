interface ConfirmacaoSolicitacaoProps {
  protocolo: string;
  onVoltar: () => void;
}

function ConfirmacaoSolicitacao({
  protocolo,
  onVoltar,
}: ConfirmacaoSolicitacaoProps) {
  return (
    <section
      className="diniz-rh-card"
      style={{
        textAlign: "center",
      }}
    >
      <div className="diniz-rh-confirmacao-icone">
        ✓
      </div>

      <h2>
        Solicitação enviada
      </h2>

      <p
        style={{
          marginTop: "12px",
        }}
      >
        Sua solicitação foi
        encaminhada para o
        Recrutamento e
        Seleção.
      </p>

      <div
        className="diniz-rh-info-box"
        style={{
          marginTop: "22px",
        }}
      >
        <span>
          Protocolo
        </span>

        <strong>
          {protocolo}
        </strong>
      </div>

      <button
        type="button"
        className="diniz-rh-botao diniz-rh-botao-primario"
        onClick={onVoltar}
        style={{
          marginTop: "24px",
        }}
      >
        VOLTAR AO INÍCIO
      </button>
    </section>
  );
}

export default ConfirmacaoSolicitacao;