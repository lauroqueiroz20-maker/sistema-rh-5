interface HeaderProps {
  paginaAtual: "cadastro" | "relatorio";
  setPaginaAtual: (pagina: "cadastro" | "relatorio") => void;
}

function Header({ paginaAtual, setPaginaAtual }: HeaderProps) {
  return (
    <header className="topo">
      <div className="menu-superior">
        <button 
          className={`aba-menu ${paginaAtual === "cadastro" ? "ativa" : ""}`}
          onClick={() => setPaginaAtual("cadastro")}
        >
          Cadastro
        </button>
        
        <button 
          className={`aba-menu ${paginaAtual === "relatorio" ? "ativa" : ""}`}
          onClick={() => setPaginaAtual("relatorio")}
        >
          Relatório Gerencial
        </button>

        {/* Aqui você poderá adicionar mais funções no futuro, ex: */}
        {/* <button className="aba-menu">Configurações</button> */}
      </div>
    </header>
  );
}

export default Header;