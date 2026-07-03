import { useEffect, useState } from "react";

import "./App.css";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Cards from "./components/Cards";
import Cadastro from "./components/Cadastro";
import TelaCadastro from "./components/TelaCadastro";
import RelatorioGerencial from "./components/RelatorioGerencial.tsx";

import vagasIniciais, { type Vaga } from "./data/vagas";

function App() {
  const [vagas, setVagas] = useState<Vaga[]>(() => {
    const vagasSalvas = localStorage.getItem("rh-diniz-vagas");
    return vagasSalvas ? JSON.parse(vagasSalvas) : vagasIniciais;
  });

  const [, setLixeira] = useState<Vaga[]>([]);
  const [codigoFiltro, setCodigoFiltro] = useState("001");
  const [modoTela, setModoTela] = useState<"novo" | "atualizar">("novo");
  const [admissoesPendentes, setAdmissoesPendentes] = useState<number[]>([]);
  const [paginaAtual, setPaginaAtual] = useState<"cadastro" | "relatorio">(
    "relatorio"
  );

  const temAtualizacaoPendente = admissoesPendentes.length > 0;

  useEffect(() => {
    localStorage.setItem("rh-diniz-vagas", JSON.stringify(vagas));
  }, [vagas]);

  function gerarPDF() {
    setPaginaAtual("relatorio");

    setTimeout(() => {
      window.print();

      setTimeout(() => {
        setPaginaAtual("cadastro");
      }, 500);
    }, 1000);
  }

  const vagasFiltradas =
    codigoFiltro === "0"
      ? vagas
      : vagas.filter((vaga) => vaga.codigo === codigoFiltro);

  function alterarModo(modo: "novo" | "atualizar") {
    setModoTela(modo);
    setAdmissoesPendentes([]);
  }

  function encerrarVaga(id: number) {
    const confirmou = window.confirm(
      "Deseja realmente encerrar esta vaga?\n\nEla será removida da Base de Dados e ficará disponível apenas para recuperação."
    );

    if (!confirmou) return;

    const vaga = vagas.find((v) => v.id === id);
    if (!vaga) return;

    setLixeira((anterior) => [
      {
        ...vaga,
        ativo: false,
        motivo: "ENCERRAR VAGA",
      },
      ...anterior,
    ]);

    setVagas((anterior) => anterior.filter((v) => v.id !== id));
    setAdmissoesPendentes((anterior) => anterior.filter((item) => item !== id));

    alert("Vaga encerrada com sucesso.");
  }

  function adicionarVagas(novasVagas: Vaga[]) {
    setVagas((listaAtual) => [...novasVagas, ...listaAtual]);
  }

  function atualizarMotivo(id: number, novoMotivo: string) {
    if (novoMotivo === "ENCERRAR VAGA") {
      encerrarVaga(id);
      return;
    }

    setVagas((listaAtual) =>
      listaAtual.map((vaga) =>
        vaga.id === id ? { ...vaga, motivo: novoMotivo } : vaga
      )
    );
  }

  function alternarAdmissao(id: number) {
    const vaga = vagas.find((item) => item.id === id);

    if (!vaga || vaga.admissoes >= vaga.quantidade) return;

    setAdmissoesPendentes((anterior) =>
      anterior.includes(id)
        ? anterior.filter((item) => item !== id)
        : [...anterior, id]
    );
  }

  function confirmarAtualizacaoCadastro() {
    if (!codigoFiltro) {
      alert("Informe o código da unidade antes de atualizar.");
      return;
    }

    if (!temAtualizacaoPendente) {
      alert("Nenhuma admissão foi marcada para atualizar.");
      return;
    }

    setVagas((listaAtual) =>
      listaAtual.map((vaga) =>
        admissoesPendentes.includes(vaga.id)
          ? {
              ...vaga,
              admissoes: Math.min(vaga.admissoes + 1, vaga.quantidade),
            }
          : vaga
      )
    );

    setAdmissoesPendentes([]);
    alert("Cadastro atualizado com sucesso!");
  }

  return (
    <div className="app">
      <Sidebar />

      <main className="principal">
        <Header paginaAtual={paginaAtual} setPaginaAtual={setPaginaAtual} />

        {paginaAtual === "cadastro" && (
          <>
            <Cards vagas={vagas} />

            <div className="area-trabalho">
              <Cadastro
                vagas={vagas}
                onAdicionarVagas={adicionarVagas}
                onSelecionarCodigo={setCodigoFiltro}
                onAlterarModo={alterarModo}
                onConfirmarAtualizacao={confirmarAtualizacaoCadastro}
                temAtualizacaoPendente={temAtualizacaoPendente}
                onGerarPDF={gerarPDF}
              />

              <TelaCadastro
                vagas={vagasFiltradas}
                modo={modoTela}
                onAtualizarMotivo={atualizarMotivo}
                onAlternarAdmissao={alternarAdmissao}
              />
            </div>
          </>
        )}

        {paginaAtual === "relatorio" && <RelatorioGerencial vagas={vagas} />}
      </main>
    </div>
  );
}

export default App;