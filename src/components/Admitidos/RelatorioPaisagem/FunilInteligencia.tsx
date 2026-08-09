import { useEffect, useState } from "react";

import {
  carregarMetricasRecrutamento,
  CHAVE_METRICAS_RECRUTAMENTO,
  EVENTO_METRICAS_RECRUTAMENTO,
} from "../../../Services/recrutamentoMetricasService";

const CORES_FUNIL = [
  "#0057b8",
  "#0ea5e9",
  "#16a34a",
  "#f97316",
  "#0f766e",
  "#7c3aed",
];

export default function FunilInteligencia() {
  const [metricas, setMetricas] = useState(carregarMetricasRecrutamento);

  useEffect(() => {
    const atualizar = () => setMetricas(carregarMetricasRecrutamento());
    const atualizarOutraAba = (evento: StorageEvent) => {
      if (evento.key === CHAVE_METRICAS_RECRUTAMENTO) {
        atualizar();
      }
    };

    window.addEventListener(EVENTO_METRICAS_RECRUTAMENTO, atualizar);
    window.addEventListener("storage", atualizarOutraAba);

    return () => {
      window.removeEventListener(EVENTO_METRICAS_RECRUTAMENTO, atualizar);
      window.removeEventListener("storage", atualizarOutraAba);
    };
  }, []);

  const funil = metricas.funil.map((item, indice) => ({
    ...item,
    cor: CORES_FUNIL[indice] ?? "#0057b8",
  }));
  const maiorValor = Math.max(
    1,
    ...funil.map((item) => Number(item.valor || 0)),
  );
  return (
    <section className="rpaisagem-inteligencia">
      <h2>Funil de Recrutamento</h2>
      <article className="rpaisagem-funil-card">
        <div className="rpaisagem-funil-pontas">
          {funil.map((item, indice) => {
            const altura = `${Math.max(8, Math.round((item.valor / maiorValor) * 46))}px`;

            return (
              <div className="rpaisagem-funil-etapa" key={item.nome}>
                <strong>{item.valor}</strong>
                <i
                  aria-hidden="true"
                  className="rpaisagem-funil-barra"
                  style={{
                    backgroundColor: item.cor,
                    height: altura,
                  }}
                />
                <span>{item.nome}</span>
                {indice < funil.length - 1 ? (
                  <em aria-hidden="true" className="rpaisagem-funil-seta" />
                ) : null}
              </div>
            );
          })}
        </div>
      </article>
    </section>
  );
}
