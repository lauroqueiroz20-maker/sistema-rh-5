type Pagina =
  | "cadastro"
  | "admitidos"
  | "relatorio"
  | "relatorio2"
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
    <header className="topo">
      <div className="menu-esquerda">
        {(
          [
            ["cadastro", "Cadastro"],
            ["admitidos", "Admitidos"],
            ["relatorio2", "Relatório"],
            ["dashboard", "Dashboard"],
            ["gestores", "Central Gestores"],
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

      <div className="responsavel-topo">
        TATYANA TRAVASSOS - Coordenação de Recrutamento e Seleção
      </div>

      <div className="menu-direita">
        {onPublicarNuvem && (
          <button
            type="button"
            className="aba-menu publicar-nuvem-discreto"
            onClick={onPublicarNuvem}
            disabled={salvandoNuvem}
          >
            {salvandoNuvem
              ? "Salvando..."
              : "Nuvem"}
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
