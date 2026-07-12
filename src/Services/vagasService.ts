import type { Vaga } from "../data/vagas";

export function listarVagasAtivas(vagas: Vaga[]): Vaga[] {
  return vagas.filter((vaga) => vaga.ativo);
}

export function calcularTotalSolicitacoes(vagas: Vaga[]): number {
  return listarVagasAtivas(vagas).reduce(
    (total, vaga) => total + vaga.quantidade,
    0
  );
}

export function calcularTotalAdmissoes(vagas: Vaga[]): number {
  return vagas.reduce(
    (total, vaga) => total + vaga.admissoes,
    0
  );
}

export function calcularTotalPendentes(vagas: Vaga[]): number {
  return listarVagasAtivas(vagas).reduce(
    (total, vaga) =>
      total +
      Math.max(
        vaga.quantidade - vaga.admissoes,
        0
      ),
    0
  );
}

function normalizar(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

export function calcularTotalPorTipo(vagas: Vaga[], tipo: string): number {
  const tipoNormalizado = normalizar(tipo);

  return listarVagasAtivas(vagas)
    .filter((vaga) => {
      const tipoVaga = normalizar(vaga.tipo);
      const cargoVaga = normalizar(vaga.cargo);

      return (
        tipoVaga.includes(tipoNormalizado) ||
        cargoVaga.includes(tipoNormalizado)
      );
    })
    .reduce((total, vaga) => total + vaga.quantidade, 0);
}
