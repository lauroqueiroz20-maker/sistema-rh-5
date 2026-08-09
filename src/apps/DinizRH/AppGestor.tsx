import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./gestor.css";

import ConfirmacaoSolicitacao from "./ConfirmacaoSolicitacao";
import FormularioSolicitacao from "./FormularioSolicitacao";
import HistoricoSolicitacoes from "./HistoricoSolicitacoes";
import HomeGestor from "./HomeGestor";

import {
  adicionarSolicitacao,
  carregarSolicitacoesPorGestor,
  registrarSemSolicitacao,
} from "./storage";

import {
  buscarGestor,
  listarGestores,
  obterCodigoGestorPeloLink,
} from "./services";

import {
  dataCompleta,
  gerarId,
  gerarProtocolo,
  obterSaudacao,
} from "./utils";

import type {
  ItemSolicitacao,
  SolicitacaoGestor,
  TelaGestor,
} from "./types";

const CODIGO_GESTOR_PADRAO =
  "001";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
  }>;
};

type WindowComInstalador = Window & {
  __dinizInstallPrompt?: BeforeInstallPromptEvent;
};

function AppGestor() {
  const codigoGestor =
    useMemo(() => {
      const codigoRecebido =
        obterCodigoGestorPeloLink();

      return String(
        codigoRecebido ||
          CODIGO_GESTOR_PADRAO
      )
        .trim()
        .padStart(3, "0");
    }, []);

  const gestor = useMemo(
    () =>
      buscarGestor(
        codigoGestor
      ),
    [codigoGestor]
  );

  const gestoresUnidades =
    useMemo(
      () =>
        listarGestores().filter(
          (item) =>
            item.codigo !== "000" &&
            item.codigo !== "014"
        ),
      []
    );

  const isTatyana =
    String(codigoGestor).padStart(3, "0") === "000";

  const [
    unidadeTatyana,
    setUnidadeTatyana,
  ] = useState("");

  const unidadeOperacional =
    isTatyana
      ? unidadeTatyana
      : gestor?.unidade || "";

  const [
    telaAtual,
    setTelaAtual,
  ] = useState<TelaGestor>(
    "HOME"
  );

  const [
    protocolo,
    setProtocolo,
  ] = useState("");

  const [
    historico,
    setHistorico,
  ] = useState<
    SolicitacaoGestor[]
  >(() => {
    if (!gestor) {
      return [];
    }

    return carregarSolicitacoesPorGestor(
      gestor.codigo,
      gestor.unidade
    );
  });

  const [
    instalador,
    setInstalador,
  ] = useState<BeforeInstallPromptEvent | null>(
    null
  );

  useEffect(() => {
    const janela =
      window as WindowComInstalador;

    if (janela.__dinizInstallPrompt) {
      setInstalador(
        janela.__dinizInstallPrompt
      );
    }

    function capturarInstalacao(
      evento: Event
    ) {
      evento.preventDefault();
      janela.__dinizInstallPrompt =
        evento as BeforeInstallPromptEvent;
      setInstalador(
        evento as BeforeInstallPromptEvent
      );
    }

    window.addEventListener(
      "beforeinstallprompt",
      capturarInstalacao
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        capturarInstalacao
      );
    };
  }, []);

  const saudacao =
    obterSaudacao();

  const dataHoje =
    dataCompleta();

  function atualizarHistorico() {
    if (!gestor) {
      setHistorico([]);
      return;
    }

    if (!unidadeOperacional) {
      alert(
        "Selecione a unidade antes de continuar."
      );
      return;
    }

    setHistorico(
      carregarSolicitacoesPorGestor(
        gestor.codigo,
        unidadeOperacional
      )
    );
  }

  function abrirNovaSolicitacao() {
    if (!unidadeOperacional) {
      alert(
        "Selecione a unidade antes de fazer a solicitação."
      );
      return;
    }

    setTelaAtual(
      "SOLICITACAO"
    );
  }

  function abrirHistorico() {
    atualizarHistorico();

    setTelaAtual(
      "HISTORICO"
    );
  }

  function voltarInicio() {
    setTelaAtual(
      "HOME"
    );
  }

  async function enviarSolicitacao(
    itens:
      ItemSolicitacao[],
    totalVagas: number
  ) {
    if (!gestor) {
      alert(
        "Gestor não identificado."
      );

      return;
    }

    if (!unidadeOperacional) {
      alert(
        "Selecione a unidade antes de enviar."
      );
      return;
    }

    const novoProtocolo =
      gerarProtocolo();

    const solicitacao:
      SolicitacaoGestor = {
      id: gerarId(),
      protocolo:
        novoProtocolo,
      codigoGestor:
        gestor.codigo,
      gestor:
        gestor.nome,
      unidade:
        unidadeOperacional,
      itens,
      totalVagas,
      dataResposta:
        new Date().toISOString(),
      status: "RECEBIDA",
    };

    try {
      await adicionarSolicitacao(
        solicitacao
      );

      setProtocolo(
        novoProtocolo
      );

      setHistorico(
        carregarSolicitacoesPorGestor(
          gestor.codigo,
          unidadeOperacional
        )
      );

      setTelaAtual(
        "CONFIRMACAO"
      );
    } catch (erro) {
      console.error(
        "Erro ao enviar solicitação:",
        erro
      );

      alert(
        "Não foi possível enviar a solicitação. Verifique a conexão e tente novamente."
      );
    }
  }

  async function responderSemSolicitacao() {
    if (!gestor) {
      alert(
        "Gestor não identificado."
      );

      return;
    }

    if (!unidadeOperacional) {
      alert(
        "Selecione a unidade antes de responder."
      );
      return;
    }

    try {
      await registrarSemSolicitacao({
        id: gerarId(),
        codigoGestor:
          gestor.codigo,
        gestor:
          gestor.nome,
        unidade:
          unidadeOperacional,
        dataResposta:
          new Date().toISOString(),
        status:
          "SEM_SOLICITACAO",
      });

      setTelaAtual(
        "SEM_SOLICITACAO"
      );
    } catch (erro) {
      console.error(
        "Erro ao registrar resposta:",
        erro
      );

      alert(
        "Não foi possível registrar a resposta. Verifique a conexão e tente novamente."
      );
    }
  }

  async function instalarAplicativo() {
    const eventoInstalacao =
      instalador ||
      (window as WindowComInstalador).__dinizInstallPrompt ||
      null;

    const emAplicativo =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;

    if (emAplicativo) {
      alert("Este acesso ja esta aberto como aplicativo.");
      return;
    }

    if (!eventoInstalacao) {
      const ehAndroid =
        /Android/i.test(window.navigator.userAgent);
      const ehChrome =
        /Chrome/i.test(window.navigator.userAgent) &&
        !/SamsungBrowser|Edg|OPR/i.test(window.navigator.userAgent);

      if (ehAndroid && !ehChrome) {
        const destino =
          `${window.location.host}${window.location.pathname}${window.location.search}`;
        const fallback =
          encodeURIComponent(window.location.href);

        window.location.href =
          `intent://${destino}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${fallback};end`;
        return;
      }

      alert(
        "No Chrome, toque nos tres pontos e escolha Instalar app ou Adicionar a tela inicial."
      );
      return;
    }

    await eventoInstalacao.prompt();
    await eventoInstalacao.userChoice;
    (window as WindowComInstalador).__dinizInstallPrompt =
      undefined;
    setInstalador(null);
  }

  if (!gestor) {
    return (
      <div className="diniz-rh-app">
        <header className="diniz-rh-header">
          <div className="diniz-rh-header-conteudo">
            <div className="diniz-rh-header-espaco" />

            <div className="diniz-rh-identidade">
              <strong>
                DINIZ RH
              </strong>

              <span>
                Portal do Gestor
              </span>
            </div>

            <div className="diniz-rh-header-espaco" />
          </div>
        </header>

        <main className="diniz-rh-conteudo">
          <div className="diniz-rh-container">
            <section className="diniz-rh-card">
              <h2>
                Gestor não encontrado
              </h2>

              <p>
                Código informado:
                {" "}
                {codigoGestor}
              </p>
            </section>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="diniz-rh-app">
      <header className="diniz-rh-header">
        <div className="diniz-rh-header-conteudo">
          <button
            type="button"
            className="diniz-rh-botao-voltar"
            onClick={
              voltarInicio
            }
            style={{
              visibility:
                telaAtual ===
                "HOME"
                  ? "hidden"
                  : "visible",
            }}
            aria-label="Voltar"
          >
            ←
          </button>

          <div className="diniz-rh-identidade">
            <strong>
              DINIZ RH
            </strong>

            <span>
              Portal do Gestor
            </span>
          </div>

          <div className="diniz-rh-header-espaco" />
        </div>
      </header>

      <main className="diniz-rh-conteudo">
        <div className="diniz-rh-container">
          {telaAtual ===
            "HOME" && (
            <>
              {isTatyana && (
                <section className="diniz-rh-card diniz-rh-card-unidade">
                  <h2>Selecionar unidade</h2>

                  <p>
                    Escolha a unidade para registrar a solicitação.
                  </p>

                  <select
                    value={unidadeTatyana}
                    onChange={(evento) =>
                      setUnidadeTatyana(
                        evento.target.value
                      )
                    }
                  >
                    <option value="">
                      Selecione uma unidade
                    </option>

                    {gestoresUnidades.map(
                      (item) => (
                        <option
                          key={item.codigo}
                          value={item.unidade}
                        >
                          {item.codigo} - {item.unidade}
                        </option>
                      )
                    )}
                  </select>

                  <div className="diniz-rh-unidades-grade">
                    {gestoresUnidades.map((item) => (
                      <button
                        key={item.codigo}
                        type="button"
                        className={
                          unidadeTatyana === item.unidade
                            ? "diniz-rh-unidade-opcao ativa"
                            : "diniz-rh-unidade-opcao"
                        }
                        onClick={() =>
                          setUnidadeTatyana(
                            item.unidade
                          )
                        }
                      >
                        <span>{item.codigo}</span>
                        <strong>{item.unidade}</strong>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <HomeGestor
                saudacao={
                  saudacao
                }
                dataHoje={
                  dataHoje
                }
                gestor={{
                  nome:
                    gestor.nome,
                  unidade:
                    unidadeOperacional ||
                    "SELECIONE A UNIDADE",
                }}
                onNovaSolicitacao={
                  abrirNovaSolicitacao
                }
                onSemSolicitacao={
                  responderSemSolicitacao
                }
                onHistorico={
                  abrirHistorico
                }
                onInstalar={
                  instalarAplicativo
                }
              />
            </>
          )}

          {telaAtual ===
            "SOLICITACAO" && (
            <FormularioSolicitacao
              onEnviar={
                enviarSolicitacao
              }
            />
          )}

          {telaAtual ===
            "CONFIRMACAO" && (
            <ConfirmacaoSolicitacao
              protocolo={
                protocolo
              }
              onVoltar={
                voltarInicio
              }
            />
          )}

          {telaAtual ===
            "SEM_SOLICITACAO" && (
            <section
              className="diniz-rh-card"
              style={{
                textAlign:
                  "center",
              }}
            >
              <div className="diniz-rh-confirmacao-icone">
                ✓
              </div>

              <h2>
                Unidade atualizada
              </h2>

              <p
                style={{
                  marginTop:
                    "12px",
                }}
              >
                Sua unidade foi
                registrada hoje sem
                novas solicitações.
              </p>

              <button
                type="button"
                className="diniz-rh-botao diniz-rh-botao-primario"
                onClick={
                  voltarInicio
                }
                style={{
                  marginTop:
                    "24px",
                }}
              >
                VOLTAR AO INÍCIO
              </button>
            </section>
          )}

          {telaAtual ===
            "HISTORICO" && (
            <HistoricoSolicitacoes
              historico={
                historico
              }
            />
          )}
        </div>
      </main>

      <footer className="diniz-rh-footer">
        <span>
          Diniz Supermercados
        </span>

        <small>
          Recrutamento e Seleção
        </small>
      </footer>
    </div>
  );
}

export default AppGestor;
