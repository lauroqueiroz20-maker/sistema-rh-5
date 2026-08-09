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
  entrarComSenha,
  obterUsuarioAcesso,
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

const CHAVE_SENHA_GESTORES =
  "sistema-rh-senha-gestores";

const PREFIXO_HASH_SENHA =
  "sha256:";

function chaveSenhaGestorLegada(
  codigo: string
) {
  return `sistema-rh-senha-gestor-${codigo}`;
}

function chaveAcessoGestor(
  codigo: string
) {
  return `sistema-rh-acesso-gestor-${codigo}`;
}

async function gerarHashSenha(
  senha: string,
  codigo: string
) {
  const dados = new TextEncoder().encode(
    `diniz-rh:${codigo}:${senha}`
  );

  const hash = await crypto.subtle.digest(
    "SHA-256",
    dados
  );

  return `${PREFIXO_HASH_SENHA}${Array.from(
    new Uint8Array(hash)
  )
    .map((byte) =>
      byte.toString(16).padStart(2, "0")
    )
    .join("")}`;
}

function obterSenhaGestorSalva(
  codigo: string
) {
  return (
    localStorage.getItem(
      CHAVE_SENHA_GESTORES
    ) ||
    localStorage.getItem(
      chaveSenhaGestorLegada(codigo)
    )
  );
}

async function salvarSenhaGestor(
  codigo: string,
  senha: string
) {
  const hash = await gerarHashSenha(
    senha,
    codigo
  );

  localStorage.setItem(
    CHAVE_SENHA_GESTORES,
    hash
  );
  localStorage.setItem(
    chaveSenhaGestorLegada(codigo),
    hash
  );
}

async function senhaGestorConfere(
  codigo: string,
  senha: string,
  senhaSalva: string
) {
  if (
    senhaSalva.startsWith(
      PREFIXO_HASH_SENHA
    )
  ) {
    return (
      senhaSalva ===
      (await gerarHashSenha(senha, codigo))
    );
  }

  const senhaLegadaConfere =
    senhaSalva === senha;

  if (senhaLegadaConfere) {
    await salvarSenhaGestor(
      codigo,
      senha
    );
  }

  return senhaLegadaConfere;
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

  const [
    acessoGestorLocal,
    setAcessoGestorLocal,
  ] = useState(false);

  const codigoNormalizado =
    normalizarCodigo(
      codigoGestor
    );

  const email = useMemo(
    () => emailAdminTatyana(),
    []
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
    perfil === "GESTOR"
      ? acessoGestorLocal
      : (
          session?.user.email === email ||
          usuario?.perfil === "ADMIN"
        );

  useEffect(() => {
    if (perfil === "GESTOR") {
      setAcessoGestorLocal(
        localStorage.getItem(
          chaveAcessoGestor(
            codigoNormalizado
          )
        ) === "SIM"
      );
      setCarregando(false);
      return;
    }

    let ativo = true;
    let cancelarAssinatura:
      | (() => void)
      | undefined;

    const timeout = window.setTimeout(() => {
      if (ativo) {
        setCarregando(false);
      }
    }, 1800);

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

    try {
      const { data } =
        supabase.auth.onAuthStateChange(
        (_evento, novaSession) => {
          setSession(
            novaSession
          );
        }
      );

      cancelarAssinatura = () => {
        data.subscription.unsubscribe();
      };
    } catch {
      setCarregando(false);
    }

    return () => {
      ativo = false;
      window.clearTimeout(timeout);
      cancelarAssinatura?.();
    };
  }, [perfil, codigoNormalizado]);

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
        const senhaSalva =
          obterSenhaGestorSalva(
            codigoNormalizado
          );

        if (
          senhaSalva &&
          !(await senhaGestorConfere(
            codigoNormalizado,
            senha,
            senhaSalva
          ))
        ) {
          setMensagem(
            "Senha incorreta."
          );
          return;
        }

        if (!senhaSalva) {
          await salvarSenhaGestor(
            codigoNormalizado,
            senha
          );
        }

        localStorage.setItem(
          chaveAcessoGestor(
            codigoNormalizado
          ),
          "SIM"
        );

        setAcessoGestorLocal(
          true
        );

        setMensagem(
          senhaSalva
            ? ""
            : "Senha criada com sucesso."
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

  async function trocarSenhaGestor() {
    const senhaAtual =
      obterSenhaGestorSalva(
        codigoNormalizado
      );

    const novaSenha =
      window.prompt(
        "Digite a nova senha com no mínimo 6 caracteres:"
      );

    if (novaSenha === null) {
      return;
    }

    if (novaSenha.length < 6) {
      alert(
        "Use uma senha com no mínimo 6 caracteres."
      );
      return;
    }

    if (
      senhaAtual &&
      (await senhaGestorConfere(
        codigoNormalizado,
        novaSenha,
        senhaAtual
      ))
    ) {
      alert(
        "A nova senha precisa ser diferente da atual."
      );
      return;
    }

    await salvarSenhaGestor(
      codigoNormalizado,
      novaSenha
    );

    localStorage.setItem(
      chaveAcessoGestor(
        codigoNormalizado
      ),
      "SIM"
    );

    setAcessoGestorLocal(true);
    setMensagem("");

    alert("Senha alterada.");
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
        {children}

        {perfil === "GESTOR" && (
          <button
            type="button"
            className="auth-trocar-senha"
            onClick={() => {
              void trocarSenhaGestor();
            }}
          >
            Trocar senha
          </button>
        )}
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

        {perfil === "GESTOR" && (
          <button
            type="button"
            className="auth-link-senha"
            onClick={() => {
              void trocarSenhaGestor();
            }}
          >
            Trocar senha salva
          </button>
        )}
      </form>
    </div>
  );
}

export default AuthGate;
