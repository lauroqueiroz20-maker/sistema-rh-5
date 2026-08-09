type IndicadoresProps = {
  demandaAcumulada: number;
  contratacoesEfetivadas: number;
  vagasPendentes: number;
};

export default function Indicadores({
  demandaAcumulada,
  contratacoesEfetivadas,
  vagasPendentes,
}: IndicadoresProps) {
  return (
    <section className="rpaisagem-indicadores">
      <article className="rpaisagem-indicador rpaisagem-indicador-demanda">
        <span className="rpaisagem-indicador-titulo">
          DEMANDA ACUMULADA
        </span>

        <strong className="rpaisagem-indicador-numero">
          {demandaAcumulada}
        </strong>

 <small className="rpaisagem-indicador-descricao">
  Total de vagas sob gestão do RH no ciclo analisado, incluindo novas solicitações e demandas remanescentes de períodos anteriores.
</small>
      </article>

      <article className="rpaisagem-indicador rpaisagem-indicador-contratacoes">
        <span className="rpaisagem-indicador-titulo">
          CONTRATAÇÕES EFETIVADAS
        </span>

        <strong className="rpaisagem-indicador-numero">
          {contratacoesEfetivadas}
        </strong>

<small className="rpaisagem-indicador-descricao">
  Total de admissões realizadas durante o ciclo, considerando todas as vagas efetivamente preenchidas, independentemente da data da solicitação.
</small>
      </article>

      <article className="rpaisagem-indicador rpaisagem-indicador-pendentes">
        <span className="rpaisagem-indicador-titulo">
          VAGAS PENDENTES
        </span>

        <strong className="rpaisagem-indicador-numero">
          {vagasPendentes}
        </strong>

<small className="rpaisagem-indicador-descricao">
  Vagas que permanecem em recrutamento e seleção ao encerramento do ciclo, incluindo solicitações ainda não concluídas e demandas remanescentes.
</small>
      </article>
    </section>
  );
}