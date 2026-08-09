import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import unidadesPadrao from "../data/unidades";
import tipos from "../data/tipos";
import motivos from "../data/motivos";
import cargos from "../data/cargos";
import { type Vaga } from "../data/vagas";
import "./Cadastro.css";

import eventBus from "../Services/eventBus";
import {
  EVENTO_ESTRUTURA_CADASTRO,
  listarUnidadesConfiguradas,
} from "../Services/estruturaCadastroService";

const EVENTO_GESTORES_ATUALIZADOS = "sistema-rh-gestores-atualizados";
const CHAVE_GESTORES = "sistema-rh-gestores";

type UnidadeCadastro = {
  codigo: string;
  nome: string;
  colaboradores: number;
};

type GestorUnidade = {
  codigo?: string;
  unidade?: string;
  ativo?: boolean;
  tipoContato?: string;
};

interface CadastroProps {
  vagas: Vaga[];
  onAdicionarVagas: (novasVagas: Vaga[]) => void;
  onSelecionarCodigo: (codigo: string) => void;
  onAlterarModo: (modo: "novo" | "atualizar") => void;
  onConfirmarAtualizacao: () => void;
  temAtualizacaoPendente: boolean;
  onGerarPDF: () => void;
  onZerarCiclo: () => void;
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

function normalizarChave(valor: unknown) {
  return normalizarTexto(valor)
    .replace(/[^A-Z0-9]/g, "");
}

function localizarPorChaves<T>(
  lista: T[],
  obterValor: (item: T) => unknown,
  chaves: string[]
) {
  const chavesNormalizadas = new Set(
    chaves.map(normalizarChave)
  );

  return lista.find((item) =>
    chavesNormalizadas.has(
      normalizarChave(obterValor(item))
    )
  );
}

function resolverUnidadeSolicitacao(
  unidade: string,
  unidadesDisponiveis: UnidadeCadastro[],
) {
  const chave = normalizarChave(unidade);
  const aliases: Record<string, string[]> = {
    BETOLANDIA: ["BETOLANDIA"],
    FREIDAMIAO: ["FREIDAMIAO"],
    MISSAOVELHA: ["MISSAOVELHA"],
    PIRAJA: ["PIRAJA"],
    SALESIANO: ["SALESIANOS"],
    SALESIANOS: ["SALESIANOS"],
    VILATRESMARIAS: ["VILATRESMARIAS"],
    CRATOOSSIAN: ["CRATOOSSIANARARIPE"],
    CRATOOSSIANARARIPE: ["CRATOOSSIANARARIPE"],
    CRATOSIQUEIRA: ["CRATOSIQUEIRACAMPOS"],
    CRATOSIQUEIRACAMPOS: ["CRATOSIQUEIRACAMPOS"],
  };

  return localizarPorChaves(
    unidadesDisponiveis,
    (item) => item.nome,
    aliases[chave] || [unidade]
  );
}

function carregarUnidadesCadastro(): UnidadeCadastro[] {
  const mapa = new Map<string, UnidadeCadastro>();

  [...unidadesPadrao, ...listarUnidadesConfiguradas()].forEach((unidade) => {
    mapa.set(unidade.codigo.padStart(3, "0"), unidade);
  });

  try {
    const gestoresSalvos = localStorage.getItem(CHAVE_GESTORES);
    const dados: unknown = gestoresSalvos ? JSON.parse(gestoresSalvos) : [];

    if (Array.isArray(dados)) {
      dados.forEach((valor) => {
        if (typeof valor !== "object" || valor === null) return;

        const gestor = valor as GestorUnidade;
        const codigo = String(gestor.codigo || "").trim().padStart(3, "0");
        const nomeOriginal = String(gestor.unidade || "").trim().toUpperCase();
        const nome = codigo === "014" && nomeOriginal === "TESTE"
          ? "LAZULI"
          : nomeOriginal;

        if (
          codigo !== "000" &&
          nome &&
          gestor.ativo !== false &&
          gestor.tipoContato === "GESTOR"
        ) {
          mapa.set(codigo, { codigo, nome, colaboradores: 0 });
        }
      });
    }
  } catch {
    // Mantém unidades válidas já carregadas.
  }

  return Array.from(mapa.values()).sort((a, b) =>
    a.codigo.localeCompare(b.codigo)
  );
}

function resolverCargoSolicitacao(
  cargo: string,
  tipo: string
) {
  const cargoChave = normalizarChave(cargo);
  const tipoChave = normalizarChave(tipo);
  const aliases: Record<string, string[]> = {
    ACOUGUEIRO: ["AÇOUGUEIRO"],
    ACOUGUE: ["B. AÇOUGUE"],
    BALCONISTADEACOUGUE: ["B. AÇOUGUE"],
    AUXILIARDESERVICOSGERAIS: ["AUX SERV. GER."],
    AUXSERVGER: ["AUX SERV. GER."],
    AUXILIARDECOZINHA: ["AUX. COZINHA"],
    BALCONISTADEPADARIA: ["B. PADARIA"],
    BPADARIA: ["B. PADARIA"],
    ESTOQUE: ["ESTOQUISTA"],
    ESTOQUISTA: ["ESTOQUISTA"],
    INVENTARIO: ["INVENTÁRIO"],
    JOVEMAPRENDIZ: ["J. APRENDIZ"],
    JAPRENDIZ: ["J. APRENDIZ"],
    OPERADORCAIXA: ["OPERADOR CX."],
    OPERADORDECAIXA: ["OPERADOR CX."],
    OPERADORCX: ["OPERADOR CX."],
    PREVENCAOPERDAS: ["PREV. PERDAS"],
    FISCALDEPREVENCAODEPERDAS: ["PREV. PERDAS"],
    REPOSITOR: ["REPOS. MERC."],
    REPOSITORMERCADORIAS: ["REPOS. MERC."],
    REPOSITORDEMERCADORIAS: ["REPOS. MERC."],
    REPOSMERC: ["REPOS. MERC."],
    SEPARADORDEMERCADORIAS: ["SEPAR. DE MERC."],
  };

  const chavesCargo =
    aliases[cargoChave] || [cargo];
  const cargoEncontrado =
    localizarPorChaves(
      cargos.filter((item) => item.ativo),
      (item) => item.cargo,
      chavesCargo
    );

  if (cargoEncontrado) {
    return cargoEncontrado;
  }

  if (tipoChave.includes("APRENDIZ")) {
    return localizarPorChaves(
      cargos,
      (item) => item.cargo,
      ["J. APRENDIZ"]
    );
  }

  if (tipoChave.includes("INVENTARIO")) {
    return localizarPorChaves(
      cargos,
      (item) => item.cargo,
      ["INVENTÁRIO"]
    );
  }

  return undefined;
}

function normalizarTipoSolicitacao(
  tipo: string,
  cargo: string
) {
  const chave = normalizarChave(`${tipo} ${cargo}`);

  if (chave.includes("APRENDIZ")) {
    return "J. APRENDIZ";
  }

  if (chave.includes("INVENTARIO")) {
    return "INVENTÁRIO";
  }

  if (chave.includes("PCD")) {
    return "PCD";
  }

  if (chave.includes("ADM")) {
    return "ADM";
  }

  return "OPERAC.";
}

function normalizarMotivoSolicitacao(
  motivo: string
) {
  const chave = normalizarChave(motivo);

  if (chave.includes("DEMISSAO")) {
    return "DESLIG.";
  }

  if (chave.includes("EXPANSAO")) {
    return "EXPANSÃO";
  }

  if (chave.includes("SUBST")) {
    return "SUBST.";
  }

  if (chave.includes("REMANEJ")) {
    return "REMANEJ.";
  }

  return (
    String(motivo || "DESLIG.")
      .trim()
      .toUpperCase() || "DESLIG."
  );
}

function normalizarTurnoSolicitacao(
  turno: string
) {
  const chave = normalizarChave(turno);

  if (
    chave === "N" ||
    chave.includes("NOTURNO") ||
    chave.includes("NOITE")
  ) {
    return "N";
  }

  return "D";
}

function normalizarEmergenciaSolicitacao(
  emergencia: string
) {
  return normalizarChave(emergencia).includes(
    "SIM"
  )
    ? "SIM"
    : "NÃO";
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

function obterDataInputHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function converterDataInputParaBrasil(data: string) {
  const partes = data.split("-");

  if (partes.length !== 3) {
    return new Date().toLocaleDateString("pt-BR");
  }

  const [ano, mes, dia] = partes;

  return `${dia}/${mes}/${ano}`;
}

function Cadastro({
  vagas,
  onAdicionarVagas,
  onSelecionarCodigo,
  onConfirmarAtualizacao,
  temAtualizacaoPendente,
  onGerarPDF,
  onZerarCiclo,
}: CadastroProps) {
  const [unidadesCadastro, setUnidadesCadastro] = useState(
    carregarUnidadesCadastro
  );
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

  const opcoesUnidades = [
    "0 = Todas",
    ...unidadesCadastro.map(
      (item) => `${item.codigo} - ${item.nome}`
    ),
  ];

  useEffect(() => {
    const atualizarUnidades = () => {
      setUnidadesCadastro(carregarUnidadesCadastro());
    };

    window.addEventListener(EVENTO_ESTRUTURA_CADASTRO, atualizarUnidades);
    window.addEventListener(EVENTO_GESTORES_ATUALIZADOS, atualizarUnidades);

    return () => {
      window.removeEventListener(EVENTO_ESTRUTURA_CADASTRO, atualizarUnidades);
      window.removeEventListener(EVENTO_GESTORES_ATUALIZADOS, atualizarUnidades);
    };
  }, []);

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
        (codigoRef.current?.value || "")
          .split("-")[0]
          .replace(/\D/g, "");

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
        unidadesCadastro.find(
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
      converterDataInputParaBrasil(
        obterDataInputHoje()
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
          resolverUnidadeSolicitacao(
            solicitacao.unidade,
            unidadesCadastro,
          );

        const cargoEncontrado =
          resolverCargoSolicitacao(
            solicitacao.cargo,
            solicitacao.tipo
          );

        const quantidadeSolicitada =
          Number(
            solicitacao.quantidade
          );

        const turnoSolicitado =
          normalizarTurnoSolicitacao(
            solicitacao.turno
          );

        const emergenciaSolicitada =
          normalizarEmergenciaSolicitacao(
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
          Boolean(turnoSolicitado) &&
          Boolean(emergenciaSolicitada);

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
          resolverUnidadeSolicitacao(
            solicitacao.unidade,
            unidadesCadastro,
          );

        const cargoEncontrado =
          resolverCargoSolicitacao(
            solicitacao.cargo,
            solicitacao.tipo
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
          normalizarEmergenciaSolicitacao(
            solicitacao.emergencia
          );

        const turnoFinal =
          normalizarTurnoSolicitacao(
            solicitacao.turno
          );

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
            tipo: normalizarTipoSolicitacao(
              solicitacao.tipo,
              solicitacao.cargo
            ),
            cargo:
              cargoEncontrado.cargo,
            setor:
              cargoEncontrado.setor,
            turno: turnoFinal,
            motivo:
              normalizarMotivoSolicitacao(
                solicitacao.motivo
              ),
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
            type="text"
            list="lista-codigos-unidades"
            placeholder="0 = Todas"
            value={codigo}
            onChange={(evento) =>
              selecionarCodigo(
                evento.target.value
              )
            }
          />
          <datalist id="lista-codigos-unidades">
            {opcoesUnidades.map((item) => (
              <option
                key={item}
                value={item}
              />
            ))}
          </datalist>
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
            name="novo-cadastro-cargo"
            value={cargoSelecionado}
            disabled={
              emergencia === "ESTÁVEL"
            }
            onClick={(evento) =>
              evento.stopPropagation()
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
            type="text"
            value={
              emergencia === "ESTÁVEL"
                ? "ESTÁVEL"
                : setor
            }
            placeholder="Setor automático"
            readOnly
            aria-label="Setor preenchido automaticamente"
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
                className={
                  normalizarTexto(item).includes("EXPERIENCIA")
                    ? "opcao-motivo-experiencia"
                    : undefined
                }
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
          onClick={onZerarCiclo}
        >
          Zerar ciclo
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








