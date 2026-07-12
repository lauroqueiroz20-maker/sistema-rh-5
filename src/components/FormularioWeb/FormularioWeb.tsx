import {
  useMemo,
  useState,
} from "react";

import "./FormularioWeb.css";

import unidades from "../../data/unidades";
import tipos from "../../data/tipos";
import motivos from "../../data/motivos";
import cargos from "../../data/cargos";

import gestoresIniciais, {
  type Gestor,
} from "../../data/gestores";

import {
  gerarId,
  type SolicitacaoFormulario,
} from "../../api/formulario";

import {
  salvarFormulario,
} from "../../Services/formularioService";

const CHAVE_GESTORES =
  "sistema-rh-gestores";

const CHAVE_MONITOR =
  "sistema-rh-monitor-gestores";

type GestorEditavel = Gestor & {
  nome?: string;
  gerente?: string;
};

function carregarGestores(): Gestor[] {
  try {
    const dadosSalvos =
      localStorage.getItem(
        CHAVE_GESTORES
      );

    if (!dadosSalvos) {
      return gestoresIniciais;
    }

    const dadosConvertidos =
      JSON.parse(dadosSalvos);

    return Array.isArray(
      dadosConvertidos
    )
      ? dadosConvertidos
      : gestoresIniciais;
  } catch {
    return gestoresIniciais;
  }
}

function obterNomeGestor(
  gestor: Gestor
) {
  const dados =
    gestor as GestorEditavel;

  return String(
    dados.nome ||
      dados.gerente ||
      ""
  );
}

function carregarMonitor() {
  try {
    const dadosSalvos =
      localStorage.getItem(
        CHAVE_MONITOR
      );

    if (!dadosSalvos) {
      return [];
    }

    const dadosConvertidos =
      JSON.parse(dadosSalvos);

    return Array.isArray(
      dadosConvertidos
    )
      ? dadosConvertidos
      : [];
  } catch {
    return [];
  }
}

function FormularioWeb() {
  const [gestores] =
    useState<Gestor[]>(
      carregarGestores
    );

  const [
    codigoGestor,
    setCodigoGestor,
  ] = useState("");

  const [tipo, setTipo] =
    useState("OPERAC.");

  const [cargo, setCargo] =
    useState("");

  const [
    quantidade,
    setQuantidade,
  ] = useState("1");

  const [turno, setTurno] =
    useState("D");

  const [motivo, setMotivo] =
    useState("DESLIG.");

  const [
    emergencia,
    setEmergencia,
  ] = useState("NÃO");

  const [
    observacao,
    setObservacao,
  ] = useState("");

  const [
    enviado,
    setEnviado,
  ] = useState(false);

  const gestorSelecionado =
    useMemo(
      () =>
        gestores.find(
          (gestor) =>
            gestor.codigo ===
            codigoGestor
        ),
      [gestores, codigoGestor]
    );

  const unidadeSelecionada =
    useMemo(() => {
      if (!gestorSelecionado) {
        return "";
      }

      const unidadeEncontrada =
        unidades.find(
          (item) =>
            String(item.codigo) ===
            String(
              gestorSelecionado.codigo
            )
        );

      return (
        unidadeEncontrada?.nome ||
        gestorSelecionado.unidade
      );
    }, [gestorSelecionado]);

  function limparFormulario() {
    setTipo("OPERAC.");
    setCargo("");
    setQuantidade("1");
    setTurno("D");
    setMotivo("DESLIG.");
    setEmergencia("NÃO");
    setObservacao("");
    setEnviado(false);
  }

  function enviarSolicitacao() {
    if (
      !gestorSelecionado ||
      !unidadeSelecionada
    ) {
      alert(
        "Selecione o gestor."
      );
      return;
    }

    if (!cargo) {
      alert(
        "Selecione o cargo."
      );
      return;
    }

    const quantidadeFinal =
      Number(quantidade);

    if (
      !Number.isFinite(
        quantidadeFinal
      ) ||
      quantidadeFinal <= 0
    ) {
      alert(
        "Informe uma quantidade válida."
      );
      return;
    }

    const solicitacao:
      SolicitacaoFormulario = {
      id: gerarId(),
      codigoGestor:
        gestorSelecionado.codigo,
      gestor:
        obterNomeGestor(
          gestorSelecionado
        ),
      unidade:
        unidadeSelecionada,
      tipo,
      cargo,
      quantidade:
        quantidadeFinal,
      turno,
      motivo,
      emergencia,
      observacao:
        observacao.trim(),
      data:
        new Date().toISOString(),
      status: "RECEBIDA",
    };

    salvarFormulario(
      solicitacao
    );

    const monitorAtual =
      carregarMonitor();

    localStorage.setItem(
      CHAVE_MONITOR,
      JSON.stringify([
        ...monitorAtual,
        {
          id: solicitacao.id,
          codigoGestor:
            solicitacao.codigoGestor,
          gestor:
            solicitacao.gestor,
          unidade:
            solicitacao.unidade,
          tipo:
            solicitacao.tipo,
          cargo:
            solicitacao.cargo,
          quantidade:
            solicitacao.quantidade,
          turno:
            solicitacao.turno,
          motivo:
            solicitacao.motivo,
          emergencia:
            solicitacao.emergencia,
          dataResposta:
            solicitacao.data,
          atualizado: false,
        },
      ])
    );

    window.dispatchEvent(
      new CustomEvent(
        "sistema-rh-monitor-atualizado",
        {
          detail: solicitacao,
        }
      )
    );

    setEnviado(true);
  }

  return (
    <div className="formulario-web-page">
      <div className="formulario-web-card">
        <header className="formulario-web-header">
          <div>
            <h1>
              Formulário de Solicitação de Vagas
            </h1>

            <p>
              Preencha os dados abaixo e envie sua solicitação.
            </p>
          </div>

          <span className="formulario-web-status">
            Sistema RH
          </span>
        </header>

        {enviado ? (
          <div className="formulario-web-sucesso">
            <h2>
              Solicitação enviada com sucesso
            </h2>

            <p>
              Sua solicitação foi recebida pelo RH.
            </p>

            <button
              type="button"
              onClick={
                limparFormulario
              }
            >
              ENVIAR NOVA SOLICITAÇÃO
            </button>
          </div>
        ) : (
          <>
            <div className="formulario-web-grid">
              <div className="campo-formulario-web campo-formulario-web-duplo">
                <label>
                  Gestor
                </label>

                <select
                  value={
                    codigoGestor
                  }
                  onChange={(evento) =>
                    setCodigoGestor(
                      evento.target.value
                    )
                  }
                >
                  <option value="">
                    Selecione
                  </option>

                  {gestores
                    .filter(
                      (gestor) =>
                        gestor.ativo
                    )
                    .map((gestor) => (
                      <option
                        key={
                          gestor.id
                        }
                        value={
                          gestor.codigo
                        }
                      >
                        {
                          gestor.unidade
                        }{" "}
                        —{" "}
                        {obterNomeGestor(
                          gestor
                        )}
                      </option>
                    ))}
                </select>
              </div>

              <div className="campo-formulario-web campo-formulario-web-duplo">
                <label>
                  Unidade
                </label>

                <input
                  value={
                    unidadeSelecionada
                  }
                  readOnly
                  placeholder="Automática"
                />
              </div>

              <div className="campo-formulario-web">
                <label>
                  Tipo
                </label>

                <select
                  value={tipo}
                  onChange={(evento) =>
                    setTipo(
                      evento.target.value
                    )
                  }
                >
                  {tipos.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="campo-formulario-web">
                <label>
                  Cargo
                </label>

                <select
                  value={cargo}
                  onChange={(evento) =>
                    setCargo(
                      evento.target.value
                    )
                  }
                >
                  <option value="">
                    Selecione
                  </option>

                  {cargos
                    .filter(
                      (item) =>
                        item.ativo
                    )
                    .map((item) => (
                      <option
                        key={
                          item.id
                        }
                        value={
                          item.cargo
                        }
                      >
                        {
                          item.cargo
                        }
                      </option>
                    ))}
                </select>
              </div>

              <div className="campo-formulario-web">
                <label>
                  Quantidade
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    quantidade
                  }
                  onChange={(evento) =>
                    setQuantidade(
                      evento.target.value
                    )
                  }
                />
              </div>

              <div className="campo-formulario-web">
                <label>
                  Turno
                </label>

                <select
                  value={turno}
                  onChange={(evento) =>
                    setTurno(
                      evento.target.value
                    )
                  }
                >
                  <option value="D">
                    D
                  </option>

                  <option value="N">
                    N
                  </option>
                </select>
              </div>

              <div className="campo-formulario-web campo-formulario-web-duplo">
                <label>
                  Motivo
                </label>

                <select
                  value={motivo}
                  onChange={(evento) =>
                    setMotivo(
                      evento.target.value
                    )
                  }
                >
                  {motivos.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="campo-formulario-web campo-formulario-web-duplo">
                <label>
                  Emergência
                </label>

                <select
                  value={
                    emergencia
                  }
                  onChange={(evento) =>
                    setEmergencia(
                      evento.target.value
                    )
                  }
                >
                  <option value="NÃO">
                    NÃO
                  </option>

                  <option value="SIM">
                    SIM
                  </option>
                </select>
              </div>

              <div className="campo-formulario-web campo-formulario-web-total">
                <label>
                  Observação
                </label>

                <textarea
                  maxLength={250}
                  value={
                    observacao
                  }
                  onChange={(evento) =>
                    setObservacao(
                      evento.target.value
                    )
                  }
                  placeholder="Informações adicionais sobre a vaga"
                />

                <small>
                  {observacao.length}/250
                </small>
              </div>
            </div>

            <div className="formulario-web-acoes">
              <button
                type="button"
                className="botao-limpar-formulario"
                onClick={
                  limparFormulario
                }
              >
                LIMPAR
              </button>

              <button
                type="button"
                className="botao-enviar-formulario"
                onClick={
                  enviarSolicitacao
                }
              >
                ENVIAR SOLICITAÇÃO
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default FormularioWeb;