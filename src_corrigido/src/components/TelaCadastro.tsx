import motivos from "../data/motivos";
import { type Vaga } from "../data/vagas";

interface TelaCadastroProps {
  vagas: Vaga[];
  modo: "novo" | "atualizar";
  onAtualizarMotivo: (id: number, motivo: string) => void;
  onAlternarAdmissao: (id: number) => void;
}

function classeTipo(tipo: string) {
  if (tipo === "PCD") return "tipo-pcd";
  if (tipo === "J. APRENDIZ") return "tipo-ja";
  if (tipo === "INVENTÁRIO") return "tipo-inv";
  if (tipo === "ADM") return "tipo-adm";
  if (tipo === "ESTÁVEL") return "tipo-estavel";

  return "";
}

function classeLinha(tipo: string) {
  if (tipo === "ESTÁVEL") return "tipo-estavel";

  return "";
}

function TelaCadastro({
  vagas,
  modo,
  onAtualizarMotivo,
  onAlternarAdmissao,
}: TelaCadastroProps) {
  const unidadesNaTabela: string[] = [];

  vagas.forEach((vaga) => {
    if (!unidadesNaTabela.includes(vaga.unidade)) {
      unidadesNaTabela.push(vaga.unidade);
    }
  });

  function classeGrupoUnidade(unidade: string) {
    const indice = unidadesNaTabela.indexOf(unidade);
    return indice % 2 === 1 ? "grupo-unidade-azul" : "";
  }

  function primeiraLinhaUnidade(index: number) {
    if (index === 0) return true;
    return vagas[index - 1].unidade !== vagas[index].unidade;
  }

  return (
    <section className="painel-atualizacao">
      <table>
        <thead>
          <tr>
            <th>Unidade</th>
            <th>Tipo</th>
            <th>Cargo</th>
            <th>Setor</th>
            <th>Qtde</th>
            <th>Turno</th>
            <th>Motivo</th>
            <th>Emerg.</th>
            <th>ADM</th>
            <th>Data</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {vagas.map((vaga, index) => {
            const concluida = vaga.admissoes >= 1;
            const destaqueEstavel = classeLinha(vaga.tipo);

            const classeLinhaTabela = [
              classeGrupoUnidade(vaga.unidade),
              primeiraLinhaUnidade(index) ? "inicio-unidade" : "",
            ]
              .join(" ")
              .trim();

            return (
              <tr key={vaga.id} className={classeLinhaTabela}>
                <td className={destaqueEstavel}>{vaga.unidade}</td>
                <td className={classeTipo(vaga.tipo)}>{vaga.tipo}</td>
                <td className={destaqueEstavel}>{vaga.cargo}</td>
                <td className={destaqueEstavel}>{vaga.setor}</td>
                <td className={destaqueEstavel}>{vaga.quantidade}</td>
                <td className={destaqueEstavel}>{vaga.turno}</td>

                <td className={destaqueEstavel}>
                  {modo === "novo" && !concluida ? (
                    <select
                      className="select-motivo-tabela"
                      value={vaga.motivo}
                      onChange={(e) =>
                        onAtualizarMotivo(vaga.id, e.target.value)
                      }
                    >
                      {motivos.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  ) : (
                    vaga.motivo
                  )}
                </td>

                <td className={destaqueEstavel}>{vaga.emergencia}</td>

                <td className={destaqueEstavel}>
                  {modo === "atualizar" ? (
                    <button
                      className={concluida ? "botao-adm marcado" : "botao-adm"}
                      onClick={() => onAlternarAdmissao(vaga.id)}
                    >
                      {concluida ? "✓" : "□"}
                    </button>
                  ) : (
                    vaga.admissoes
                  )}
                </td>

                <td className={destaqueEstavel}>{vaga.data}</td>

                <td>
                  <span
                    className={
                      concluida
                        ? `status ativo ${destaqueEstavel}`
                        : `status pendente ${destaqueEstavel}`
                    }
                  >
                    {concluida ? "Concluída" : "Aberta"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

export default TelaCadastro;