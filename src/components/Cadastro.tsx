import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import unidades from "../data/unidades";
import tipos from "../data/tipos";
import motivos from "../data/motivos";
import cargos from "../data/cargos";
import { type Vaga } from "../data/vagas";
import "./Cadastro.css";

import eventBus from "../Services/eventBus";

interface CadastroProps {
  vagas: Vaga[];
  onAdicionarVagas: (novasVagas: Vaga[]) => void;
  onSelecionarCodigo: (codigo: string) => void;
  onAlterarModo: (modo: "novo" | "atualizar") => void;
  onConfirmarAtualizacao: () => void;
  temAtualizacaoPendente: boolean;
  onGerarPDF: () => void;
  onImprimir: () => void;
}

type SolicitacaoGestor = {
  id: string;
  unidade: string;
  tipo: string;
  cargo: string;
  quantidade: number;
  turno: string;
  motivo: string;
  emergencia: string;
  gestor?: string;
  codigoGestor?: string;
};

const CHAVE_FILA_GESTORES =
  "sistema-rh-solicitacoes-gestores";

const CHAVE_MONITOR_GESTORES =
  "sistema-rh-monitor-gestores";

const CHAVE_HISTORICO_GESTORES =
  "sistema-rh-historico-gestores";

const CHAVE_SOLICITACOES_PROCESSADAS =
  "sistema-rh-solicitacoes-processadas";

function normalizarTexto(valor: unknown) {
  return String(valor || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function carregarLista<T>(chave: string): T[] {
  try {
    const dadosSalvos = localStorage.getItem(chave);

    if (!dadosSalvos) {
      return [];
    }

    const dadosConvertidos = JSON.parse(dadosSalvos);

    return Array.isArray(dadosConvertidos)
      ? dadosConvertidos
      : [];
  } catch {
    return [];
  }
}

function salvarLista<T>(chave: string, lista: T[]) {
  localStorage.setItem(
    chave,
    JSON.stringify(lista)
  );
}

function obterCargoIndicador(tipo: string) {
  const tipoNormalizado =
    normalizarTexto(tipo);

  if (tipoNormalizado.includes("APRENDIZ")) {
    return "J. APRENDIZ";
  }

  if (tipoNormalizado.includes("INVENTARIO")) {
    return "INVENTÁRIO";
  }

  if (tipoNormalizado === "ADM") {
    return "ADM";
  }

  if (tipoNormalizado === "PCD") {
    return "PCD";
  }

  return "";
}

function Cadastro({
  vagas,
  onAdicionarVagas,
  onSelecionarCodigo,
  onConfirmarAtualizacao,
  temAtualizacaoPendente,
  onGerarPDF,
  onImprimir,
}: CadastroProps) {
  const codigoRef =
    useRef<HTMLInputElement>(null);

  const quantidadeRef =
    useRef<HTMLInputElement>(null);

  const timerCodigo =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const processandoSolicitacoesRef =
    useRef(false);

  const [codigo, setCodigo] = useState("");
  const [codigoConfirmado, setCodigoConfirmado] =
    useState("");
  const [unidade, setUnidade] = useState("");

  const [quantidade, setQuantidade] =
    useState("1");

  const [tipo, setTipo] =
    useState("OPERAC.");

  const [
    cargoSelecionado,
    setCargoSelecionado,
  ] = useState("");

  const [setor, setSetor] = useState("");

  const [turno, setTurno] =
    useState<"D" | "N">("D");

  const [motivo, setMotivo] =
    useState("DESLIG.");

  const [emergencia, setEmergencia] =
    useState<"SIM" | "NÃO" | "ESTÁVEL">(
      "NÃO"
    );

  function limparCampos(
    limparUnidade = true
  ) {
    setQuantidade("1");
    setTipo("OPERAC.");
    setCargoSelecionado("");
    setSetor("");
    setTurno("D");
    setMotivo("DESLIG.");
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

  function selecionarCargo(cargo: string) {
    setCargoSelecionado(cargo);

    const cargoEncontrado = cargos.find(
      (item) =>
        normalizarTexto(item.cargo) ===
        normalizarTexto(cargo)
    );

    setSetor(
      cargoEncontrado
        ? cargoEncontrado.setor
        : ""
    );
  }

  function selecionarTipo(
    novoTipo: string
  ) {
    setTipo(novoTipo);

    const cargoIndicador =
      obterCargoIndicador(novoTipo);

    if (!cargoIndicador) {
      return;
    }

    const cargoEncontrado = cargos.find(
      (item) =>
        normalizarTexto(item.cargo) ===
        normalizarTexto(cargoIndicador)
    );

    setCargoSelecionado(cargoIndicador);
    setSetor(
      cargoEncontrado?.setor ||
        cargoIndicador
    );
  }

  function selecionarCodigo(valor: string) {
    setCodigo(valor);

    if (timerCodigo.current) {
      clearTimeout(timerCodigo.current);
    }

    if (valor === "") {
      return;
    }

    timerCodigo.current = setTimeout(() => {
      const codigoAtual =
        codigoRef.current?.value || "";

      if (codigoAtual === "") {
        return;
      }

      if (codigoAtual === "0") {
        setCodigoConfirmado("0");
        setUnidade("TODAS AS UNIDADES");
        onSelecionarCodigo("0");

        setCodigo("");

        quantidadeRef.current?.focus();
        quantidadeRef.current?.select();

        return;
      }

      const codigoFormatado =
        codigoAtual.padStart(3, "0");

      const unidadeEncontrada =
        unidades.find(
          (item) =>
            item.codigo === codigoFormatado
        );

      if (!unidadeEncontrada) {
        setCodigoConfirmado("");
        setUnidade("");
        onSelecionarCodigo("");

        alert(
          "Código de unidade não encontrado."
        );

        codigoRef.current?.focus();
        codigoRef.current?.select();

        return;
      }

      setCodigoConfirmado(
        codigoFormatado
      );

      setUnidade(
        unidadeEncontrada.nome.toUpperCase()
      );

      onSelecionarCodigo(
        codigoFormatado
      );

      setCodigo("");

      quantidadeRef.current?.focus();
      quantidadeRef.current?.select();
    }, 650);
  }

  function salvarCadastro() {
    const ehEstavel =
      emergencia === "ESTÁVEL";

    const tipoFinal = ehEstavel
      ? "ESTÁVEL"
      : tipo;

    const cargoIndicador =
      obterCargoIndicador(tipoFinal);

    const qtde = ehEstavel
      ? 1
      : Number(quantidade);

    if (
      !codigoConfirmado ||
      !unidade
    ) {
      alert("Selecione a unidade.");
      return;
    }

    if (!ehEstavel) {
      if (
        !tipoFinal ||
        (!cargoIndicador &&
          !cargoSelecionado) ||
        (!cargoIndicador && !setor) ||
        !turno ||
        !motivo
      ) {
        alert(
          "Preencha os campos obrigatórios."
        );
        return;
      }
    }

    if (
      !ehEstavel &&
      (!Number.isFinite(qtde) ||
        qtde <= 0)
    ) {
      alert(
        "A quantidade precisa ser maior que zero."
      );
      return;
    }

    const maiorId =
      vagas.length > 0
        ? Math.max(
            ...vagas.map(
              (vaga) => vaga.id
            )
          )
        : 0;

    const dataSolicitacao =
      new Date().toLocaleDateString(
        "pt-BR"
      );

    const novasVagas: Vaga[] =
      Array.from(
        { length: qtde },
        (_, index) => ({
          id: maiorId + index + 1,
          codigo: codigoConfirmado,
          unidade:
            unidade.toUpperCase(),
          data: dataSolicitacao,
          quantidade: ehEstavel
            ? 0
            : 1,
          tipo: tipoFinal,
          cargo: ehEstavel
            ? "ESTÁVEL"
            : cargoIndicador ||
              cargoSelecionado,
          setor: ehEstavel
            ? "ESTÁVEL"
            : setor ||
              cargoIndicador,
          turno: ehEstavel
            ? "D"
            : turno,
          motivo: ehEstavel
            ? "ESTÁVEL"
            : motivo,
          emergencia: ehEstavel
            ? "NÃO"
            : emergencia,
          admissoes: 0,
          ativo: true,
        })
      );

    onAdicionarVagas(novasVagas);

    eventBus.emit(
      "VAGA_CRIADA",
      {
        origem: "CADASTRO_MANUAL",
        vagas: novasVagas,
      }
    );

    alert(
      ehEstavel
        ? "Índice cadastrado com sucesso!"
        : `${qtde} vaga(s) cadastrada(s) com sucesso!`
    );

    limparCampos(false);
  }

  function salvarOuAtualizar() {
    if (temAtualizacaoPendente) {
      onConfirmarAtualizacao();
      return;
    }

    salvarCadastro();
  }

  const processarSolicitacoesGestores =
    useCallback((
    solicitacoesRecebidas:
      SolicitacaoGestor[]
  ) => {
    if (
      processandoSolicitacoesRef.current
    ) {
      return;
    }

    if (
      solicitacoesRecebidas.length === 0
    ) {
      return;
    }

    processandoSolicitacoesRef.current =
      true;

    try {
      const idsProcessados =
        carregarLista<string>(
          CHAVE_SOLICITACOES_PROCESSADAS
        );

      const idsProcessadosSet =
        new Set(idsProcessados);

      const solicitacoesValidas:
        SolicitacaoGestor[] = [];

      const solicitacoesComErro:
        SolicitacaoGestor[] = [];

      for (
        const solicitacao of
        solicitacoesRecebidas
      ) {
        if (
          !solicitacao.id ||
          idsProcessadosSet.has(
            solicitacao.id
          )
        ) {
          continue;
        }

        const unidadeEncontrada =
          unidades.find(
            (item) =>
              normalizarTexto(
                item.nome
              ) ===
              normalizarTexto(
                solicitacao.unidade
              )
          );

        const cargoEncontrado =
          cargos.find(
            (item) =>
              item.ativo &&
              normalizarTexto(
                item.cargo
              ) ===
                normalizarTexto(
                  solicitacao.cargo
                )
          );

        const quantidadeSolicitada =
          Number(
            solicitacao.quantidade
          );

        const turnoSolicitado =
          normalizarTexto(
            solicitacao.turno
          );

        const emergenciaSolicitada =
          normalizarTexto(
            solicitacao.emergencia
          );

        const solicitacaoValida =
          Boolean(unidadeEncontrada) &&
          Boolean(cargoEncontrado) &&
          Boolean(
            String(
              solicitacao.tipo || ""
            ).trim()
          ) &&
          Boolean(
            String(
              solicitacao.motivo || ""
            ).trim()
          ) &&
          Number.isFinite(
            quantidadeSolicitada
          ) &&
          quantidadeSolicitada > 0 &&
          [
            "D",
            "N",
            "DIURNO",
            "NOTURNO",
          ].includes(
            turnoSolicitado
          ) &&
          [
            "SIM",
            "NAO",
            "NÃO",
          ].includes(
            emergenciaSolicitada
          );

        if (!solicitacaoValida) {
          solicitacoesComErro.push(
            solicitacao
          );
          continue;
        }

        solicitacoesValidas.push(
          solicitacao
        );
      }

      if (
        solicitacoesValidas.length === 0
      ) {
        if (
          solicitacoesComErro.length > 0
        ) {
          alert(
            "Existem solicitações com dados inválidos no Monitor de Gestores."
          );
        }

        return;
      }

      let proximoId =
        vagas.length > 0
          ? Math.max(
              ...vagas.map(
                (vaga) => vaga.id
              )
            ) + 1
          : 1;

      const dataAtual =
        new Date().toLocaleDateString(
          "pt-BR"
        );

      const novasVagas: Vaga[] = [];

      for (
        const solicitacao of
        solicitacoesValidas
      ) {
        const unidadeEncontrada =
          unidades.find(
            (item) =>
              normalizarTexto(
                item.nome
              ) ===
              normalizarTexto(
                solicitacao.unidade
              )
          );

        const cargoEncontrado =
          cargos.find(
            (item) =>
              item.ativo &&
              normalizarTexto(
                item.cargo
              ) ===
                normalizarTexto(
                  solicitacao.cargo
                )
          );

        if (
          !unidadeEncontrada ||
          !cargoEncontrado
        ) {
          continue;
        }

        const quantidadeSolicitada =
          Number(
            solicitacao.quantidade
          );

        const emergenciaFinal =
          normalizarTexto(
            solicitacao.emergencia
          ) === "SIM"
            ? "SIM"
            : "NÃO";

        const turnoNormalizado =
          normalizarTexto(
            solicitacao.turno
          );

        const turnoFinal =
          turnoNormalizado === "N" ||
          turnoNormalizado === "NOTURNO"
            ? "N"
            : "D";

        for (
          let indice = 0;
          indice <
          quantidadeSolicitada;
          indice += 1
        ) {
          novasVagas.push({
            id: proximoId,
            codigo:
              unidadeEncontrada.codigo,
            unidade:
              unidadeEncontrada.nome.toUpperCase(),
            data: dataAtual,
            quantidade: 1,
            tipo: String(
              solicitacao.tipo
            )
              .trim()
              .toUpperCase(),
            cargo:
              cargoEncontrado.cargo,
            setor:
              cargoEncontrado.setor,
            turno: turnoFinal,
            motivo: String(
              solicitacao.motivo
            )
              .trim()
              .toUpperCase(),
            emergencia:
              emergenciaFinal,
            admissoes: 0,
            ativo: true,
          });

          proximoId += 1;
        }
      }

      if (novasVagas.length === 0) {
        return;
      }

      const idsConcluidos =
        solicitacoesValidas.map(
          (item) => item.id
        );

      const novosIdsProcessados = [
        ...idsProcessadosSet,
        ...idsConcluidos,
      ];

      salvarLista(
        CHAVE_SOLICITACOES_PROCESSADAS,
        novosIdsProcessados
      );

      const filaAtual =
        carregarLista<SolicitacaoGestor>(
          CHAVE_FILA_GESTORES
        );

      const novaFila =
        filaAtual.filter(
          (item) =>
            !idsConcluidos.includes(
              item.id
            )
        );

      salvarLista(
        CHAVE_FILA_GESTORES,
        novaFila
      );

      const monitorAtual =
        carregarLista<SolicitacaoGestor>(
          CHAVE_MONITOR_GESTORES
        );

      const novoMonitor =
        monitorAtual.filter(
          (item) =>
            !idsConcluidos.includes(
              item.id
            )
        );

      salvarLista(
        CHAVE_MONITOR_GESTORES,
        novoMonitor
      );

      const historicoAtual =
        carregarLista<
          SolicitacaoGestor & {
            status: string;
            concluidoEm: string;
          }
        >(
          CHAVE_HISTORICO_GESTORES
        );

      const concluidoEm =
        new Date().toISOString();

      const registrosHistorico =
        solicitacoesValidas.map(
          (item) => ({
            ...item,
            status: "CONCLUÍDO",
            concluidoEm,
          })
        );

      salvarLista(
        CHAVE_HISTORICO_GESTORES,
        [
          ...historicoAtual,
          ...registrosHistorico,
        ]
      );

      onAdicionarVagas(novasVagas);

      eventBus.emit(
        "VAGA_CRIADA",
        {
          origem:
            "CENTRAL_GESTORES",
          solicitacaoIds:
            idsConcluidos,
          vagas: novasVagas,
        }
      );

      eventBus.emit(
        "CADASTRO_ATUALIZADO",
        {
          origem:
            "CENTRAL_GESTORES",
          solicitacaoIds:
            idsConcluidos,
          totalVagas:
            novasVagas.length,
        }
      );

      window.dispatchEvent(
        new CustomEvent(
          "sistema-rh-monitor-atualizado",
          {
            detail: {
              solicitacaoIds:
                idsConcluidos,
            },
          }
        )
      );

      alert(
        `${novasVagas.length} vaga(s) recebida(s) da Central de Gestores e cadastrada(s) com sucesso.`
      );
    } finally {
      processandoSolicitacoesRef.current =
        false;
    }
  }, [onAdicionarVagas, vagas]);

  useEffect(() => {
    const filaPendente =
      carregarLista<SolicitacaoGestor>(
        CHAVE_FILA_GESTORES
      );

    processarSolicitacoesGestores(
      filaPendente
    );

    function receberSolicitacao(
      dados?: unknown
    ) {
      if (!dados) {
        return;
      }

      const solicitacao =
        dados as SolicitacaoGestor;

      processarSolicitacoesGestores([
        solicitacao,
      ]);
    }

    eventBus.on(
      "SOLICITACAO_APROVADA",
      receberSolicitacao
    );

    return () => {
      eventBus.off(
        "SOLICITACAO_APROVADA",
        receberSolicitacao
      );
    };
  }, [processarSolicitacoesGestores]);

  return (
    <section className="central">
      <div className="cabecalho-cadastro">
        <h2>
          Central de Cadastro de Vagas
        </h2>
      </div>

      <div className="formulario">
        <div>
          <label>
            Código da Unidade
          </label>

          <input
            ref={codigoRef}
            type="number"
            placeholder="0 = Todas"
            value={codigo}
            onChange={(evento) =>
              selecionarCodigo(
                evento.target.value
              )
            }
          />
        </div>

        <div className="unidade-destaque">
          <span>
            Unidade Selecionada
          </span>

          <strong>
            {unidade ||
              "NENHUMA UNIDADE"}
          </strong>
        </div>

        <div>
          <label>Quantidade</label>

          <input
            ref={quantidadeRef}
            type="number"
            min="1"
            placeholder={
              emergencia === "ESTÁVEL"
                ? "0"
                : "Ex: 4"
            }
            value={
              emergencia === "ESTÁVEL"
                ? "0"
                : quantidade
            }
            disabled={
              emergencia === "ESTÁVEL"
            }
            onChange={(evento) =>
              setQuantidade(
                evento.target.value
              )
            }
          />
        </div>

        <div>
          <label>Tipo</label>

          <select
            value={tipo}
            disabled={
              emergencia === "ESTÁVEL"
            }
            onChange={(evento) =>
              selecionarTipo(
                evento.target.value
              )
            }
          >
            <option value="">
              Selecione
            </option>

            {tipos.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Cargo</label>

          <select
            value={cargoSelecionado}
            disabled={
              emergencia === "ESTÁVEL"
            }
            onChange={(evento) =>
              selecionarCargo(
                evento.target.value
              )
            }
          >
            <option value="">
              Selecione o cargo
            </option>

            {cargos
              .filter(
                (item) => item.ativo
              )
              .map((item) => (
                <option
                  key={item.id}
                  value={item.cargo}
                >
                  {item.cargo}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label>Setor</label>

          <input
            value={
              emergencia === "ESTÁVEL"
                ? "ESTÁVEL"
                : setor
            }
            placeholder="Automático"
            readOnly
          />
        </div>

        <div>
          <label>Turno</label>

          <select
            value={turno}
            disabled={
              emergencia === "ESTÁVEL"
            }
            onChange={(evento) =>
              setTurno(
                evento.target.value as
                  | "D"
                  | "N"
              )
            }
          >
            <option value="D">
              D
            </option>

            <option value="N">
              N
            </option>
          </select>
        </div>

        <div>
          <label>Motivo</label>

          <select
            value={motivo}
            disabled={
              emergencia === "ESTÁVEL"
            }
            onChange={(evento) =>
              setMotivo(
                evento.target.value
              )
            }
          >
            <option value="">
              Selecione
            </option>

            {motivos.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Emergência</label>

          <select
            value={emergencia}
            onChange={(evento) =>
              setEmergencia(
                evento.target.value as
                  | "SIM"
                  | "NÃO"
                  | "ESTÁVEL"
              )
            }
          >
            <option value="NÃO">
              NÃO
            </option>

            <option value="SIM">
              SIM
            </option>

            <option value="ESTÁVEL">
              ESTÁVEL
            </option>
          </select>
        </div>

        <div className="campo-salvar-lateral">
          <button
            type="button"
            className="btn-cadastro btn-salvar"
            onClick={salvarOuAtualizar}
          >
            {temAtualizacaoPendente
              ? "Salvar atualização"
              : "Salvar"}
          </button>
        </div>
      </div>

<div className="botoes-cadastro-grid">
        <button
          type="button"
          className="btn-cadastro btn-fim-ciclo"
          onClick={onImprimir}
        >
          Fim ciclo
        </button>

        <button
          type="button"
          className="btn-cadastro btn-gerar"
          onClick={onGerarPDF}
        >
          Gerar PDF
        </button>
      </div>

    </section>
  );
}

export default Cadastro;
