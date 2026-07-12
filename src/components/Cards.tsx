import { useMemo } from "react";

import { type Vaga } from "../data/vagas";

interface CardsProps {
  vagas: Vaga[];
  admitidos?: Vaga[];
}

function normalizar(
  valor: unknown
) {
  return String(
    valor ?? ""
  )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim()
    .toUpperCase();
}

function numeroSeguro(
  valor: unknown
) {
  const numero =
    Number(valor);

  return Number.isFinite(
    numero
  )
    ? numero
    : 0;
}

function quantidadePorIndicador(
  vagas: Vaga[],
  indicador: string
) {
  const indicadorNormalizado =
    normalizar(indicador);

  return vagas.reduce(
    (total, vaga) => {
      const tipo =
        normalizar(
          vaga.tipo
        );

      const cargo =
        normalizar(
          vaga.cargo
        );

      const quantidade =
        Math.max(
          numeroSeguro(
            vaga.admissoes
          ),
          numeroSeguro(
            vaga.quantidade
          )
        );

      return tipo.includes(
        indicadorNormalizado
      ) ||
        cargo.includes(
          indicadorNormalizado
        )
        ? total +
            quantidade
        : total;
    },
    0
  );
}

function Cards({
  vagas,
  admitidos = [],
}: CardsProps) {
  const indicadores =
    useMemo(() => {
      const vagasAtivas =
        vagas.filter(
          (vaga) =>
            normalizar(
              vaga.tipo
            ) !==
            "ESTAVEL"
        );

      const demandaAcumulada =
        vagasAtivas.reduce(
          (total, vaga) =>
            total +
            numeroSeguro(
              vaga.quantidade
            ),
          0
        );

      const contratacoesEfetivadas =
        vagasAtivas.reduce(
          (total, vaga) =>
            total +
            numeroSeguro(
              vaga.admissoes
            ),
          0
        );

      const vagasPendentes =
        vagasAtivas.reduce(
          (total, vaga) => {
            const quantidade =
              numeroSeguro(
                vaga.quantidade
              );

            const admissoes =
              numeroSeguro(
                vaga.admissoes
              );

            return (
              total +
              Math.max(
                quantidade -
                  admissoes,
                0
              )
            );
          },
          0
        );

      const unidadesEstaveis =
        new Set(
          vagas
            .filter(
              (vaga) =>
                normalizar(
                  vaga.tipo
                ) ===
                "ESTAVEL"
            )
            .map(
              (vaga) =>
                normalizar(
                  vaga.unidade
                )
            )
            .filter(Boolean)
        ).size;

      const baseIndicadores =
        admitidos;

      const jovemAprendiz =
        quantidadePorIndicador(
          baseIndicadores,
          "APRENDIZ"
        );

      const pcd =
        quantidadePorIndicador(
          baseIndicadores,
          "PCD"
        );

      const inventario =
        quantidadePorIndicador(
          baseIndicadores,
          "INVENTARIO"
        );

      const adm =
        quantidadePorIndicador(
          baseIndicadores,
          "ADM"
        );

      return {
        demandaAcumulada,
        contratacoesEfetivadas,
        vagasPendentes,
        unidadesEstaveis,
        jovemAprendiz,
        pcd,
        inventario,
        adm,
      };
    }, [vagas, admitidos]);

  return (
    <section className="resumo">
      <div className="card vermelho">
        <span>
          Demanda Acumulada
        </span>

        <strong>
          {
            indicadores.demandaAcumulada
          }
        </strong>
      </div>

      <div className="card azul">
        <span>
          Contratações Efetivadas
        </span>

        <strong>
          {
            indicadores.contratacoesEfetivadas
          }
        </strong>
      </div>

      <div className="card verde">
        <span>
          Vagas Pendentes
        </span>

        <strong>
          {
            indicadores.vagasPendentes
          }
        </strong>
      </div>

      <div className="card cinza">
        <span>
          Unidades Estáveis
        </span>

        <strong>
          {
            indicadores.unidadesEstaveis
          }
        </strong>
      </div>

      <div className="mini-indicadores">
        <div className="mini-card">
          <span>
            Jovem Aprendiz
          </span>

          <strong className="numero-ja">
            {
              indicadores.jovemAprendiz
            }
          </strong>
        </div>

        <div className="mini-card">
          <span>
            PCD
          </span>

          <strong className="numero-pcd">
            {
              indicadores.pcd
            }
          </strong>
        </div>

        <div className="mini-card">
          <span>
            Inventário
          </span>

          <strong className="numero-inv">
            {
              indicadores.inventario
            }
          </strong>
        </div>

        <div className="mini-card">
          <span>
            ADM
          </span>

          <strong className="numero-adm">
            {
              indicadores.adm
            }
          </strong>
        </div>
      </div>
    </section>
  );
}

export default Cards;
