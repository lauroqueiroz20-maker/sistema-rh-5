import type {
  SolicitacaoGestor,
} from "./types";

interface HistoricoSolicitacoesProps {
  historico: SolicitacaoGestor[];
}

function HistoricoSolicitacoes({
  historico,
}: HistoricoSolicitacoesProps) {
  return (
    <section className="diniz-rh-card">
      <h2>
        Histórico de Solicitações
      </h2>

      {historico.length === 0 ? (
        <p>
          Nenhuma solicitação registrada.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "12px",
            marginTop: "18px",
          }}
        >
          {historico.map(
            (solicitacao) => (
              <article
                key={solicitacao.id}
                className="diniz-rh-item-solicitacao"
              >
                <div>
                  <strong>
                    {
                      solicitacao.protocolo
                    }
                  </strong>

                  <span>
                    {
                      solicitacao.unidade
                    }
                  </span>

                  <span>
                    {
                      solicitacao.totalVagas
                    }{" "}
                    vagas
                  </span>

                  <span>
                    {
                      solicitacao.status
                    }
                  </span>
                </div>
              </article>
            )
          )}
        </div>
      )}
    </section>
  );
}

export default HistoricoSolicitacoes;