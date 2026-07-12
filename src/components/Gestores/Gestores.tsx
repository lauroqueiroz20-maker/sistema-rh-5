import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./Gestores.css";
import FormularioGestor from "./FormularioGestor";

import gestoresIniciais, {
  type Gestor,
} from "../../data/gestores";

import eventBus from "../../Services/eventBus";

import {
  arquivarRegistroMonitor,
  carregarMonitor as carregarMonitorLocal,
  carregarMonitorRemoto,
} from "../../apps/DinizRH/storage";

import type {
  RegistroMonitor as SolicitacaoGestor,
} from "../../apps/DinizRH/types";

const CHAVE_GESTORES = "sistema-rh-gestores";
const CHAVE_MONITOR = "sistema-rh-monitor-gestores";
const CHAVE_SOLICITACOES =
  "sistema-rh-solicitacoes-gestores";
const CHAVE_DISPARO =
  "sistema-rh-disparo-gestores";

const MENSAGEM_DISPARO =
  "Olá! Você tem solicitação de vaga para hoje?\n\nSe SIM, acesse o app DINIZ RH e envie pelo Portal do Gestor.\n\nSe NÃO, responda: NÃO.\n\nObrigado.";

type GestorDisparo = {
  codigo: string;
  unidade: string;
  gestor: string;
  telefone: string;
  dataDisparo: string;
  status: "PREPARADO";
  selecionado: boolean;
};

type GestorEditavel = Gestor & {
  nome?: string;
  gerente?: string;
  telefone?: string;
  whatsapp?: string;
  atualizadoEm?: string;
};

type CadastroAtualizadoPayload = {
  solicitacaoIds?: string[];
};

function carregarLista<T>(
  chave: string,
  valorPadrao: T[]
): T[] {
  try {
    const dadosSalvos =
      localStorage.getItem(chave);

    if (!dadosSalvos) {
      return valorPadrao;
    }

    const dadosConvertidos =
      JSON.parse(dadosSalvos);

    return Array.isArray(dadosConvertidos)
      ? dadosConvertidos
      : valorPadrao;
  } catch {
    return valorPadrao;
  }
}

function carregarGestores(): Gestor[] {
  const gestoresSalvos =
    carregarLista<Gestor>(
    CHAVE_GESTORES,
    gestoresIniciais
  );

  const gestoresPorCodigo =
    new Map<string, Gestor>();

  gestoresIniciais.forEach((gestor) => {
    gestoresPorCodigo.set(
      gestor.codigo,
      gestor
    );
  });

  gestoresSalvos.forEach((gestor) => {
    const gestorBase =
      gestoresPorCodigo.get(
        gestor.codigo
      );

    gestoresPorCodigo.set(
      gestor.codigo,
      {
        ...gestorBase,
        ...gestor,
        recebeDisparoDiario:
          gestor.codigo === "000"
            ? true
            : gestor.recebeDisparoDiario,
      } as Gestor
    );
  });

  return Array.from(
    gestoresPorCodigo.values()
  );
}

function carregarMonitor(): SolicitacaoGestor[] {
  return carregarMonitorLocal();
}

function obterNomeGestor(
  gestor: Gestor
): string {
  const gestorEditavel =
    gestor as GestorEditavel;

  return String(
    gestorEditavel.nome ||
      gestorEditavel.gerente ||
      ""
  );
}

function obterTelefoneGestor(
  gestor: Gestor
): string {
  const gestorEditavel =
    gestor as GestorEditavel;

  return String(
    gestorEditavel.telefone ||
      gestorEditavel.whatsapp ||
    ""
  );
}

function formatarHorarioBrasilia() {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());
}

function gerarLinkWhatsApp(
  telefone: string
) {
  if (!telefone) {
    return `https://wa.me/?text=${encodeURIComponent(
      MENSAGEM_DISPARO
    )}`;
  }

  const numero =
    telefone.startsWith("55")
      ? telefone
      : `55${telefone}`;

  return `https://wa.me/${numero}?text=${encodeURIComponent(
    MENSAGEM_DISPARO
  )}`;
}

function TelaGestores() {
  const [gestores, setGestores] =
    useState<Gestor[]>(carregarGestores);

  const [
    codigoSelecionado,
    setCodigoSelecionado,
  ] = useState("");

  const [nomeEdicao, setNomeEdicao] =
    useState("");

  const [
    telefoneEdicao,
    setTelefoneEdicao,
  ] = useState("");

  const [
    ativoEdicao,
    setAtivoEdicao,
  ] = useState(true);

  const [monitor, setMonitor] =
    useState<SolicitacaoGestor[]>(
      carregarMonitor
    );

  const [
    idsProcessando,
    setIdsProcessando,
  ] = useState<string[]>([]);

  const [
    horarioBrasilia,
    setHorarioBrasilia,
  ] = useState(formatarHorarioBrasilia);

  const [
    disparoGestores,
    setDisparoGestores,
  ] = useState<GestorDisparo[]>([]);

  const totalUnidades = 13;
  const totalGestores = gestores.length;

  const totalAtivos = gestores.filter(
    (gestor) => gestor.ativo
  ).length;

  const totalPendentes = Math.max(
    0,
    totalUnidades - totalGestores
  );

  const totalDisparoSelecionado =
    disparoGestores.filter(
      (gestor) =>
        gestor.selecionado
    ).length;

  const gestoresOrdenados = useMemo(
    () =>
      [...gestores].sort((a, b) =>
        a.unidade.localeCompare(
          b.unidade,
          "pt-BR",
          {
            sensitivity: "base",
          }
        )
      ),
    [gestores]
  );

  const gestorSelecionado = useMemo(
    () =>
      gestores.find(
        (gestor) =>
          gestor.codigo ===
          codigoSelecionado
      ),
    [gestores, codigoSelecionado]
  );

  function selecionarGestor(
    codigo: string
  ) {
    const gestor =
      gestores.find(
        (item) =>
          item.codigo === codigo
      );

    setCodigoSelecionado(codigo);

    if (!gestor) {
      setNomeEdicao("");
      setTelefoneEdicao("");
      setAtivoEdicao(true);
      return;
    }

    setNomeEdicao(
      obterNomeGestor(gestor)
    );
    setTelefoneEdicao(
      obterTelefoneGestor(gestor)
    );
    setAtivoEdicao(gestor.ativo);
  }

  useEffect(() => {
    localStorage.setItem(
      CHAVE_GESTORES,
      JSON.stringify(gestores)
    );
  }, [gestores]);

  useEffect(() => {
    const intervalo =
      window.setInterval(() => {
        setHorarioBrasilia(
          formatarHorarioBrasilia()
        );
      }, 1000);

    return () => {
      window.clearInterval(intervalo);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(
      CHAVE_MONITOR,
      JSON.stringify(monitor)
    );
  }, [monitor]);

  useEffect(() => {
    function concluirSolicitacoes(
      dados?: unknown
    ) {
      const payload =
        dados as CadastroAtualizadoPayload;

      const ids =
        payload?.solicitacaoIds || [];

      if (ids.length === 0) {
        return;
      }

      setMonitor((listaAtual) =>
        listaAtual.filter(
          (item) =>
            !ids.includes(item.id)
        )
      );

      setIdsProcessando(
        (listaAtual) =>
          listaAtual.filter(
            (id) => !ids.includes(id)
          )
      );

      const filaAtual =
        carregarLista<SolicitacaoGestor>(
          CHAVE_SOLICITACOES,
          []
        );

      const novaFila =
        filaAtual.filter(
          (item) =>
            !ids.includes(item.id)
        );

      localStorage.setItem(
        CHAVE_SOLICITACOES,
        JSON.stringify(novaFila)
      );
    }

    eventBus.on(
      "CADASTRO_ATUALIZADO",
      concluirSolicitacoes
    );

    return () => {
      eventBus.off(
        "CADASTRO_ATUALIZADO",
        concluirSolicitacoes
      );
    };
  }, []);

  useEffect(() => {
    function sincronizarMonitor() {
      setMonitor(carregarMonitor());
    }

    let ativo = true;

    async function sincronizarMonitorRemoto() {
      try {
        const registros =
          await carregarMonitorRemoto();

        if (ativo) {
          setMonitor(registros);
        }
      } catch {
        if (ativo) {
          sincronizarMonitor();
        }
      }
    }

    window.addEventListener(
      "sistema-rh-monitor-atualizado",
      sincronizarMonitor
    );

    window.addEventListener(
      "storage",
      sincronizarMonitor
    );

    sincronizarMonitor();
    sincronizarMonitorRemoto();

    const intervalo =
      window.setInterval(
        sincronizarMonitorRemoto,
        15000
      );

    return () => {
      ativo = false;

      window.removeEventListener(
        "sistema-rh-monitor-atualizado",
        sincronizarMonitor
      );

      window.removeEventListener(
        "storage",
        sincronizarMonitor
      );

      window.clearInterval(intervalo);
    };
  }, []);

  function cadastrarGestor(
    novoGestor: Gestor
  ) {
    const unidadeJaCadastrada =
      gestores.some(
        (gestor) =>
          gestor.codigo ===
            novoGestor.codigo ||
          gestor.unidade
            .trim()
            .toUpperCase() ===
            novoGestor.unidade
              .trim()
              .toUpperCase()
      );

    if (unidadeJaCadastrada) {
      alert(
        "Esta unidade já possui um gestor cadastrado. Selecione o gestor na lista para editar."
      );
      return;
    }

    setGestores((listaAtual) =>
      [...listaAtual, novoGestor].sort(
        (a, b) =>
          a.codigo.localeCompare(
            b.codigo
          )
      )
    );

    setCodigoSelecionado(
      novoGestor.codigo
    );
    setNomeEdicao(
      obterNomeGestor(novoGestor)
    );
    setTelefoneEdicao(
      obterTelefoneGestor(novoGestor)
    );
    setAtivoEdicao(
      novoGestor.ativo
    );

    alert(
      "Gestor cadastrado com sucesso."
    );
  }

  function salvarEdicaoGestor() {
    if (!gestorSelecionado) {
      alert(
        "Selecione um gestor cadastrado para editar."
      );
      return;
    }

    if (!nomeEdicao.trim()) {
      alert(
        "Informe o nome do gestor."
      );
      return;
    }

    if (!telefoneEdicao.trim()) {
      alert(
        "Informe o WhatsApp do gestor."
      );
      return;
    }

    setGestores((listaAtual) =>
      listaAtual.map((gestor) => {
        if (
          gestor.codigo !==
          gestorSelecionado.codigo
        ) {
          return gestor;
        }

        const gestorAtual =
          gestor as GestorEditavel;

        const gestorAtualizado: GestorEditavel =
          {
            ...gestorAtual,
            ativo: ativoEdicao,
            atualizadoEm:
              new Date().toISOString(),
          };

        if (
          Object.prototype.hasOwnProperty.call(
            gestorAtual,
            "gerente"
          )
        ) {
          gestorAtualizado.gerente =
            nomeEdicao.trim();
        } else {
          gestorAtualizado.nome =
            nomeEdicao.trim();
        }

        if (
          Object.prototype.hasOwnProperty.call(
            gestorAtual,
            "whatsapp"
          )
        ) {
          gestorAtualizado.whatsapp =
            telefoneEdicao.replace(
              /\D/g,
              ""
            );
        } else {
          gestorAtualizado.telefone =
            telefoneEdicao.replace(
              /\D/g,
              ""
            );
        }

        return gestorAtualizado as Gestor;
      })
    );

    alert(
      "Dados do gestor atualizados."
    );
  }

  function cancelarEdicao() {
    selecionarGestor("");
  }

  function dispararAgora() {
    if (disparoGestores.length > 0) {
      const selecionados =
        disparoGestores.filter(
          (gestor) =>
            gestor.selecionado
        );

      if (selecionados.length === 0) {
        alert(
          "Marque pelo menos um gestor para enviar."
        );
        return;
      }

      selecionados.forEach(
        (gestor) => {
          abrirWhatsAppGestor(gestor);
        }
      );

      return;
    }

    const gestoresAtivos =
      gestores.filter((gestor) => {
        const telefone =
          obterTelefoneGestor(
            gestor
          ).trim();

        const recebeDisparo =
          gestor.recebeDisparoDiario !==
            false ||
          gestor.codigo === "000";

        return (
          gestor.ativo &&
          recebeDisparo &&
          (telefone ||
            gestor.codigo === "000")
        );
      });

    const gestoresComTelefone =
      gestoresAtivos.filter((gestor) =>
        obterTelefoneGestor(
          gestor
        ).trim()
      );

    if (
      gestoresComTelefone.length === 0
    ) {
      alert(
        "Nenhum gestor ativo com WhatsApp disponível para envio."
      );
      return;
    }

    const dadosDisparo: GestorDisparo[] =
      gestoresAtivos.map((gestor) => ({
        codigo: gestor.codigo,
        unidade: gestor.unidade,
        gestor:
          obterNomeGestor(gestor),
        telefone:
          obterTelefoneGestor(
            gestor
          ).replace(/\D/g, ""),
        dataDisparo:
          new Date().toISOString(),
        status: "PREPARADO",
        selecionado: true,
      }));

    localStorage.setItem(
      CHAVE_DISPARO,
      JSON.stringify(dadosDisparo)
    );

    setDisparoGestores(
      dadosDisparo
    );

    window.dispatchEvent(
      new CustomEvent(
        "sistema-rh-disparo-gestores",
        {
          detail: dadosDisparo,
        }
      )
    );

    alert(
      `Disparo preparado para ${gestoresAtivos.length} gestores ativos. Desmarque quem não deve receber.`
    );
  }

  function alternarGestorDisparo(
    codigo: string
  ) {
    setDisparoGestores((listaAtual) => {
      const novaLista =
        listaAtual.map((gestor) =>
          gestor.codigo === codigo
            ? {
                ...gestor,
                selecionado:
                  !gestor.selecionado,
              }
            : gestor
        );

      localStorage.setItem(
        CHAVE_DISPARO,
        JSON.stringify(novaLista)
      );

      return novaLista;
    });
  }

  function selecionarTodosDisparo() {
    setDisparoGestores((listaAtual) => {
      const novaLista =
        listaAtual.map((gestor) => ({
          ...gestor,
          selecionado: true,
        }));

      localStorage.setItem(
        CHAVE_DISPARO,
        JSON.stringify(novaLista)
      );

      return novaLista;
    });
  }

  function limparSelecaoDisparo() {
    setDisparoGestores((listaAtual) => {
      const novaLista =
        listaAtual.map((gestor) => ({
          ...gestor,
          selecionado: false,
        }));

      localStorage.setItem(
        CHAVE_DISPARO,
        JSON.stringify(novaLista)
      );

      return novaLista;
    });
  }

  function abrirWhatsAppGestor(
    gestor: GestorDisparo
  ) {
    if (!gestor.selecionado) {
      return;
    }

    window.open(
      gerarLinkWhatsApp(
        gestor.telefone
      ),
      "_blank",
      "noopener,noreferrer"
    );
  }

  function atualizarSolicitacao(
    solicitacao: SolicitacaoGestor
  ) {
    if (
      idsProcessando.includes(
        solicitacao.id
      )
    ) {
      return;
    }

    const filaAtual =
      carregarLista<SolicitacaoGestor>(
        CHAVE_SOLICITACOES,
        []
      );

    const jaExisteNaFila =
      filaAtual.some(
        (item) =>
          item.id === solicitacao.id
      );

    const solicitacaoCadastro: SolicitacaoGestor =
      {
        ...solicitacao,
        quantidade: Number(
          solicitacao.quantidade
        ),
        atualizado: true,
      };

    if (!jaExisteNaFila) {
      localStorage.setItem(
        CHAVE_SOLICITACOES,
        JSON.stringify([
          ...filaAtual,
          solicitacaoCadastro,
        ])
      );
    }

    setIdsProcessando(
      (listaAtual) => [
        ...listaAtual,
        solicitacao.id,
      ]
    );

    setMonitor((listaAtual) =>
      listaAtual.map((item) =>
        item.id === solicitacao.id
          ? {
              ...item,
              atualizado: true,
            }
          : item
      )
    );

    eventBus.emit(
      "SOLICITACAO_APROVADA",
      solicitacaoCadastro
    );
  }

  async function excluirSolicitacao(
    solicitacao: SolicitacaoGestor
  ) {
    const confirmar = window.confirm(
      `Excluir a resposta de teste da unidade ${solicitacao.unidade}?`
    );

    if (!confirmar) {
      return;
    }

    setMonitor((listaAtual) =>
      listaAtual.filter(
        (item) =>
          item.id !==
          solicitacao.id
      )
    );

    setIdsProcessando(
      (listaAtual) =>
        listaAtual.filter(
          (id) =>
            id !==
            solicitacao.id
        )
    );

    const filaAtual =
      carregarLista<SolicitacaoGestor>(
        CHAVE_SOLICITACOES,
        []
      );

    localStorage.setItem(
      CHAVE_SOLICITACOES,
      JSON.stringify(
        filaAtual.filter(
          (item) =>
            item.id !==
            solicitacao.id
        )
      )
    );

    await arquivarRegistroMonitor(
      solicitacao.id
    );
  }

  return (
    <div className="gestores-container">
      <div className="gestores-header">
        <h1>Central de Gestores</h1>

        <p>
          Gerencie os contatos e
          acompanhe as solicitações
          diárias das unidades.
        </p>
      </div>

      <div className="cards-gestores">
        <div className="card-gestor">
          <span>Unidades</span>
          <strong>
            {totalUnidades}
          </strong>
        </div>

        <div className="card-gestor">
          <span>Gestores</span>
          <strong>
            {totalGestores}
          </strong>
        </div>

        <div className="card-gestor">
          <span>Ativos</span>
          <strong>
            {totalAtivos}
          </strong>
        </div>

        <div className="card-gestor">
          <span>Pendentes</span>
          <strong>
            {totalPendentes}
          </strong>
        </div>
      </div>

      <div className="painel-disparo">
        <div className="painel-disparo-esquerda">
          <h2>
            Disparo Automático
            WhatsApp
          </h2>

          <p>
            Envio diário automático
            para os gestores ativos
            das unidades.
          </p>
        </div>

        <div className="painel-disparo-centro">
          <div className="status-disparo ativo">
            ● ATIVO
          </div>

          <div className="hora-disparo">
            {horarioBrasilia}
          </div>

          <small>
            Horário de Brasília
          </small>
        </div>

        <div className="painel-disparo-direita">
          <button
            type="button"
            className="botao-disparar"
            onClick={dispararAgora}
          >
            {disparoGestores.length > 0
              ? "ENVIAR SELECIONADOS"
              : "DISPARAR AGORA"}
          </button>
        </div>
      </div>

      {disparoGestores.length > 0 && (
        <section className="painel-lista-disparo">
          <div className="titulo-lista-disparo">
            <div>
              <h2>
                Disparo preparado
              </h2>

              <p>
                Desmarque quem não deve
                receber a mensagem agora.
              </p>
            </div>

            <strong>
              {totalDisparoSelecionado} de{" "}
              {disparoGestores.length}
            </strong>
          </div>

          <div className="acoes-lista-disparo">
            <button
              type="button"
              onClick={selecionarTodosDisparo}
            >
              MARCAR TODOS
            </button>

            <button
              type="button"
              onClick={limparSelecaoDisparo}
            >
              DESMARCAR TODOS
            </button>
          </div>

          <div className="lista-disparo-gestores">
            {disparoGestores.map(
              (gestor) => (
                <div
                  key={gestor.codigo}
                  className="item-disparo-gestor"
                >
                  <label>
                    <input
                      type="checkbox"
                      checked={
                        gestor.selecionado
                      }
                      onChange={() =>
                        alternarGestorDisparo(
                          gestor.codigo
                        )
                      }
                    />

                    <span>
                      {gestor.unidade} -{" "}
                      {gestor.gestor}
                      {!gestor.telefone &&
                      gestor.codigo !== "000"
                        ? " (sem WhatsApp)"
                        : ""}
                    </span>
                  </label>

                  <button
                    type="button"
                    disabled={
                      !gestor.selecionado ||
                      (!gestor.telefone &&
                        gestor.codigo !== "000")
                    }
                    onClick={() =>
                      abrirWhatsAppGestor(
                        gestor
                      )
                    }
                  >
                    ENVIAR
                  </button>
                </div>
              )
            )}
          </div>
        </section>
      )}

      <section className="painel-cadastro-gestores">
        <div className="titulo-painel-gestores">
          <div>
            <h2>
              Cadastro e edição de
              contato
            </h2>

            <p>
              Cadastre um novo gestor
              ou selecione um contato
              já cadastrado para editar.
            </p>
          </div>
        </div>

        <div className="busca-gestor-cadastrado">
          <label htmlFor="gestor-cadastrado">
            Buscar gestor cadastrado
          </label>

          <select
            id="gestor-cadastrado"
            value={codigoSelecionado}
            onChange={(evento) =>
              selecionarGestor(
                evento.target.value
              )
            }
          >
            <option value="">
              Selecione um gestor
            </option>

            {gestoresOrdenados.map(
              (gestor) => (
                <option
                  key={gestor.codigo}
                  value={gestor.codigo}
                >
                  {gestor.unidade} —{" "}
                  {obterNomeGestor(
                    gestor
                  ) ||
                    "Gestor sem nome"}
                </option>
              )
            )}
          </select>
        </div>

        {gestorSelecionado ? (
          <div className="formulario-edicao-gestor">
            <div className="campo-edicao-gestor">
              <label>Código</label>

              <input
                type="text"
                value={
                  gestorSelecionado.codigo
                }
                disabled
              />
            </div>

            <div className="campo-edicao-gestor">
              <label>Unidade</label>

              <input
                type="text"
                value={
                  gestorSelecionado.unidade
                }
                disabled
              />
            </div>

            <div className="campo-edicao-gestor">
              <label>Gestor</label>

              <input
                type="text"
                value={nomeEdicao}
                onChange={(evento) =>
                  setNomeEdicao(
                    evento.target.value
                  )
                }
                placeholder="Nome do gestor"
              />
            </div>

            <div className="campo-edicao-gestor">
              <label>WhatsApp</label>

              <input
                type="text"
                value={telefoneEdicao}
                onChange={(evento) =>
                  setTelefoneEdicao(
                    evento.target.value
                  )
                }
                placeholder="Número com DDD"
              />
            </div>

            <div className="campo-edicao-gestor campo-status-gestor">
              <label>Status</label>

              <select
                value={
                  ativoEdicao
                    ? "ATIVO"
                    : "INATIVO"
                }
                onChange={(evento) =>
                  setAtivoEdicao(
                    evento.target.value ===
                      "ATIVO"
                  )
                }
              >
                <option value="ATIVO">
                  Ativo
                </option>

                <option value="INATIVO">
                  Inativo
                </option>
              </select>
            </div>

            <div className="acoes-edicao-gestor">
              <button
                type="button"
                className="botao-salvar-gestor"
                onClick={
                  salvarEdicaoGestor
                }
              >
                SALVAR ALTERAÇÕES
              </button>

              <button
                type="button"
                className="botao-cancelar-gestor"
                onClick={cancelarEdicao}
              >
                CANCELAR
              </button>
            </div>
          </div>
        ) : (
          <FormularioGestor
            onCadastrar={
              cadastrarGestor
            }
          />
        )}
      </section>

      <section className="painel-monitor-gestores">
        <div className="titulo-painel-gestores">
          <div>
            <h2>
              Monitor diário de
              respostas
            </h2>

            <p>
              Solicitações recebidas
              dos gestores para
              atualização do Cadastro.
            </p>
          </div>

          <strong className="contador-monitor">
            {monitor.length} respostas
          </strong>
        </div>

        <div className="tabela-monitor-wrapper">
          <table className="tabela-monitor-gestores">
            <thead>
              <tr>
                <th>Unidade</th>
                <th>Tipo</th>
                <th>Cargo</th>
                <th>
                  Quantidade de vagas
                </th>
                <th>Turno</th>
                <th>Motivo</th>
                <th>Emergência</th>
                <th>Ação</th>
              </tr>
            </thead>

            <tbody>
              {monitor.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="monitor-sem-respostas"
                  >
                    Nenhuma resposta
                    recebida hoje.
                  </td>
                </tr>
              ) : (
                monitor.map(
                  (solicitacao) => {
                    const processando =
                      idsProcessando.includes(
                        solicitacao.id
                      );

                    return (
                      <tr
                        key={
                          solicitacao.id
                        }
                      >
                        <td>
                          {
                            solicitacao.unidade
                          }
                        </td>

                        <td>
                          {
                            solicitacao.tipo
                          }
                        </td>

                        <td>
                          {
                            solicitacao.cargo
                          }
                        </td>

                        <td>
                          {
                            solicitacao.quantidade
                          }
                        </td>

                        <td>
                          {
                            solicitacao.turno
                          }
                        </td>

                        <td>
                          {
                            solicitacao.motivo
                          }
                        </td>

                        <td>
                          <span
                            className={
                              solicitacao.emergencia
                                .trim()
                                .toUpperCase() ===
                              "SIM"
                                ? "emergencia-sim"
                                : "emergencia-nao"
                            }
                          >
                            {
                              solicitacao.emergencia
                            }
                          </span>
                        </td>

                        <td>
                          <div className="acoes-monitor-gestores">
                            <button
                              type="button"
                              className={
                                processando
                                  ? "botao-atualizar-monitor atualizado"
                                  : "botao-atualizar-monitor"
                              }
                              disabled={
                                processando
                              }
                              onClick={() =>
                                atualizarSolicitacao(
                                  solicitacao
                                )
                              }
                            >
                              {processando
                                ? "PROCESSANDO"
                                : "ATUALIZAR"}
                            </button>

                          <button
                            type="button"
                            className="botao-excluir-monitor"
                            onClick={() =>
                              excluirSolicitacao(
                                solicitacao
                              )
                            }
                          >
                            EXCLUIR
                          </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default TelaGestores;
