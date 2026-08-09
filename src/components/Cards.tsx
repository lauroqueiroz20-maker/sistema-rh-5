import {
  useMemo,
  useState,
} from "react";

import { type Vaga } from "../data/vagas";

interface CardsProps {
  vagas: Vaga[];
  vagasAbertas?: Vaga[];
  admitidos?: Vaga[];
}

type ModalResumo =
  | "contratacoes"
  | "pendentes"
  | "estaveis";

type UnidadeResumo = {
  unidade: string;
  quantidade: number;
};

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

function agruparPorUnidade(
  vagas: Vaga[],
  calcular: (vaga: Vaga) => number
): UnidadeResumo[] {
  const agrupamento =
    new Map<string, number>();

  vagas.forEach((vaga) => {
    const quantidade = Math.max(
      0,
      calcular(vaga)
    );

    if (quantidade <= 0) {
      return;
    }

    const unidade =
      String(vaga.unidade || "")
        .trim()
        .toUpperCase() ||
      "UNIDADE NÃO INFORMADA";

    agrupamento.set(
      unidade,
      numeroSeguro(
        agrupamento.get(unidade)
      ) + quantidade
    );
  });

  return Array.from(
    agrupamento.entries()
  )
    .map(([unidade, quantidade]) => ({
      unidade,
      quantidade,
    }))
    .sort((a, b) =>
      a.unidade.localeCompare(
        b.unidade,
        "pt-BR"
      )
    );
}

function Cards({
  vagas,
  vagasAbertas = vagas,
  admitidos = [],
}: CardsProps) {
  const [
    modalResumoAberto,
    setModalResumoAberto,
  ] = useState<ModalResumo | null>(null);

  const indicadores =
    useMemo(() => {
      // Total real da lista oficial de admitidos.
      const totalAdmitidosLista = admitidos.reduce(
        (total, a) => total + Math.max(numeroSeguro(a.admissoes), numeroSeguro(a.quantidade)),
        0
      );

      // Compatibilidade com bases antigas que ainda guardam admissões nas vagas abertas.
      const admissoesVagasAtivas = vagasAbertas.reduce(
        (total, vaga) => total + numeroSeguro(vaga.admissoes),
        0
      );
      const contratacoesEfetivadas =
        admitidos.length > 0
          ? totalAdmitidosLista
          : admissoesVagasAtivas;
      const contratacoesPorUnidade =
        admitidos.length > 0
          ? agruparPorUnidade(
              admitidos,
              (vaga) =>
                Math.max(
                  numeroSeguro(vaga.admissoes),
                  numeroSeguro(vaga.quantidade)
                )
            )
          : agruparPorUnidade(
              vagas,
              (vaga) => numeroSeguro(vaga.admissoes)
            );

      // Saldo real das vagas abertas, inclusive admissões parciais.
      const vagasPendentes = vagasAbertas.reduce(
        (total, vaga) =>
          total +
          Math.max(
            numeroSeguro(vaga.quantidade) -
              numeroSeguro(vaga.admissoes),
            0
          ),
        0
      );

      // Demanda acumulada = admitidos + saldo pendente.
      const demandaAcumulada =
        contratacoesEfetivadas + vagasPendentes;
      const pendentesPorUnidade =
        agruparPorUnidade(
          vagasAbertas,
          (vaga) =>
            Math.max(
              numeroSeguro(vaga.quantidade) -
                numeroSeguro(vaga.admissoes),
              0
            )
        );

      // ✅ 4. UNIDADES ESTÁVEIS: MANTIDO EXATAMENTE COMO ESTAVA
      const unidadesEstaveisLista =
        Array.from(new Set(
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
                String(vaga.unidade || "")
                  .trim()
                  .toUpperCase()
            )
            .filter(Boolean)
        )).sort((a, b) =>
          a.localeCompare(b, "pt-BR")
        );

      // ✅ TODOS OS MINI INDICADORES: Jovem Aprendiz, PCD, Inventário, ADM — MANTIDOS IGUAIS
      const baseIndicadores =
        admitidos.length > 0 ? admitidos : vagas;

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
        contratacoesPorUnidade,
        vagasPendentes,
        pendentesPorUnidade,
        unidadesEstaveis:
          unidadesEstaveisLista.length,
        unidadesEstaveisLista,
        jovemAprendiz,
        pcd,
        inventario,
        adm,
      };
    }, [vagas, vagasAbertas, admitidos]);

  const dadosModalResumo =
    useMemo(() => {
      if (modalResumoAberto === "contratacoes") {
        return {
          titulo: `Contratações Efetivadas - ${indicadores.contratacoesPorUnidade.length}`,
          total:
            indicadores.contratacoesEfetivadas,
          itens:
            indicadores.contratacoesPorUnidade,
          textoVazio:
            "Nenhuma contratação registrada.",
        };
      }

      if (modalResumoAberto === "pendentes") {
        return {
          titulo: `Vagas Pendentes - ${indicadores.pendentesPorUnidade.length}`,
          total: indicadores.vagasPendentes,
          itens:
            indicadores.pendentesPorUnidade,
          textoVazio:
            "Nenhuma pendência registrada.",
        };
      }

      if (modalResumoAberto === "estaveis") {
        return {
          titulo: "Unidades Estáveis",
          total: indicadores.unidadesEstaveis,
          itens:
            indicadores.unidadesEstaveisLista.map(
              (unidade) => ({
                unidade,
                quantidade: 0,
              })
            ),
          textoVazio:
            "Nenhuma unidade estável.",
        };
      }

      return null;
    }, [modalResumoAberto, indicadores]);

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

      <button
        type="button"
        className="card azul card-clicavel"
        onClick={() =>
          setModalResumoAberto(
            "contratacoes"
          )
        }
        title="Ver contratações por unidade"
      >
        <span>
          Contratações Efetivadas
        </span>

        <strong>
          {
            indicadores.contratacoesEfetivadas
          }
        </strong>
      </button>

      <button
        type="button"
        className="card verde card-clicavel"
        onClick={() =>
          setModalResumoAberto("pendentes")
        }
        title="Ver pendências por unidade"
      >
        <span>
          Vagas Pendentes
        </span>

        <strong>
          {
            indicadores.vagasPendentes
          }
        </strong>
      </button>

      <button
        type="button"
        className="card cinza card-clicavel"
        onClick={() =>
          setModalResumoAberto("estaveis")
        }
        title="Ver unidades estáveis"
      >
        <span>
          Unidades Estáveis
        </span>

        <strong>
          {
            indicadores.unidadesEstaveis
          }
        </strong>
      </button>

      {dadosModalResumo && (
        <div
          className="modal-indicador-fundo"
          onClick={() =>
            setModalResumoAberto(null)
          }
        >
          <div
            className={`modal-indicador ${
              modalResumoAberto === "estaveis"
                ? "verde"
                : "azul"
            }`}
            onClick={(evento) =>
              evento.stopPropagation()
            }
          >
            <div className="modal-indicador-cabecalho">
              <div>
                <span>Indicador</span>
                <h3>{dadosModalResumo.titulo}</h3>
              </div>

              <button
                type="button"
                className="modal-indicador-fechar"
                onClick={() =>
                  setModalResumoAberto(null)
                }
                title="Fechar"
              >
                ×
              </button>
            </div>

            <div className="modal-indicador-conteudo">
              {dadosModalResumo.itens.length >
              0 ? (
                dadosModalResumo.itens.map(
                  (item) => (
                    <div
                      className="modal-indicador-unidade"
                      key={item.unidade}
                    >
                      <span>{item.unidade}</span>
                      <strong>
                        {modalResumoAberto ===
                        "estaveis"
                          ? "Estável"
                          : item.quantidade}
                      </strong>
                    </div>
                  )
                )
              ) : (
                <div className="modal-indicador-vazio">
                  {dadosModalResumo.textoVazio}
                </div>
              )}
            </div>

            <div className="modal-indicador-total">
              <span>Total</span>
              <strong>
                {dadosModalResumo.total}
              </strong>
            </div>
          </div>
        </div>
      )}

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
