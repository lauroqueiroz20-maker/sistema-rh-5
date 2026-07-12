import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import "./gestor.css";

import type {
  Session,
} from "@supabase/supabase-js";

import {
  criarSenha,
  emailAdminTatyana,
  emailGestor,
  entrarGestorAnonimo,
  entrarComSenha,
  obterUsuarioAcesso,
  sair,
  type PerfilAcesso,
} from "./authService";
import {
  supabase,
} from "./supabase";

type AuthGateProps = {
  perfil: PerfilAcesso;
  codigoGestor?: string;
  children: ReactNode;
};

function normalizarCodigo(
  codigo?: string
) {
  return String(codigo || "")
    .trim()
    .padStart(3, "0");
}

function chaveSenhaGestor(
  codigo: string
) {
  return `sistema-rh-senha-gestor-${codigo}`;
}

function AuthGate({
  perfil,
  codigoGestor,
  children,
}: AuthGateProps) {
  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    processando,
    setProcessando,
  ] = useState(false);

  const [senha, setSenha] =
    useState("");

  const [
    mensagem,
    setMensagem,
  ] = useState("");

  const [
    session,
    setSession,
  ] = useState<Session | null>(
    null
  );

  const codigoNormalizado =
    normalizarCodigo(
      codigoGestor
    );

  const email = useMemo(
    () =>
      perfil === "ADMIN"
        ? emailAdminTatyana()
        : emailGestor(
            codigoNormalizado
          ),
    [
      perfil,
      codigoNormalizado,
    ]
  );

  const titulo =
    perfil === "ADMIN"
      ? "Acesso Tatyana"
      : "Acesso do Gestor";

  const subtitulo =
    perfil === "ADMIN"
      ? "Sistema completo RH"
      : `Unidade ${codigoNormalizado}`;

  const usuario =
    obterUsuarioAcesso(session);

  const acessoValido =
    (
      session?.user.email === email ||
      (
        usuario?.perfil === perfil &&
        (
          perfil === "ADMIN" ||
          usuario.codigoGestor ===
            codigoNormalizado
        )
      )
    );

  useEffect(() => {
    let ativo = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (ativo) {
          setSession(
            data.session
          );
          setCarregando(false);
        }
      })
      .catch(() => {
        if (ativo) {
          setCarregando(false);
        }
      });

    const { data } =
      supabase.auth.onAuthStateChange(
        (_evento, novaSession) => {
          setSession(
            novaSession
          );
        }
      );

    return () => {
      ativo = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function enviar(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (senha.length < 6) {
      setMensagem(
        "Use uma senha com no mínimo 6 caracteres."
      );
      return;
    }

    setProcessando(true);
    setMensagem("");

    try {
      if (perfil === "GESTOR") {
        const chaveSenha =
          chaveSenhaGestor(
            codigoNormalizado
          );

        const senhaSalva =
          localStorage.getItem(
            chaveSenha
          );

        if (
          senhaSalva &&
          senhaSalva !== senha
        ) {
          setMensagem(
            "Senha incorreta."
          );
          return;
        }

        if (!senhaSalva) {
          localStorage.setItem(
            chaveSenha,
            senha
          );
        }

        const usuarioAtual =
          obterUsuarioAcesso(
            session
          );

        if (
          usuarioAtual?.perfil ===
            "GESTOR" &&
          usuarioAtual.codigoGestor ===
            codigoNormalizado
        ) {
          return;
        }

        await sair();

        const resultado =
          await entrarGestorAnonimo(
            codigoNormalizado
          );

        setSession(
          resultado.session
        );
        return;
      }

      const resultado =
        await entrarComSenha(
          email,
          senha
        );

      setSession(
        resultado.session
      );
    } catch {
      try {
        const resultado =
          await criarSenha(
            email,
            senha,
            perfil,
            perfil === "GESTOR"
              ? codigoNormalizado
              : undefined
          );

        setSession(
          resultado.session
        );
        setMensagem(
          resultado.aviso ||
            "Senha criada com sucesso."
        );
      } catch (erro) {
        setMensagem(
          erro instanceof Error
            ? erro.message
            : "Não foi possível acessar."
        );
      }
    } finally {
      setProcessando(false);
    }
  }

  async function encerrarSessao() {
    await sair();
    setSession(null);
  }

  if (carregando) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <strong>DINIZ RH</strong>
          <p>Carregando acesso...</p>
        </div>
      </div>
    );
  }

  if (acessoValido) {
    return (
      <>
        <button
          type="button"
          className="auth-sair"
          onClick={encerrarSessao}
        >
          Sair
        </button>
        {children}
      </>
    );
  }

  return (
    <div className="auth-page">
      <form
        className="auth-card"
        onSubmit={enviar}
      >
        <div className="auth-marca">
          DINIZ RH
        </div>

        <h1>{titulo}</h1>
        <p>{subtitulo}</p>

        <label htmlFor="senha-acesso">
          Senha
        </label>

        <input
          id="senha-acesso"
          type="password"
          value={senha}
          onChange={(evento) =>
            setSenha(
              evento.target.value
            )
          }
          autoComplete="current-password"
          minLength={6}
          required
        />

        <button
          type="submit"
          disabled={processando}
        >
          {processando
            ? "Acessando..."
            : "ENTRAR / CRIAR SENHA"}
        </button>

        {mensagem && (
          <span className="auth-mensagem">
            {mensagem}
          </span>
        )}
      </form>
    </div>
  );
}

export default AuthGate;
