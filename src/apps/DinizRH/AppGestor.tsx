import {
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

function AppGestor() {
  const codigoGestor =
    useMemo(() => {
      const codigoRecebido =
        obterCodigoGestorPeloLink();

      return (
        codigoRecebido ||
        CODIGO_GESTOR_PADRAO
      );
    }, []);

  const gestor = useMemo(
    () =>
      buscarGestor(
        codigoGestor
      ),
    [codigoGestor]
  );

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

  const saudacao =
    obterSaudacao();

  const dataHoje =
    dataCompleta();

  function atualizarHistorico() {
    if (!gestor) {
      setHistorico([]);
      return;
    }

    setHistorico(
      carregarSolicitacoesPorGestor(
        gestor.codigo,
        gestor.unidade
      )
    );
  }

  function abrirNovaSolicitacao() {
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
        gestor.unidade,
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
          gestor.unidade
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

    try {
      await registrarSemSolicitacao({
        id: gerarId(),
        codigoGestor:
          gestor.codigo,
        gestor:
          gestor.nome,
        unidade:
          gestor.unidade,
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
                  gestor.unidade,
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
            />
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
