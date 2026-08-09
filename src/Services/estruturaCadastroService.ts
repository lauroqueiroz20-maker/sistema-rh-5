export type ItemEstruturaCadastro = {
  id: string;
  codigoUnidade: string;
  unidade: string;
  tipo: string;
  cargo: string;
  setor: string;
};

export const CHAVE_ESTRUTURA_CADASTRO =
  "rh-pratico-comercial-estrutura-cadastro";

export const EVENTO_ESTRUTURA_CADASTRO =
  "rh-pratico-estrutura-cadastro-atualizada";

function texto(valor: unknown) {
  return String(valor || "").trim().toUpperCase();
}

function itemValido(valor: unknown): valor is ItemEstruturaCadastro {
  if (typeof valor !== "object" || valor === null) {
    return false;
  }

  const item = valor as Partial<ItemEstruturaCadastro>;
  return (
    typeof item.id === "string" &&
    typeof item.codigoUnidade === "string" &&
    typeof item.unidade === "string" &&
    typeof item.tipo === "string" &&
    typeof item.cargo === "string" &&
    typeof item.setor === "string"
  );
}

function inferirTipoPadrao(cargo: string) {
  const nome = texto(cargo);

  if (nome.includes("APRENDIZ")) return "J. APRENDIZ";
  if (
    nome.includes("GERENTE") ||
    nome.includes("COORDENADOR") ||
    nome.includes("SUPERVISOR")
  ) {
    return "LIDERANÇA";
  }
  if (nome.includes("ADMINISTRATIVO") || nome.includes("ANALISTA")) {
    return "ADMINISTRATIVO";
  }

  return "OPERACIONAL";
}

function criarEstruturaPadrao(): ItemEstruturaCadastro[] {
  return unidadesPadrao.flatMap((unidade) =>
    cargosPadrao
      .filter((cargo) => cargo.ativo)
      .map((cargo) => ({
        id: `padrao-${unidade.codigo}-${cargo.id}`,
        codigoUnidade: unidade.codigo,
        unidade: unidade.nome,
        tipo: inferirTipoPadrao(cargo.cargo),
        cargo: cargo.cargo,
        setor: cargo.setor,
      })),
  );
}

export function carregarEstruturaCadastro(): ItemEstruturaCadastro[] {
  try {
    const dadosSalvos = localStorage.getItem(CHAVE_ESTRUTURA_CADASTRO);

    if (!dadosSalvos) {
      return criarEstruturaPadrao();
    }

    const dados = JSON.parse(dadosSalvos) as unknown;

    const itens = Array.isArray(dados) ? dados.filter(itemValido) : [];
    const itensNormalizados = itens.map((item) =>
      item.codigoUnidade === "014" && texto(item.unidade) === "TESTE"
        ? { ...item, unidade: "LAZULI" }
        : item
    );

    if (JSON.stringify(itensNormalizados) !== JSON.stringify(itens)) {
      localStorage.setItem(
        CHAVE_ESTRUTURA_CADASTRO,
        JSON.stringify(itensNormalizados),
      );
    }

    return itensNormalizados;
  } catch {
    return [];
  }
}

export function salvarEstruturaCadastro(
  itens: ItemEstruturaCadastro[],
) {
  localStorage.setItem(
    CHAVE_ESTRUTURA_CADASTRO,
    JSON.stringify(itens),
  );
  window.dispatchEvent(new Event(EVENTO_ESTRUTURA_CADASTRO));
}

export function criarItemEstruturaCadastro(
  dados: Omit<ItemEstruturaCadastro, "id">,
): ItemEstruturaCadastro {
  return {
    id: crypto.randomUUID(),
    codigoUnidade: texto(dados.codigoUnidade).padStart(3, "0"),
    unidade: texto(dados.unidade),
    tipo: texto(dados.tipo),
    cargo: texto(dados.cargo),
    setor: texto(dados.setor),
  };
}

export function listarUnidadesConfiguradas() {
  const unidades = new Map<string, string>();

  carregarEstruturaCadastro().forEach((item) => {
    unidades.set(item.codigoUnidade, item.unidade);
  });

  return Array.from(unidades.entries())
    .map(([codigo, nome]) => ({ codigo, nome, colaboradores: 0 }))
    .sort((a, b) => a.codigo.localeCompare(b.codigo));
}

export function listarTiposConfigurados() {
  return Array.from(
    new Set(carregarEstruturaCadastro().map((item) => item.tipo)),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function listarCargosConfigurados() {
  const cargos = new Map<string, { cargo: string; setor: string }>();

  carregarEstruturaCadastro().forEach((item) => {
    cargos.set(`${item.cargo}|${item.setor}`, {
      cargo: item.cargo,
      setor: item.setor,
    });
  });

  return Array.from(cargos.values())
    .map((item, indice) => ({
      id: indice + 1,
      ...item,
      ativo: true,
    }))
    .sort((a, b) => a.cargo.localeCompare(b.cargo, "pt-BR"));
}
import cargosPadrao from "../data/cargos";
import unidadesPadrao from "../data/unidades";
