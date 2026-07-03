import React, { useMemo } from "react";
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

function RelatorioGerencial({ vagas = [] }: Props) {
  // 1. CÁLCULO DOS INDICADORES TOTAIS (Blindado contra dados nulos ou corrompidos)
  const { demandaAcumulada, contratacoes, pendentes } = useMemo(() => {
    return vagas.reduce(
      (acc, vaga) => {
        if (!vaga) return acc;
        const qtd = Math.max(0, Number(vaga.quantidade || 0));
        const adm = Math.max(0, Number(vaga.admissoes || 0));
        const pen = Math.max(0, qtd - adm);

        acc.demandaAcumulada += qtd;
        acc.contratacoes += adm;
        acc.pendentes += pen;
        return acc;
      },
      { demandaAcumulada: 0, contratacoes: 0, pendentes: 0 }
    );
  }, [vagas]);

  // 2. AGRUPAMENTO POR UNIDADE (Evita criar grupos fantasmas se a string estiver vazia)
  const grupos = useMemo(() => {
    return vagas.reduce<GrupoUnidade[]>((lista, vaga) => {
      if (!vaga) return lista;

      // Se a unidade não estiver preenchida, joga para "NÃO INFORMADA" para não sumir do relatório
      const unidadeRaw = String(vaga.unidade || "").trim().toUpperCase();
      const unidade = unidadeRaw === "" ? "NÃO INFORMADA" : unidadeRaw;

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

      const qtd = Math.max(0, Number(vaga.quantidade || 0));
      const adm = Math.max(0, Number(vaga.admissoes || 0));
      const pen = Math.max(0, qtd - adm);

      grupo.vagas.push(vaga);
      grupo.totalVagas += qtd;
      grupo.totalAdmissoes += adm;
      grupo.totalPendentes += pen;

      return lista;
    }, []);
  }, [vagas]);

  // Se não houver nenhum cadastro na base, exibe uma mensagem amigável em vez de uma tabela vazia
  if (!vagas || vagas.length === 0) {
    return (
      <section className="relatorio-gerencial">
        <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
          <h3>Nenhum registro de vaga encontrado para gerar o relatório.</h3>
        </div>
      </section>
    );
  }

  return (
    <section className="relatorio-gerencial">
      {/* CABEÇALHO CORPORATIVO AZUL */}
      <div className="relatorio-cabecalho">
        <div className="relatorio-titulo">
          <h2>RELATÓRIO SEMANAL DE RECRUTAMENTO E SELEÇÃO</h2>
          <p>
            Relatório gerado automaticamente pelo RH | Tatyana Travassos - Coord. R&amp;S
          </p>
        </div>
      </div>

<div className="relatorio-indicadores">
  <div className="relatorio-indicador-linha">
    <span className="indicador-numero">{demandaAcumulada}</span>
    <span className="indicador-titulo">DEMANDA ACUMULADA:</span>
    <span className="indicador-texto">
      Total de vagas sob gestão (requisições atuais + saldos anteriores).
    </span>
  </div>

  <div className="relatorio-indicador-linha">
    <span className="indicador-numero">{contratacoes}</span>
    <span className="indicador-titulo">CONTRATAÇÕES EFETIVADAS:</span>
    <span className="indicador-texto">
      Total de admissões realizadas no período, independente da data de abertura.
    </span>
  </div>

  <div className="relatorio-indicador-linha">
    <span className="indicador-numero">{pendentes}</span>
    <span className="indicador-titulo">VAGAS PENDENTES:</span>
    <span className="indicador-texto">
      Saldo de vagas ainda em processo de seleção ao final do ciclo.
    </span>
  </div>
</div>
<div className="relatorio-bloco-meio">
  <div className="relatorio-destaques">
    <h3>Resumo Executivo</h3>
    <p>
      O presente relatório apresenta a posição consolidada das vagas sob gestão
      do RH durante o ciclo analisado, contemplando a demanda acumulada,
      contratações efetivadas e vagas pendentes.
      <br />
      As informações estão organizadas por unidade, permitindo o acompanhamento
      das solicitações, admissões realizadas e saldo de vagas em aberto.
      <br />
      Este relatório subsidia a tomada de decisão da gestão, auxiliando na
      definição de prioridades e no acompanhamento dos indicadores de
      Recrutamento e Seleção.
    </p>
  </div>

  <div className="painel-indicadores-relatorio">
    <div><strong>Turnover</strong><span>0,00%</span></div>
    <div><strong>Demissões</strong><span>0</span></div>
    <div><strong>J. Aprendiz</strong><span>0</span></div>
    <div><strong>Inventário</strong><span>0</span></div>
    <div><strong>PCD</strong><span>0</span></div>
    <div><strong>ADM</strong><span>0</span></div>
    <div><strong>INÍCIO</strong><span>26/06/2026</span></div>
    <div><strong>FIM</strong><span>02/07/2026</span></div>
  </div>
</div>
      {/* TABELA AJUSTADA COM 10 COLUNAS FIXAS */}
      <table className="relatorio-tabela">
        <thead>
          <tr>
            <th>TIPO</th>
            <th>CARGO</th>
            <th>SETOR</th>
            <th>VAGA</th>
            <th>MOTIVO</th>
            <th>DATA DE SOLICITAÇÃO</th>
            <th>ADMISSÕES</th>
            <th>DATA DE ADMISSÕES</th>
            <th>TEMPO DE CONTRATAÇÃO</th>
            <th>VAGAS PENDENTES</th>
          </tr>
        </thead>

        <tbody>
          {grupos.map((grupo) => (
            <React.Fragment key={grupo.unidade}>
              <tr className="linha-cabecalho-unidade">
                <td colSpan={10}>UNIDADE {grupo.unidade}</td>
              </tr>

              {grupo.vagas.map((vaga) => {
                const quantidade = Math.max(0, Number(vaga.quantidade || 0));
                const admissoes = Math.max(0, Number(vaga.admissoes || 0));
                const pendente = Math.max(0, quantidade - admissoes);

                return (
                  <tr key={vaga.id}>
                    <td>{vaga.tipo || "OPERAC."}</td>
                    <td>{vaga.cargo || "------"}</td>
                    <td>{vaga.setor || "------"}</td>
                    <td>{quantidade}</td>
                    <td>{vaga.motivo || "------"}</td>
                    <td>{vaga.data || "------"}</td>
                    <td>{admissoes}</td>
                    <td>{vaga.data || "------"}</td>
                    <td>0</td>
                    <td>{pendente}</td>
                  </tr>
                );
              })}

{/* LINHA DE TOTAIS TOTALMENTE ESTABILIZADA E ALINHADA */}
              <tr className="linha-total-unidade" style={{ height: '24px' }}>
                {/* Coluna 1: Onde o texto fica ancorado e centralizado flutuando */}
                <td style={{ 
                  position: 'relative',
                  padding: '2px 0', 
                  borderRight: 'none',
                  verticalAlign: 'middle'
                }}>
                  <div style={{ 
                    position: 'absolute', 
                    left: '160px',          /* Força o texto a ir para o centro exato das 3 colunas vazias */
                    top: '50%', 
                    transform: 'translate(-50%, -50%)', /* Centralização perfeita */
                    whiteSpace: 'nowrap',   /* Proíbe o texto de quebrar linha de qualquer forma */
                    fontWeight: 'bold', 
                    color: '#003b82', 
                    fontSize: '10px',
                    zIndex: 2,
                    width: '320px',         /* Caixa larga o suficiente para o texto caber reto */
                    textAlign: 'left'     /* Centraliza o texto dentro da própria caixa */
                  }}>
                    UNIDADE {grupo.unidade} - TOTAL
                  </div>
                </td>

                {/* Coluna 2 (CARGA): Vazia e sem bordas para o texto passar por cima */}
                <td style={{ borderLeft: 'none', borderRight: 'none', padding: '2px 0' }}></td>

                {/* Coluna 3 (SETOR): Vazia e sem borda esquerda */}
                <td style={{ borderLeft: 'none', padding: '2px 0' }}></td>

                {/* Coluna 4: VAGAS (Centralização Absoluta com Flexbox inline) */}
                <td className="numero-total-destaque" style={{ padding: '2px 0', verticalAlign: 'middle' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', fontWeight: 'bold' }}>
                    {grupo.totalVagas}
                  </div>
                </td>

                {/* Coluna 5 */}
                <td style={{ padding: '2px 0' }}></td>
                {/* Coluna 6 */}
                <td style={{ padding: '2px 0' }}></td>

                {/* Coluna 7: ADMISSÕES (Centralização Absoluta com Flexbox inline) */}
                <td className="numero-total-destaque" style={{ padding: '2px 0', verticalAlign: 'middle' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', fontWeight: 'bold' }}>
                    {grupo.totalAdmissoes}
                  </div>
                </td>

                {/* Coluna 8 */}
                <td style={{ padding: '2px 0' }}></td>
                {/* Coluna 9 */}
                <td style={{ padding: '2px 0' }}></td>

                {/* Coluna 10: PENDENTES (Centralização Absoluta com Flexbox inline) */}
                <td className="numero-total-destaque" style={{ padding: '2px 0', verticalAlign: 'middle' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', fontWeight: 'bold' }}>
                    {grupo.totalPendentes}
                  </div>
                </td> 
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* RODAPÉ DE ASSINATURA */}
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

