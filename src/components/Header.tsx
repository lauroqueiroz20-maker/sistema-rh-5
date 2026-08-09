import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
} from "react";

import dinizLogo from "../assets/logo-diniz.jpg";

type Pagina =
  | "cadastro"
  | "admitidos"
  | "relatorio"
  | "relatorio2"
  | "relatorioPaisagem"
  | "dashboard"
  | "aso"
  | "gestores"
  | "aplicativo"
  | "portalgestor";

interface HeaderProps {
  paginaAtual: Pagina;
  setPaginaAtual: (pagina: Pagina) => void;
  onPublicarNuvem: () => void;
  mostrarNuvem: boolean;
  salvandoNuvem: boolean;
}

const CHAVE_MONITOR_GESTORES =
  "sistema-rh-monitor-gestores";
const CHAVE_MONITOR_VISUALIZADO =
  "sistema-rh-monitor-gestores-visualizado";

function obterAssinaturaMonitor() {
  try {
    const dados = JSON.parse(
      localStorage.getItem(CHAVE_MONITOR_GESTORES) ||
        "[]",
    ) as unknown;

    if (!Array.isArray(dados) || dados.length === 0) {
      return "";
    }

    return dados
      .map((item) => {
        if (
          typeof item === "object" &&
          item !== null &&
          "id" in item
        ) {
          return String(item.id);
        }

        return JSON.stringify(item);
      })
      .sort()
      .join("|");
  } catch {
    return "";
  }
}

function Header({
  paginaAtual,
  setPaginaAtual,
  onPublicarNuvem,
  mostrarNuvem,
  salvandoNuvem,
}: HeaderProps) {
  const [horario, setHorario] = useState("");
  const [
    aplicativoPendente,
    setAplicativoPendente,
  ] = useState(false);
  const inputExcelRef =
    useRef<HTMLInputElement>(null);

  useEffect(() => {
    const atualizarHorario = () => {
      setHorario(
        new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };

    atualizarHorario();

    const intervalo = window.setInterval(
      atualizarHorario,
      1000,
    );

    return () => {
      window.clearInterval(intervalo);
    };
  }, []);

  useEffect(() => {
    const atualizarPendenciaAplicativo = () => {
      const assinaturaAtual = obterAssinaturaMonitor();

      if (!assinaturaAtual) {
        setAplicativoPendente(false);
        localStorage.removeItem(CHAVE_MONITOR_VISUALIZADO);
        return;
      }

      const assinaturaVisualizada =
        localStorage.getItem(CHAVE_MONITOR_VISUALIZADO) ||
        "";

      if (paginaAtual === "aplicativo") {
        localStorage.setItem(
          CHAVE_MONITOR_VISUALIZADO,
          assinaturaAtual,
        );
        setAplicativoPendente(false);
        return;
      }

      setAplicativoPendente(
        assinaturaAtual !== assinaturaVisualizada,
      );
    };

    atualizarPendenciaAplicativo();

    const intervalo = window.setInterval(
      atualizarPendenciaAplicativo,
      2000
    );


    window.addEventListener(
      "sistema-rh-monitor-atualizado",
      atualizarPendenciaAplicativo,
    );

    window.addEventListener(
      "storage",
      atualizarPendenciaAplicativo,
    );

    return () => {
      window.clearInterval(intervalo);
      window.removeEventListener(
        "sistema-rh-monitor-atualizado",
        atualizarPendenciaAplicativo,
      );
      window.removeEventListener(
        "storage",
        atualizarPendenciaAplicativo,
      );
    };
  }, [paginaAtual]);

  useEffect(() => {
    if (paginaAtual !== "aplicativo") {
      return;
    }

    const assinaturaAtual = obterAssinaturaMonitor();

    if (assinaturaAtual) {
      localStorage.setItem(
        CHAVE_MONITOR_VISUALIZADO,
        assinaturaAtual,
      );
    }

    setAplicativoPendente(false);
  }, [paginaAtual]);

  function criarLink(pagina: Pagina) {
    const parametros = new URLSearchParams(
      window.location.search,
    );

    parametros.set("pagina", pagina);

    return `${window.location.pathname}?${parametros.toString()}`;
  }

  function navegar(
    evento: MouseEvent<HTMLAnchorElement>,
    pagina: Pagina,
  ) {
    evento.preventDefault();

    const link = criarLink(pagina);

    window.history.pushState({}, "", link);
    setPaginaAtual(pagina);

    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }

  function abrirSeletorExcel() {
    inputExcelRef.current?.click();
  }

  function selecionarArquivoExcel(
    evento: ChangeEvent<HTMLInputElement>,
  ) {
    const arquivo = evento.target.files?.[0];

    if (!arquivo) {
      return;
    }

    const nomeArquivo =
      arquivo.name.toLowerCase();

    const arquivoValido =
      nomeArquivo.endsWith(".xlsx") ||
      nomeArquivo.endsWith(".xlsm") ||
      nomeArquivo.endsWith(".xls");

    if (!arquivoValido) {
      alert(
        "Selecione uma planilha Excel nos formatos .xlsx, .xlsm ou .xls.",
      );

      evento.target.value = "";
      return;
    }

    window.dispatchEvent(
      new CustomEvent(
        "sistema-rh-importar-excel",
        {
          detail: {
            arquivo,
          },
        },
      ),
    );

    evento.target.value = "";
  }

  const estiloLink = {
    textDecoration: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "34px",
    padding: "0 8px",
    lineHeight: 1,
    boxSizing: "border-box" as const,
    whiteSpace: "nowrap" as const,
  };

  return (
    <header
      className="topo"
      style={{
        position: "relative",
        zIndex: 2147483647,
        pointerEvents: "auto",
        display: "flex",
        alignItems: "center",
        minHeight: "64px",
        overflow: "visible",
      }}
    >
      <nav
        className="menu-esquerda"
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          flex: "0 0 auto",
          minWidth: 0,
          flexWrap: "nowrap",
        }}
      >
        <a
          href={criarLink("cadastro")}
          className={`aba-menu ${
            paginaAtual === "cadastro"
              ? "ativa"
              : ""
          }`}
          style={estiloLink}
          onClick={(evento) =>
            navegar(evento, "cadastro")
          }
        >
          Cadastro
        </a>

        <a
          href={criarLink("admitidos")}
          className={`aba-menu ${
            paginaAtual === "admitidos"
              ? "ativa"
              : ""
          }`}
          style={estiloLink}
          onClick={(evento) =>
            navegar(evento, "admitidos")
          }
        >
          Admitidos
        </a>

        <a
          href={criarLink("relatorioPaisagem")}
          className={`aba-menu ${
            paginaAtual === "relatorioPaisagem"
              ? "ativa"
              : ""
          }`}
          style={estiloLink}
          onClick={(evento) =>
            navegar(
              evento,
              "relatorioPaisagem",
            )
          }
        >
          Relatorio
        </a>

        <a
          href={criarLink("dashboard")}
          className={`aba-menu ${
            paginaAtual === "dashboard"
              ? "ativa"
              : ""
          }`}
          style={estiloLink}
          onClick={(evento) =>
            navegar(evento, "dashboard")
          }
        >
          Dashboard
        </a>

        <a
          href={criarLink("aplicativo")}
          className={`aba-menu ${
            paginaAtual === "aplicativo"
              ? "ativa"
              : ""
          } ${
            aplicativoPendente &&
            paginaAtual !== "aplicativo"
              ? "aba-alerta-aplicativo"
              : ""
          }`}
          style={estiloLink}
          onClick={(evento) =>
            navegar(evento, "aplicativo")
          }
        >
          Aplicativo
        </a>

        <a
          href={criarLink("gestores")}
          className={`aba-menu ${
            paginaAtual === "gestores"
              ? "ativa"
              : ""
          }`}
          style={estiloLink}
          onClick={(evento) =>
            navegar(evento, "gestores")
          }
        >
          Gestores
        </a>

        <a
          href={criarLink("aso")}
          className={`aba-menu ${
            paginaAtual === "aso"
              ? "ativa"
              : ""
          }`}
          style={estiloLink}
          onClick={(evento) =>
            navegar(evento, "aso")
          }
        >
          ASO
        </a>

      </nav>

      <div
        className="titulo-topo"
        style={{
          position: "relative",
          zIndex: 1,
          flex: "1 1 auto",
          minWidth: 180,
          maxWidth: 360,
          textAlign: "center",
          lineHeight: 1.15,
          pointerEvents: "none",
          whiteSpace: "nowrap",
          marginLeft: 12,
          marginRight: 14,
        }}
      >
        <strong
          style={{
            display: "block",
          }}
        >
          TATYANA TRAVASSOS
        </strong>

        <span
          style={{
            display: "block",
          }}
        >
          Coordenação de Recrutamento e Seleção
        </span>
      </div>

      <div
        className="acoes-topo"
        style={{
          position: "relative",
          zIndex: 2,
          flex: "0 0 auto",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          whiteSpace: "nowrap",
        }}
      >
        <div className="area-logo-diniz-topo">
          <div
            className="logo-diniz-topo"
            aria-label="Diniz RH"
          >
            <img
              src={dinizLogo}
              alt="Diniz Supermercados"
            />
          </div>
        </div>

        <span className="relogio-topo">
          <strong>{horario}</strong>
        </span>

        {mostrarNuvem && (
          <button
            type="button"
            className="botao-nuvem"
            onClick={onPublicarNuvem}
            disabled={salvandoNuvem}
          >
            {salvandoNuvem
              ? "Publicando..."
              : "Nuvem"}
          </button>
        )}

        <input
          ref={inputExcelRef}
          type="file"
          accept=".xlsx,.xlsm,.xls"
          onChange={selecionarArquivoExcel}
          style={{ display: "none" }}
        />

        <button
          type="button"
          title="Importar planilha Excel"
          aria-label="Importar planilha Excel"
          onClick={abrirSeletorExcel}
          style={{
            width: "38px",
            height: "34px",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.35)",
            borderRadius: "6px",
            background: "#107c41",
            color: "#ffffff",
            cursor: "pointer",
          }}
        >
          <svg
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M4 4.75A1.75 1.75 0 0 1 5.75 3h7.5A1.75 1.75 0 0 1 15 4.75v14.5A1.75 1.75 0 0 1 13.25 21h-7.5A1.75 1.75 0 0 1 4 19.25V4.75Z"
              fill="currentColor"
            />
            <path
              d="M13 6h5.25A1.75 1.75 0 0 1 20 7.75v8.5A1.75 1.75 0 0 1 18.25 18H13V6Z"
              fill="currentColor"
              opacity="0.72"
            />
            <path
              d="m7.1 8.2 1.55 2.72L10.2 8.2h1.7l-2.3 3.8 2.4 3.8h-1.75l-1.6-2.78-1.6 2.78H5.3L7.7 12 5.4 8.2h1.7Z"
              fill="#ffffff"
            />
            <path
              d="M14.5 8.5h3M14.5 11.5h3M14.5 14.5h3"
              stroke="#ffffff"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}

export default Header;


