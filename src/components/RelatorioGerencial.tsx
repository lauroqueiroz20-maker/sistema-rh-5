import React, { useMemo } from "react";
import { type Vaga } from "../data/vagas";

type Ciclo = {
  inicio: string;
  fim: string;
};

type RegistroRelatorio = Vaga & {
  dataAdmissao?: string;
};

type Props = {
  vagas: RegistroRelatorio[];
  ciclo: Ciclo;
};

type GrupoUnidade = {
  unidade: string;
  vagas: RegistroRelatorio[];
  totalVagas: number;
  totalAdmissoes: number;
  totalPendentes: number;
};

function classeTipo(tipo: string) {
  const tipoNormalizado = String(tipo || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (tipoNormalizado === "PCD") return "tipo-pcd";
  if (tipoNormalizado.includes("APRENDIZ")) return "tipo-ja";
  if (tipoNormalizado.includes("INVENTARIO")) return "tipo-inv";
  if (tipoNormalizado === "ADM") return "tipo-adm";
  if (tipoNormalizado.includes("ESTAVEL")) return "tipo-estavel";

  return "tipo-operac";
}

function RelatorioGerencial({ vagas = [], ciclo }: Props) {
  const { demandaAcumulada, contratacoes, pendentes } = useMemo(() => {
    return vagas.reduce(
      (acc, vaga) => {
        const qtd = Math.max(0, Number(vaga.quantidade || 0));
        const adm = Math.max(0, Number(vaga.admissoes || 0));
        const pen = Math.max(0, qtd - adm);

        acc.demandaAcumulada += qtd;
        acc.contratacoes += adm;
        acc.pendentes += pen;

        return acc;
      },
      {
        demandaAcumulada: 0,
        contratacoes: 0,
        pendentes: 0,
      }
    );
  }, [vagas]);

  const indicadoresRelatorio = useMemo(() => {
    return vagas.reduce(
      (acc, vaga) => {
        if (!vaga.dataAdmissao) {
          return acc;
        }

        const tipo = String(vaga.tipo || "")
          .toUpperCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim();

        const qtd = Math.max(
          Number(vaga.admissoes || 0),
          Number(vaga.quantidade || 0),
          0
        );

        if (tipo.includes("APRENDIZ")) {
          acc.totalAprendiz += qtd;
        }

        if (tipo.includes("INVENTARIO")) {
          acc.totalInventario += qtd;
        }

        if (tipo === "PCD") {
          acc.totalPCD += qtd;
        }

        if (tipo === "ADM") {
          acc.totalADM += qtd;
        }

        return acc;
      },
      {
        totalAprendiz: 0,
        totalInventario: 0,
        totalPCD: 0,
        totalADM: 0,
      }
    );
  }, [vagas]);

  const grupos = useMemo(() => {
    const vagasOrdenadas = [...vagas].sort((a, b) =>
      String(a.unidade || "").localeCompare(
        String(b.unidade || ""),
        "pt-BR"
      )
    );

    return vagasOrdenadas.reduce<GrupoUnidade[]>((lista, vaga) => {
      const unidadeRaw = String(vaga.unidade || "")
        .trim()
        .toUpperCase();

      const unidade =
        unidadeRaw === "" ? "NÃO INFORMADA" : unidadeRaw;

      let grupo = lista.find(
        (item) => item.unidade === unidade
      );

      if (!grupo) {
        grupo = {
          unidade,
          vagas: [],
          totalVagas: 0,
          totalAdmissoes: 0,
          totalPendentes: 0,
        };

        lista.push(grupo);
      }

      const qtd = Math.max(
        0,
        Number(vaga.quantidade || 0)
      );

      const adm = Math.max(
        0,
        Number(vaga.admissoes || 0)
      );

      const pen = Math.max(0, qtd - adm);

      grupo.vagas.push(vaga);
      grupo.totalVagas += qtd;
      grupo.totalAdmissoes += adm;
      grupo.totalPendentes += pen;

      return lista;
    }, []);
  }, [vagas]);

  if (vagas.length === 0) {
    return (
      <section className="relatorio-gerencial">
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "#666",
          }}
        >
          <h3>
            Nenhum registro de vaga encontrado para gerar o
            relatório.
          </h3>
        </div>
      </section>
    );
  }

  return (
    <section className="relatorio-gerencial">
      <div className="relatorio-cabecalho">
        <div className="relatorio-titulo">
          <h2>
            RELATÓRIO SEMANAL DE RECRUTAMENTO E SELEÇÃO
          </h2>

          <p>
            Relatório gerado automaticamente pelo RH |
            Tatyana Travassos - Coord. R&amp;S
          </p>
        </div>
      </div>

      <div className="relatorio-indicadores">
        <div className="relatorio-indicador-linha">
          <span className="indicador-numero">
            {demandaAcumulada}
          </span>

          <span className="indicador-titulo">
            DEMANDA ACUMULADA:
          </span>

          <span className="indicador-texto">
            Total de vagas sob gestão.
          </span>
        </div>

        <div className="relatorio-indicador-linha">
          <span className="indicador-numero">
            {contratacoes}
          </span>

          <span className="indicador-titulo">
            CONTRATAÇÕES EFETIVADAS:
          </span>

          <span className="indicador-texto">
            Total de admissões realizadas no período.
          </span>
        </div>

        <div className="relatorio-indicador-linha">
          <span className="indicador-numero">
            {pendentes}
          </span>

          <span className="indicador-titulo">
            VAGAS PENDENTES:
          </span>

          <span className="indicador-texto">
            Saldo de vagas ainda em processo de seleção.
          </span>
        </div>
      </div>

      <div className="relatorio-bloco-meio">
        <div className="relatorio-destaques">
          <h3>Resumo Executivo</h3>

          <p>
            O presente relatório apresenta a posição
            consolidada das vagas sob gestão do RH durante o
            ciclo analisado, contemplando a demanda acumulada,
            contratações efetivadas e vagas pendentes.
            <br />
            As informações estão organizadas por unidade,
            permitindo o acompanhamento das solicitações,
            admissões realizadas e saldo de vagas em aberto.
          </p>
        </div>

        <div className="painel-indicadores-relatorio">
          <div>
            <strong>Turnover</strong>
            <span>0.00%</span>
          </div>

          <div>
            <strong>Demissões</strong>
            <span>0</span>
          </div>

          <div>
            <strong>J. Aprendiz</strong>
            <span>
              {indicadoresRelatorio.totalAprendiz}
            </span>
          </div>

          <div>
            <strong>Inventário</strong>
            <span>
              {indicadoresRelatorio.totalInventario}
            </span>
          </div>

          <div>
            <strong>PCD</strong>
            <span>{indicadoresRelatorio.totalPCD}</span>
          </div>

          <div>
            <strong>ADM</strong>
            <span>{indicadoresRelatorio.totalADM}</span>
          </div>

          <div>
            <strong>INÍCIO</strong>
            <span>{ciclo?.inicio || "03/07/2026"}</span>
          </div>

          <div>
            <strong>FIM</strong>
            <span>{ciclo?.fim || ""}</span>
          </div>
        </div>
      </div>

      <table className="relatorio-tabela">
        <thead>
          <tr>
            <th>TIPO</th>
            <th>CARGO</th>
            <th>SETOR</th>
            <th>VAGA</th>
            <th>MOTIVO</th>
            <th>DATA DE SOLICITAÇÃO</th>
            <th>ADMISSÕES</th>
            <th>DATA DE ADMISSÕES</th>
            <th>TEMPO DE CONTRATAÇÃO</th>
            <th>VAGAS PENDENTES</th>
          </tr>
        </thead>

        <tbody>
          {grupos.map((grupo) => (
            <React.Fragment key={grupo.unidade}>
              <tr className="linha-cabecalho-unidade">
                <td colSpan={10}>
                  UNIDADE {grupo.unidade}
                </td>
              </tr>

              {grupo.vagas.map((vaga) => {
                const quantidade = Math.max(
                  0,
                  Number(vaga.quantidade || 0)
                );

                const admissoes = Math.max(
                  0,
                  Number(vaga.admissoes || 0)
                );

                const pendente = Math.max(
                  0,
                  quantidade - admissoes
                );

                return (
                  <tr key={vaga.id}>
                    <td className={classeTipo(vaga.tipo)}>
                      {vaga.tipo || "OPERAC."}
                    </td>

                    <td>{vaga.cargo || "------"}</td>
                    <td>{vaga.setor || "------"}</td>
                    <td>{quantidade}</td>
                    <td>{vaga.motivo || "------"}</td>
                    <td
                      style={
                        admissoes > 0
                          ? {
                              fontWeight: 700,
                              color: "#003b82",
                            }
                          : undefined
                      }
                    >
                      03/07/2026
                    </td>
                    <td>{admissoes}</td>

                    <td
                      style={
                        admissoes > 0
                          ? {
                              fontWeight: 700,
                              color: "#003b82",
                            }
                          : undefined
                      }
                    >
                      {admissoes > 0
                        ? vaga.dataAdmissao || "10/07/2026"
                        : "------"}
                    </td>

                    <td>0</td>
                    <td>{pendente}</td>
                  </tr>
                );
              })}

              <tr className="linha-total-unidade linha-total-menor">
                <td
                  style={{
                    position: "relative",
                    padding: "2px 0",
                    borderRight: "none",
                    verticalAlign: "middle",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "160px",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      whiteSpace: "nowrap",
                      fontWeight: "bold",
                      color: "#003b82",
                      fontSize: "10px",
                      zIndex: 2,
                      width: "320px",
                      textAlign: "left",
                    }}
                  >
                    UNIDADE {grupo.unidade} - TOTAL
                  </div>
                </td>

                <td
                  style={{
                    borderLeft: "none",
                    borderRight: "none",
                    padding: "2px 0",
                  }}
                />

                <td
                  style={{
                    borderLeft: "none",
                    padding: "2px 0",
                  }}
                />

                <td className="numero-total-destaque">
                  {grupo.totalVagas}
                </td>

                <td />
                <td />

                <td className="numero-total-destaque">
                  {grupo.totalAdmissoes}
                </td>

                <td />
                <td />

                <td className="numero-total-destaque">
                  {grupo.totalPendentes}
                </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <div className="relatorio-assinatura">
        <div className="linha" />

        <strong>Tatyana Travassos</strong>

        <br />

        Coordenação de Recrutamento &amp; Seleção
      </div>
    </section>
  );
}

export default RelatorioGerencial;
