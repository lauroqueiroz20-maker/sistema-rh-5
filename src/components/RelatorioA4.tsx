import React, { useMemo } from "react";
import { type Vaga } from "../data/vagas";

type Ciclo = {
  inicio: string;
  fim: string;
};

type RegistroRelatorioA4 = Vaga & {
  dataAdmissao?: string;
};

type Props = {
  vagas: RegistroRelatorioA4[];
  ciclo: Ciclo;
};

type GrupoUnidade = {
  unidade: string;
  vagas: RegistroRelatorioA4[];
  totalVagas: number;
  totalAdmissoes: number;
  totalPendentes: number;
};

function normalizar(valor: string) {
  return valor
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function juntar(lista: string[]) {
  if (lista.length === 0) {
    return "sem destaque";
  }

  if (lista.length === 1) {
    return lista[0];
  }

  return `${lista.slice(0, -1).join(", ")} e ${
    lista[lista.length - 1]
  }`;
}

function classeTipo(tipo: string) {
  const tipoNormalizado = normalizar(tipo);

  if (tipoNormalizado === "PCD") return "tipo-pcd";
  if (tipoNormalizado.includes("APRENDIZ")) return "tipo-ja";
  if (tipoNormalizado.includes("INVENTARIO")) return "tipo-inv";
  if (tipoNormalizado === "ADM") return "tipo-adm";
  if (tipoNormalizado.includes("ESTAVEL")) return "tipo-estavel";

  return "tipo-operac";
}

function RelatorioA4({ vagas, ciclo }: Props) {
  const grupos = useMemo(() => {
    return [...vagas]
      .sort((a, b) =>
        String(a.unidade || "").localeCompare(
          String(b.unidade || ""),
          "pt-BR"
        )
      )
      .reduce<GrupoUnidade[]>((lista, vaga) => {
        const unidade =
          normalizar(String(vaga.unidade || "")) ||
          "NÃO INFORMADA";

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

        const quantidade = Math.max(
          0,
          Number(vaga.quantidade || 0)
        );

        const admissoes = Math.max(
          0,
          Number(vaga.admissoes || 0)
        );

        grupo.vagas.push(vaga);
        grupo.totalVagas += quantidade;
        grupo.totalAdmissoes += admissoes;
        grupo.totalPendentes += Math.max(
          0,
          quantidade - admissoes
        );

        return lista;
      }, []);
  }, [vagas]);

  const totais = useMemo(
    () =>
      grupos.reduce(
        (acc, grupo) => ({
          vagas:
            acc.vagas + grupo.totalVagas,
          admissoes:
            acc.admissoes +
            grupo.totalAdmissoes,
          pendentes:
            acc.pendentes +
            grupo.totalPendentes,
        }),
        {
          vagas: 0,
          admissoes: 0,
          pendentes: 0,
        }
      ),
    [grupos]
  );

  const indicadores = useMemo(() => {
    return vagas.reduce(
      (acc, vaga) => {
        const tipo = normalizar(
          String(vaga.tipo || "")
        );

        const quantidade = Math.max(
          Number(vaga.admissoes || 0),
          Number(vaga.quantidade || 0),
          0
        );

        if (tipo.includes("APRENDIZ")) {
          acc.aprendiz += quantidade;
        }

        if (tipo.includes("INVENTARIO")) {
          acc.inventario += quantidade;
        }

        if (tipo === "PCD") {
          acc.pcd += quantidade;
        }

        if (tipo === "ADM") {
          acc.adm += quantidade;
        }

        return acc;
      },
      {
        aprendiz: 0,
        inventario: 0,
        pcd: 0,
        adm: 0,
      }
    );
  }, [vagas]);

  const destaques = useMemo(() => {
    const unidades = [...grupos]
      .sort((a, b) => b.totalVagas - a.totalVagas)
      .slice(0, 3)
      .map((grupo) => grupo.unidade);

    const cargos = Array.from(
      vagas.reduce<Map<string, number>>((mapa, vaga) => {
        const cargo =
          normalizar(String(vaga.cargo || "")) ||
          "NÃO INFORMADO";

        mapa.set(
          cargo,
          (mapa.get(cargo) || 0) +
            Math.max(0, Number(vaga.quantidade || 0))
        );

        return mapa;
      }, new Map())
    )
      .sort(([, totalA], [, totalB]) => totalB - totalA)
      .slice(0, 3)
      .map(([cargo]) => cargo);

    const estaveis = grupos
      .filter((grupo) => grupo.totalPendentes === 0)
      .slice(0, 3)
      .map((grupo) => grupo.unidade);

    return {
      unidades,
      cargos,
      estaveis,
    };
  }, [grupos, vagas]);

  return (
    <section className="relatorio-a4">
      <header className="a4-cabecalho">
        <h1>
          RELATÓRIO SEMANAL DE RECRUTAMENTO E SELEÇÃO
        </h1>
        <p>
          Relatório gerado automaticamente pelo RH | Tatyana
          Travassos - Coord. R&amp;S
        </p>
      </header>

      <section className="a4-topo">
        <div className="a4-metricas">
          <div>
            <strong>{totais.vagas}</strong>
            <span>DEMANDA ACUMULADA</span>
            <small>Total de vagas sob gestão.</small>
          </div>

          <div>
            <strong>{totais.admissoes}</strong>
            <span>CONTRATAÇÕES EFETIVADAS</span>
            <small>Total de admissões realizadas.</small>
          </div>

          <div>
            <strong>{totais.pendentes}</strong>
            <span>VAGAS PENDENTES</span>
            <small>Saldo de vagas em seleção.</small>
          </div>
        </div>

        <aside className="a4-indicadores">
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
            <span>{indicadores.aprendiz}</span>
          </div>
          <div>
            <strong>Inventário</strong>
            <span>{indicadores.inventario}</span>
          </div>
          <div>
            <strong>PCD</strong>
            <span>{indicadores.pcd}</span>
          </div>
          <div>
            <strong>ADM</strong>
            <span>{indicadores.adm}</span>
          </div>
          <div>
            <strong>INÍCIO</strong>
            <span>{ciclo.inicio || "03/07/2026"}</span>
          </div>
          <div>
            <strong>FIM</strong>
            <span>{ciclo.fim || "00/00/0000"}</span>
          </div>
        </aside>
      </section>

      <section className="a4-destaques">
        <h2>DESTAQUES</h2>
        <p>
          As maiores demandas concentram-se nas unidades de{" "}
          <strong>{juntar(destaques.unidades)}</strong>.
        </p>
        <p>
          As funções com maior necessidade de reposição são{" "}
          <strong>{juntar(destaques.cargos)}</strong>.
        </p>
        <p>
          As unidades{" "}
          <strong>{juntar(destaques.estaveis)}</strong>{" "}
          encontram-se estáveis, sem pendências de contratação.
        </p>
      </section>

      <table className="a4-tabela">
        <thead>
          <tr>
            <th>UNIDADE</th>
            <th>TIPO</th>
            <th>CARGO</th>
            <th>SETOR</th>
            <th>VAGA</th>
            <th>MOTIVO</th>
            <th>SOLIC.</th>
            <th>ADM.</th>
            <th>DATA ADM.</th>
            <th>PEND.</th>
          </tr>
        </thead>
        <tbody>
          {grupos.map((grupo) => (
            <React.Fragment key={grupo.unidade}>
              <tr className="a4-unidade">
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

                return (
                  <tr key={vaga.id}>
                    <td>{grupo.unidade}</td>
                    <td className={classeTipo(vaga.tipo)}>
                      {vaga.tipo || "OPERAC."}
                    </td>
                    <td>{vaga.cargo || "------"}</td>
                    <td>{vaga.setor || "------"}</td>
                    <td>{quantidade}</td>
                    <td>{vaga.motivo || "------"}</td>
                    <td>{vaga.data || "03/07/2026"}</td>
                    <td>{admissoes}</td>
                    <td>
                      {admissoes > 0
                        ? vaga.dataAdmissao || "10/07/2026"
                        : "------"}
                    </td>
                    <td>
                      {Math.max(0, quantidade - admissoes)}
                    </td>
                  </tr>
                );
              })}

              <tr className="a4-total">
                <td colSpan={4}>
                  UNIDADE {grupo.unidade} - TOTAL
                </td>
                <td>{grupo.totalVagas}</td>
                <td />
                <td />
                <td>{grupo.totalAdmissoes}</td>
                <td />
                <td>{grupo.totalPendentes}</td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default RelatorioA4;
