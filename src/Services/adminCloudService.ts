import type {
  Vaga,
} from "../data/vagas";
import type {
  RegistroAdmitido,
} from "../components/Admitidos/Admitidos";
import {
  supabase,
} from "../apps/DinizRH/supabase";
import type {
  MetricasRecrutamento,
} from "./recrutamentoMetricasService";

const ESTADO_ID = "principal";

type AppStateRegistro = {
  id: string;
  key?: string;
  dados: EstadoAdmin;
  atualizado_em: string;
};

type AppStateLeitura = {
  dados: unknown;
  atualizado_em: string | null;
};

export type EstadoAdmin = {
  vagas: Vaga[];
  admitidos: RegistroAdmitido[];
  ciclo: {
    inicio: string;
    fim: string;
  };
  metricasRecrutamento?: MetricasRecrutamento;
  armazenamentoLocal?: Record<string, string>;
  atualizadoEm: string;
};

function chavePermitida(chave: string) {
  const normalizada = chave.toLowerCase();
  const chaveDoSistema =
    normalizada.startsWith("sistema-rh-") ||
    normalizada.startsWith("rh-diniz-") ||
    normalizada.startsWith("diniz-rh-") ||
    normalizada === "respostasgestores";

  return chaveDoSistema &&
    !normalizada.includes("senha") &&
    !normalizada.includes("auth") &&
    !normalizada.includes("token");
}

export function capturarArmazenamentoLocal() {
  const dados: Record<string, string> = {};

  for (let indice = 0; indice < localStorage.length; indice += 1) {
    const chave = localStorage.key(indice);
    if (!chave || !chavePermitida(chave)) continue;
    const valor = localStorage.getItem(chave);
    if (valor !== null) dados[chave] = valor;
  }

  return dados;
}

export function aplicarArmazenamentoLocal(dados?: Record<string, string>) {
  if (!dados) return false;
  let alterado = false;

  Object.entries(dados).forEach(([chave, valor]) => {
    if (!chavePermitida(chave) || localStorage.getItem(chave) === valor) return;
    localStorage.setItem(chave, valor);
    alterado = true;
  });

  return alterado;
}

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
      .select("dados, atualizado_em")
      .eq("id", ESTADO_ID)
      .maybeSingle<AppStateLeitura>();

  if (error || !data) {
    return null;
  }

  const dados =
    data.dados;

  if (!isEstadoAdmin(dados)) {
    return null;
  }

  return {
    ...dados,
    atualizadoEm:
      data.atualizado_em ??
      dados.atualizadoEm,
  };
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
    key: ESTADO_ID,
    dados,
    atualizado_em:
      dados.atualizadoEm,
  };

  const { data: existente, error: erroBusca } =
    await supabase
      .from("app_state")
      .select("id, dados")
      .eq("id", ESTADO_ID)
      .maybeSingle<{ id: string; dados: Partial<EstadoAdmin> }>();

  if (erroBusca) {
    throw new Error(erroBusca.message);
  }

  const dadosCompletos: EstadoAdmin = {
    ...existente?.dados,
    ...dados,
  };

  const operacao = existente
    ? supabase
        .from("app_state")
        .update({
          key: registro.key,
          dados: dadosCompletos,
          atualizado_em:
            registro.atualizado_em,
        })
        .eq("id", ESTADO_ID)
    : supabase
        .from("app_state")
        .insert(registro);

  const { error } = await operacao;

  if (error) {
    throw new Error(error.message);
  }
}

export async function salvarBackupCompletoAdmin() {
  const estado = await carregarEstadoAdmin();
  if (!estado) throw new Error("Estado principal não localizado.");

  await salvarEstadoAdmin({
    vagas: estado.vagas,
    admitidos: estado.admitidos,
    ciclo: estado.ciclo,
    metricasRecrutamento: estado.metricasRecrutamento,
    armazenamentoLocal: capturarArmazenamentoLocal(),
  });
}


