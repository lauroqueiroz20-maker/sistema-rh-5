import { type Gestor } from "../../data/gestores";

type ListaGestoresProps = {
  gestores: Gestor[];
};

function formatarTelefone(telefone: string) {
  const numeros = telefone.replace(/\D/g, "");

  if (numeros.length === 11) {
    return numeros.replace(
      /(\d{2})(\d{5})(\d{4})/,
      "($1) $2-$3"
    );
  }

  if (numeros.length === 10) {
    return numeros.replace(
      /(\d{2})(\d{4})(\d{4})/,
      "($1) $2-$3"
    );
  }

  return telefone;
}

function ListaGestores({ gestores }: ListaGestoresProps) {
  const gestoresOrdenados = [...gestores].sort((a, b) => {
    if (
      a.tipoContato === "GESTOR" &&
      b.tipoContato !== "GESTOR"
    ) {
      return -1;
    }

    if (
      a.tipoContato !== "GESTOR" &&
      b.tipoContato === "GESTOR"
    ) {
      return 1;
    }

    return a.codigo.localeCompare(b.codigo);
  });

  function editarGestor(gestor: Gestor) {
    alert(
      `Editar contato:\n\n${gestor.nome}\n${gestor.cargo}\n${gestor.unidade}`
    );
  }

  function abrirWhatsApp(telefone: string) {
    const numeros = telefone.replace(/\D/g, "");

    window.open(
      `https://wa.me/55${numeros}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function copiarLink(gestor: Gestor) {
    if (gestor.tipoContato !== "GESTOR") {
      alert(
        "O formulário diário é exclusivo para gestores de unidade."
      );
      return;
    }

    const link =
      `${window.location.origin}` +
      `/?formulario=gestor&codigo=${gestor.codigo}`;

    try {
      await navigator.clipboard.writeText(link);
      alert("Link exclusivo copiado.");
    } catch {
      window.prompt("Copie o link abaixo:", link);
    }
  }

  function abrirHistorico(gestor: Gestor) {
    alert(
      `Histórico de comunicação:\n\n${gestor.nome}\n${gestor.unidade}`
    );
  }

  return (
    <div className="gestores-card">
      <table>
        <thead>
          <tr>
            <th>Cód.</th>
            <th>Tipo</th>
            <th>Unidade / Área</th>
            <th>Nome</th>
            <th>Cargo</th>
            <th>WhatsApp</th>
            <th>Disparo</th>
            <th>Situação</th>
            <th>Novas Vagas</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          {gestoresOrdenados.length === 0 ? (
            <tr>
              <td colSpan={10} className="sem-registro">
                Nenhum contato cadastrado.
              </td>
            </tr>
          ) : (
            gestoresOrdenados.map((gestor) => (
              <tr key={gestor.id}>
                <td>
                  <strong>
                    {gestor.tipoContato === "GESTOR"
                      ? gestor.codigo
                      : "—"}
                  </strong>
                </td>

                <td>{gestor.tipoContato}</td>

                <td>{gestor.unidade}</td>

                <td>{gestor.nome}</td>

                <td>{gestor.cargo}</td>

                <td>
                  {formatarTelefone(gestor.telefone)}
                </td>

                <td>
                  <span
                    className={
                      gestor.recebeDisparoDiario
                        ? "status-gestor status-ativo"
                        : "status-gestor status-inativo"
                    }
                  >
                    {gestor.recebeDisparoDiario
                      ? "17:30"
                      : "—"}
                  </span>
                </td>

                <td>
                  <span
                    className={
                      gestor.ativo
                        ? "status-gestor status-ativo"
                        : "status-gestor status-inativo"
                    }
                  >
                    {gestor.ativo
                      ? "Aguardando"
                      : "Inativo"}
                  </span>
                </td>

                <td>
                  <strong>—</strong>
                </td>

                <td>
                  <div className="acoes-gestor">
                    <button
                      type="button"
                      className="botao-editar-gestor"
                      onClick={() => editarGestor(gestor)}
                      title="Editar contato"
                    >
                      ✏️
                    </button>

                    <button
                      type="button"
                      className="botao-whatsapp-gestor"
                      onClick={() =>
                        abrirWhatsApp(gestor.telefone)
                      }
                      title="Abrir WhatsApp"
                    >
                      📲
                    </button>

                    {gestor.tipoContato === "GESTOR" && (
                      <>
                        <button
                          type="button"
                          className="botao-link-gestor"
                          onClick={() => copiarLink(gestor)}
                          title="Copiar link do formulário"
                        >
                          🔗
                        </button>

                        <button
                          type="button"
                          className="botao-historico-gestor"
                          onClick={() =>
                            abrirHistorico(gestor)
                          }
                          title="Histórico da unidade"
                        >
                          📋
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ListaGestores;