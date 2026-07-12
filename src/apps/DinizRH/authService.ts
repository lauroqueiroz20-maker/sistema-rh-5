import type {
  Session,
} from "@supabase/supabase-js";

import {
  supabase,
} from "./supabase";

const DOMINIO_AUTH =
  "dinizrh.com.br";

export type PerfilAcesso =
  | "ADMIN"
  | "GESTOR";

export type UsuarioAcesso = {
  perfil: PerfilAcesso;
  codigoGestor?: string;
  email: string;
};

export type AuthResultado = {
  session: Session | null;
  aviso?: string;
};

export function emailAdminTatyana() {
  return "tatyanatravassos@gmail.com";
}

export function emailGestor(
  codigoGestor: string
) {
  const codigo =
    codigoGestor
      .trim()
      .padStart(3, "0");

  if (codigo === "000") {
    return emailAdminTatyana();
  }

  return `gestor-${codigo}@${DOMINIO_AUTH}`;
}

export function obterUsuarioAcesso(
  session: Session | null
): UsuarioAcesso | null {
  if (!session?.user.email) {
    return null;
  }

  const metadados =
    session.user.user_metadata ??
    {};

  const perfil =
    metadados.perfil;

  const codigoGestor =
    metadados.codigoGestor;

  if (
    perfil !== "ADMIN" &&
    perfil !== "GESTOR"
  ) {
    return null;
  }

  return {
    perfil,
    codigoGestor:
      typeof codigoGestor ===
      "string"
        ? codigoGestor
        : undefined,
    email: session.user.email,
  };
}

export async function entrarComSenha(
  email: string,
  senha: string
): Promise<AuthResultado> {
  const { data, error } =
    await supabase.auth
      .signInWithPassword({
        email,
        password: senha,
      });

  if (error) {
    throw new Error(error.message);
  }

  return {
    session: data.session,
  };
}

export async function criarSenha(
  email: string,
  senha: string,
  perfil: PerfilAcesso,
  codigoGestor?: string
): Promise<AuthResultado> {
  const { data, error } =
    await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          perfil,
          codigoGestor,
        },
      },
    });

  if (error) {
    throw new Error(error.message);
  }

  return {
    session: data.session,
    aviso: data.session
      ? undefined
      : "Conta criada. Abra o e-mail e confirme o acesso.",
  };
}

export async function entrarGestorAnonimo(
  codigoGestor: string
): Promise<AuthResultado> {
  const { data, error } =
    await supabase.auth
      .signInAnonymously({
        options: {
          data: {
            perfil: "GESTOR",
            codigoGestor,
          },
        },
      });

  if (error) {
    throw new Error(error.message);
  }

  return {
    session: data.session,
  };
}

export async function sair() {
  await supabase.auth.signOut();
}
