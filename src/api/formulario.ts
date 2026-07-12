export type StatusFormulario =
  | "RECEBIDA"
  | "PROCESSANDO"
  | "CADASTRADA";

export type SolicitacaoFormulario = {
  id: string;
  codigoGestor: string;
  gestor: string;
  unidade: string;
  tipo: string;
  cargo: string;
  quantidade: number;
  turno: string;
  motivo: string;
  emergencia: string;
  observacao: string;
  data: string;
  status: StatusFormulario;
};

const CHAVE_FORMULARIOS =
  "rh-formularios";

export function gerarId(): string {
  return crypto.randomUUID();
}

function isFormulario(
  valor: unknown
): valor is SolicitacaoFormulario {
  if (
    typeof valor !== "object" ||
    valor === null
  ) {
    return false;
  }

  const formulario =
    valor as Partial<SolicitacaoFormulario>;

  return (
    typeof formulario.id === "string" &&
    typeof formulario.codigoGestor === "string" &&
    typeof formulario.gestor === "string" &&
    typeof formulario.unidade === "string" &&
    typeof formulario.tipo === "string" &&
    typeof formulario.cargo === "string" &&
    typeof formulario.quantidade === "number" &&
    typeof formulario.turno === "string" &&
    typeof formulario.motivo === "string" &&
    typeof formulario.emergencia === "string" &&
    typeof formulario.observacao === "string" &&
    typeof formulario.data === "string" &&
    (
      formulario.status === "RECEBIDA" ||
      formulario.status === "PROCESSANDO" ||
      formulario.status === "CADASTRADA"
    )
  );
}

export function listarFormularios(): SolicitacaoFormulario[] {
  try {
    const dados =
      localStorage.getItem(
        CHAVE_FORMULARIOS
      );

    if (!dados) {
      return [];
    }

    const lista: unknown =
      JSON.parse(dados);

    return Array.isArray(lista)
      ? lista.filter(isFormulario)
      : [];
  } catch {
    return [];
  }
}

export function salvarFormulario(
  formulario: SolicitacaoFormulario
): SolicitacaoFormulario {
  const lista =
    listarFormularios();

  localStorage.setItem(
    CHAVE_FORMULARIOS,
    JSON.stringify([
      formulario,
      ...lista.filter(
        (item) =>
          item.id !== formulario.id
      ),
    ])
  );

  return formulario;
}

export function atualizarStatus(
  id: string,
  status: SolicitacaoFormulario["status"]
): void {
  const lista =
    listarFormularios();

  const novaLista =
    lista.map((item) =>
      item.id === id
        ? {
            ...item,
            status,
          }
        : item
    );

  localStorage.setItem(
    CHAVE_FORMULARIOS,
    JSON.stringify(novaLista)
  );
}

export function removerFormulario(
  id: string
): void {
  const lista =
    listarFormularios();

  const novaLista =
    lista.filter(
      (item) => item.id !== id
    );

  localStorage.setItem(
    CHAVE_FORMULARIOS,
    JSON.stringify(novaLista)
  );
}
