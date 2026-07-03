import React from "react";
import logoDiniz from "../assets/logo-diniz.jpg";
import { type Vaga } from "../data/vagas";

type Props = {
  vagas: Vaga[];
};

type GrupoUnidade = {
  unidade: string;
  vagas: Vaga[];
  totalVagas: number;
  totalAdmissoes: number;
  totalPendentes: number;
};

function calcularDias(data: string) {
  if (!data) return 0;

  const partes = data.split("/");
  if (partes.length !== 3) return 0;

  const [dia, mes, ano] = partes.map(Number);
  const dataInicial = new Date(ano, mes - 1, dia);
  const hoje = new Date();

  if (Number.isNaN(dataInicial.getTime())) return 0;

  const diferenca = hoje.getTime() - dataInicial.getTime();
  return Math.max(Math.floor(diferenca / (1000 * 60 * 60 * 24)), 0);
}

function RelatorioGerencial({ vagas }: Props) {
  const vagasAtivas = vagas.filter((vaga) => vaga.ativo !== false);

  const demandaAcumulada = vagasAtivas.reduce(
    (total, vaga) => total + Number(vaga.quantidade || 0),
    0
  );

  const contratacoes = vagasAtivas.reduce(
    (total, vaga) => total + Number(vaga.admissoes || 0),
    0
  );

  const pendentes = vagasAtivas.reduce(
    (total, vaga) =>
      total +
      Math.max(Number(vaga.quantidade || 0) - Number(vaga.admissoes || 0), 0),
    0
  );

  const grupos = vagasAtivas.reduce<GrupoUnidade[]>((lista, vaga) => {
    const unidade = String(vaga.unidade || "").trim().toUpperCase();

    let grupo = lista.find((item) => item.unidade === unidade);

    if (!grupo) {
      grupo = {
        unidade,
        vagas: [],
        totalVagas: 0,
        totalAdmissoes: 0,
        totalPendentes: 0,
      };

      lista.push(grupo);
    }

    const pendente = Math.max(
      Number(vaga.quantidade || 0) - Number(vaga.admissoes || 0),
      0
    );

    grupo.vagas.push(vaga);
    grupo.totalVagas += Number(vaga.quantidade || 0);
    grupo.totalAdmissoes += Number(vaga.admissoes || 0);
    grupo.totalPendentes += pendente;

    return lista;
  }, []);

  return (
    <section className="relatorio-gerencial">
      <div className="relatorio-cabecalho">
        <div className="relatorio-logo">
          <img src={logoDiniz} alt="Diniz Supermercados" />
        </div>

        <div className="relatorio-titulo">
          <h2>RELATÓRIO SEMANAL DE RECRUTAMENTO E SELEÇÃO</h2>
          <p>
            Relatório gerado automaticamente pelo RH | Tatyana Travassos - Coord.
            R&amp;S
          </p>
        </div>
      </div>

      <div className="relatorio-indicadores">
        <div className="relatorio-card">
          <span>DEMANDA ACUMULADA</span>
          <strong>{demandaAcumulada}</strong>
          <p>Total de vagas registradas no ciclo.</p>
        </div>

        <div className="relatorio-card">
          <span>CONTRATAÇÕES EFETIVADAS</span>
          <strong>{contratacoes}</strong>
          <p>Total de admissões realizadas.</p>
        </div>

        <div className="relatorio-card">
          <span>VAGAS PENDENTES</span>
          <strong>{pendentes}</strong>
          <p>Saldo de vagas ainda em aberto.</p>
        </div>
      </div>

      <div className="relatorio-destaques">
        <h3>Destaques Automáticos</h3>
        <p>
          As maiores demandas concentram-se nas unidades com maior volume de vagas
          abertas.
        </p>
        <p>
          As funções com maior necessidade de reposição serão exibidas conforme os
          cargos cadastrados.
        </p>
        <p>
          As unidades estáveis serão identificadas automaticamente pela base de
          dados.
        </p>
      </div>

      <table className="relatorio-tabela">
        <thead>
          <tr>
            <th>TIPO</th>
            <th>CARGO</th>
            <th>SETOR</th>
            <th>VAGAS</th>
            <th>MOTIVO</th>
            <th>SOLICITADAS</th>
            <th>ADMISSÕES</th>
            <th>DATA</th>
            <th>DIAS</th>
            <th>PENDENTES</th>
          </tr>
        </thead>

        <tbody>
          {grupos.map((grupo) => (
            <React.Fragment key={grupo.unidade}>
              <tr className="linha-cabecalho-unidade">
                <td colSpan={10}>UNIDADE {grupo.unidade}</td>
              </tr>

              {grupo.vagas.map((vaga) => {
                const pendente = Math.max(
                  Number(vaga.quantidade || 0) - Number(vaga.admissoes || 0),
                  0
                );

                return (
                  <tr key={vaga.id}>
                    <td className={`tipo-${String(vaga.tipo).toLowerCase().replace(".", "")}`}>
                      {vaga.tipo}
                    </td>
                    <td>{vaga.cargo}</td>
                    <td>{vaga.setor}</td>
                    <td>{vaga.quantidade}</td>
                    <td>{vaga.motivo || "------"}</td>
                    <td>{vaga.quantidade}</td>
                    <td>{vaga.admissoes}</td>
                    <td>{vaga.data || "------"}</td>
                    <td>{calcularDias(vaga.data)}</td>
                    <td>{pendente}</td>
                  </tr>
                );
              })}

              <tr className="linha-total-unidade">
                <td colSpan={3}>UNIDADE {grupo.unidade} - TOTAL</td>
                <td>{grupo.totalVagas}</td>
                <td></td>
                <td>{grupo.totalVagas}</td>
                <td>{grupo.totalAdmissoes}</td>
                <td></td>
                <td></td>
                <td>{grupo.totalPendentes}</td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <div className="relatorio-assinatura">
        <div className="linha"></div>
        <strong>Tatyana Travassos</strong>
        <br />
        Coordenação de Recrutamento &amp; Seleção
      </div>
    </section>
  );
}

export default RelatorioGerencial;
