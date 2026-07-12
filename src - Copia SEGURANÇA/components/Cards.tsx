import { type Vaga } from "../data/vagas";

interface CardsProps {
  vagas: Vaga[];
}

function Cards({ vagas }: CardsProps) {
  const demandaAcumulada = vagas.reduce(
    (total, vaga) => total + vaga.quantidade,
    0
  );

  const contratacoesEfetivadas = vagas.reduce(
    (total, vaga) => total + vaga.admissoes,
    0
  );

  const vagasPendentes = vagas.reduce((total, vaga) => {
    const pendente = vaga.quantidade - vaga.admissoes;
    return total + Math.max(pendente, 0);
  }, 0);

  const unidadesEstaveis = vagas.filter(
    (vaga) => vaga.tipo === "ESTÁVEL"
  ).length;

  const jovemAprendiz = vagas.filter(
    (vaga) => vaga.tipo === "J. APRENDIZ"
  ).length;

  const pcd = vagas.filter((vaga) => vaga.tipo === "PCD").length;

  const inventario = vagas.filter(
    (vaga) => vaga.tipo === "INVENTÁRIO"
  ).length;

  const adm = vagas.filter((vaga) => vaga.tipo === "ADM").length;

  return (
    <section className="resumo">
      <div className="card vermelho">
        <span>Demanda Acumulada</span>
        <strong>{demandaAcumulada}</strong>
      </div>

      <div className="card azul">
        <span>Contratações Efetivadas</span>
        <strong>{contratacoesEfetivadas}</strong>
      </div>

      <div className="card verde">
        <span>Vagas Pendentes</span>
        <strong>{vagasPendentes}</strong>
      </div>

      <div className="card cinza">
        <span>Unidades Estáveis</span>
        <strong>{unidadesEstaveis}</strong>
      </div>

      <div className="mini-indicadores">
        <div className="mini-card">
          <span>Jovem Aprendiz</span>
          <strong className="numero-ja">{jovemAprendiz}</strong>
        </div>

        <div className="mini-card">
          <span>PCD</span>
          <strong className="numero-pcd">{pcd}</strong>
        </div>

        <div className="mini-card">
          <span>Inventário</span>
          <strong className="numero-inv">{inventario}</strong>
        </div>

        <div className="mini-card">
          <span>ADM</span>
          <strong className="numero-adm">{adm}</strong>
        </div>
      </div>
    </section>
  );
}

export default Cards;