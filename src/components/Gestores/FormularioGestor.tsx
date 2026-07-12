import { useState } from "react";

import unidades from "../../data/unidades";
import {
  type Gestor,
  type TipoContato,
} from "../../data/gestores";

type FormularioGestorProps = {
  onCadastrar: (gestor: Gestor) => void;
};

function FormularioGestor({ onCadastrar }: FormularioGestorProps) {
  const [codigo, setCodigo] = useState("");
  const [unidade, setUnidade] = useState("");
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [tipoContato, setTipoContato] =
    useState<TipoContato>("GESTOR");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] =
    useState<"ATIVO" | "INATIVO">("ATIVO");
  const [recebeDisparoDiario, setRecebeDisparoDiario] =
    useState(true);

  function selecionarUnidade(codigoSelecionado: string) {
    const unidadeEncontrada = unidades.find(
      (item) => String(item.codigo) === codigoSelecionado
    );

    setCodigo(codigoSelecionado);
    setUnidade(unidadeEncontrada?.nome || "");
  }

  function alterarTipoContato(novoTipo: TipoContato) {
    setTipoContato(novoTipo);

    if (novoTipo === "GESTOR") {
      setRecebeDisparoDiario(true);
      return;
    }

    setRecebeDisparoDiario(false);
  }

  function salvarGestor() {
    if (!nome.trim()) {
      alert("Informe o nome do contato.");
      return;
    }

    if (!cargo.trim()) {
      alert("Informe o cargo.");
      return;
    }

    if (!telefone.trim()) {
      alert("Informe o WhatsApp.");
      return;
    }

    if (tipoContato === "GESTOR" && (!codigo || !unidade)) {
      alert("Selecione a unidade do gestor.");
      return;
    }

    if (
      email.trim() &&
      !email.includes("@")
    ) {
      alert("Informe um e-mail válido.");
      return;
    }

    const agora = new Date().toISOString();

    const codigoFinal =
      tipoContato === "GESTOR"
        ? codigo
        : `CONTATO-${Date.now()}`;

    const unidadeFinal =
      tipoContato === "GESTOR"
        ? unidade
        : unidade.trim() || "MATRIZ";

    const novoGestor: Gestor = {
      id: crypto.randomUUID(),
      codigo: codigoFinal,
      unidade: unidadeFinal,
      nome: nome.trim(),
      cargo: cargo.trim(),
      tipoContato,
      telefone: telefone.replace(/\D/g, ""),
      email: email.trim().toLowerCase(),
      ativo: status === "ATIVO",
      recebeDisparoDiario,
      criadoEm: agora,
      atualizadoEm: agora,
    };

    onCadastrar(novoGestor);

    setCodigo("");
    setUnidade("");
    setNome("");
    setCargo("");
    setTipoContato("GESTOR");
    setTelefone("");
    setEmail("");
    setStatus("ATIVO");
    setRecebeDisparoDiario(true);
  }

  return (
    <div className="formulario-gestor">
      <h2>Cadastro de Contato Estratégico</h2>

      <div className="gestor-form-grid">
        <div className="campo-gestor">
          <label>Tipo de contato</label>

          <select
            value={tipoContato}
            onChange={(event) =>
              alterarTipoContato(
                event.target.value as TipoContato
              )
            }
          >
            <option value="GESTOR">Gestor</option>
            <option value="DIRETORIA">Diretoria</option>
            <option value="RH">RH</option>
            <option value="DP">DP</option>
            <option value="OPERAÇÕES">Operações</option>
            <option value="FINANCEIRO">Financeiro</option>
            <option value="OUTRO">Outro</option>
          </select>
        </div>

        <div className="campo-gestor">
          <label>
            {tipoContato === "GESTOR"
              ? "Unidade"
              : "Unidade / Área"}
          </label>

          {tipoContato === "GESTOR" ? (
            <select
              value={codigo}
              onChange={(event) =>
                selecionarUnidade(event.target.value)
              }
            >
              <option value="" disabled>
                Selecione a unidade
              </option>

              {unidades.map((item) => (
                <option
                  key={item.codigo}
                  value={String(item.codigo)}
                >
                  {item.nome}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={unidade}
              onChange={(event) =>
                setUnidade(event.target.value)
              }
              placeholder="Ex.: Matriz, RH, DP ou Diretoria"
            />
          )}
        </div>

        <div className="campo-gestor">
          <label>Nome completo</label>

          <input
            type="text"
            value={nome}
            onChange={(event) =>
              setNome(event.target.value)
            }
            placeholder="Digite o nome completo"
          />
        </div>

        <div className="campo-gestor">
          <label>Cargo</label>

          <input
            type="text"
            value={cargo}
            onChange={(event) =>
              setCargo(event.target.value)
            }
            placeholder="Ex.: Gerente, Diretor, Coordenador"
          />
        </div>

        <div className="campo-gestor">
          <label>WhatsApp</label>

          <input
            type="text"
            value={telefone}
            onChange={(event) =>
              setTelefone(event.target.value)
            }
            placeholder="(88) 9 9999-9999"
          />
        </div>

        <div className="campo-gestor">
          <label>E-mail</label>

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="nome@empresa.com.br"
          />
        </div>

        <div className="campo-gestor">
          <label>Status</label>

          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value as "ATIVO" | "INATIVO"
              )
            }
          >
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
          </select>
        </div>

        <div className="campo-gestor">
          <label>Recebe disparo diário?</label>

          <select
            value={recebeDisparoDiario ? "SIM" : "NÃO"}
            onChange={(event) =>
              setRecebeDisparoDiario(
                event.target.value === "SIM"
              )
            }
          >
            <option value="SIM">Sim</option>
            <option value="NÃO">Não</option>
          </select>
        </div>
      </div>

      <div className="gestor-form-acoes">
        <button
          type="button"
          className="botao-salvar-gestor"
          onClick={salvarGestor}
        >
          Cadastrar Contato
        </button>
      </div>
    </div>
  );
}

export default FormularioGestor;