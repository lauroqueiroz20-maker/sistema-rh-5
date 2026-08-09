import {
  useMemo,
  useState,
  type MouseEvent,
} from "react";

import motivos from "../data/motivos";
import cargos from "../data/cargos";
import tipos from "../data/tipos";
import { type Vaga } from "../data/vagas";
import "./TelaCadastro.css";

type Emergencia = "SIM" | "NÃO";

interface TelaCadastroProps {
  vagas: Vaga[];
  modo: "novo" | "atualizar";
  admissoesPendentes: number[];
  onAtualizarCargo: (
    id: number,
    cargo: string,
    setor: string
  ) => void;
  onAtualizarTipo: (id: number, tipo: string) => void;
  onAtualizarTurno: (id: number, turno: string) => void;
  onAtualizarMotivo: (
    id: number,
    motivo: string
  ) => void;
  onAtualizarEmergencia: (
    id: number,
    emergencia: Emergencia
  ) => void;
  onAtualizarData: (
    id: number,
    data: string
  ) => void;
  onAlternarAdmissao: (id: number) => void;
  onExcluirVaga: (id: number) => void;
  idsVagasDestacadas?: number[];
}


function normalizarTexto(valor: unknown) {
  return String(valor || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function classeTipo(tipo: string) {
  const tipoNormalizado =
    normalizarTexto(tipo);

  if (tipoNormalizado === "PCD") {
    return "tipo-pcd";
  }

  if (
    tipoNormalizado.includes("APRENDIZ")
  ) {
    return "tipo-ja";
  }

  if (
    tipoNormalizado.includes("INVENTARIO")
  ) {
    return "tipo-inv";
  }

  if (tipoNormalizado === "ADM") {
    return "tipo-adm";
  }

  if (
    tipoNormalizado.includes("ESTAVEL")
  ) {
    return "tipo-estavel";
  }

  return "tipo-operac";
}

function classeLinha(tipo: string) {
  return classeTipo(tipo) ===
    "tipo-estavel"
    ? "tipo-estavel"
    : "";
}

function indiceDataBrasil(valor?: string) {
  if (!valor) return 0;

  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return Number(valor.replace(/-/g, ""));
  }

  const partes = valor.split("/");
  if (partes.length !== 3) return 0;

  const [dia, mes, ano] = partes;
  return Number(`${ano}${mes.padStart(2, "0")}${dia.padStart(2, "0")}`);
}

function motivoEmExperiencia(valor?: string) {
  return normalizarTexto(valor).includes("EXPERIENCIA");
}
function ordenarVagas(vagas: Vaga[]) {
  return [...vagas].sort((a, b) => {
    const dataA = indiceDataBrasil(a.data);
    const dataB = indiceDataBrasil(b.data);

    if (dataA !== dataB) {
      return dataA - dataB;
    }

    const porUnidade = String(
      a.unidade || ""
    ).localeCompare(
      String(b.unidade || ""),
      "pt-BR"
    );

    if (porUnidade !== 0) {
      return porUnidade;
    }

    return Number(a.id || 0) - Number(b.id || 0);
  });
}

function calcularQuantidade(
  valor: number
) {
  return Math.max(
    0,
    Number(valor || 0)
  );
}

function normalizarEmergencia(
  valor: string
): Emergencia {
  return valor === "SIM"
    ? "SIM"
    : "NÃO";
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

function converterBrasilParaDataInput(data: string) {
  if (!data) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return data;
  }

  const partes = data.split("/");

  if (partes.length !== 3) {
    return "";
  }

  const [dia, mes, ano] = partes;

  if (!dia || !mes || !ano) {
    return "";
  }

  return `${ano.padStart(4, "0")}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
}

function abrirCalendarioData(
  evento: MouseEvent<HTMLButtonElement>
) {
  const campo = evento.currentTarget
    .previousElementSibling;

  if (campo instanceof HTMLInputElement) {
    campo.showPicker();
  }
}

function TelaCadastro({
  vagas,
  modo,
  admissoesPendentes,
  onAtualizarCargo,
  onAtualizarTipo,
  onAtualizarTurno,
  onAtualizarMotivo,
  onAtualizarEmergencia,
  onAtualizarData,
  onAlternarAdmissao,
  onExcluirVaga,
  idsVagasDestacadas = [],
}: TelaCadastroProps) {
  const [
    cargoFiltro,
    setCargoFiltro,
  ] = useState("");

  const [
    setorFiltro,
    setSetorFiltro,
  ] = useState("");

  const cargosDisponiveis = useMemo(() => {
    const mapaCargos = new Map<string, number>();

    vagas.forEach((vaga) => {
      const nomeCargo = String(vaga.cargo || "").trim();

      if (!nomeCargo) {
        return;
      }

      const totalAtual = mapaCargos.get(nomeCargo) || 0;

      mapaCargos.set(
        nomeCargo,
        totalAtual + calcularQuantidade(vaga.quantidade)
      );
    });

    return Array.from(mapaCargos.entries()).sort((a, b) =>
      a[0].localeCompare(b[0], "pt-BR")
    );
  }, [vagas]);

  const setoresDisponiveis = useMemo(() => {
    return Array.from(
      new Set(
        [...cargos.map((item) => item.setor), ...vagas.map((vaga) => vaga.setor)]
          .map((setor) => String(setor || "").trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [vagas]);

  const tiposDisponiveis = useMemo(
    () => Array.from(new Set([...tipos, ...vagas.map((vaga) => vaga.tipo)]))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "pt-BR")),
    [vagas]
  );

  const cargosEditaveis = useMemo(
    () => Array.from(new Set([...cargos.map((item) => item.cargo), ...vagas.map((vaga) => vaga.cargo)]))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "pt-BR")),
    [vagas]
  );

  const setoresPorCargo = useMemo(() => {
    const mapa = new Map<string, string>();

    cargos.forEach((item) => {
      mapa.set(normalizarTexto(item.cargo), item.setor);
    });

    vagas.forEach((vaga) => {
      const chave = normalizarTexto(vaga.cargo);
      if (chave && vaga.setor) {
        mapa.set(chave, vaga.setor);
      }
    });

    return mapa;
  }, [vagas]);

  const turnosDisponiveis = useMemo(
    () => Array.from(new Set(["D", "N", "S", "E", ...vagas.map((vaga) => vaga.turno)]))
      .filter(Boolean),
    [vagas]
  );

  const vagasFiltradas = useMemo(() => {
    return vagas.filter((vaga) => {
      const cargoConfere = cargoFiltro
        ? normalizarTexto(vaga.cargo) === normalizarTexto(cargoFiltro)
        : true;
      const setorConfere = setorFiltro
        ? normalizarTexto(vaga.setor) === normalizarTexto(setorFiltro)
        : true;

      return cargoConfere && setorConfere;
    });
  }, [vagas, cargoFiltro, setorFiltro]);

  const vagasOrdenadas = useMemo(
    () => ordenarVagas(vagasFiltradas),
    [vagasFiltradas]
  );

  const unidadesNaTabela = useMemo(
    () =>
      Array.from(
        new Set(vagasOrdenadas.map((vaga) => vaga.unidade))
      ),
    [vagasOrdenadas]
  );

  const totalVagasExibidas = useMemo(
    () =>
      vagasFiltradas.reduce(
        (total, vaga) => total + calcularQuantidade(vaga.quantidade),
        0
      ),
    [vagasFiltradas]
  );

  function classeGrupoUnidade(
    unidade: string
  ) {
    return unidadesNaTabela.indexOf(
      unidade
    ) %
      2 ===
      0
      ? "grupo-unidade-azul"
      : "";
  }

  function primeiraLinhaUnidade(
    index: number
  ) {
    return (
      index === 0 ||
      vagasOrdenadas[index - 1]
        .unidade !==
        vagasOrdenadas[index].unidade
    );
  }

  return (
    <section
      className="painel-atualizacao"
      style={{
        maxHeight: "none",
        overflowY: "visible",
      }}
    >
      <div
        style={{
          overflowX: "auto",
        }}
      >
        <table>
          <thead>
            <tr>
              <th>Unidade</th>

              <th>Tipo</th>

              <th>
                <select
                  className="filtro-tabela-cadastro"
                  value={cargoFiltro}
                  onChange={(evento) =>
                    setCargoFiltro(evento.target.value)
                  }
                >
                  <option value="">
                    Cargo
                  </option>

                  {cargosDisponiveis.map(([nomeCargo]) => (
                    <option key={nomeCargo} value={nomeCargo}>
                      {nomeCargo}
                    </option>
                  ))}
                </select>
              </th>

              <th>
                <select
                  className="filtro-tabela-cadastro"
                  value={setorFiltro}
                  onChange={(evento) =>
                    setSetorFiltro(evento.target.value)
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

              <th className="total-vagas">
                {totalVagasExibidas}
              </th>

              <th>Turno</th>
              <th>Motivo</th>
              <th>Emerg.</th>
              <th>ADM</th>
              <th>Data</th>
              <th>Status</th>
              <th>Ação</th>
            </tr>
          </thead>

          <tbody>
            {vagasOrdenadas.length ===
            0 ? (
              <tr>
                <td
                  colSpan={12}
                  style={{
                    textAlign: "center",
                    padding: "18px",
                    fontWeight: 700,
                  }}
                >
                  Nenhuma vaga encontrada
                  para o cargo selecionado.
                </td>
              </tr>
            ) : (
              vagasOrdenadas.map(
                (vaga, index) => {
                  const quantidade =
                    calcularQuantidade(
                      vaga.quantidade
                    );

                  const admissoes =
                    calcularQuantidade(
                      vaga.admissoes
                    );

                  const concluida =
                    quantidade > 0 &&
                    admissoes >=
                      quantidade;

                  const selecionadaParaAdmissao =
                    admissoesPendentes.includes(
                      vaga.id
                    );

                  const destaqueEstavel =
                    classeLinha(
                      vaga.tipo
                    );

                  const vagaDestacada =
                    idsVagasDestacadas.includes(
                      vaga.id
                    );

                  const classeLinhaTabela =
                    [
                      classeGrupoUnidade(
                        vaga.unidade
                      ),
                      vagaDestacada
                        ? "vaga-recem-transferida"
                        : "",
                      primeiraLinhaUnidade(
                        index
                      )
                        ? "inicio-unidade"
                        : "",
                    ]
                      .join(" ")
                      .trim();

                  return (
                    <tr
                      key={vaga.id}
                      className={
                        classeLinhaTabela
                      }
                    >
                      <td
                        className={
                          destaqueEstavel
                        }
                      >
                        {vaga.unidade}
                      </td>

                      <td
                        className={
                          destaqueEstavel
                        }
                      >
                        <select
                          className="select-motivo-tabela"
                          value={vaga.tipo || "OPERAC."}
                          onChange={(evento) =>
                            onAtualizarTipo(vaga.id, evento.target.value)
                          }
                        >
                          {tiposDisponiveis.map((tipo) => (
                            <option key={tipo} value={tipo}>{tipo}</option>
                          ))}
                        </select>
                      </td>

                      <td
                        className={
                          [
                            destaqueEstavel,
                            vagaDestacada
                              ? "cargo-recem-transferido"
                              : "",
                          ]
                            .join(" ")
                            .trim()
                        }
                      >
                        <select
                          className="select-motivo-tabela"
                          value={vaga.cargo}
                          onChange={(evento) => {
                            const cargoSelecionado = evento.target.value;
                            const setorRelacionado = setoresPorCargo.get(
                              normalizarTexto(cargoSelecionado)
                            );

                            onAtualizarCargo(
                              vaga.id,
                              cargoSelecionado,
                              setorRelacionado || vaga.setor
                            );
                          }}
                        >
                          {cargosEditaveis.map((cargo) => (
                            <option key={cargo} value={cargo}>{cargo}</option>
                          ))}
                        </select>
                      </td>

                      <td
                        className={
                          destaqueEstavel
                        }
                      >
                        <span className="setor-automatico-tabela">
                          {vaga.setor}
                        </span>
                      </td>

                      <td
                        className={
                          destaqueEstavel
                        }
                      >
                        {quantidade}
                      </td>

                      <td
                        className={
                          destaqueEstavel
                        }
                      >
                        <select
                          className="select-motivo-tabela"
                          value={vaga.turno}
                          onChange={(evento) =>
                            onAtualizarTurno(vaga.id, evento.target.value)
                          }
                        >
                          {turnosDisponiveis.map((turno) => (
                            <option key={turno} value={turno}>{turno}</option>
                          ))}
                        </select>
                      </td>

                      <td
                        className={
                          destaqueEstavel
                        }
                      >
                        {modo === "novo" &&
                        !concluida ? (
                          <select
                            className="select-motivo-tabela"
                            value={
                              vaga.motivo
                            }
                            onChange={(
                              evento
                            ) =>
                              onAtualizarMotivo(
                                vaga.id,
                                evento.target
                                  .value
                              )
                            }
                          >
                            {motivos.map(
                              (item) => (
                                <option
                                  key={
                                    item
                                  }
                                  value={
                                    item
                                  }
                                >
                                  {item}
                                </option>
                              )
                            )}
                          </select>
                        ) : (
                          vaga.motivo
                        )}
                      </td>

                      <td
                        className={
                          [
                            destaqueEstavel,
                            motivoEmExperiencia(vaga.motivo)
                              ? "motivo-experiencia-tabela"
                              : "",
                          ]
                            .join(" ")
                            .trim()
                        }
                      >
                        {modo === "novo" &&
                        !concluida ? (
                          <select
                            className="select-motivo-tabela"
                            value={normalizarEmergencia(
                              vaga.emergencia
                            )}
                            onChange={(
                              evento
                            ) =>
                              onAtualizarEmergencia(
                                vaga.id,
                                normalizarEmergencia(
                                  evento
                                    .target
                                    .value
                                )
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
                        ) : (
                          normalizarEmergencia(
                            vaga.emergencia
                          )
                        )}
                      </td>

                      <td
                        className={
                          destaqueEstavel
                        }
                      >
                        {!concluida &&
                        quantidade > 0 ? (
                          <button
                            type="button"
                            className={
                              selecionadaParaAdmissao
                                ? "botao-adm marcado"
                                : "botao-adm"
                            }
                            onClick={() =>
                              onAlternarAdmissao(
                                vaga.id
                              )
                            }
                            title={
                              selecionadaParaAdmissao
                                ? "Clique para desmarcar"
                                : "Marcar admissão"
                            }
                          >
                            {selecionadaParaAdmissao
                              ? String.fromCharCode(10003)
                              : String.fromCharCode(9633)}
                          </button>
                        ) : (
                          admissoes
                        )}
                      </td>

                      <td
                        className={
                          destaqueEstavel
                        }
                      >
                        <div className="campo-data-cadastro">
                          <input
                            type="date"
                            className="input-data-cadastro"
                            title="Alterar data"
                            value={converterBrasilParaDataInput(
                              vaga.data
                            )}
                            onChange={(evento) =>
                              onAtualizarData(
                                vaga.id,
                                converterParaDataBrasil(
                                  evento.target.value
                                )
                              )
                            }
                          />
                          <button
                            type="button"
                            className="botao-data-cadastro"
                            aria-label={`Alterar data de ${vaga.unidade}`}
                            title="Abrir calendário"
                            onClick={abrirCalendarioData}
                          >
                            📅
                          </button>
                        </div>
                      </td>

                      <td>
                        <span
                          className={
                            concluida
                              ? `status ativo ${destaqueEstavel}`
                              : `status pendente ${destaqueEstavel}`
                          }
                        >
                          {concluida
                            ? "Concluída"
                            : "Aberta"}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="botao-excluir"
                          onClick={() =>
                            onExcluirVaga(
                              vaga.id
                            )
                          }
                          title="Excluir cadastro"
                        >
                          Excluir
                        </button>
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
  );
}

export default TelaCadastro;








