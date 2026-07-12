import { useMemo, useState } from "react";

import "./FormularioGestorVagas.css";

type RespostaInicial = "" | "SIM" | "NAO";

type NovaVaga = {
  quantidade: number;
  tipo: string;
  cargo: string;
  setor: string;
  turno: string;
  motivo: string;
  emergencia: "SIM" | "NÃO";
  observacao: string;
};

const unidadesPorCodigo: Record<
  string,
  {
    unidade: string;
    gestor: string;
  }
> = {
  "001": {
    unidade: "Aeroporto",
    gestor: "Luiz",
  },
  "002": {
    unidade: "Ailton Gomes",
    gestor: "Sabrina",
  },
  "003": {
    unidade: "Barbalha",
    gestor: "Fran",
  },
  "004": {
    unidade: "Betolândia",
    gestor: "Reginaldo",
  },
  "005": {
    unidade: "Crato – Ossian",
    gestor: "Ana Karoliny",
  },
  "006": {
    unidade: "Crato – Centro",
    gestor: "Leonardo",
  },
  "007": {
    unidade: "Crato – Siqueira Campos",
    gestor: "Roberlanha",
  },
  "008": {
    unidade: "Frei Damião",
    gestor: "Gabriel",
  },
  "009": {
    unidade: "Missão Velha",
    gestor: "Matheus",
  },
  "010": {
    unidade: "Pirajá",
    gestor: "Jessica",
  },
  "011": {
    unidade: "Salesiano",
    gestor: "Eduardo",
  },
  "012": {
    unidade: "Tiradentes",
    gestor: "Jerlane",
  },
  "013": {
    unidade: "Vila Três Marias",
    gestor: "Ângelo",
  },
};

const cargos = [
  {
    nome: "OPERADOR DE CAIXA",
    setor: "CHECKOUT",
  },
  {
    nome: "REPOSITOR DE MERCADORIAS",
    setor: "ABASTECIMENTO",
  },
  {
    nome: "BALCONISTA DE AÇOUGUE",
    setor: "PERECÍVEIS",
  },
  {
    nome: "AÇOUGUEIRO",
    setor: "PERECÍVEIS",
  },
  {
    nome: "AUXILIAR DE SERVIÇOS GERAIS",
    setor: "ZELADORIA",
  },
  {
    nome: "FISCAL DE PREVENÇÃO DE PERDAS",
    setor: "FISCALIZAÇÃO DE LOJA",
  },
  {
    nome: "ESTOQUISTA",
    setor: "DEPÓSITO",
  },
  {
    nome: "BALCONISTA DE PADARIA",
    setor: "PERECÍVEIS",
  },
  {
    nome: "JOVEM APRENDIZ",
    setor: "ABASTECIMENTO",
  },
];

const formularioInicial: NovaVaga = {
  quantidade: 1,
  tipo: "OPERAC.",
  cargo: "",
  setor: "",
  turno: "",
  motivo: "",
  emergencia: "NÃO",
  observacao: "",
};

function FormularioGestorVagas() {
  const parametros = useMemo(
    () => new URLSearchParams(window.location.search),
    []
  );

  const codigoRecebido = parametros.get("codigo") || "001";

  const identificacao =
    unidadesPorCodigo[codigoRecebido] ||
    unidadesPorCodigo["001"];

  const [respostaInicial, setRespostaInicial] =
    useState<RespostaInicial>("");

  const [formulario, setFormulario] =
    useState<NovaVaga>(formularioInicial);

  const [enviado, setEnviado] = useState(false);

  function atualizarCampo<K extends keyof NovaVaga>(
    campo: K,
    valor: NovaVaga[K]
  ) {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  function selecionarCargo(cargoSelecionado: string) {
    const cargoEncontrado = cargos.find(
      (item) => item.nome === cargoSelecionado
    );

    setFormulario((anterior) => ({
      ...anterior,
      cargo: cargoSelecionado,
      setor: cargoEncontrado?.setor || "",
    }));
  }

  function registrarSemVagas() {
    const resposta = {
      id: crypto.randomUUID(),
      codigo: codigoRecebido,
      unidade: identificacao.unidade,
      gestor: identificacao.gestor,
      possuiNovaVaga: false,
      dataResposta: new Date().toISOString(),
      status: "FINALIZADO",
    };

    const respostasSalvas = JSON.parse(
      localStorage.getItem("respostasGestores") || "[]"
    );

    localStorage.setItem(
      "respostasGestores",
      JSON.stringify([resposta, ...respostasSalvas])
    );

    setRespostaInicial("NAO");
    setEnviado(true);
  }

  function enviarSolicitacao() {
    if (!formulario.cargo) {
      alert("Selecione o cargo.");
      return;
    }

    if (!formulario.turno) {
      alert("Selecione o turno.");
      return;
    }

    if (!formulario.motivo) {
      alert("Selecione o motivo.");
      return;
    }

    const resposta = {
      id: crypto.randomUUID(),
      codigo: codigoRecebido,
      unidade: identificacao.unidade,
      gestor: identificacao.gestor,
      possuiNovaVaga: true,
      dataResposta: new Date().toISOString(),
      status: "PENDENTE",
      vaga: formulario,
    };

    const respostasSalvas = JSON.parse(
      localStorage.getItem("respostasGestores") || "[]"
    );

    localStorage.setItem(
      "respostasGestores",
      JSON.stringify([resposta, ...respostasSalvas])
    );

    setEnviado(true);
  }

  if (enviado) {
    return (
      <main className="formulario-vagas-pagina">
        <section className="confirmacao-resposta">
          <div className="confirmacao-simbolo">✓</div>

          <h1>Resposta registrada</h1>

          <p>
            Obrigado, {identificacao.gestor}. A resposta da unidade{" "}
            <strong>{identificacao.unidade}</strong> foi enviada ao
            setor de Recrutamento e Seleção.
          </p>

          <div className="confirmacao-status">
            {respostaInicial === "NAO"
              ? "Nenhuma nova vaga informada hoje."
              : "Solicitação enviada para análise do RH."}
          </div>

          <small>Você já pode fechar esta página.</small>
        </section>
      </main>
    );
  }

  return (
    <main className="formulario-vagas-pagina">
      <section className="formulario-vagas-container">
        <header className="formulario-vagas-header">
          <div>
            <span className="formulario-vagas-etiqueta">
              Recrutamento e Seleção
            </span>

            <h1>Solicitação diária de vagas</h1>

            <p>
              Informe se a sua unidade possui novas necessidades de
              contratação.
            </p>
          </div>

          <div className="formulario-vagas-horario">
            Envio diário • 17h30
          </div>
        </header>

        <section className="identificacao-unidade">
          <div>
            <span>Código</span>
            <strong>{codigoRecebido}</strong>
          </div>

          <div>
            <span>Unidade</span>
            <strong>{identificacao.unidade}</strong>
          </div>

          <div>
            <span>Gestor responsável</span>
            <strong>{identificacao.gestor}</strong>
          </div>
        </section>

        <section className="pergunta-principal">
          <span className="numero-etapa">1</span>

          <div>
            <h2>Sua unidade possui novas vagas para cadastrar hoje?</h2>

            <p>
              Selecione uma opção para continuar.
            </p>
          </div>
        </section>

        <div className="opcoes-resposta">
          <button
            type="button"
            className={
              respostaInicial === "SIM"
                ? "opcao-resposta opcao-resposta-ativa"
                : "opcao-resposta"
            }
            onClick={() => {
              setRespostaInicial("SIM");
              setEnviado(false);
            }}
          >
            <strong>Sim</strong>
            <span>Tenho novas vagas para informar</span>
          </button>

          <button
            type="button"
            className="opcao-resposta opcao-sem-vagas"
            onClick={registrarSemVagas}
          >
            <strong>Não</strong>
            <span>Não tenho novas vagas hoje</span>
          </button>
        </div>

        {respostaInicial === "SIM" && (
          <section className="dados-nova-vaga">
            <div className="titulo-etapa">
              <span className="numero-etapa">2</span>

              <div>
                <h2>Dados da nova vaga</h2>
                <p>Preencha as informações abaixo.</p>
              </div>
            </div>

            <div className="formulario-premium-grid">
              <div className="campo-premium campo-pequeno">
                <label>Quantidade</label>

                <input
                  type="number"
                  min={1}
                  value={formulario.quantidade}
                  onChange={(event) =>
                    atualizarCampo(
                      "quantidade",
                      Math.max(1, Number(event.target.value))
                    )
                  }
                />
              </div>

              <div className="campo-premium">
                <label>Tipo da vaga</label>

                <select
                  value={formulario.tipo}
                  onChange={(event) =>
                    atualizarCampo("tipo", event.target.value)
                  }
                >
                  <option value="OPERAC.">Operacional</option>
                  <option value="ADM">Administrativa</option>
                  <option value="PCD">PCD</option>
                  <option value="J. APRENDIZ">
                    Jovem Aprendiz
                  </option>
                  <option value="INVENTÁRIO">Inventário</option>
                </select>
              </div>

              <div className="campo-premium campo-largo">
                <label>Cargo</label>

                <select
                  value={formulario.cargo}
                  onChange={(event) =>
                    selecionarCargo(event.target.value)
                  }
                >
                  <option value="">Selecione o cargo</option>

                  {cargos.map((cargo) => (
                    <option key={cargo.nome} value={cargo.nome}>
                      {cargo.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="campo-premium">
                <label>Setor</label>

                <input
                  type="text"
                  value={formulario.setor}
                  placeholder="Preenchimento automático"
                  readOnly
                />
              </div>

              <div className="campo-premium">
                <label>Turno</label>

                <select
                  value={formulario.turno}
                  onChange={(event) =>
                    atualizarCampo("turno", event.target.value)
                  }
                >
                  <option value="">Selecione o turno</option>
                  <option value="ABERTURA">Abertura</option>
                  <option value="INTERMEDIÁRIO">
                    Intermediário
                  </option>
                  <option value="FECHAMENTO">Fechamento</option>
                  <option value="DIURNO">Diurno</option>
                  <option value="NOTURNO">Noturno</option>
                </select>
              </div>

              <div className="campo-premium">
                <label>Motivo da solicitação</label>

                <select
                  value={formulario.motivo}
                  onChange={(event) =>
                    atualizarCampo("motivo", event.target.value)
                  }
                >
                  <option value="">Selecione o motivo</option>
                  <option value="DEMISSÃO">Demissão</option>
                  <option value="EXPANSÃO">Expansão</option>
                  <option value="PROMOÇÃO">Promoção</option>
                  <option value="REMANEJAMENTO">
                    Remanejamento
                  </option>
                  <option value="SUBSTITUIÇÃO">
                    Substituição
                  </option>
                </select>
              </div>

              <div className="campo-premium">
                <label>É uma necessidade emergencial?</label>

                <div className="seletor-emergencia">
                  <button
                    type="button"
                    className={
                      formulario.emergencia === "NÃO"
                        ? "emergencia-opcao emergencia-ativa"
                        : "emergencia-opcao"
                    }
                    onClick={() =>
                      atualizarCampo("emergencia", "NÃO")
                    }
                  >
                    Não
                  </button>

                  <button
                    type="button"
                    className={
                      formulario.emergencia === "SIM"
                        ? "emergencia-opcao emergencia-ativa"
                        : "emergencia-opcao"
                    }
                    onClick={() =>
                      atualizarCampo("emergencia", "SIM")
                    }
                  >
                    Sim
                  </button>
                </div>
              </div>

              <div className="campo-premium campo-observacao">
                <label>Observação complementar</label>

                <textarea
                  rows={4}
                  value={formulario.observacao}
                  onChange={(event) =>
                    atualizarCampo(
                      "observacao",
                      event.target.value
                    )
                  }
                  placeholder="Informe detalhes importantes sobre a necessidade da vaga."
                />
              </div>
            </div>

            <div className="resumo-solicitacao">
              <div>
                <span>Unidade</span>
                <strong>{identificacao.unidade}</strong>
              </div>

              <div>
                <span>Quantidade</span>
                <strong>{formulario.quantidade}</strong>
              </div>

              <div>
                <span>Cargo</span>
                <strong>
                  {formulario.cargo || "Não selecionado"}
                </strong>
              </div>
            </div>

            <button
              type="button"
              className="botao-enviar-solicitacao"
              onClick={enviarSolicitacao}
            >
              Enviar solicitação ao RH
            </button>

            <p className="aviso-envio">
              Revise os dados antes de enviar. A solicitação será
              encaminhada para análise do Recrutamento e Seleção.
            </p>
          </section>
        )}
      </section>
    </main>
  );
}

export default FormularioGestorVagas;