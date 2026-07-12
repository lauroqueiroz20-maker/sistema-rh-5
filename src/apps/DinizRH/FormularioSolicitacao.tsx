import {
  useMemo,
  useState,
} from "react";

import cargos from "../../data/cargos";
import emergencias from "./emergencias";
import motivos from "./motivos";
import tipos from "./tipos";
import turnos from "./turnos";

import {
  gerarId,
} from "./utils";

import type {
  Emergencia,
  ItemSolicitacao,
} from "./types";

interface FormularioSolicitacaoProps {
  onEnviar: (
    itens: ItemSolicitacao[],
    totalVagas: number
  ) => void;
}

function FormularioSolicitacao({
  onEnviar,
}: FormularioSolicitacaoProps) {
  const [tipo, setTipo] =
    useState(
      tipos[0] || ""
    );

  const [cargo, setCargo] =
    useState("");

  const [
    quantidade,
    setQuantidade,
  ] = useState(1);

  const [turno, setTurno] =
    useState(
      turnos[0] || ""
    );

  const [motivo, setMotivo] =
    useState(
      motivos[0] || ""
    );

  const [
    emergencia,
    setEmergencia,
  ] = useState<Emergencia>(
    "NÃO"
  );

  const [
    itensSolicitacao,
    setItensSolicitacao,
  ] = useState<
    ItemSolicitacao[]
  >([]);

  const totalVagas =
    useMemo(
      () =>
        itensSolicitacao.reduce(
          (
            total,
            item
          ) =>
            total +
            item.quantidade,
          0
        ),
      [itensSolicitacao]
    );

  function limparCampos() {
    setTipo(
      tipos[0] || ""
    );

    setCargo("");

    setQuantidade(1);

    setTurno(
      turnos[0] || ""
    );

    setMotivo(
      motivos[0] || ""
    );

    setEmergencia("NÃO");
  }

  function adicionarCargo() {
    if (!tipo) {
      alert(
        "Selecione o tipo."
      );

      return;
    }

    if (!cargo) {
      alert(
        "Selecione o cargo."
      );

      return;
    }

    if (
      !Number.isInteger(
        quantidade
      ) ||
      quantidade <= 0
    ) {
      alert(
        "Informe uma quantidade válida."
      );

      return;
    }

    if (!turno) {
      alert(
        "Selecione o turno."
      );

      return;
    }

    if (!motivo) {
      alert(
        "Selecione o motivo."
      );

      return;
    }

    const itemExistente =
      itensSolicitacao.find(
        (item) =>
          item.tipo === tipo &&
          item.cargo === cargo &&
          item.turno ===
            turno &&
          item.motivo ===
            motivo &&
          item.emergencia ===
            emergencia
      );

    if (itemExistente) {
      setItensSolicitacao(
        (listaAtual) =>
          listaAtual.map(
            (item) =>
              item.id ===
              itemExistente.id
                ? {
                    ...item,
                    quantidade:
                      item.quantidade +
                      quantidade,
                  }
                : item
          )
      );
    } else {
      const novoItem:
        ItemSolicitacao = {
        id: gerarId(),
        tipo,
        cargo,
        quantidade,
        turno,
        motivo,
        emergencia,
      };

      setItensSolicitacao(
        (listaAtual) => [
          ...listaAtual,
          novoItem,
        ]
      );
    }

    limparCampos();
  }

  function removerCargo(
    id: string
  ) {
    setItensSolicitacao(
      (listaAtual) =>
        listaAtual.filter(
          (item) =>
            item.id !== id
        )
    );
  }

  function diminuirQuantidade(
    id: string
  ) {
    setItensSolicitacao(
      (listaAtual) =>
        listaAtual.map(
          (item) =>
            item.id === id
              ? {
                  ...item,
                  quantidade:
                    Math.max(
                      1,
                      item.quantidade -
                        1
                    ),
                }
              : item
        )
    );
  }

  function aumentarQuantidade(
    id: string
  ) {
    setItensSolicitacao(
      (listaAtual) =>
        listaAtual.map(
          (item) =>
            item.id === id
              ? {
                  ...item,
                  quantidade:
                    item.quantidade +
                    1,
                }
              : item
        )
    );
  }

  function enviarSolicitacao() {
    if (
      itensSolicitacao.length ===
      0
    ) {
      alert(
        "Adicione pelo menos um cargo."
      );

      return;
    }

    onEnviar(
      itensSolicitacao,
      totalVagas
    );
  }

  return (
    <>
      <section className="diniz-rh-card">
        <h2>
          Nova Solicitação
        </h2>

        <p>
          Preencha os dados da vaga
          e adicione todos os cargos
          necessários.
        </p>

        <div className="diniz-rh-info">
          <div>
            <label>
              Tipo
            </label>

            <select
              className="diniz-rh-select"
              value={tipo}
              onChange={(
                evento
              ) =>
                setTipo(
                  evento.target.value
                )
              }
            >
              {tipos.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label>
              Cargo
            </label>

            <select
              className="diniz-rh-select"
              value={cargo}
              onChange={(
                evento
              ) =>
                setCargo(
                  evento.target.value
                )
              }
            >
              <option value="">
                Selecione
              </option>

              {cargos
                .filter(
                  (cargo) => cargo.ativo
                )
                .map((cargo) => (
                  <option
                    key={cargo.id}
                    value={cargo.cargo}
                  >
                    {cargo.cargo}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label>
              Quantidade
            </label>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "44px 1fr 44px",
                gap: "8px",
              }}
            >
              <button
                type="button"
                className="diniz-rh-botao-quantidade"
                onClick={() =>
                  setQuantidade(
                    Math.max(
                      1,
                      quantidade - 1
                    )
                  )
                }
              >
                −
              </button>

              <input
                type="number"
                min={1}
                className="diniz-rh-input"
                value={quantidade}
                onChange={(
                  evento
                ) =>
                  setQuantidade(
                    Math.max(
                      1,
                      Number(
                        evento.target
                          .value
                      ) || 1
                    )
                  )
                }
                style={{
                  textAlign:
                    "center",
                }}
              />

              <button
                type="button"
                className="diniz-rh-botao-quantidade"
                onClick={() =>
                  setQuantidade(
                    quantidade + 1
                  )
                }
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label>
              Turno
            </label>

            <select
              className="diniz-rh-select"
              value={turno}
              onChange={(
                evento
              ) =>
                setTurno(
                  evento.target.value
                )
              }
            >
              {turnos.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label>
              Motivo
            </label>

            <select
              className="diniz-rh-select"
              value={motivo}
              onChange={(
                evento
              ) =>
                setMotivo(
                  evento.target.value
                )
              }
            >
              {motivos.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label>
              Emergência
            </label>

            <select
              className="diniz-rh-select"
              value={emergencia}
              onChange={(
                evento
              ) =>
                setEmergencia(
                  evento.target
                    .value as Emergencia
                )
              }
            >
              {emergencias.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        <button
          type="button"
          className="diniz-rh-botao diniz-rh-botao-verde"
          onClick={adicionarCargo}
          style={{
            marginTop: "24px",
          }}
        >
          + ADICIONAR CARGO
        </button>
      </section>

      {itensSolicitacao.length >
        0 && (
        <section className="diniz-rh-card">
          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "space-between",
              gap: "12px",
            }}
          >
            <h2>
              Solicitações
            </h2>

            <strong
              style={{
                color:
                  "#005ec4",
              }}
            >
              {totalVagas}{" "}
              {totalVagas === 1
                ? "vaga"
                : "vagas"}
            </strong>
          </div>

          <div
            style={{
              display: "grid",
              gap: "12px",
              marginTop: "18px",
            }}
          >
            {itensSolicitacao.map(
              (item) => (
                <article
                  key={item.id}
                  className="diniz-rh-item-solicitacao"
                >
                  <div>
                    <strong>
                      {item.cargo}
                    </strong>

                    <span>
                      {item.tipo}
                      {" • "}
                      {item.turno}
                      {" • "}
                      {item.motivo}
                      {" • "}
                      Emergência:{" "}
                      {
                        item.emergencia
                      }
                    </span>
                  </div>

                  <div className="diniz-rh-item-acoes">
                    <button
                      type="button"
                      onClick={() =>
                        diminuirQuantidade(
                          item.id
                        )
                      }
                    >
                      −
                    </button>

                    <strong>
                      {
                        item.quantidade
                      }
                    </strong>

                    <button
                      type="button"
                      onClick={() =>
                        aumentarQuantidade(
                          item.id
                        )
                      }
                    >
                      +
                    </button>

                    <button
                      type="button"
                      className="diniz-rh-excluir"
                      onClick={() =>
                        removerCargo(
                          item.id
                        )
                      }
                    >
                      ×
                    </button>
                  </div>
                </article>
              )
            )}
          </div>

          <button
            type="button"
            className="diniz-rh-botao diniz-rh-botao-primario"
            onClick={
              enviarSolicitacao
            }
            style={{
              marginTop: "22px",
            }}
          >
            ENVIAR SOLICITAÇÃO
          </button>
        </section>
      )}
    </>
  );
}

export default FormularioSolicitacao;