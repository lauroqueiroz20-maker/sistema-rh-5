import type {
  Vaga,
} from "../data/vagas";
import type {
  RegistroAdmitido,
} from "../components/Admitidos/Admitidos";
import {
  supabase,
} from "../apps/DinizRH/supabase";

const ESTADO_ID = "principal";

type AppStateRegistro = {
  id: string;
  key?: string;
  dados: EstadoAdmin;
  atualizado_em: string;
};

export type EstadoAdmin = {
  vagas: Vaga[];
  admitidos: RegistroAdmitido[];
  ciclo: {
    inicio: string;
    fim: string;
  };
  atualizadoEm: string;
};

function isEstadoAdmin(
  valor: unknown
): valor is EstadoAdmin {
  if (
    typeof valor !== "object" ||
    valor === null
  ) {
    return false;
  }

  const estado =
    valor as Partial<EstadoAdmin>;

  return (
    Array.isArray(estado.vagas) &&
    Array.isArray(estado.admitidos) &&
    typeof estado.ciclo ===
      "object" &&
    estado.ciclo !== null
  );
}

export async function carregarEstadoAdmin():
  Promise<EstadoAdmin | null> {
  const { data, error } =
    await supabase
      .from("app_state")
      .select("dados")
      .eq("id", ESTADO_ID)
      .maybeSingle();

  if (error || !data) {
    return null;
  }

  const dados =
    data.dados as unknown;

  return isEstadoAdmin(dados)
    ? dados
    : null;
}

export async function salvarEstadoAdmin(
  estado: Omit<
    EstadoAdmin,
    "atualizadoEm"
  >
) {
  const dados: EstadoAdmin = {
    ...estado,
    atualizadoEm:
      new Date().toISOString(),
  };

  const registro: AppStateRegistro = {
    id: ESTADO_ID,
    dados,
    atualizado_em:
      dados.atualizadoEm,
  };

  const { error } = await supabase
    .from("app_state")
    .upsert(registro);

  if (
    error &&
    error.message.includes(
      'null value in column "key"'
    )
  ) {
    const { error: erroComChave } =
      await supabase
        .from("app_state")
        .upsert({
          ...registro,
          key: ESTADO_ID,
        });

    if (erroComChave) {
      throw new Error(
        erroComChave.message
      );
    }

    return;
  }

  if (error) {
    throw new Error(error.message);
  }
}
