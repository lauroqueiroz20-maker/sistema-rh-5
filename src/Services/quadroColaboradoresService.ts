export type QuadroColaboradores = {
  operacionais: number;
  gestores: number;
  diretoria: number;
  rh: number;
  dp: number;
};

export const CHAVE_QUADRO_COLABORADORES =
  "rh-pratico-comercial-quadro-colaboradores";

export const EVENTO_QUADRO_COLABORADORES =
  "rh-pratico-quadro-colaboradores-atualizado";

export const QUADRO_COLABORADORES_VAZIO: QuadroColaboradores = {
  operacionais: 0,
  gestores: 0,
  diretoria: 0,
  rh: 0,
  dp: 0,
};

function numeroSeguro(valor: unknown) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.max(0, numero) : 0;
}

export function carregarQuadroColaboradores(): QuadroColaboradores {
  try {
    const dados = JSON.parse(
      localStorage.getItem(CHAVE_QUADRO_COLABORADORES) || "{}",
    ) as Partial<QuadroColaboradores>;

    return {
      operacionais: numeroSeguro(dados.operacionais),
      gestores: numeroSeguro(dados.gestores),
      diretoria: numeroSeguro(dados.diretoria),
      rh: numeroSeguro(dados.rh),
      dp: numeroSeguro(dados.dp),
    };
  } catch {
    return { ...QUADRO_COLABORADORES_VAZIO };
  }
}

export function salvarQuadroColaboradores(
  quadro: QuadroColaboradores,
) {
  const dadosNormalizados: QuadroColaboradores = {
    operacionais: numeroSeguro(quadro.operacionais),
    gestores: numeroSeguro(quadro.gestores),
    diretoria: numeroSeguro(quadro.diretoria),
    rh: numeroSeguro(quadro.rh),
    dp: numeroSeguro(quadro.dp),
  };

  localStorage.setItem(
    CHAVE_QUADRO_COLABORADORES,
    JSON.stringify(dadosNormalizados),
  );
  window.dispatchEvent(new Event(EVENTO_QUADRO_COLABORADORES));
}

export function totalQuadroColaboradores(
  quadro: QuadroColaboradores,
) {
  return (
    quadro.operacionais +
    quadro.gestores +
    quadro.diretoria +
    quadro.rh +
    quadro.dp
  );
}
