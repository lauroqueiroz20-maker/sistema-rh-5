type Pagina =
  | "cadastro"
  | "admitidos"
  | "relatorio"
  | "dashboard"
  | "aso"
  | "gestores"
  | "portalgestor";

interface HeaderProps {
  paginaAtual: Pagina;
  setPaginaAtual: (pagina: Pagina) => void;
}

function Header({
  paginaAtual,
  setPaginaAtual,
}: HeaderProps) {
  return (
    <header
      className="topo"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div className="menu-esquerda">
        <button
          type="button"
          className={`aba-menu ${
            paginaAtual === "cadastro"
              ? "ativa"
              : ""
          }`}
          onClick={() =>
            setPaginaAtual("cadastro")
          }
        >
          Cadastro
        </button>

        <button
          type="button"
          className={`aba-menu ${
            paginaAtual === "admitidos"
              ? "ativa"
              : ""
          }`}
          onClick={() =>
            setPaginaAtual("admitidos")
          }
        >
          Admitidos
        </button>

        <button
          type="button"
          className={`aba-menu ${
            paginaAtual === "relatorio"
              ? "ativa"
              : ""
          }`}
          onClick={() =>
            setPaginaAtual("relatorio")
          }
        >
          Relatório
        </button>

        <button
          type="button"
          className={`aba-menu ${
            paginaAtual === "dashboard"
              ? "ativa"
              : ""
          }`}
          onClick={() =>
            setPaginaAtual("dashboard")
          }
        >
          Dashboard
        </button>

        <button
          type="button"
          className={`aba-menu ${
            paginaAtual === "gestores"
              ? "ativa"
              : ""
          }`}
          onClick={() =>
            setPaginaAtual("gestores")
          }
        >
          Gestores
        </button>

        <button
          type="button"
          className={`aba-menu ${
            paginaAtual === "portalgestor"
              ? "ativa"
              : ""
          }`}
          onClick={() =>
            setPaginaAtual("portalgestor")
          }
        >
          Portal do Gestor
        </button>

        <button
          type="button"
          className={`aba-menu ${
            paginaAtual === "aso"
              ? "ativa"
              : ""
          }`}
          onClick={() =>
            setPaginaAtual("aso")
          }
        >
          Controle ASO
        </button>
      </div>

      <div
        style={{
          color: "#fff",
          fontWeight: 800,
          fontSize: "18px",
          whiteSpace: "nowrap",
          marginLeft: "40px",
        }}
      >
        TATYANA TRAVASSOS — Coordenadora de Recursos Humanos
      </div>
    </header>
  );
}

export default Header;