type PainelExecutivoProps = {
  pcd: number;
  aprendiz: number;
  adm: number;
  inventario: number;
  percentualDemanda: string;
  unidadesEstaveis: number;
  admitidos: number;
};

export default function PainelExecutivo({
  pcd,
  aprendiz,
  adm,
  inventario,
  percentualDemanda,
  unidadesEstaveis,
  admitidos,
}: PainelExecutivoProps) {
  const possuiAdmissoes = admitidos > 0;

  return (
    <section className="rpaisagem-painel">
      <div className="rpaisagem-painel-titulo">
        PAINEL EXECUTIVO
      </div>

      <div className="rpaisagem-painel-grid">
        <div className="rpaisagem-painel-item rpaisagem-painel-pcd">
          <span>PCD</span>
          <strong>{possuiAdmissoes ? pcd : 0}</strong>
        </div>

        <div className="rpaisagem-painel-item rpaisagem-painel-aprendiz">
          <span>JOVEM APRENDIZ</span>
          <strong>{possuiAdmissoes ? aprendiz : 0}</strong>
        </div>

        <div className="rpaisagem-painel-item rpaisagem-painel-adm">
          <span>ADM</span>
          <strong>{possuiAdmissoes ? adm : 0}</strong>
        </div>

        <div className="rpaisagem-painel-item rpaisagem-painel-inventario">
          <span>INVENTARIO</span>
          <strong>{possuiAdmissoes ? inventario : 0}</strong>
        </div>

        <div className="rpaisagem-painel-item rpaisagem-painel-estaveis">
          <span>UNIDADES ESTAVEIS</span>
          <strong>{unidadesEstaveis}</strong>
        </div>

        <div className="rpaisagem-painel-item rpaisagem-painel-demanda">
          <span>% DEMANDA</span>
          <strong>{percentualDemanda}</strong>
        </div>
      </div>
    </section>
  );
}
