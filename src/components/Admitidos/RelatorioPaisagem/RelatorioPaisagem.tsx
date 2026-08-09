import { useMemo } from "react";

import Cabecalho from "./Cabecalho";
import Indicadores from "./Indicadores";
import PainelExecutivo from "./PainelExecutivo";
import Destaques from "./Destaques";
import TabelaExecutiva, {
  type GrupoTabelaExecutiva,
  type RegistroTabelaExecutiva,
} from "./TabelaExecutiva";
import Rodape from "./Rodape";

import "./RelatorioPaisagem.css";

type RelatorioPaisagemProps = {
  vagas: RegistroTabelaExecutiva[];
  ciclo: {
    inicio: string;
    fim: string;
  };
  onAlterarCiclo: (ciclo: {
    inicio: string;
    fim: string;
  }) => void;
  onAlterarData: (
    id: number,
    campo: "solicitacao" | "admissao",
    valor: string,
  ) => void;
};

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}


function abreviarDestaque(nome: string) {
  return nome
    .replace(/CRATO OSSIAN ARARIPE/g, "CR. - OSSIAN ARARIPE")
    .replace(/CRATO CENTRO/g, "CR. CTR.")
    .replace(/OPERADOR CX\./g, "OPER. CX.")
    .replace(/REPOS\. MERC\./g, "REPOS. MERC.")
    .replace(/B\. ACOUGUE/g, "B. ACOUGUE");
}

function formatarListaComValor(
  itens: Array<[string, number]>
) {
  if (itens.length === 0) {
    return "Sem destaque";
  }

  return itens
    .map(([nome, total]) => `${abreviarDestaque(nome)} (${total})`)
    .join(", ");
}
function juntarNomes(nomes: string[]) {
  if (nomes.length === 0) {
    return "Sem destaque";
  }

  if (nomes.length === 1) {
    return nomes[0];
  }

  return `${nomes.slice(0, -1).join(", ")} e ${
    nomes[nomes.length - 1]
  }`;
}

function consolidarRegistros(
  registros: RegistroTabelaExecutiva[],
) {
  const mapa = new Map<
    number,
    RegistroTabelaExecutiva
  >();

  for (const registro of registros) {
    const existente = mapa.get(registro.id);

    if (!existente) {
      mapa.set(registro.id, {
        ...registro,
        quantidade: Math.max(
          0,
          Number(registro.quantidade ?? 0),
        ),
        admissoes: Math.max(
          0,
          Number(registro.admissoes ?? 0),
        ),
      });

      continue;
    }

    mapa.set(registro.id, {
      ...existente,
      ...registro,

      unidade:
        registro.unidade ||
        existente.unidade,

      tipo:
        registro.tipo ||
        existente.tipo,

      cargo:
        registro.cargo ||
        existente.cargo,

      setor:
        registro.setor ||
        existente.setor,

      motivo:
        registro.motivo ||
        existente.motivo,

      data:
        existente.data ||
        registro.data,

      dataAdmissao:
        registro.dataAdmissao ||
        existente.dataAdmissao,

      quantidade: Math.max(
        Number(existente.quantidade ?? 0),
        Number(registro.quantidade ?? 0),
        0,
      ),

      admissoes: Math.max(
        Number(existente.admissoes ?? 0),
        Number(registro.admissoes ?? 0),
        0,
      ),
    });
  }

  return Array.from(mapa.values());
}

export default function RelatorioPaisagem({
  vagas,
  ciclo,
  onAlterarCiclo,
  onAlterarData,
}: RelatorioPaisagemProps) {
  const registrosConsolidados = useMemo(
    () => consolidarRegistros(vagas),
    [vagas],
  );

  const grupos = useMemo<
    GrupoTabelaExecutiva[]
  >(() => {
    const mapa = new Map<
      string,
      GrupoTabelaExecutiva
    >();

    for (const vaga of registrosConsolidados) {
      const unidade =
        normalizar(
          String(vaga.unidade || ""),
      ) || "NÃO INFORMADA";

      const grupoAtual =
        mapa.get(unidade) || {
          unidade,
          registros: [],
          totalVagas: 0,
          totalAdmissoes: 0,
          totalPendentes: 0,
        };

      const quantidade = Math.max(
        0,
        Number(vaga.quantidade ?? 0),
      );

      const admissoes = Math.min(
        quantidade,
        Math.max(
          0,
          Number(vaga.admissoes ?? 0),
        ),
      );

      grupoAtual.registros.push({
        ...vaga,
        quantidade,
        admissoes,
      });

      grupoAtual.totalVagas += quantidade;
      grupoAtual.totalAdmissoes += admissoes;
      grupoAtual.totalPendentes += Math.max(
        0,
        quantidade - admissoes,
      );

      mapa.set(unidade, grupoAtual);
    }

    return Array.from(mapa.values())
      .map((grupo) => ({
        ...grupo,
        registros: [...grupo.registros],
      }))
      .sort((a, b) =>
        a.unidade.localeCompare(
          b.unidade,
          "pt-BR",
        ),
      );
  }, [registrosConsolidados]);

  const totais = useMemo(() => {
    return grupos.reduce(
      (acumulador, grupo) => {
        acumulador.demanda +=
          grupo.totalVagas;

        acumulador.contratacoes +=
          grupo.totalAdmissoes;

        acumulador.pendentes +=
          grupo.totalPendentes;

        return acumulador;
      },
      {
        demanda: 0,
        contratacoes: 0,
        pendentes: 0,
      },
    );
  }, [grupos]);

  const painel = useMemo(() => {
    return registrosConsolidados.reduce(
      (acumulador, vaga) => {
        const tipo = normalizar(
          String(vaga.tipo || ""),
        );

        const admissoes = Math.max(
          0,
          Number(vaga.admissoes ?? 0),
        );

        if (admissoes === 0) {
          return acumulador;
        }

        if (tipo === "PCD") {
          acumulador.pcd += admissoes;
        }

        if (tipo.includes("APRENDIZ")) {
          acumulador.aprendiz += admissoes;
        }

        if (tipo === "ADM") {
          acumulador.adm += admissoes;
        }

        if (tipo.includes("INVENTARIO")) {
          acumulador.inventario +=
            admissoes;
        }

        return acumulador;
      },
      {
        pcd: 0,
        aprendiz: 0,
        adm: 0,
        inventario: 0,
      },
    );
  }, [registrosConsolidados]);

  const destaques = useMemo(() => {
    const maioresDemandas = [...grupos]
      .filter(
        (grupo) =>
          grupo.totalPendentes >= 7,
      )
      .sort(
        (a, b) =>
          b.totalPendentes -
          a.totalPendentes,
      )
      .map((grupo) => [
        grupo.unidade,
        grupo.totalPendentes,
      ] as [string, number]);

    const cargosCriticos = Array.from(
      registrosConsolidados.reduce<
        Map<string, number>
      >((mapa, vaga) => {
        const cargo =
          normalizar(
            String(vaga.cargo || ""),
      ) || "NÃO INFORMADO";

        const quantidade = Math.max(
          0,
          Number(vaga.quantidade ?? 0),
        );

        const admissoes = Math.min(
          quantidade,
          Math.max(
            0,
            Number(vaga.admissoes ?? 0),
          ),
        );

        const pendentes = Math.max(
          0,
          quantidade - admissoes,
        );

        mapa.set(
          cargo,
          (mapa.get(cargo) || 0) +
            pendentes,
        );

        return mapa;
      }, new Map()),
    )
      .filter(([, total]) => total > 0)
      .sort(
        ([, totalA], [, totalB]) =>
          totalB - totalA,
      )
      .map(([cargo, total]) => [
        cargo,
        total,
      ] as [string, number]);

    const unidadesEstaveis = grupos
      .filter(
        (grupo) =>
          grupo.totalPendentes === 0,
      )
      .map((grupo) => grupo.unidade);

    let observacoes = "";

    if (totais.demanda === 0) {
      observacoes =
        "Não existem vagas registradas no ciclo.";
    } else if (totais.pendentes === 0) {
      observacoes =
        "Todas as vagas do ciclo foram preenchidas.";
    } else if (
      totais.contratacoes === 0
    ) {
      observacoes =
        "Ainda não existem admissões registradas neste ciclo.";
    } else {
      const percentual = Math.round(
        (totais.contratacoes /
          totais.demanda) *
          100,
      );

      observacoes =
        `${totais.contratacoes} admissões efetivadas (${percentual}% da demanda), permanecendo ${totais.pendentes} vagas em andamento.`;
    }

    const percentualDemanda = totais.demanda > 0
      ? `${Math.round((totais.contratacoes / totais.demanda) * 100)}%`
      : "0%";

    return {
      maioresDemandas:
        formatarListaComValor(maioresDemandas),

      cargosCriticos:
        formatarListaComValor(cargosCriticos),

      unidadesEstaveis:
        juntarNomes(unidadesEstaveis),

      totalUnidadesEstaveis:
        unidadesEstaveis.length,

      percentualDemanda,

      observacoes,
    };
  }, [
    grupos,
    registrosConsolidados,
    totais,
  ]);

  return (
    <section className="rpaisagem-pagina">
      <div className="rpaisagem-primeira-pagina">
        <Cabecalho
        cicloInicio={ciclo.inicio}
        cicloFim={ciclo.fim}
        onAlterarInicio={(inicio) =>
          onAlterarCiclo({
            ...ciclo,
            inicio,
          })
        }
        onAlterarFim={(fim) =>
          onAlterarCiclo({
            ...ciclo,
            fim,
          })
        }
        />

        <Indicadores
        demandaAcumulada={totais.demanda}
        contratacoesEfetivadas={totais.contratacoes}
        vagasPendentes={totais.pendentes}
        />

        <PainelExecutivo
        pcd={painel.pcd}
        aprendiz={painel.aprendiz}
        adm={painel.adm}
        inventario={painel.inventario}
        admitidos={totais.contratacoes}
        percentualDemanda={destaques.percentualDemanda}
        unidadesEstaveis={destaques.totalUnidadesEstaveis}
        />

        <Destaques
        maioresDemandas={destaques.maioresDemandas}
        cargosCriticos={destaques.cargosCriticos}
        unidadesEstaveis={destaques.unidadesEstaveis}
        observacoes={destaques.observacoes}
        />

        <Rodape mostrarAssinatura={false} />
      </div>

      <div className="rpaisagem-quebra-tabela" />

      <TabelaExecutiva
        grupos={grupos}
        onAlterarData={onAlterarData}
      />

      <Rodape />

    </section>
  );
}












