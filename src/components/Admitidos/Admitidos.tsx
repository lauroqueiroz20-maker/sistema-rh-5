import {
  useMemo,
  useState,
} from "react";

import { type Vaga } from "../../data/vagas";
import "./Admitidos.css";

export type RegistroAdmitido = Vaga & {
  dataAdmissao: string;
};

interface AdmitidosProps {
  admitidos: RegistroAdmitido[];
}

function Admitidos({
  admitidos,
}: AdmitidosProps) {
  const [
    unidadeSelecionada,
    setUnidadeSelecionada,
  ] = useState("");

  const unidades = useMemo(
    () =>
      Array.from(
        new Set(
          admitidos
            .map((registro) =>
              String(
                registro.unidade || ""
              ).trim()
            )
            .filter(Boolean)
        )
      ).sort((a, b) =>
        a.localeCompare(b, "pt-BR")
      ),
    [admitidos]
  );

  const registrosFiltrados = useMemo(
    () =>
      unidadeSelecionada
        ? admitidos.filter(
            (registro) =>
              registro.unidade ===
              unidadeSelecionada
          )
        : admitidos,
    [admitidos, unidadeSelecionada]
  );

  const registrosOrdenados =
    useMemo(
      () =>
        [...registrosFiltrados].sort(
          (a, b) => {
            const porUnidade = String(
              a.unidade || ""
            ).localeCompare(
              String(b.unidade || ""),
              "pt-BR"
            );

            if (porUnidade !== 0) {
              return porUnidade;
            }

            return String(
              a.cargo || ""
            ).localeCompare(
              String(b.cargo || ""),
              "pt-BR"
            );
          }
        ),
      [registrosFiltrados]
    );

  const totalQuantidade =
    registrosOrdenados.reduce(
      (total, registro) =>
        total +
        Math.max(
          Number(
            registro.admissoes ||
              registro.quantidade ||
              0
          ),
          0
        ),
      0
    );

  return (
    <section className="pagina-admitidos">
      <div className="cabecalho-admitidos">
        <div>
          <h2>Colaboradores Admitidos</h2>

          <p>
            Histórico das vagas concluídas por admissão.
          </p>
        </div>

        <strong className="total-admitidos">
          {totalQuantidade}
        </strong>
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
                    setUnidadeSelecionada(
                      evento.target.value
                    )
                  }
                >
                  <option value="">
                    Todas as unidades
                  </option>

                  {unidades.map((unidade) => (
                    <option
                      key={unidade}
                      value={unidade}
                    >
                      {unidade}
                    </option>
                  ))}
                </select>
              </th>
              <th>Tipo</th>
              <th>Cargo</th>
              <th>Qtd.</th>
              <th>Setor</th>
              <th>Turno</th>
              <th>Motivo</th>
              <th>Emerg.</th>
              <th>Data Solicitação</th>
              <th>Data Admissão</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {registrosOrdenados.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="sem-admitidos"
                >
                  Nenhuma admissão registrada.
                </td>
              </tr>
            ) : (
              registrosOrdenados.map(
                (registro) => (
                  <tr
                    key={`${registro.id}-${registro.dataAdmissao}`}
                  >
                    <td>{registro.unidade}</td>
                    <td>{registro.tipo}</td>
                    <td>{registro.cargo}</td>
                    <td>
                      {Math.max(
                        Number(
                          registro.admissoes ||
                            registro.quantidade ||
                            0
                        ),
                        0
                      )}
                    </td>
                    <td>{registro.setor}</td>
                    <td>{registro.turno}</td>
                    <td>{registro.motivo}</td>

                    <td>
                      {registro.emergencia || "NÃO"}
                    </td>

                    <td>03/07/2026</td>

                    <td>
                      {registro.dataAdmissao}
                    </td>

                    <td>
                      <span className="status-admitido">
                        ADMITIDO
                      </span>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default Admitidos;
