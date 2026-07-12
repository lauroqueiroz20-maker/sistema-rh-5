import type { Vaga } from "../data/vagas";

const CHAVE_VAGAS = "rh-diniz-vagas-pdf-20260710-v4";
const CHAVE_CICLO = "rh-diniz-ciclo";

function vagasValidas(vagas: unknown): vagas is Vaga[] {
  return Array.isArray(vagas);
}

function recuperarVagasSalvas(
  vagas: Vaga[],
  vagasIniciais: Vaga[]
): Vaga[] {
  if (
    vagas.length === 0 &&
    vagasIniciais.length > 0
  ) {
    localStorage.setItem(
      CHAVE_VAGAS,
      JSON.stringify(vagasIniciais)
    );

    return vagasIniciais;
  }

  return vagas;
}

export function carregarCiclo<T>(cicloPadrao: T): T {
  try {
    const cicloSalvo = localStorage.getItem(CHAVE_CICLO);

    if (!cicloSalvo) {
      localStorage.setItem(CHAVE_CICLO, JSON.stringify(cicloPadrao));
      return cicloPadrao;
    }

    return JSON.parse(cicloSalvo) as T;
  } catch {
    return cicloPadrao;
  }
}

export function salvarCiclo<T>(ciclo: T) {
  localStorage.setItem(CHAVE_CICLO, JSON.stringify(ciclo));
}

export function carregarVagas(vagasIniciais: Vaga[]): Vaga[] {
  try {
    const salvo = localStorage.getItem(CHAVE_VAGAS);

    if (!salvo) {
      localStorage.setItem(CHAVE_VAGAS, JSON.stringify(vagasIniciais));
      return vagasIniciais;
    }

    const dados: unknown = JSON.parse(salvo);

    if (vagasValidas(dados)) {
      return recuperarVagasSalvas(
        dados,
        vagasIniciais
      );
    }

    if (
      typeof dados === "object" &&
      dados !== null &&
      "vagas" in dados &&
      vagasValidas(dados.vagas)
    ) {
      return recuperarVagasSalvas(
        dados.vagas,
        vagasIniciais
      );
    }

    return vagasIniciais;
  } catch {
    return vagasIniciais;
  }
}

export function salvarVagas(vagas: Vaga[]) {
  localStorage.setItem(CHAVE_VAGAS, JSON.stringify(vagas));
}
