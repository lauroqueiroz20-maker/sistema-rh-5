import cargosData from "../../data/cargos";

const cargos = cargosData
  .filter((cargo) => cargo.ativo)
  .map((cargo) => cargo.cargo);

export default cargos;