import {
  useEffect,
  useRef,
  useState,
} from "react";

import "./App.css";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Cards from "./components/Cards";
import Cadastro from "./components/Cadastro";
import TelaCadastro from "./components/TelaCadastro";

import Admitidos, {
  type RegistroAdmitido,
} from "./components/Admitidos/Admitidos";

import RelatorioGerencial from "./components/RelatorioGerencial.tsx";

import vagasIniciais, {
  type Vaga,
} from "./data/vagas";

import DashboardRH from "./components/DashboardRH/DashboardRH";
import TelaGestores from "./components/Gestores/Gestores";
import AppGestor from "./apps/DinizRH/AppGestor";
import AuthGate from "./apps/DinizRH/AuthGate";

import {
  carregarCiclo,
  carregarVagas,
  salvarCiclo,
  salvarVagas,
} from "./Services/storageService";
import {
  carregarEstadoAdmin,
  salvarEstadoAdmin,
} from "./Services/adminCloudService";

const CHAVE_ADMITIDOS =
  "sistema-rh-admitidos";

const CHAVE_MIGRACAO_DATA_CADASTRO =
  "sistema-rh-migracao-cadastro-03-07-2026";

const CHAVE_MIGRACAO_DATA_ADMITIDOS =
  "sistema-rh-migracao-admitidos-03-07-2026-10-07-2026";

const CICLO_PADRAO = {
  inicio: "03/07/2026",
  fim: "",
};

function normalizarVagas(
  vagas: Vaga[]
): Vaga[] {
  const migracaoJaExecutada =
    localStorage.getItem(
      CHAVE_MIGRACAO_DATA_CADASTRO
    ) === "SIM";

  const vagasNormalizadas =
    vagas.map((vaga) => {
      const ehEstavel =
        vaga.tipo === "ESTÁVEL" ||
        vaga.tipo === "ESTÃVEL";

      return {
        ...vaga,
        data: migracaoJaExecutada
          ? vaga.data
          : "03/07/2026",
        quantidade: ehEstavel
          ? 0
          : Number(
              vaga.quantidade || 0
            ),
        admissoes: ehEstavel
          ? 0
          : Number(
              vaga.admissoes || 0
            ),
      };
    });

  if (!migracaoJaExecutada) {
    localStorage.setItem(
      CHAVE_MIGRACAO_DATA_CADASTRO,
      "SIM"
    );

    salvarVagas(
      vagasNormalizadas
    );
  }

  return vagasNormalizadas;
}

function carregarAdmitidos():
  RegistroAdmitido[] {
  try {
    const salvo =
      localStorage.getItem(
        CHAVE_ADMITIDOS
      );

    if (!salvo) {
      return [];
    }

    const dados: unknown =
      JSON.parse(salvo);

    if (!Array.isArray(dados)) {
      return [];
    }

    const registros =
      dados as RegistroAdmitido[];

    const migracaoJaExecutada =
      localStorage.getItem(
        CHAVE_MIGRACAO_DATA_ADMITIDOS
      ) === "SIM";

    if (migracaoJaExecutada) {
      return registros;
    }

    const registrosNormalizados =
      registros.map(
        (registro) => ({
          ...registro,
          data: "03/07/2026",
          dataAdmissao:
            "10/07/2026",
          admissoes: Math.max(
            1,
            Number(
              registro.admissoes ||
                0
            )
          ),
          ativo: false,
        })
      );

    localStorage.setItem(
      CHAVE_ADMITIDOS,
      JSON.stringify(
        registrosNormalizados
      )
    );

    localStorage.setItem(
      CHAVE_MIGRACAO_DATA_ADMITIDOS,
      "SIM"
    );

    return registrosNormalizados;
  } catch {
    return [];
  }
}

function criarRegistroAdmitido(
  vaga: Vaga,
  dataAdmissao: string
): RegistroAdmitido {
  return {
    ...vaga,
    admissoes: Math.max(
      1,
      Number(
        vaga.admissoes || 0
      )
    ),
    ativo: false,
    dataAdmissao,
  };
}

function prepararDadosIniciais() {
  const vagasCarregadas =
    normalizarVagas(
      carregarVagas(
        vagasIniciais
      )
    );

  const admitidosSalvos =
    carregarAdmitidos();

  const idsJaAdmitidos =
    new Set(
      admitidosSalvos.map(
        (registro) =>
          registro.id
      )
    );

  const vagasAbertas: Vaga[] =
    [];

  const admitidosMigrados:
    RegistroAdmitido[] = [];

  for (
    const vaga of
    vagasCarregadas
  ) {
    const quantidade =
      Number(
        vaga.quantidade || 0
      );

    const admissoes =
      Number(
        vaga.admissoes || 0
      );

    const concluida =
      quantidade > 0 &&
      admissoes >= quantidade;

    if (concluida) {
      if (
        !idsJaAdmitidos.has(
          vaga.id
        )
      ) {
        admitidosMigrados.push(
          criarRegistroAdmitido(
            vaga,
            vaga.data
          )
        );
      }

      continue;
    }

    vagasAbertas.push(vaga);
  }

  return {
    vagasAbertas,
    admitidos: [
      ...admitidosMigrados,
      ...admitidosSalvos,
    ],
  };
}

function AppAdministrativo() {
  const modoTatyana =
    new URLSearchParams(
      window.location.search
    ).get("app") ===
    "tatyana";

  const areaCadastroRef =
    useRef<HTMLDivElement>(
      null
    );

  const [dadosIniciais] =
    useState(
      prepararDadosIniciais
    );

  const [ciclo, setCiclo] =
    useState(() => {
      const cicloSalvo =
        carregarCiclo(
          CICLO_PADRAO
        );

      return {
        ...cicloSalvo,
        inicio:
          CICLO_PADRAO.inicio,
      };
    });

  const [vagas, setVagas] =
    useState<Vaga[]>(
      dadosIniciais.vagasAbertas
    );

  const [
    admitidos,
    setAdmitidos,
  ] = useState<
    RegistroAdmitido[]
  >(
    dadosIniciais.admitidos
  );

  const [, setLixeira] =
    useState<Vaga[]>([]);

  const [
    codigoFiltro,
    setCodigoFiltro,
  ] = useState("001");

  const [
    cargoFiltro,
    setCargoFiltro,
  ] = useState("");

  const [
    modoTela,
    setModoTela,
  ] = useState<
    "novo" | "atualizar"
  >("novo");

  const [
    admissoesPendentes,
    setAdmissoesPendentes,
  ] = useState<number[]>([]);

  const [
    paginaAtual,
    setPaginaAtual,
  ] = useState<
    | "cadastro"
    | "admitidos"
    | "relatorio"
    | "dashboard"
    | "aso"
    | "gestores"
    | "portalgestor"
  >(() =>
    modoTatyana
      ? "cadastro"
      : "dashboard"
  );

  const [
    nuvemCarregada,
    setNuvemCarregada,
  ] = useState(false);

  const [
    salvandoNuvem,
    setSalvandoNuvem,
  ] = useState(false);

  const temAtualizacaoPendente =
    admissoesPendentes.length >
    0;

  useEffect(() => {
    const executarRolagem =
      () => {
        if (
          paginaAtual ===
            "cadastro" &&
          areaCadastroRef.current
        ) {
          areaCadastroRef.current.scrollIntoView(
            {
              behavior:
                "auto",
              block:
                "start",
            }
          );

          return;
        }

        window.scrollTo({
          top: 0,
          behavior: "auto",
        });
      };

    requestAnimationFrame(
      executarRolagem
    );
  }, [paginaAtual]);

  useEffect(() => {
    salvarCiclo(ciclo);
  }, [ciclo]);

  useEffect(() => {
    salvarVagas(vagas);
  }, [vagas]);

  useEffect(() => {
    localStorage.setItem(
      CHAVE_ADMITIDOS,
      JSON.stringify(
        admitidos
      )
    );
  }, [admitidos]);

  useEffect(() => {
    let ativo = true;

    carregarEstadoAdmin()
      .then((estado) => {
        if (!ativo) {
          return;
        }

        if (estado) {
          setVagas(estado.vagas);
          setAdmitidos(
            estado.admitidos
          );
          setCiclo({
            ...estado.ciclo,
            inicio:
              CICLO_PADRAO.inicio,
          });
        }
      })
      .finally(() => {
        if (ativo) {
          setNuvemCarregada(
            true
          );
        }
      });

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (!nuvemCarregada) {
      return;
    }

    const timeout =
      window.setTimeout(() => {
        salvarEstadoAdmin({
          vagas,
          admitidos,
          ciclo,
        }).catch(() => undefined);
      }, 900);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    nuvemCarregada,
    vagas,
    admitidos,
    ciclo,
  ]);

  async function publicarDadosNaNuvem() {
    setSalvandoNuvem(true);

    try {
      await salvarEstadoAdmin({
        vagas,
        admitidos,
        ciclo,
      });

      alert(
        "Dados publicados na nuvem. Tatyana pode recarregar o sistema."
      );
    } catch (erro) {
      alert(
        erro instanceof Error
          ? erro.message
          : "Não foi possível publicar na nuvem."
      );
    } finally {
      setSalvandoNuvem(false);
    }
  }

  function gerarPDF() {
    const hoje =
      new Date().toLocaleDateString(
        "pt-BR"
      );

    setCiclo(
      (
        cicloAtual:
          typeof CICLO_PADRAO
      ) => ({
        ...cicloAtual,
        fim: hoje,
      })
    );

    setPaginaAtual(
      "relatorio"
    );

    setTimeout(() => {
      window.print();

      setTimeout(() => {
        const novoCiclo = {
          inicio:
            CICLO_PADRAO.inicio,
          fim: "00/00/0000",
        };

        setCiclo(novoCiclo);
        salvarCiclo(
          novoCiclo
        );

        setPaginaAtual(
          modoTatyana
            ? "cadastro"
            : "dashboard"
        );
      }, 500);
    }, 500);
  }

  function imprimirRelatorio() {
    setPaginaAtual(
      "relatorio"
    );

    setTimeout(() => {
      window.print();

      setTimeout(() => {
        setPaginaAtual(
          modoTatyana
            ? "cadastro"
            : "dashboard"
        );
      }, 500);
    }, 500);
  }

  const vagasFiltradas =
    vagas.filter((vaga) => {
      const unidadeConfere =
        codigoFiltro === "0"
          ? true
          : vaga.codigo ===
            codigoFiltro;

      const cargoConfere =
        cargoFiltro === ""
          ? true
          : String(
              vaga.cargo || ""
            )
              .trim()
              .toUpperCase() ===
            cargoFiltro
              .trim()
              .toUpperCase();

      return (
        unidadeConfere &&
        cargoConfere
      );
    });

  function alterarModo(
    modo:
      | "novo"
      | "atualizar"
  ) {
    setModoTela(modo);
    setAdmissoesPendentes(
      []
    );
  }

  function encerrarVaga(
    id: number
  ) {
    const confirmou =
      window.confirm(
        "Deseja realmente encerrar esta vaga?\n\nEla será removida da Base de Dados e ficará disponível apenas para recuperação."
      );

    if (!confirmou) {
      return;
    }

    const vaga =
      vagas.find(
        (item) =>
          item.id === id
      );

    if (!vaga) {
      return;
    }

    setLixeira(
      (anterior) => [
        {
          ...vaga,
          ativo: false,
          motivo:
            "ENCERRAR VAGA",
        },
        ...anterior,
      ]
    );

    setVagas(
      (anterior) =>
        anterior.filter(
          (item) =>
            item.id !== id
        )
    );

    setAdmissoesPendentes(
      (anterior) =>
        anterior.filter(
          (item) =>
            item !== id
        )
    );

    alert(
      "Vaga encerrada com sucesso."
    );
  }

  function excluirVaga(
    id: number
  ) {
    const confirmou =
      window.confirm(
        "Deseja realmente excluir este cadastro?\n\nEssa ação removerá o cadastro da tela atual."
      );

    if (!confirmou) {
      return;
    }

    const vaga =
      vagas.find(
        (item) =>
          item.id === id
      );

    if (vaga) {
      setLixeira(
        (anterior) => [
          {
            ...vaga,
            ativo: false,
            motivo:
              "EXCLUÍDO MANUALMENTE",
          },
          ...anterior,
        ]
      );
    }

    setVagas(
      (anterior) =>
        anterior.filter(
          (item) =>
            item.id !== id
        )
    );

    setAdmissoesPendentes(
      (anterior) =>
        anterior.filter(
          (item) =>
            item !== id
        )
    );

    alert(
      "Cadastro excluído com sucesso."
    );
  }

  function adicionarVagas(
    novasVagas: Vaga[]
  ) {
    const hoje =
      new Date().toLocaleDateString(
        "pt-BR"
      );

    const vagasCorrigidas =
      novasVagas.map(
        (vaga) => ({
          ...vaga,
          data:
            vaga.data ||
            hoje,
          quantidade:
            vaga.tipo ===
            "ESTÁVEL"
              ? 0
              : Number(
                  vaga.quantidade ||
                    0
                ),
          admissoes:
            vaga.tipo ===
            "ESTÁVEL"
              ? 0
              : Number(
                  vaga.admissoes ||
                    0
                ),
        })
      );

    setVagas(
      (listaAtual) => [
        ...vagasCorrigidas,
        ...listaAtual,
      ]
    );
  }

  function atualizarMotivo(
    id: number,
    novoMotivo: string
  ) {
    if (
      novoMotivo ===
      "ENCERRAR VAGA"
    ) {
      encerrarVaga(id);
      return;
    }

    setVagas(
      (listaAtual) =>
        listaAtual.map(
          (vaga) =>
            vaga.id === id
              ? {
                  ...vaga,
                  motivo:
                    novoMotivo,
                }
              : vaga
        )
    );
  }

  function atualizarEmergencia(
    id: number,
    novaEmergencia:
      | "SIM"
      | "NÃO"
  ) {
    setVagas(
      (listaAtual) =>
        listaAtual.map(
          (vaga) =>
            vaga.id === id
              ? {
                  ...vaga,
                  emergencia:
                    novaEmergencia,
                }
              : vaga
        )
    );
  }

  function alternarAdmissao(
    id: number
  ) {
    const vaga =
      vagas.find(
        (item) =>
          item.id === id
      );

    if (
      !vaga ||
      Number(
        vaga.admissoes || 0
      ) >=
        Number(
          vaga.quantidade || 0
        )
    ) {
      return;
    }

    setAdmissoesPendentes(
      (anterior) =>
        anterior.includes(id)
          ? anterior.filter(
              (item) =>
                item !== id
            )
          : [
              ...anterior,
              id,
            ]
    );
  }

  function confirmarAtualizacaoCadastro() {
    if (!codigoFiltro) {
      alert(
        "Informe o código da unidade antes de atualizar."
      );
      return;
    }

    if (
      !temAtualizacaoPendente
    ) {
      alert(
        "Nenhuma admissão foi marcada para atualizar."
      );
      return;
    }

    const hoje =
      new Date().toLocaleDateString(
        "pt-BR"
      );

    const novosAdmitidos:
      RegistroAdmitido[] =
      [];

    setVagas(
      (listaAtual) => {
        const vagasMantidas:
          Vaga[] = [];

        for (
          const vaga of
          listaAtual
        ) {
          if (
            !admissoesPendentes.includes(
              vaga.id
            )
          ) {
            vagasMantidas.push(
              vaga
            );
            continue;
          }

          const quantidade =
            Number(
              vaga.quantidade ||
                0
            );

          const novasAdmissoes =
            Math.min(
              Number(
                vaga.admissoes ||
                  0
              ) + 1,
              quantidade
            );

          const concluida =
            quantidade > 0 &&
            novasAdmissoes >=
              quantidade;

          if (concluida) {
            novosAdmitidos.push(
              {
                ...vaga,
                admissoes:
                  novasAdmissoes,
                ativo: false,
                dataAdmissao:
                  hoje,
              }
            );

            continue;
          }

          vagasMantidas.push(
            {
              ...vaga,
              admissoes:
                novasAdmissoes,
            }
          );
        }

        return vagasMantidas;
      }
    );

    if (
      novosAdmitidos.length >
      0
    ) {
      setAdmitidos(
        (listaAtual) => {
          const idsExistentes =
            new Set(
              listaAtual.map(
                (registro) =>
                  registro.id
              )
            );

          const semDuplicar =
            novosAdmitidos.filter(
              (registro) =>
                !idsExistentes.has(
                  registro.id
                )
            );

          return [
            ...semDuplicar,
            ...listaAtual,
          ];
        }
      );
    }

    setAdmissoesPendentes(
      []
    );

    alert(
      "Admissão confirmada e transferida para a aba Admitidos."
    );
  }

  function recuperarAdmissoes() {
    const idsAdmitidos =
      new Set(
        admitidos.map(
          (registro) =>
            registro.id
        )
      );

    const vagasParaRecuperar =
      vagas
        .filter(
          (vaga) =>
            !idsAdmitidos.has(
              vaga.id
            )
        )
        .slice(0, 12);

    if (
      vagasParaRecuperar.length ===
      0
    ) {
      alert(
        "Nenhuma vaga disponível para recuperar."
      );
      return;
    }

    const dataAdmissao =
      new Date().toLocaleDateString(
        "pt-BR"
      );

    const recuperados =
      vagasParaRecuperar.map(
        (vaga) =>
          criarRegistroAdmitido(
            {
              ...vaga,
              admissoes: Math.max(
                1,
                Number(
                  vaga.admissoes || 0
                )
              ),
            },
            dataAdmissao
          )
      );

    setAdmitidos(
      (listaAtual) => [
        ...recuperados,
        ...listaAtual,
      ]
    );

    setVagas(
      (listaAtual) =>
        listaAtual.filter(
          (vaga) =>
            !vagasParaRecuperar.some(
              (recuperado) =>
                recuperado.id ===
                vaga.id
            )
        )
    );

    alert(
      `${recuperados.length} admissão(ões) recuperada(s).`
    );
  }

  return (
    <div
      className={
        modoTatyana
          ? "app app-tatyana"
          : "app"
      }
    >
      {!modoTatyana && (
        <Sidebar />
      )}

      <main className="principal">
        {!modoTatyana && (
          <Header
            paginaAtual={
              paginaAtual
            }
            setPaginaAtual={
              setPaginaAtual
            }
            onPublicarNuvem={
              publicarDadosNaNuvem
            }
            salvandoNuvem={
              salvandoNuvem
            }
          />
        )}

        {paginaAtual ===
          "cadastro" && (
          <>
            <Cards
              vagas={[
                ...vagas,
                ...admitidos,
              ]}
            />

            <div
              ref={
                areaCadastroRef
              }
              className="area-trabalho"
            >
              <Cadastro
                vagas={vagas}
                onAdicionarVagas={
                  adicionarVagas
                }
                onSelecionarCodigo={(
                  codigo
                ) => {
                  setCodigoFiltro(
                    codigo
                  );
                  setCargoFiltro(
                    ""
                  );
                }}
                onSelecionarCargoFiltro={
                  setCargoFiltro
                }
                onAlterarModo={
                  alterarModo
                }
                onConfirmarAtualizacao={
                  confirmarAtualizacaoCadastro
                }
                temAtualizacaoPendente={
                  temAtualizacaoPendente
                }
                onGerarPDF={
                  gerarPDF
                }
                onImprimir={
                  imprimirRelatorio
                }
              />

              <TelaCadastro
                vagas={
                  vagasFiltradas
                }
                modo={
                  modoTela
                }
                admissoesPendentes={
                  admissoesPendentes
                }
                onAtualizarMotivo={
                  atualizarMotivo
                }
                onAtualizarEmergencia={
                  atualizarEmergencia
                }
                onAlternarAdmissao={
                  alternarAdmissao
                }
                onExcluirVaga={
                  excluirVaga
                }
              />
            </div>
          </>
        )}

        {paginaAtual ===
          "admitidos" && (
          <>
            {admitidos.length ===
              0 && (
              <button
                type="button"
                className="salvar"
                onClick={
                  recuperarAdmissoes
                }
                style={{
                  maxWidth: "340px",
                  marginBottom:
                    "14px",
                }}
              >
                RECUPERAR 12 ADMISSÕES
              </button>
            )}

            <Admitidos
              admitidos={
                admitidos
              }
            />
          </>
        )}

        {paginaAtual ===
          "relatorio" && (
          <RelatorioGerencial
            vagas={[
              ...vagas,
              ...admitidos,
            ]}
            ciclo={ciclo}
          />
        )}

        {paginaAtual ===
          "dashboard" && (
          <DashboardRH
            vagas={vagas}
            admitidos={
              admitidos
            }
          />
        )}

        {paginaAtual ===
          "gestores" && (
          <TelaGestores />
        )}

        {paginaAtual ===
          "portalgestor" && (
          <AppGestor />
        )}

        {paginaAtual ===
          "aso" && (
          <div className="pagina-em-construcao">
            <h2>
              Controle de ASO
            </h2>

            <p>
              Área destinada ao acompanhamento de exames admissionais.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  const parametros =
    new URLSearchParams(
      window.location.search
    );

  const acessoGestor =
    Boolean(
      parametros.get(
        "gestor"
      ) ||
        parametros.get(
          "codigo"
        )
    );

  if (acessoGestor) {
    const codigoGestor =
      parametros.get("gestor") ||
      parametros.get("codigo") ||
      "001";

    if (
      codigoGestor.trim() ===
      "000"
    ) {
      return (
        <AuthGate perfil="ADMIN">
          <AppAdministrativo />
        </AuthGate>
      );
    }

    return (
      <AuthGate
        perfil="GESTOR"
        codigoGestor={
          codigoGestor
        }
      >
        <AppGestor />
      </AuthGate>
    );
  }

  return (
    <AuthGate perfil="ADMIN">
      <AppAdministrativo />
    </AuthGate>
  );
}

export default App;
