import {
  useMemo,
  useState,
} from "react";

import tipos from "../../data/tipos";
import motivos from "../../data/motivos";
import cargos from "../../data/cargos";

import gestoresIniciais, {
  type Gestor,
} from "../../data/gestores";

import eventBus from "../../Services/eventBus";

const CHAVE_GESTORES =
  "sistema-rh-gestores";

const CHAVE_MONITOR =
  "sistema-rh-monitor-gestores";

type GestorEditavel = Gestor & {
  nome?: string;
  gerente?: string;
  telefone?: string;
  whatsapp?: string;
};

type Turno =
  | "ABERTURA"
  | "INTERMEDIÁRIO"
  | "FECHAMENTO"
  | "NOTURNO";

type Emergencia =
  | "SIM"
  | "NÃO";

type ItemSolicitacao = {
  id: string;
  tipo: string;
  cargo: string;
  quantidade: number;
  turno: Turno;
  motivo: string;
  emergencia: Emergencia;
};

type SolicitacaoGestor = {
  id: string;
  codigoGestor: string;
  gestor: string;
  unidade: string;
  tipo: string;
  cargo: string;
  quantidade: number;
  turno: string;
  motivo: string;
  emergencia: string;
  dataResposta: string;
  atualizado: boolean;
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

function carregarMonitor():
  SolicitacaoGestor[] {
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

function obterNomeGestor(
  gestor: Gestor
): string {
  const dados =
    gestor as GestorEditavel;

  return String(
    dados.nome ||
      dados.gerente ||
      ""
  );
}

function gerarId(
  prefixo = "SOL"
) {
  if (
    typeof crypto !==
      "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }

  return `${prefixo}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)
    .toUpperCase()}`;
}

function obterCodigoPeloLink() {
  const parametros =
    new URLSearchParams(
      window.location.search
    );

  return (
    parametros.get("gestor") ||
    parametros.get("codigo") ||
    ""
  )
    .trim()
    .toUpperCase();
}

function FormularioSolicitacaoGestor() {
  const [gestores] =
    useState<Gestor[]>(
      carregarGestores
    );

  const [
    codigoTeste,
    setCodigoTeste,
  ] = useState("");

  const codigoLink =
    obterCodigoPeloLink();

  const codigoGestor =
    codigoLink || codigoTeste;

  const [tipo, setTipo] =
    useState(
      tipos[0] || "OPERAC."
    );

  const [
    cargoSelecionado,
    setCargoSelecionado,
  ] = useState("");

  const [
    quantidade,
    setQuantidade,
  ] = useState("1");

  const [turno, setTurno] =
    useState<Turno>("ABERTURA");

  const [motivo, setMotivo] =
    useState(
      motivos[0] || "DESLIG."
    );

  const [
    emergencia,
    setEmergencia,
  ] = useState<Emergencia>(
    "NÃO"
  );

  const [
    itensSolicitacao,
    setItensSolicitacao,
  ] = useState<
    ItemSolicitacao[]
  >([]);

  const [enviando, setEnviando] =
    useState(false);

  const [
    enviadoComSucesso,
    setEnviadoComSucesso,
  ] = useState(false);

  const gestorSelecionado =
    useMemo(
      () =>
        gestores.find(
          (gestor) =>
            gestor.codigo
              .trim()
              .toUpperCase() ===
            codigoGestor
              .trim()
              .toUpperCase()
        ),
      [gestores, codigoGestor]
    );

  const gestoresAtivos =
    useMemo(
      () =>
        gestores
          .filter(
            (gestor) =>
              gestor.ativo
          )
          .sort((a, b) =>
            a.unidade.localeCompare(
              b.unidade,
              "pt-BR"
            )
          ),
      [gestores]
    );

  const cargosAtivos =
    useMemo(
      () =>
        cargos
          .filter(
            (cargo) =>
              cargo.ativo
          )
          .sort((a, b) =>
            a.cargo.localeCompare(
              b.cargo,
              "pt-BR"
            )
          ),
      []
    );

  const totalVagas =
    useMemo(
      () =>
        itensSolicitacao.reduce(
          (total, item) =>
            total +
            item.quantidade,
          0
        ),
      [itensSolicitacao]
    );

  function limparCampos() {
    setTipo(
      tipos[0] || "OPERAC."
    );
    setCargoSelecionado("");
    setQuantidade("1");
    setTurno("ABERTURA");
    setMotivo(
      motivos[0] || "DESLIG."
    );
    setEmergencia("NÃO");
  }

  function adicionarCargo() {
    if (!gestorSelecionado) {
      alert(
        "Não foi possível identificar o gestor."
      );
      return;
    }

    if (!tipo) {
      alert(
        "Selecione o tipo."
      );
      return;
    }

    if (!cargoSelecionado) {
      alert(
        "Selecione o cargo."
      );
      return;
    }

    const quantidadeFinal =
      Number(quantidade);

    if (
      !Number.isInteger(
        quantidadeFinal
      ) ||
      quantidadeFinal <= 0
    ) {
      alert(
        "Informe uma quantidade válida."
      );
      return;
    }

    const itemExistente =
      itensSolicitacao.find(
        (item) =>
          item.tipo === tipo &&
          item.cargo ===
            cargoSelecionado &&
          item.turno === turno &&
          item.motivo === motivo &&
          item.emergencia ===
            emergencia
      );

    if (itemExistente) {
      setItensSolicitacao(
        (listaAtual) =>
          listaAtual.map(
            (item) =>
              item.id ===
              itemExistente.id
                ? {
                    ...item,
                    quantidade:
                      item.quantidade +
                      quantidadeFinal,
                  }
                : item
          )
      );
    } else {
      const novoItem:
        ItemSolicitacao = {
        id: gerarId("ITEM"),
        tipo,
        cargo:
          cargoSelecionado,
        quantidade:
          quantidadeFinal,
        turno,
        motivo,
        emergencia,
      };

      setItensSolicitacao(
        (listaAtual) => [
          ...listaAtual,
          novoItem,
        ]
      );
    }

    limparCampos();
  }

  function removerItem(
    id: string
  ) {
    setItensSolicitacao(
      (listaAtual) =>
        listaAtual.filter(
          (item) =>
            item.id !== id
        )
    );
  }

  function alterarQuantidadeItem(
    id: string,
    novaQuantidade: number
  ) {
    if (
      !Number.isInteger(
        novaQuantidade
      ) ||
      novaQuantidade <= 0
    ) {
      return;
    }

    setItensSolicitacao(
      (listaAtual) =>
        listaAtual.map(
          (item) =>
            item.id === id
              ? {
                  ...item,
                  quantidade:
                    novaQuantidade,
                }
              : item
        )
    );
  }

  function enviarSolicitacoes() {
    if (!gestorSelecionado) {
      alert(
        "Não foi possível identificar o gestor."
      );
      return;
    }

    if (
      itensSolicitacao.length === 0
    ) {
      alert(
        "Adicione pelo menos uma solicitação."
      );
      return;
    }

    setEnviando(true);

    const dataResposta =
      new Date().toISOString();

    const novasSolicitacoes:
      SolicitacaoGestor[] =
      itensSolicitacao.map(
        (item) => ({
          id: gerarId(),
          codigoGestor:
            gestorSelecionado.codigo,
          gestor:
            obterNomeGestor(
              gestorSelecionado
            ),
          unidade:
            gestorSelecionado.unidade,
          tipo: item.tipo,
          cargo: item.cargo,
          quantidade:
            item.quantidade,
          turno: item.turno,
          motivo: item.motivo,
          emergencia:
            item.emergencia,
          dataResposta,
          atualizado: false,
        })
      );

    const monitorAtual =
      carregarMonitor();

    const novoMonitor = [
      ...monitorAtual,
      ...novasSolicitacoes,
    ];

    localStorage.setItem(
      CHAVE_MONITOR,
      JSON.stringify(
        novoMonitor
      )
    );

    novasSolicitacoes.forEach(
      (solicitacao) => {
        eventBus.emit(
          "GESTOR_ENVIOU_SOLICITACAO",
          solicitacao
        );
      }
    );

    window.dispatchEvent(
      new CustomEvent(
        "sistema-rh-monitor-atualizado",
        {
          detail:
            novasSolicitacoes,
        }
      )
    );

    setItensSolicitacao([]);
    setEnviadoComSucesso(true);
    setEnviando(false);
  }

  if (
    codigoLink &&
    !gestorSelecionado
  ) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent:
            "center",
          padding: "20px",
          background:
            "#eef2f7",
          fontFamily:
            "Arial, sans-serif",
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: "440px",
            padding: "28px",
            borderRadius: "18px",
            background:
              "#ffffff",
            boxShadow:
              "0 12px 32px rgba(15, 23, 42, 0.12)",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              margin:
                "0 0 10px",
              color: "#0f2747",
            }}
          >
            Link inválido
          </h2>

          <p
            style={{
              margin: 0,
              color: "#64748b",
              lineHeight: 1.5,
            }}
          >
            Não foi possível
            identificar o gestor
            responsável por este
            formulário.
          </p>
        </section>
      </main>
    );
  }

  if (enviadoComSucesso) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent:
            "center",
          padding: "20px",
          background:
            "#eef2f7",
          fontFamily:
            "Arial, sans-serif",
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: "440px",
            padding: "32px 24px",
            borderRadius: "20px",
            background:
              "#ffffff",
            boxShadow:
              "0 14px 36px rgba(15, 23, 42, 0.14)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              margin:
                "0 auto 18px",
              display: "flex",
              alignItems: "center",
              justifyContent:
                "center",
              borderRadius: "50%",
              background:
                "#dcfce7",
              color: "#15803d",
              fontSize: "34px",
              fontWeight: 900,
            }}
          >
            ✓
          </div>

          <h1
            style={{
              margin:
                "0 0 10px",
              fontSize: "24px",
              color: "#0f2747",
            }}
          >
            Solicitação enviada
          </h1>

          <p
            style={{
              margin:
                "0 0 22px",
              color: "#64748b",
              lineHeight: 1.55,
            }}
          >
            As necessidades da unidade{" "}
            <strong>
              {
                gestorSelecionado
                  ?.unidade
              }
            </strong>{" "}
            foram encaminhadas ao
            setor de Recrutamento e
            Seleção.
          </p>

          <button
            type="button"
            onClick={() =>
              setEnviadoComSucesso(
                false
              )
            }
            style={{
              width: "100%",
              minHeight: "48px",
              border: "none",
              borderRadius: "12px",
              background:
                "#0f2747",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            FAZER NOVA SOLICITAÇÃO
          </button>
        </section>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "16px",
        background:
          "#eef2f7",
        fontFamily:
          "Arial, sans-serif",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "620px",
          margin: "0 auto",
          overflow: "hidden",
          borderRadius: "20px",
          background:
            "#ffffff",
          boxShadow:
            "0 14px 36px rgba(15, 23, 42, 0.14)",
        }}
      >
        <header
          style={{
            padding:
              "24px 20px",
            background:
              "linear-gradient(135deg, #071b35, #123c6a)",
            color: "#ffffff",
            textAlign: "center",
          }}
        >
          <img
            src="/logo-diniz.png"
            alt="Diniz Supermercados"
            style={{
              width: "150px",
              maxWidth: "70%",
              marginBottom:
                "14px",
              objectFit:
                "contain",
            }}
          />

          <h1
            style={{
              margin:
                "0 0 6px",
              fontSize: "23px",
            }}
          >
            Solicitação de Vagas
          </h1>

          <p
            style={{
              margin: 0,
              color:
                "rgba(255,255,255,.82)",
              fontSize: "13px",
            }}
          >
            Registro de necessidade
            da unidade
          </p>
        </header>

        {!codigoLink &&
          !gestorSelecionado && (
            <div
              style={{
                padding:
                  "18px 18px 0",
              }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom:
                    "7px",
                  color: "#334155",
                  fontSize: "12px",
                  fontWeight: 800,
                }}
              >
                ACESSO DE TESTE
              </label>

              <select
                value={codigoTeste}
                onChange={(evento) =>
                  setCodigoTeste(
                    evento.target
                      .value
                  )
                }
                style={{
                  width: "100%",
                  height: "46px",
                  border:
                    "1px solid #cbd5e1",
                  borderRadius:
                    "10px",
                  padding:
                    "0 12px",
                  background:
                    "#ffffff",
                }}
              >
                <option value="">
                  Selecione o gestor
                </option>

                {gestoresAtivos.map(
                  (gestor) => (
                    <option
                      key={
                        gestor.codigo
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
                  )
                )}
              </select>
            </div>
          )}

        {gestorSelecionado && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: "10px",
                padding:
                  "18px 18px 0",
              }}
            >
              <div
                style={{
                  padding:
                    "12px",
                  borderRadius:
                    "12px",
                  background:
                    "#f1f5f9",
                }}
              >
                <span
                  style={{
                    display:
                      "block",
                    marginBottom:
                      "4px",
                    color:
                      "#64748b",
                    fontSize:
                      "10px",
                    fontWeight:
                      800,
                  }}
                >
                  GESTOR
                </span>

                <strong
                  style={{
                    color:
                      "#0f2747",
                    fontSize:
                      "13px",
                  }}
                >
                  {obterNomeGestor(
                    gestorSelecionado
                  )}
                </strong>
              </div>

              <div
                style={{
                  padding:
                    "12px",
                  borderRadius:
                    "12px",
                  background:
                    "#f1f5f9",
                }}
              >
                <span
                  style={{
                    display:
                      "block",
                    marginBottom:
                      "4px",
                    color:
                      "#64748b",
                    fontSize:
                      "10px",
                    fontWeight:
                      800,
                  }}
                >
                  UNIDADE
                </span>

                <strong
                  style={{
                    color:
                      "#0f2747",
                    fontSize:
                      "13px",
                  }}
                >
                  {
                    gestorSelecionado.unidade
                  }
                </strong>
              </div>
            </div>

            <div
              style={{
                padding: "18px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(190px, 1fr))",
                  gap: "13px",
                }}
              >
                <CampoSelect
                  titulo="Tipo"
                  valor={tipo}
                  aoAlterar={
                    setTipo
                  }
                  opcoes={tipos}
                />

                <CampoSelect
                  titulo="Cargo"
                  valor={
                    cargoSelecionado
                  }
                  aoAlterar={
                    setCargoSelecionado
                  }
                  opcoes={[
                    "",
                    ...cargosAtivos.map(
                      (item) =>
                        item.cargo
                    ),
                  ]}
                  primeiraOpcao="Selecione"
                />

                <div>
                  <label
                    style={
                      estiloLabel
                    }
                  >
                    Quantidade
                  </label>

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "44px 1fr 44px",
                      gap: "7px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setQuantidade(
                          String(
                            Math.max(
                              1,
                              Number(
                                quantidade
                              ) - 1
                            )
                          )
                        )
                      }
                      style={
                        estiloBotaoQuantidade
                      }
                    >
                      −
                    </button>

                    <input
                      type="number"
                      min="1"
                      value={
                        quantidade
                      }
                      onChange={(
                        evento
                      ) =>
                        setQuantidade(
                          evento.target
                            .value
                        )
                      }
                      style={{
                        ...estiloCampo,
                        textAlign:
                          "center",
                        fontSize:
                          "16px",
                        fontWeight:
                          800,
                      }}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setQuantidade(
                          String(
                            Math.max(
                              1,
                              Number(
                                quantidade
                              ) + 1
                            )
                          )
                        )
                      }
                      style={
                        estiloBotaoQuantidade
                      }
                    >
                      +
                    </button>
                  </div>
                </div>

                <CampoSelect
                  titulo="Turno"
                  valor={turno}
                  aoAlterar={(
                    valor
                  ) =>
                    setTurno(
                      valor as Turno
                    )
                  }
                  opcoes={[
                    "ABERTURA",
                    "INTERMEDIÁRIO",
                    "FECHAMENTO",
                    "NOTURNO",
                  ]}
                />

                <CampoSelect
                  titulo="Motivo"
                  valor={motivo}
                  aoAlterar={
                    setMotivo
                  }
                  opcoes={motivos}
                />

                <CampoSelect
                  titulo="Emergência"
                  valor={
                    emergencia
                  }
                  aoAlterar={(
                    valor
                  ) =>
                    setEmergencia(
                      valor as Emergencia
                    )
                  }
                  opcoes={[
                    "NÃO",
                    "SIM",
                  ]}
                />
              </div>

              <button
                type="button"
                onClick={
                  adicionarCargo
                }
                style={{
                  width: "100%",
                  minHeight: "48px",
                  marginTop:
                    "18px",
                  border: "none",
                  borderRadius:
                    "12px",
                  background:
                    "#15803d",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                + ADICIONAR CARGO
              </button>

              {itensSolicitacao.length >
                0 && (
                <div
                  style={{
                    marginTop:
                      "22px",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "space-between",
                      gap: "10px",
                      marginBottom:
                        "10px",
                    }}
                  >
                    <h2
                      style={{
                        margin: 0,
                        color:
                          "#0f2747",
                        fontSize:
                          "17px",
                      }}
                    >
                      Solicitações
                    </h2>

                    <strong
                      style={{
                        color:
                          "#2563eb",
                        fontSize:
                          "12px",
                      }}
                    >
                      {totalVagas}{" "}
                      {totalVagas ===
                      1
                        ? "vaga"
                        : "vagas"}
                    </strong>
                  </div>

                  <div
                    style={{
                      display:
                        "flex",
                      flexDirection:
                        "column",
                      gap: "10px",
                    }}
                  >
                    {itensSolicitacao.map(
                      (item) => (
                        <article
                          key={
                            item.id
                          }
                          style={{
                            padding:
                              "14px",
                            border:
                              "1px solid #dbe3ee",
                            borderRadius:
                              "14px",
                            background:
                              "#f8fafc",
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              justifyContent:
                                "space-between",
                              gap:
                                "12px",
                            }}
                          >
                            <div>
                              <strong
                                style={{
                                  display:
                                    "block",
                                  marginBottom:
                                    "5px",
                                  color:
                                    "#0f2747",
                                  fontSize:
                                    "14px",
                                }}
                              >
                                {
                                  item.cargo
                                }
                              </strong>

                              <span
                                style={{
                                  color:
                                    "#64748b",
                                  fontSize:
                                    "11px",
                                  lineHeight:
                                    1.5,
                                }}
                              >
                                {
                                  item.tipo
                                }{" "}
                                •{" "}
                                {
                                  item.turno
                                }{" "}
                                •{" "}
                                {
                                  item.motivo
                                }
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removerItem(
                                  item.id
                                )
                              }
                              style={{
                                width:
                                  "34px",
                                height:
                                  "34px",
                                flexShrink:
                                  0,
                                border:
                                  "none",
                                borderRadius:
                                  "9px",
                                background:
                                  "#fee2e2",
                                color:
                                  "#b91c1c",
                                fontWeight:
                                  900,
                                cursor:
                                  "pointer",
                              }}
                            >
                              ×
                            </button>
                          </div>

                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "space-between",
                              gap:
                                "12px",
                              marginTop:
                                "12px",
                            }}
                          >
                            <span
                              style={{
                                color:
                                  item.emergencia ===
                                  "SIM"
                                    ? "#b91c1c"
                                    : "#64748b",
                                fontSize:
                                  "11px",
                                fontWeight:
                                  800,
                              }}
                            >
                              Emergência:{" "}
                              {
                                item.emergencia
                              }
                            </span>

                            <div
                              style={{
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                gap:
                                  "7px",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  alterarQuantidadeItem(
                                    item.id,
                                    Math.max(
                                      1,
                                      item.quantidade -
                                        1
                                    )
                                  )
                                }
                                style={
                                  estiloBotaoQuantidadePequeno
                                }
                              >
                                −
                              </button>

                              <strong
                                style={{
                                  minWidth:
                                    "24px",
                                  textAlign:
                                    "center",
                                  color:
                                    "#0f2747",
                                }}
                              >
                                {
                                  item.quantidade
                                }
                              </strong>

                              <button
                                type="button"
                                onClick={() =>
                                  alterarQuantidadeItem(
                                    item.id,
                                    item.quantidade +
                                      1
                                  )
                                }
                                style={
                                  estiloBotaoQuantidadePequeno
                                }
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </article>
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={enviando}
                    onClick={
                      enviarSolicitacoes
                    }
                    style={{
                      width: "100%",
                      minHeight:
                        "52px",
                      marginTop:
                        "18px",
                      border: "none",
                      borderRadius:
                        "12px",
                      background:
                        enviando
                          ? "#94a3b8"
                          : "#0f2747",
                      color:
                        "#ffffff",
                      fontSize:
                        "14px",
                      fontWeight:
                        900,
                      cursor:
                        enviando
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {enviando
                      ? "ENVIANDO..."
                      : "ENVIAR SOLICITAÇÃO"}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

type CampoSelectProps = {
  titulo: string;
  valor: string;
  aoAlterar: (
    valor: string
  ) => void;
  opcoes: string[];
  primeiraOpcao?: string;
};

function CampoSelect({
  titulo,
  valor,
  aoAlterar,
  opcoes,
  primeiraOpcao,
}: CampoSelectProps) {
  return (
    <div>
      <label style={estiloLabel}>
        {titulo}
      </label>

      <select
        value={valor}
        onChange={(evento) =>
          aoAlterar(
            evento.target.value
          )
        }
        style={estiloCampo}
      >
        {opcoes.map(
          (opcao, indice) => (
            <option
              key={`${titulo}-${indice}-${opcao}`}
              value={opcao}
            >
              {!opcao &&
              primeiraOpcao
                ? primeiraOpcao
                : opcao}
            </option>
          )
        )}
      </select>
    </div>
  );
}

const estiloLabel = {
  display: "block",
  marginBottom: "7px",
  color: "#334155",
  fontSize: "12px",
  fontWeight: 800,
} as const;

const estiloCampo = {
  width: "100%",
  height: "46px",
  boxSizing:
    "border-box",
  border:
    "1px solid #cbd5e1",
  borderRadius: "10px",
  padding: "0 12px",
  background: "#ffffff",
  color: "#0f172a",
  outline: "none",
} as const;

const estiloBotaoQuantidade = {
  height: "46px",
  border: "none",
  borderRadius: "10px",
  background: "#e2e8f0",
  color: "#0f2747",
  fontSize: "20px",
  fontWeight: 900,
  cursor: "pointer",
} as const;

const estiloBotaoQuantidadePequeno = {
  width: "32px",
  height: "32px",
  border: "none",
  borderRadius: "8px",
  background: "#e2e8f0",
  color: "#0f2747",
  fontSize: "17px",
  fontWeight: 900,
  cursor: "pointer",
} as const;

export default FormularioSolicitacaoGestor;