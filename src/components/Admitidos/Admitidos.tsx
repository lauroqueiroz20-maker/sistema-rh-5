import { useMemo, useState } from "react";
import cargos from "../../data/cargos";
import { type Vaga } from "../../data/vagas";
import "./Admitidos.css";

export type RegistroAdmitido = Vaga & {
  dataAdmissao: string;
};

interface AdmitidosProps {
  admitidos: RegistroAdmitido[];
  onExcluir?: (indice: number) => void;
  onReativar?: (indice: number) => void;
  onAlterarRegistro?: (
    indice: number,
    dados: Partial<RegistroAdmitido>,
  ) => void;
}

const obterDataHoje = () => {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
};

function converterParaInputData(data: string) {
  if (!data) {
    return obterDataHoje();
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return data;
  }

  const partes = data.split("/");

  if (partes.length !== 3) {
    return obterDataHoje();
  }

  const [dia, mes, ano] = partes;

  return `${ano}-${mes}-${dia}`;
}

function converterParaDataBrasil(data: string) {
  if (!data) {
    return "";
  }

  const partes = data.split("-");

  if (partes.length !== 3) {
    return data;
  }

  const [ano, mes, dia] = partes;

  return `${dia}/${mes}/${ano}`;
}

function normalizarTexto(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

function classeTipoAdmitido(tipo: string) {
  const t = normalizarTexto(tipo);

  if (t.includes("PCD")) {
    return "tipo-pcd";
  }

  if (t.includes("APRENDIZ") || t === "JA") {
    return "tipo-ja";
  }

  if (t.includes("INVENTARIO")) {
    return "tipo-inv";
  }

  if (t.includes("ADM")) {
    return "tipo-adm";
  }

  if (t.includes("ESTAVEL")) {
    return "tipo-estavel";
  }

  return "tipo-operac";
}

export default function Admitidos({
  admitidos,
  onExcluir,
  onReativar,
  onAlterarRegistro,
}: AdmitidosProps) {
  const [unidadeSelecionada, setUnidadeSelecionada] = useState("");
  const [cargoSelecionado, setCargoSelecionado] = useState("");
  const [setorSelecionado, setSetorSelecionado] = useState("");
  const [indiceEditando, setIndiceEditando] = useState<number | null>(null);
  const [dataEdicao, setDataEdicao] = useState("");
  const [
    mostrarResumoUnidades,
    setMostrarResumoUnidades,
  ] = useState(false);

  const unidades = useMemo(
    () =>
      Array.from(
        new Set(
          admitidos
            .map((registro) => String(registro.unidade || "").trim())
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [admitidos],
  );

  const cargosDisponiveis = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...cargos
              .filter((item) => item.ativo)
              .map((item) => item.cargo),
            ...admitidos.map((registro) => String(registro.cargo || "")),
          ].filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [admitidos],
  );

  const setoresDisponiveis = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...cargos
              .filter((item) => item.ativo)
              .map((item) => item.setor),
            ...admitidos.map((registro) => String(registro.setor || "")),
          ].filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [admitidos],
  );

  const registrosFiltrados = useMemo(
    () =>
      admitidos.filter((registro) => {
        const unidadeConfere = unidadeSelecionada
          ? registro.unidade === unidadeSelecionada
          : true;
        const cargoConfere = cargoSelecionado
          ? normalizarTexto(registro.cargo || "") === normalizarTexto(cargoSelecionado)
          : true;
        const setorConfere = setorSelecionado
          ? normalizarTexto(registro.setor || "") === normalizarTexto(setorSelecionado)
          : true;

        return unidadeConfere && cargoConfere && setorConfere;
      }),
    [admitidos, unidadeSelecionada, cargoSelecionado, setorSelecionado],
  );

  const registrosOrdenados = useMemo(
    () =>
      [...registrosFiltrados].sort((a, b) => {
        const dataA = converterParaInputData(a.data || "");
        const dataB = converterParaInputData(b.data || "");

        if (dataA !== dataB) {
          return dataA.localeCompare(dataB);
        }

        const unidade = String(a.unidade || "").localeCompare(
          String(b.unidade || ""),
          "pt-BR",
        );

        if (unidade !== 0) {
          return unidade;
        }

        return Number(a.id || 0) - Number(b.id || 0);
      }),
    [registrosFiltrados],
  );

  const unidadesOrdenadas = useMemo(
    () =>
      Array.from(
        new Set(
          registrosOrdenados.map((registro) =>
            String(registro.unidade || ""),
          ),
        ),
      ),
    [registrosOrdenados],
  );

  function classeGrupoUnidade(unidade: string) {
    return unidadesOrdenadas.indexOf(unidade) % 2 === 0
      ? "grupo-unidade-azul"
      : "";
  }

  const totalQuantidade = registrosOrdenados.reduce(
    (total, registro) =>
      total +
      Math.max(
        Number(registro.admissoes || registro.quantidade || 0),
        0,
      ),
    0,
  );

  const totalUnidades = unidadesOrdenadas.length;

  const admitidosPorUnidade = useMemo(
    () =>
      unidadesOrdenadas
        .map((unidade) => {
          const quantidade =
            registrosOrdenados
              .filter(
                (registro) =>
                  String(
                    registro.unidade || "",
                  ) === unidade,
              )
              .reduce(
                (total, registro) =>
                  total +
                  Math.max(
                    Number(
                      registro.admissoes ||
                        registro.quantidade ||
                        0,
                    ),
                    0,
                  ),
                0,
              );

          return {
            unidade,
            quantidade,
          };
        })
        .filter(
          (item) => item.quantidade > 0,
        ),
    [registrosOrdenados, unidadesOrdenadas],
  );

  const totalCargos = useMemo(
    () =>
      new Set(
        registrosOrdenados
          .map((registro) => String(registro.cargo || "").trim())
          .filter(Boolean),
      ).size,
    [registrosOrdenados],
  );

  const ultimaAdmissao = useMemo(
    () =>
      registrosOrdenados
        .map((registro) => registro.dataAdmissao || "")
        .filter(Boolean)
        .sort((a, b) => {
          const dataA = converterParaInputData(a);
          const dataB = converterParaInputData(b);

          return dataB.localeCompare(dataA);
        })[0] || "-",
    [registrosOrdenados],
  );

  function obterIndiceOriginal(registro: RegistroAdmitido) {
    return admitidos.findIndex((item) => item.id === registro.id);
  }

  function iniciarEdicao(registro: RegistroAdmitido) {
    const indiceOriginal = obterIndiceOriginal(registro);

    if (indiceOriginal < 0) {
      return;
    }

    setIndiceEditando(indiceOriginal);
    setDataEdicao(converterParaInputData(registro.dataAdmissao));
  }

  function salvarData(indiceOriginal: number) {
    if (!dataEdicao) {
      return;
    }

    onAlterarRegistro?.(indiceOriginal, {
      dataAdmissao: converterParaDataBrasil(dataEdicao),
    });

    setIndiceEditando(null);
    setDataEdicao("");
  }


  function cancelarEdicao() {
    setIndiceEditando(null);
    setDataEdicao("");
  }

  function excluirRegistro(registro: RegistroAdmitido) {
    const indiceOriginal = obterIndiceOriginal(registro);

    if (indiceOriginal < 0) {
      return;
    }

    const confirmou = window.confirm(
      "Tem certeza que deseja excluir este registro?",
    );

    if (!confirmou) {
      return;
    }

    onExcluir?.(indiceOriginal);
  }

  function reativarRegistro(registro: RegistroAdmitido) {
    const indiceOriginal = obterIndiceOriginal(registro);

    if (indiceOriginal < 0) {
      return;
    }

    const confirmou = window.confirm(
      "Reativar este registro e devolver para a Central de Cadastro?",
    );

    if (!confirmou) {
      return;
    }

    onReativar?.(indiceOriginal);
  }

  return (
    <section className="pagina-admitidos">
      <div className="cabecalho-admitidos">
        <div>
          <h2>Colaboradores Admitidos</h2>
          <p>Histórico das vagas concluídas por admissão.</p>
        </div>

      </div>

      <button
        type="button"
        className="total-admitidos total-admitidos-flutuante"
        onClick={() =>
          setMostrarResumoUnidades(true)
        }
        title="Ver admissões por unidade"
      >
        <span>Total admitidos</span>
        <strong>{totalQuantidade}</strong>
      </button>

      {mostrarResumoUnidades && (
        <div
          className="modal-admitidos-fundo"
          onClick={() =>
            setMostrarResumoUnidades(false)
          }
        >
          <div
            className="modal-admitidos"
            onClick={(evento) =>
              evento.stopPropagation()
            }
          >
            <div className="modal-admitidos-cabecalho">
              <div>
                <span>Resumo</span>
                <h3>
                  Admissões por unidade - {admitidosPorUnidade.length}
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMostrarResumoUnidades(false)
                }
                title="Fechar"
              >
                ×
              </button>
            </div>

            <div className="modal-admitidos-lista">
              {admitidosPorUnidade.length >
              0 ? (
                admitidosPorUnidade.map(
                  (item) => (
                    <div key={item.unidade}>
                      <span>{item.unidade}</span>
                      <strong>{item.quantidade}</strong>
                    </div>
                  ),
                )
              ) : (
                <p>
                  Nenhuma admissão registrada.
                </p>
              )}
            </div>

            <div className="modal-admitidos-total">
              <span>Total</span>
              <strong>{totalQuantidade}</strong>
            </div>
          </div>
        </div>
      )}

      <div className="painel-premium-admitidos">
        <article>
          <span>Admissões</span>
          <strong>{totalQuantidade}</strong>
          <small>Ciclo atual</small>
        </article>

        <article>
          <span>Unidades</span>
          <strong>{totalUnidades}</strong>
          <small>Com admissão</small>
        </article>

        <article>
          <span>Cargos</span>
          <strong>{totalCargos}</strong>
          <small>Preenchidos</small>
        </article>

        <article>
          <span>Última admissão</span>
          <strong>{ultimaAdmissao}</strong>
          <small>Data registrada</small>
        </article>
      </div>

      <div className="tabela-admitidos">
        <table>
          <thead>
            <tr>
              <th>
                <select
                  className="filtro-unidade-admitidos"
                  value={unidadeSelecionada}
                  onChange={(evento) =>
                    setUnidadeSelecionada(evento.target.value)
                  }
                >
                  <option value="">Todas as unidades</option>

                  {unidades.map((unidade) => (
                    <option key={unidade} value={unidade}>
                      {unidade}
                    </option>
                  ))}
                </select>
              </th>

              <th>Tipo</th>
              <th>
                <select
                  className="filtro-unidade-admitidos"
                  value={cargoSelecionado}
                  onChange={(evento) =>
                    setCargoSelecionado(evento.target.value)
                  }
                >
                  <option value="">
                    Cargo
                  </option>

                  {cargosDisponiveis.map((cargo) => (
                    <option key={cargo} value={cargo}>
                      {cargo}
                    </option>
                  ))}
                </select>
              </th>
              <th>QTD</th>
              <th>
                <select
                  className="filtro-unidade-admitidos"
                  value={setorSelecionado}
                  onChange={(evento) =>
                    setSetorSelecionado(evento.target.value)
                  }
                >
                  <option value="">
                    Setor
                  </option>

                  {setoresDisponiveis.map((setor) => (
                    <option key={setor} value={setor}>
                      {setor}
                    </option>
                  ))}
                </select>
              </th>
              <th>Turno</th>
              <th>Motivo</th>
              <th>Emerg.</th>
              <th>Data Solicitação</th>
              <th>Data Admissão</th>
              <th>Status</th>
              <th>Ação</th>
            </tr>
          </thead>

          <tbody>
            {registrosOrdenados.length === 0 ? (
              <tr>
                <td colSpan={12} className="sem-admitidos">
                  Nenhuma admissão registrada.
                </td>
              </tr>
            ) : (
              registrosOrdenados.map((registro) => {
                const indiceOriginal = obterIndiceOriginal(registro);
                const editando = indiceEditando === indiceOriginal;

                return (
                  <tr
                    key={registro.id}
                    className={[
                      `linha-${classeTipoAdmitido(registro.tipo)}`,
                      classeGrupoUnidade(String(registro.unidade || "")),
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <td>{registro.unidade}</td>

                    <td className={classeTipoAdmitido(registro.tipo)}>
                      {registro.tipo}
                    </td>

                    <td>{registro.cargo}</td>

                    <td>
                      {Math.max(
                        Number(
                          registro.admissoes ||
                            registro.quantidade ||
                            0,
                        ),
                        0,
                      )}
                    </td>

                    <td>{registro.setor}</td>
                    <td>{registro.turno}</td>
                    <td>{registro.motivo}</td>
                    <td>{registro.emergencia || "NÃO"}</td>
                    <td>{registro.data || "03/07/2026"}</td>

                    <td>
                      {editando ? (
                        <div
                          style={{
                            display: "flex",
                            gap: "4px",
                            flexDirection: "column",
                          }}
                        >
                          <input
                            type="date"
                            value={dataEdicao}
                            onChange={(evento) =>
                              setDataEdicao(evento.target.value)
                            }
                            autoFocus
                          />

                          <div
                            style={{
                              display: "flex",
                              gap: "4px",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => salvarData(indiceOriginal)}
                              style={{
                                padding: "2px 6px",
                                fontSize: "12px",
                              }}
                            >
                              ✓
                            </button>

                            <button
                              type="button"
                              onClick={cancelarEdicao}
                              style={{
                                padding: "2px 6px",
                                fontSize: "12px",
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => iniciarEdicao(registro)}
                          style={{
                            cursor: "pointer",
                            minWidth: "100px",
                            padding: "2px 4px",
                          }}
                        >
                          {registro.dataAdmissao || "Clique para editar"}
                        </div>
                      )}
                    </td>

                    <td>
                      <span className="status-admitido">ADMITIDO</span>
                    </td>

                    <td>
                      <div className="acoes-admitido">
                        <button
                          type="button"
                          className="btn-reativar"
                          onClick={() => reativarRegistro(registro)}
                        >
                          Reativar
                        </button>

                        <button
                          type="button"
                          className="btn-excluir"
                          onClick={() => excluirRegistro(registro)}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}


