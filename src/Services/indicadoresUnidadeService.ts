import type { Vaga } from "../data/vagas";

type VagaIndicador = Vaga & {
  categoria?: string;
};

function normalizarTexto(texto: unknown) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/-/g, " ")
    .toUpperCase()
    .trim();
}

function numero(valor: unknown) {
  return Number(valor || 0);
}

export function calcularIndicadoresUnidade(
  nomeUnidade: string,
  vagas: VagaIndicador[] = []
) {
  const nomeBase = normalizarTexto(nomeUnidade);

  const vagasDaUnidade = vagas.filter((vaga) => {
    const nomeVaga = normalizarTexto(vaga.unidade);

    return (
      nomeVaga === nomeBase ||
      nomeVaga.includes(nomeBase) ||
      nomeBase.includes(nomeVaga)
    );
  });

  const solicitacoes = vagasDaUnidade.reduce(
    (total, vaga) => total + numero(vaga.quantidade),
    0
  );

  const admissoes = vagasDaUnidade.reduce(
    (total, vaga) => total + numero(vaga.admissoes),
    0
  );

  const pendencias = Math.max(solicitacoes - admissoes, 0);

  const pcd = vagasDaUnidade.reduce((total, vaga) => {
    const tipo = normalizarTexto(vaga.tipo || vaga.categoria || "");
    return tipo.includes("PCD") ? total + numero(vaga.quantidade) : total;
  }, 0);

  const jovemAprendiz = vagasDaUnidade.reduce((total, vaga) => {
    const tipo = normalizarTexto(vaga.tipo || vaga.categoria || "");
    return tipo.includes("APRENDIZ") ? total + numero(vaga.quantidade) : total;
  }, 0);

  const adm = vagasDaUnidade.reduce((total, vaga) => {
    const tipo = normalizarTexto(vaga.tipo || vaga.categoria || "");
    return tipo === "ADM" ? total + numero(vaga.quantidade) : total;
  }, 0);

  const inventario = vagasDaUnidade.reduce((total, vaga) => {
    const tipo = normalizarTexto(vaga.tipo || vaga.categoria || "");
    return tipo.includes("INVENTARIO") ? total + numero(vaga.quantidade) : total;
  }, 0);

  const risco =
    pendencias >= 5 ? "Alto" : pendencias >= 2 ? "Médio" : "Baixo";

  return {
    solicitacoes,
    admissoes,
    pendencias,
    pcd,
    jovemAprendiz,
    adm,
    inventario,
    risco,
  };
}
