import unidades from "../data/unidades";

export function listarUnidades() {
  return unidades;
}

export function totalColaboradores() {
  return unidades.reduce(
    (total, unidade) => total + unidade.colaboradores,
    0
  );
}

export function buscarUnidade(nome: string) {
  return unidades.find(
    (unidade) => unidade.nome.toUpperCase() === nome.toUpperCase()
  );
}