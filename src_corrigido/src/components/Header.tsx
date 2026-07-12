function Header() {
  return (
    <header className="topo">
      <div className="menu-superior">
        <button className="menu-card ativo">RH Central</button>

        <button className="menu-card">
          Base de Dados
        </button>

        <button className="menu-card">
          Painel de Controle
        </button>

        <button className="menu-card">
          Relatórios
        </button>

        <button className="menu-card">
          Pendências
        </button>

        <button className="menu-card">
          SLA
        </button>
      </div>
    </header>
  );
}

export default Header;