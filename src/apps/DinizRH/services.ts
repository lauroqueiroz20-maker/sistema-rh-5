import gestoresIniciais, {
  type Gestor,
} from "../../data/gestores";

import type {
  GestorPortal,
} from "./types";

const CHAVE_GESTORES =
  "sistema-rh-gestores";

type GestorEditavel = Gestor & {
  nome?: string;
  gerente?: string;
  telefone?: string;
  whatsapp?: string;
  contato?: string;
  ativo?: boolean;
};

function normalizarCodigo(
  valor: unknown
) {
  return String(
    valor ?? ""
  )
    .trim()
    .toUpperCase();
}

function somenteNumeros(
  valor: unknown
) {
  return normalizarCodigo(
    valor
  ).replace(/\D/g, "");
}

function obterNomeGestor(
  gestor: Gestor
): string {
  const dados =
    gestor as GestorEditavel;

  return String(
    dados.nome ||
      dados.gerente ||
      ""
  ).trim();
}

function obterAtivo(
  gestor: Gestor
) {
  const dados =
    gestor as GestorEditavel;

  return dados.ativo !== false;
}

function converterGestor(
  gestor: Gestor
): GestorPortal {
  return {
    codigo:
      normalizarCodigo(
        gestor.codigo
      ),
    nome:
      obterNomeGestor(
        gestor
      ),
    unidade:
      String(
        gestor.unidade || ""
      ).trim(),
    ativo:
      obterAtivo(
        gestor
      ),
  };
}

function converterLista(
  lista: Gestor[]
): GestorPortal[] {
  return lista
    .map(
      converterGestor
    )
    .filter(
      (gestor) =>
        Boolean(
          gestor.codigo
        ) &&
        Boolean(
          gestor.unidade
        )
    );
}

function carregarGestoresSalvos():
  GestorPortal[] {
  try {
    const dadosSalvos =
      localStorage.getItem(
        CHAVE_GESTORES
      );

    if (!dadosSalvos) {
      return converterLista(
        gestoresIniciais
      );
    }

    const dadosConvertidos:
      unknown =
      JSON.parse(
        dadosSalvos
      );

    if (
      !Array.isArray(
        dadosConvertidos
      )
    ) {
      return converterLista(
        gestoresIniciais
      );
    }

    const gestoresSalvos =
      converterLista(
        dadosConvertidos as Gestor[]
      );

    if (
      gestoresSalvos.length ===
      0
    ) {
      return converterLista(
        gestoresIniciais
      );
    }

    return gestoresSalvos;
  } catch {
    return converterLista(
      gestoresIniciais
    );
  }
}

export function listarGestores():
  GestorPortal[] {
  return carregarGestoresSalvos()
    .filter(
      (gestor) =>
        gestor.ativo
    )
    .sort((a, b) =>
      a.unidade.localeCompare(
        b.unidade,
        "pt-BR"
      )
    );
}

export function buscarGestor(
  codigo: string
):
  | GestorPortal
  | undefined {
  const codigoNormalizado =
    normalizarCodigo(
      codigo
    );

  const numerosCodigo =
    somenteNumeros(
      codigoNormalizado
    );

  const gestores =
    carregarGestoresSalvos();

  const gestorExato =
    gestores.find(
      (gestor) =>
        normalizarCodigo(
          gestor.codigo
        ) ===
        codigoNormalizado
    );

  if (gestorExato) {
    return gestorExato;
  }

  if (numerosCodigo) {
    const gestorPorNumero =
      gestores.find(
        (gestor) =>
          somenteNumeros(
            gestor.codigo
          ) ===
          numerosCodigo
      );

    if (gestorPorNumero) {
      return gestorPorNumero;
    }
  }

  return undefined;
}

export function obterCodigoGestorPeloLink():
  string {
  const parametros =
    new URLSearchParams(
      window.location.search
    );

  return normalizarCodigo(
    parametros.get(
      "gestor"
    ) ||
      parametros.get(
        "codigo"
      ) ||
      ""
  );
}