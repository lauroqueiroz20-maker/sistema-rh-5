type DestaquesProps = {
  maioresDemandas: string;
  cargosCriticos: string;
  unidadesEstaveis: string;
  observacoes?: string;
};

export default function Destaques({
  maioresDemandas,
  cargosCriticos,
  unidadesEstaveis,
  observacoes = "-",
}: DestaquesProps) {
  const itens = [
    {
      classe: "demanda",
      titulo: "Unidades com maior demanda",
      valor: maioresDemandas,
    },
    {
      classe: "critico",
      titulo: "Cargos com maior demanda",
      valor: cargosCriticos,
    },
    {
      classe: "estavel",
      titulo: "Unidades sem vagas pendentes",
      valor: unidadesEstaveis,
    },
    {
      classe: "observacao",
      titulo: "Síntese executiva do ciclo",
      valor: observacoes,
    },
  ];

  return (
    <section className="rpaisagem-destaques">
      <div className="rpaisagem-destaques-titulo">
        DESTAQUES ESTRATÉGICOS
      </div>

      <div className="rpaisagem-destaques-grid">
        {itens.map((item) => (
          <article
            key={item.titulo}
            className={`rpaisagem-destaque-card ${item.classe}`}
          >
            <span>{item.titulo}</span>
            <strong>{item.valor}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

