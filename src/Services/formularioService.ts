type StatusFormulario =
  | "RECEBIDA"
  | "PROCESSANDO"
  | "CADASTRADA";

type FormularioSalvo = {
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

export function listarFormularios(): FormularioSalvo[] {
  try {
    const dados =
      localStorage.getItem(
        CHAVE_FORMULARIOS
      );

    if (!dados) {
      return [];
    }

    const lista = JSON.parse(dados);

    return Array.isArray(lista)
      ? lista
      : [];
  } catch {
    return [];
  }
}

export function salvarFormulario(
  formulario: FormularioSalvo
): FormularioSalvo {
  const lista =
    listarFormularios();

  const novaLista = [
    formulario,
    ...lista.filter(
      (item) =>
        item.id !== formulario.id
    ),
  ];

  localStorage.setItem(
    CHAVE_FORMULARIOS,
    JSON.stringify(novaLista)
  );

  return formulario;
}

export function atualizarStatus(
  id: string,
  status: StatusFormulario
) {
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
) {
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