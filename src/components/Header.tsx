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
  onPublicarNuvem?: () => void;
  salvandoNuvem?: boolean;
}

function Header({
  paginaAtual,
  setPaginaAtual,
  onPublicarNuvem,
  salvandoNuvem = false,
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
        {(
          [
            ["cadastro", "Cadastro"],
            ["admitidos", "Admitidos"],
            ["relatorio", "Relatório"],
            ["dashboard", "Dashboard"],
            ["gestores", "Gestores"],
            [
              "portalgestor",
              "Portal do Gestor",
            ],
            ["aso", "Controle ASO"],
          ] as const
        ).map(([pagina, texto]) => (
          <button
            key={pagina}
            type="button"
            className={`aba-menu ${
              paginaAtual === pagina
                ? "ativa"
                : ""
            }`}
            onClick={() =>
              setPaginaAtual(pagina)
            }
          >
            {texto}
          </button>
        ))}
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
        {onPublicarNuvem && (
          <button
            type="button"
            onClick={onPublicarNuvem}
            disabled={salvandoNuvem}
            style={{
              height: "34px",
              marginRight: "14px",
              border: "1px solid #fff",
              borderRadius: "7px",
              background: "#16a34a",
              color: "#fff",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {salvandoNuvem
              ? "Salvando..."
              : "Publicar nuvem"}
          </button>
        )}
        TATYANA TRAVASSOS - Coordenadora de Recursos Humanos
      </div>
    </header>
  );
}

export default Header;
