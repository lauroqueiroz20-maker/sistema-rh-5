import { useMemo } from "react";

import cargos from "../data/cargos";
import motivos from "../data/motivos";
import tipos from "../data/tipos";
import { type Vaga } from "../data/vagas";

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
  onAtualizarMotivo: (id: number, motivo: string) => void;
  onAtualizarEmergencia: (
    id: number,
    emergencia: "SIM" | "NÃO"
  ) => void;
  onAlternarAdmissao: (id: number) => void;
  onExcluirVaga: (id: number) => void;
}

function normalizarTexto(valor: unknown) {
  return String(valor || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function classeTipo(tipo: string) {
  const tipoNormalizado = normalizarTexto(tipo);

  if (tipoNormalizado === "PCD") return "tipo-pcd";
  if (tipoNormalizado.includes("APRENDIZ")) return "tipo-ja";
  if (tipoNormalizado.includes("INVENTARIO")) return "tipo-inv";
  if (tipoNormalizado === "ADM") return "tipo-adm";
  if (tipoNormalizado.includes("ESTAVEL")) return "tipo-estavel";

  return "tipo-operac";
}

function classeLinha(tipo: string) {
  return classeTipo(tipo) === "tipo-estavel"
    ? "tipo-estavel"
    : "";
}

function TelaCadastro({
  vagas,
  modo,
  admissoesPendentes,
  onAtualizarCargo,
  onAtualizarTipo,
  onAtualizarMotivo,
  onAtualizarEmergencia,
  onAlternarAdmissao,
  onExcluirVaga,
}: TelaCadastroProps) {

  const vagasFiltradas = vagas;

  const vagasOrdenadas = useMemo(() => {
    return [...vagasFiltradas].sort((a, b) => {
      const porUnidade = String(a.unidade || "").localeCompare(
        String(b.unidade || ""),
        "pt-BR"
      );

      if (porUnidade !== 0) {
        return porUnidade;
      }

      return String(a.cargo || "").localeCompare(
        String(b.cargo || ""),
        "pt-BR"
      );
    });
  }, [vagasFiltradas]);

  const unidadesNaTabela = useMemo(() => {
    return Array.from(
      new Set(vagasOrdenadas.map((vaga) => vaga.unidade))
    );
  }, [vagasOrdenadas]);

  function classeGrupoUnidade(unidade: string) {
    const indice = unidadesNaTabela.indexOf(unidade);
    return indice % 2 === 1
      ? "grupo-unidade-azul"
      : "";
  }

  function primeiraLinhaUnidade(index: number) {
    if (index === 0) return true;

    return (
      vagasOrdenadas[index - 1].unidade !==
      vagasOrdenadas[index].unidade
    );
  }

  const cargosAtivos = useMemo(
    () => cargos.filter((cargo) => cargo.ativo),
    []
  );

  const totalVagasExibidas = vagasFiltradas.reduce(
    (total, vaga) =>
      total +
      Math.max(
        0,
        Number(vaga.quantidade || 0)
      ),
    0
  );

  return (
    <section
      className="painel-atualizacao"
      style={{
        maxHeight: "none",
        overflowY: "visible",
      }}
    >
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Unidade</th>
              <th>Tipo</th>
              <th>Cargo</th>
              <th>Setor</th>
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
            {vagasOrdenadas.length === 0 ? (
              <tr>
                <td
                  colSpan={12}
                  style={{
                    textAlign: "center",
                    padding: "18px",
                    fontWeight: 700,
                  }}
                >
                  Nenhuma vaga encontrada para o cargo selecionado.
                </td>
              </tr>
            ) : (
              vagasOrdenadas.map((vaga, index) => {
                const quantidade = Math.max(
                  0,
                  Number(vaga.quantidade || 0)
                );

                const admissoes = Math.max(
                  0,
                  Number(vaga.admissoes || 0)
                );

                const concluida =
                  quantidade > 0 &&
                  admissoes >= quantidade;

                const selecionadaParaAdmissao =
                  admissoesPendentes.includes(vaga.id);

                const destaqueEstavel =
                  classeLinha(vaga.tipo);

                const classeLinhaTabela = [
                  classeGrupoUnidade(vaga.unidade),
                  primeiraLinhaUnidade(index)
                    ? "inicio-unidade"
                    : "",
                ]
                  .join(" ")
                  .trim();

                return (
                  <tr
                    key={vaga.id}
                    className={classeLinhaTabela}
                  >
                    <td className={destaqueEstavel}>
                      {vaga.unidade}
                    </td>

                    <td
                      className={classeTipo(
                        `${vaga.tipo} ${vaga.cargo}`
                      )}
                    >
                      {modo === "novo" && !concluida ? (
                        <select
                          className={`select-motivo-tabela ${classeTipo(
                            `${vaga.tipo} ${vaga.cargo}`
                          )}`}
                          value={vaga.tipo || "OPERAC."}
                          onChange={(evento) =>
                            onAtualizarTipo(
                              vaga.id,
                              evento.target.value
                            )
                          }
                        >
                          {vaga.tipo && !tipos.includes(vaga.tipo) && (
                            <option value={vaga.tipo}>
                              {vaga.tipo}
                            </option>
                          )}

                          {tipos.map((item) => (
                            <option
                              key={item}
                              value={item}
                            >
                              {item}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={classeTipo(
                            `${vaga.tipo} ${vaga.cargo}`
                          )}
                        >
                          {vaga.tipo || "OPERAC."}
                        </span>
                      )}
                    </td>

                    <td className={destaqueEstavel}>
                      {modo === "novo" && !concluida ? (
                        <select
                          className="select-motivo-tabela"
                          value={vaga.cargo}
                          onChange={(evento) => {
                            const cargoSelecionado =
                              cargosAtivos.find(
                                (cargo) =>
                                  cargo.cargo ===
                                  evento.target.value
                              );

                            onAtualizarCargo(
                              vaga.id,
                              evento.target.value,
                              cargoSelecionado?.setor ||
                                vaga.setor
                            );
                          }}
                        >
                          {vaga.cargo &&
                            !cargosAtivos.some(
                              (cargo) =>
                                cargo.cargo === vaga.cargo
                            ) && (
                              <option value={vaga.cargo}>
                                {vaga.cargo}
                              </option>
                            )}

                          {cargosAtivos.map((cargo) => (
                            <option
                              key={cargo.id}
                              value={cargo.cargo}
                            >
                              {cargo.cargo}
                            </option>
                          ))}
                        </select>
                      ) : (
                        vaga.cargo
                      )}
                    </td>

                    <td className={destaqueEstavel}>
                      {vaga.setor}
                    </td>

                    <td className={destaqueEstavel}>
                      {quantidade}
                    </td>

                    <td className={destaqueEstavel}>
                      {vaga.turno}
                    </td>

                    <td className={destaqueEstavel}>
                      {modo === "novo" && !concluida ? (
                        <select
                          className="select-motivo-tabela"
                          value={vaga.motivo}
                          onChange={(evento) =>
                            onAtualizarMotivo(
                              vaga.id,
                              evento.target.value
                            )
                          }
                        >
                          {motivos.map((item) => (
                            <option
                              key={item}
                              value={item}
                            >
                              {item}
                            </option>
                          ))}
                        </select>
                      ) : (
                        vaga.motivo
                      )}
                    </td>

                    <td className={destaqueEstavel}>
                      {modo === "novo" && !concluida ? (
                        <select
                          className="select-motivo-tabela"
                          value={
                            vaga.emergencia || "NÃO"
                          }
                          onChange={(evento) =>
                            onAtualizarEmergencia(
                              vaga.id,
                              evento.target.value as
                                | "SIM"
                                | "NÃO"
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
                        vaga.emergencia || "NÃO"
                      )}
                    </td>

                    <td className={destaqueEstavel}>
                      {!concluida && quantidade > 0 ? (
                        <button
                          type="button"
                          className={
                            selecionadaParaAdmissao
                              ? "botao-adm marcado"
                              : "botao-adm"
                          }
                          onClick={() =>
                            onAlternarAdmissao(vaga.id)
                          }
                          title={
                            selecionadaParaAdmissao
                              ? "Clique para desmarcar"
                              : "Marcar admissão"
                          }
                        >
                          {selecionadaParaAdmissao
                            ? "✓"
                            : "□"}
                        </button>
                      ) : (
                        admissoes
                      )}
                    </td>

                    <td className={destaqueEstavel}>
                      {vaga.data}
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
                          onExcluirVaga(vaga.id)
                        }
                        title="Excluir cadastro"
                      >
                        Excluir
                      </button>
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

export default TelaCadastro;
