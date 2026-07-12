import unidadesDetalhes from "../data/unidadesDetalhes";

export function buscarDetalhesUnidade(nome: string) {
  return unidadesDetalhes[nome as keyof typeof unidadesDetalhes] || null;
}