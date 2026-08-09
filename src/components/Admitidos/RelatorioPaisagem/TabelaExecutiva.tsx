import {
  Fragment,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  converterDataParaInput,
  formatarDataBrasileira,
} from "./datas";

export type RegistroTabelaExecutiva = {
  id: number;
  unidade?: string;
  tipo?: string;
  cargo?: string;
  setor?: string;
  quantidade?: number;
  motivo?: string;
  data?: string;
  admissoes?: number;
  dataAdmissao?: string;
};

export type GrupoTabelaExecutiva = {
  unidade: string;
  registros: RegistroTabelaExecutiva[];
  totalVagas: number;
  totalAdmissoes: number;
  totalPendentes: number;
};

type TabelaExecutivaProps = {
  grupos: GrupoTabelaExecutiva[];
  onAlterarData: (
    id: number,
    campo: "solicitacao" | "admissao",
    valor: string,
  ) => void;
};

type DatasPorRegistro = Record<
  number,
  {
    solicitacao: string;
    admissao: string;
  }
>;

function normalizarTipo(valor?: string) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}


function obterIndiceData(valor?: string) {
  if (!valor) return 0;

  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return Number(valor.replace(/-/g, ""));
  }

  const partes = valor.split("/");
  if (partes.length !== 3) return 0;

  const [dia, mes, ano] = partes;
  return Number(`${ano}${mes.padStart(2, "0")}${dia.padStart(2, "0")}`);
}

function ordenarRegistrosDaUnidade(
  registros: RegistroTabelaExecutiva[],
) {
  return [...registros].sort((a, b) => {
    const dataA = obterIndiceData(a.data);
    const dataB = obterIndiceData(b.data);

    if (dataA !== dataB) return dataA - dataB;

    return Number(a.id || 0) - Number(b.id || 0);
  });
}
function obterClasseTipo(tipo?: string) {
  const tipoNormalizado = normalizarTipo(tipo);

  if (tipoNormalizado === "PCD") {
    return "rpaisagem-tipo-pcd";
  }

  if (tipoNormalizado.includes("APRENDIZ")) {
    return "rpaisagem-tipo-aprendiz";
  }

  if (tipoNormalizado === "ADM") {
    return "rpaisagem-tipo-adm";
  }

  if (tipoNormalizado.includes("INVENTARIO")) {
    return "rpaisagem-tipo-inventario";
  }

  if (tipoNormalizado === "ESTAVEL") {
    return "rpaisagem-tipo-estavel";
  }

  return "";
}

export default function TabelaExecutiva({
  grupos,
  onAlterarData,
}: TabelaExecutivaProps) {
  const [datas, setDatas] = useState<DatasPorRegistro>({});
  const gruposOrdenados = useMemo(
    () =>
      [...grupos]
        .map((grupo) => ({
          ...grupo,
          registros: ordenarRegistrosDaUnidade(grupo.registros),
        }))
        .sort((a, b) =>
          a.unidade.localeCompare(b.unidade, "pt-BR"),
        ),
    [grupos],
  );

  const totalGeral = gruposOrdenados.reduce(
    (total, grupo) => ({
      vagas: total.vagas + grupo.totalVagas,
      admissoes: total.admissoes + grupo.totalAdmissoes,
      pendentes: total.pendentes + grupo.totalPendentes,
    }),
    {
      vagas: 0,
      admissoes: 0,
      pendentes: 0,
    },
  );

  useEffect(() => {
    const novasDatas: DatasPorRegistro = {};

    gruposOrdenados.forEach((grupo) => {
      grupo.registros.forEach((registro) => {
        novasDatas[registro.id] = {
          solicitacao:
            datas[registro.id]?.solicitacao ||
            converterDataParaInput(registro.data),
          admissao:
            datas[registro.id]?.admissao ||
            converterDataParaInput(registro.dataAdmissao),
        };
      });
    });

    setDatas(novasDatas);
  }, [gruposOrdenados]);

  function atualizarData(
    id: number,
    campo: "solicitacao" | "admissao",
    valor: string,
  ) {
    setDatas((anterior) => ({
      ...anterior,
      [id]: {
        solicitacao: anterior[id]?.solicitacao || "",
        admissao: anterior[id]?.admissao || "",
        [campo]: valor,
      },
    }));
    onAlterarData(id, campo, formatarDataBrasileira(valor));
  }

  return (
    <section className="rpaisagem-tabela-secao">
      <div className="rpaisagem-tabela-titulo">
        RELATÓRIO ANALÍTICO DE VAGAS
      </div>

      <table className="rpaisagem-tabela">
        <thead>
          <tr>
            <th style={{ width: "14%" }}>UNIDADE</th>
            <th style={{ width: "7%" }}>TIPO</th>
            <th style={{ width: "17%" }}>CARGO</th>
            <th style={{ width: "11%" }}>SETOR</th>
            <th style={{ width: "6%" }}>VAGAS</th>
            <th style={{ width: "13%" }}>MOTIVO</th>
            <th style={{ width: "10%" }}>SOLIC.</th>
            <th style={{ width: "6%" }}>ADM.</th>
            <th style={{ width: "10%" }}>DATA ADM.</th>
            <th style={{ width: "6%" }}>PEND.</th>
          </tr>
        </thead>

        <tbody>
          {gruposOrdenados.length === 0 ? (
            <tr>
              <td
                colSpan={10}
                className="rpaisagem-sem-registros"
              >
                Nenhum registro encontrado.
              </td>
            </tr>
          ) : (
            gruposOrdenados.map((grupo) => (
              <Fragment key={grupo.unidade}>
                <tr className="rpaisagem-linha-unidade">
                  <td colSpan={10}>
                    UNIDADE {grupo.unidade}
                  </td>
                </tr>

                {grupo.registros.map((registro) => {
                  const vagas = Math.max(
                    0,
                    Number(registro.quantidade ?? 0),
                  );

                  const admissoes = Math.max(
                    0,
                    Number(registro.admissoes ?? 0),
                  );

                  const pendentes = Math.max(
                    0,
                    vagas - admissoes,
                  );

                  const dataSolicitacao =
                    datas[registro.id]?.solicitacao || "";

                  const dataAdmissao =
                    datas[registro.id]?.admissao || "";

                  const classeTipo =
                    obterClasseTipo(registro.tipo);

                  return (
                    <tr
                      key={registro.id}
                      className={[
                        "rpaisagem-linha-cadastro",
                        classeTipo,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <td>{grupo.unidade}</td>
                      <td>{registro.tipo || "-"}</td>
                      <td>{registro.cargo || "-"}</td>
                      <td>{registro.setor || "-"}</td>
                      <td>{vagas}</td>
                      <td className={normalizarTipo(registro.motivo).includes("EXPERIENCIA") ? "rpaisagem-motivo-experiencia" : undefined}>{registro.motivo || "-"}</td>

                      <td>
                        <input
                          className="rpaisagem-input-data"
                          type="date"
                          value={dataSolicitacao}
                          onChange={(evento) =>
                            atualizarData(
                              registro.id,
                              "solicitacao",
                              evento.target.value,
                            )
                          }
                          title={formatarDataBrasileira(
                            dataSolicitacao,
                          )}
                        />
                      </td>

                      <td>{admissoes}</td>

                      <td>
                        {admissoes > 0 ? (
                          <input
                            className="rpaisagem-input-data"
                            type="date"
                            value={dataAdmissao}
                            onChange={(evento) =>
                              atualizarData(
                                registro.id,
                                "admissao",
                                evento.target.value,
                              )
                            }
                            title={formatarDataBrasileira(
                              dataAdmissao,
                            )}
                          />
                        ) : (
                          "-"
                        )}
                      </td>

                      <td>{pendentes}</td>
                    </tr>
                  );
                })}

                <tr className="rpaisagem-linha-total">
                  <td colSpan={4}>
                    TOTAL <span>Vagas</span>
                  </td>
                  <td>{grupo.totalVagas}</td>
                  <td />
                  <td>Admissões</td>
                  <td>{grupo.totalAdmissoes}</td>
                  <td>Pendências</td>
                  <td>{grupo.totalPendentes}</td>
                </tr>
              </Fragment>
            ))
          )}

          {grupos.length > 0 && (
            <tr className="rpaisagem-linha-total-geral">
              <td colSpan={4}>
                TOTAL GERAL <span>Vagas</span>
              </td>
              <td>{totalGeral.vagas}</td>
              <td />
              <td>Admissões</td>
              <td>{totalGeral.admissoes}</td>
              <td>Pendências</td>
              <td>{totalGeral.pendentes}</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
