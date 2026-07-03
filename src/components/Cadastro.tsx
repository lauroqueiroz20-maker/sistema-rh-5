import { useRef, useState } from "react";

import unidades from "../data/unidades";
import tipos from "../data/tipos";
import motivos from "../data/motivos";
import cargos from "../data/cargos";
import { type Vaga } from "../data/vagas";

interface CadastroProps {
  vagas: Vaga[];
  onAdicionarVagas: (novasVagas: Vaga[]) => void;
  onSelecionarCodigo: (codigo: string) => void;
  onAlterarModo: (modo: "novo" | "atualizar") => void;
  onConfirmarAtualizacao: () => void;
  temAtualizacaoPendente: boolean;
  onGerarPDF: () => void;
}

function Cadastro({
  vagas,
  onAdicionarVagas,
  onSelecionarCodigo,
  onAlterarModo,
  onConfirmarAtualizacao,
  temAtualizacaoPendente,
  onGerarPDF,
}: CadastroProps) {
  const codigoRef = useRef<HTMLInputElement>(null);

  const [aba, setAba] = useState<"novo" | "atualizar">("novo");

  const [codigo, setCodigo] = useState("");
  const [codigoConfirmado, setCodigoConfirmado] = useState("");
  const [unidade, setUnidade] = useState("");

  const [quantidade, setQuantidade] = useState("");
  const [tipo, setTipo] = useState("");
  const [cargoSelecionado, setCargoSelecionado] = useState("");
  const [setor, setSetor] = useState("");
  const [turno, setTurno] = useState<"D" | "N" | "">("");
  const [motivo, setMotivo] = useState("");
  const [emergencia, setEmergencia] = useState<"SIM" | "NÃO">("NÃO");

  function limparCampos(limparUnidade = true) {
    setQuantidade("");
    setTipo("");
    setCargoSelecionado("");
    setSetor("");
    setTurno("");
    setMotivo("");
    setEmergencia("NÃO");

    if (limparUnidade) {
      setCodigo("");
      setCodigoConfirmado("");
      setUnidade("");
      onSelecionarCodigo("");
    }

    setTimeout(() => {
      codigoRef.current?.focus();
    }, 100);
  }

function confirmarCodigo() {
  if (!codigo) return;

  // Mostrar todas as unidades
  if (codigo === "0") {
    setCodigoConfirmado("0");
    setUnidade("TODAS AS UNIDADES");
    setCodigo("");
    onSelecionarCodigo("0");
    return;
  }

  const codigoFormatado = codigo.padStart(3, "0");

  const unidadeEncontrada = unidades.find(
    (item) => item.codigo === codigoFormatado
  );

  if (!unidadeEncontrada) {
    alert("Código da unidade não encontrado.");
    setCodigo("");
    codigoRef.current?.focus();
    return;
  }

  setCodigoConfirmado(codigoFormatado);
  setUnidade(unidadeEncontrada.nome.toUpperCase());
  setCodigo("");
  onSelecionarCodigo(codigoFormatado);
}

  function selecionarCargo(cargo: string) {
    setCargoSelecionado(cargo);

    const cargoEncontrado = cargos.find((item) => item.cargo === cargo);
    setSetor(cargoEncontrado ? cargoEncontrado.setor : "");
  }

  function salvarCadastro() {
    if (
      !codigoConfirmado ||
      !unidade ||
      !quantidade ||
      !tipo ||
      !cargoSelecionado ||
      !setor ||
      !turno ||
      !motivo
    ) {
      alert("Preencha os campos obrigatórios.");
      return;
    }

    const qtde = Number(quantidade);

    if (qtde <= 0) {
      alert("A quantidade precisa ser maior que zero.");
      return;
    }

    const maiorId =
      vagas.length > 0 ? Math.max(...vagas.map((vaga) => vaga.id)) : 0;

    const novasVagas: Vaga[] = Array.from({ length: qtde }, (_, index) => ({
      id: maiorId + index + 1,
      codigo: codigoConfirmado,
      unidade: unidade.toUpperCase(),
      data: new Date().toLocaleDateString("pt-BR"),
      quantidade: 1,
      tipo,
      cargo: cargoSelecionado,
      setor,
      turno,
      motivo,
      emergencia,
      admissoes: 0,
      ativo: true,
    }));

    onAdicionarVagas(novasVagas);

    alert(`${qtde} vaga(s) cadastrada(s) com sucesso!`);
    limparCampos(false);
  }

  return (
    <section className="central">
      <div className="abas">
        <button
          className={aba === "novo" ? "aba-ativa" : ""}
onClick={() => {
  setAba("novo");
  onAlterarModo("novo");
  limparCampos(false);
}}
        >
          Novo Cadastro
        </button>

        <button
          className={aba === "atualizar" ? "aba-ativa" : ""}
          onClick={() => {
  setAba("atualizar");
  onAlterarModo("atualizar");
  limparCampos(false);
}}
        >
          Atualizar Cadastro
        </button>
      </div>

      <div className="formulario">
        <div>
          <label>Código da Unidade</label>
          <input
            ref={codigoRef}
            type="number"
            placeholder="Ex: 3 + Enter"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmarCodigo();
            }}
          />
        </div>

        <div>
          <label>Unidade</label>
          <input value={unidade} placeholder="Automático" readOnly />
        </div>

        {aba === "novo" && (
          <>
            <div>
              <label>Quantidade</label>
              <input
                type="number"
                placeholder="Ex: 4"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
              />
            </div>

            <div>
              <label>Tipo</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="">Selecione</option>
                {tipos.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Cargo</label>
              <select
                value={cargoSelecionado}
                onChange={(e) => selecionarCargo(e.target.value)}
              >
                <option value="">Selecione o cargo</option>
                {cargos
                  .filter((item) => item.ativo)
                  .map((item) => (
                    <option key={item.id} value={item.cargo}>
                      {item.cargo}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label>Setor</label>
              <input value={setor} placeholder="Automático" readOnly />
            </div>

            <div>
              <label>Turno</label>
              <select
                value={turno}
                onChange={(e) => setTurno(e.target.value as "D" | "N")}
              >
                <option value="">Selecione</option>
                <option value="D">D</option>
                <option value="N">N</option>
              </select>
            </div>

            <div>
              <label>Motivo</label>
              <select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                <option value="">Selecione</option>
                {motivos.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Emergência</label>
              <select
                value={emergencia}
                onChange={(e) =>
                  setEmergencia(e.target.value as "SIM" | "NÃO")
                }
              >
                <option value="NÃO">NÃO</option>
                <option value="SIM">SIM</option>
              </select>
            </div>
          </>
        )}
      </div>

      {aba === "novo" && (
        <>
          <button className="salvar" onClick={salvarCadastro}>
            Salvar Cadastro
          </button>

          <button className="salvar botao-pdf-cadastro" onClick={onGerarPDF}>
            📄 Gerar Relatório PDF
          </button>
        </>
      )}

      {aba === "atualizar" && (
        <button className="salvar" onClick={onConfirmarAtualizacao}>
          {temAtualizacaoPendente
            ? "Confirmar Atualização"
            : "Atualizar Cadastro"}
        </button>
      )}
    </section>
  );
}

export default Cadastro;