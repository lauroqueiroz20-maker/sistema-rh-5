import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./Gestores.css";
import FormularioGestor from "./FormularioGestor";

import gestoresIniciais, {
  type Gestor,
} from "../../data/gestores";
import eventBus from "../../Services/eventBus";
import {
  carregarQuadroColaboradores,
  salvarQuadroColaboradores,
  totalQuadroColaboradores,
  type QuadroColaboradores,
} from "../../Services/quadroColaboradoresService";
import {
  carregarEstruturaCadastro,
  criarItemEstruturaCadastro,
  salvarEstruturaCadastro,
  type ItemEstruturaCadastro,
} from "../../Services/estruturaCadastroService";

import {
  carregarHistoricoRecrutamento,
  carregarMetricasRecrutamento,
  salvarHistoricoRecrutamento,
  salvarMetricasRecrutamento,
  somarFunilRecrutamento,
  type MetricasRecrutamento,
  type RegistroSemanalRecrutamento,
} from "../../Services/recrutamentoMetricasService";

import {
  arquivarRegistroMonitor,
  carregarMonitor as carregarMonitorLocal,
  carregarMonitorRemoto,
} from "../../apps/DinizRH/storage";

import type {
  RegistroMonitor as SolicitacaoGestor,
} from "../../apps/DinizRH/types";
import { salvarBackupCompletoAdmin } from "../../Services/adminCloudService";

const CHAVE_GESTORES = "sistema-rh-gestores";
const CHAVE_MONITOR = "sistema-rh-monitor-gestores";
const CHAVE_SOLICITACOES =
  "sistema-rh-solicitacoes-gestores";
const LIMITE_UNIDADES = 20;
type GestorEditavel = Gestor & {
  nome?: string;
  gerente?: string;
  telefone?: string;
  whatsapp?: string;
  atualizadoEm?: string;
};

type CadastroAtualizadoPayload = {
  solicitacaoIds?: string[];
};

const CODIGOS_INTERNOS = new Set([
  "000",
]);

function ehContatoVisivel(gestor: Gestor) {
  const codigoNormalizado = String(
    gestor.codigo || ""
  )
    .trim()
    .padStart(3, "0");

  return !CODIGOS_INTERNOS.has(
    codigoNormalizado
  );
}

function ehGestorDeUnidade(gestor: Gestor) {
  return (
    ehContatoVisivel(gestor) &&
    gestor.tipoContato === "GESTOR"
  );
}

function carregarLista<T>(
  chave: string,
  valorPadrao: T[]
): T[] {
  try {
    const dadosSalvos =
      localStorage.getItem(chave);

    if (!dadosSalvos) {
      return valorPadrao;
    }

    const dadosConvertidos =
      JSON.parse(dadosSalvos);

    return Array.isArray(dadosConvertidos) && dadosConvertidos.length > 0
      ? dadosConvertidos
      : valorPadrao;
  } catch {
    return valorPadrao;
  }
}

function carregarGestores(): Gestor[] {
  const gestoresSalvos =
    carregarLista<Gestor>(
    CHAVE_GESTORES,
    gestoresIniciais
  );

  const gestoresPorCodigo =
    new Map<string, Gestor>();

  gestoresIniciais.forEach((gestor) => {
    gestoresPorCodigo.set(
      gestor.codigo,
      gestor
    );
  });

  gestoresSalvos.forEach((gestor) => {
    const gestorBase =
      gestoresPorCodigo.get(
        gestor.codigo
      );

    gestoresPorCodigo.set(
      gestor.codigo,
      {
        ...gestorBase,
        ...gestor,
        unidade:
          gestor.codigo === "014" &&
          String(gestor.unidade || "").trim().toUpperCase() === "TESTE"
            ? "LAZULI"
            : gestor.unidade,
        recebeDisparoDiario:
          gestor.codigo === "000"
            ? true
            : gestor.recebeDisparoDiario,
      } as Gestor
    );
  });

  return Array.from(
    gestoresPorCodigo.values()
  );
}

function carregarMonitor(): SolicitacaoGestor[] {
  return carregarMonitorLocal();
}

function obterNomeGestor(
  gestor: Gestor
): string {
  const gestorEditavel =
    gestor as GestorEditavel;

  return String(
    gestorEditavel.nome ||
      gestorEditavel.gerente ||
      ""
  );
}

function obterTelefoneGestor(
  gestor: Gestor
): string {
  const gestorEditavel =
    gestor as GestorEditavel;

  return String(
    gestorEditavel.telefone ||
      gestorEditavel.whatsapp ||
    ""
  );
}

type ModoTelaGestores = "completo" | "monitor";

type TelaGestoresProps = {
  modo?: ModoTelaGestores;
};

type ChaveMetricaRecrutamento = keyof MetricasRecrutamento;
type CampoRegistroSemanal = Exclude<
  keyof RegistroSemanalRecrutamento,
  "id" | "data"
>;

function obterDataLocal() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function criarRegistroSemanalVazio(): Omit<RegistroSemanalRecrutamento, "id"> {
  return {
    data: obterDataLocal(),
    curriculosRecebidos: 0,
    entrevistasRh: 0,
    enviadosGestores: 0,
    aprovadosGestores: 0,
    emProcesso: 0,
    asoFinalizados: 0,
  };
}

const gruposMetricasRecrutamento: {
  chave: Exclude<ChaveMetricaRecrutamento, "divisaoDesistencia">;
  titulo: string;
}[] = [
  { chave: "funil", titulo: "Funil de Recrutamento" },
  { chave: "fontes", titulo: "Fontes de Recrutamento" },
  { chave: "recusaGestao", titulo: "Recusa da Gestão" },
  { chave: "desistencias", titulo: "Desistência do Candidato" },
];

function TelaGestores({ modo = "completo" }: TelaGestoresProps) {
  const [sincronizandoTudo, setSincronizandoTudo] = useState(false);
  const [gestores, setGestores] =
    useState<Gestor[]>(carregarGestores);

  const [quadroColaboradores, setQuadroColaboradores] =
    useState<QuadroColaboradores>(carregarQuadroColaboradores);

  const [estruturaCadastro, setEstruturaCadastro] =
    useState<ItemEstruturaCadastro[]>(carregarEstruturaCadastro);
  const [estruturaEditandoId, setEstruturaEditandoId] =
    useState<string | null>(null);
  const [estruturaRascunho, setEstruturaRascunho] = useState({
    codigoUnidade: "",
    unidade: "",
    tipo: "",
    cargo: "",
    setor: "",
  });

  const [
    codigoSelecionado,
    setCodigoSelecionado,
  ] = useState("");

  const [nomeEdicao, setNomeEdicao] =
    useState("");

  const [
    telefoneEdicao,
    setTelefoneEdicao,
  ] = useState("");

  const [emailEdicao, setEmailEdicao] =
    useState("");

  const [operacionaisEdicao, setOperacionaisEdicao] = useState(0);
  const [gestoresEdicao, setGestoresEdicao] = useState(0);
  const [diretoriaEdicao, setDiretoriaEdicao] = useState(0);

  const [
    telefoneAlternativoEdicao,
    setTelefoneAlternativoEdicao,
  ] = useState("");

  const [
    ativoEdicao,
    setAtivoEdicao,
  ] = useState(true);

  const [monitor, setMonitor] =
    useState<SolicitacaoGestor[]>(
      carregarMonitor
    );

  const [
    idsProcessando,
    setIdsProcessando,
  ] = useState<string[]>([]);

  const [
    metricasRecrutamento,
    setMetricasRecrutamento,
  ] = useState<MetricasRecrutamento>(
    carregarMetricasRecrutamento
  );

  const [historicoRecrutamento, setHistoricoRecrutamento] =
    useState<RegistroSemanalRecrutamento[]>(carregarHistoricoRecrutamento);
  const [registroSemanal, setRegistroSemanal] =
    useState<Omit<RegistroSemanalRecrutamento, "id">>(criarRegistroSemanalVazio);


  const gestoresVisiveis = useMemo(
    () => gestores.filter(ehContatoVisivel),
    [gestores]
  );

  const gestoresDeUnidade = useMemo(
    () => gestores.filter(ehGestorDeUnidade),
    [gestores]
  );

  const totalUnidades = LIMITE_UNIDADES;
  const totalGestores = gestoresDeUnidade.length;

  const totalAtivos = gestoresDeUnidade.filter(
    (gestor) => gestor.ativo
  ).length;

  const totalPendentes = Math.max(
    0,
    totalUnidades - totalGestores
  );

  const modoCompleto = modo === "completo";

  const totalColaboradores =
    totalQuadroColaboradores(quadroColaboradores);

  const opcoesEstrutura = useMemo(() => ({
    unidades: Array.from(
      new Set(estruturaCadastro.map((item) => item.unidade)),
    ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    tipos: Array.from(
      new Set(estruturaCadastro.map((item) => item.tipo)),
    ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    cargos: Array.from(
      new Set(estruturaCadastro.map((item) => item.cargo)),
    ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    setores: Array.from(
      new Set(estruturaCadastro.map((item) => item.setor)),
    ).sort((a, b) => a.localeCompare(b, "pt-BR")),
  }), [estruturaCadastro]);

  function atualizarQuadroColaboradores(
    campo: keyof QuadroColaboradores,
    valor: string,
  ) {
    setQuadroColaboradores((quadroAtual) => ({
      ...quadroAtual,
      [campo]: Math.max(0, Number(valor || 0)),
    }));
  }

  function salvarQuadroGeral() {
    salvarQuadroColaboradores(quadroColaboradores);
    alert("Quadro de colaboradores atualizado no Dashboard.");
  }

  function atualizarEstruturaRascunho(
    campo: keyof typeof estruturaRascunho,
    valor: string,
  ) {
    setEstruturaRascunho((rascunhoAtual) => ({
      ...rascunhoAtual,
      [campo]: valor,
    }));
  }

  function selecionarUnidadeEstrutura(valor: string) {
    const unidadeExistente = estruturaCadastro.find(
      (item) => item.unidade === valor.trim().toUpperCase(),
    );

    setEstruturaRascunho((rascunhoAtual) => ({
      ...rascunhoAtual,
      unidade: valor,
      codigoUnidade:
        unidadeExistente?.codigoUnidade || rascunhoAtual.codigoUnidade,
    }));
  }

  function selecionarCargoEstrutura(valor: string) {
    const cargoExistente = estruturaCadastro.find(
      (item) => item.cargo === valor.trim().toUpperCase(),
    );

    setEstruturaRascunho((rascunhoAtual) => ({
      ...rascunhoAtual,
      cargo: valor,
      tipo: cargoExistente?.tipo || rascunhoAtual.tipo,
      setor: cargoExistente?.setor || rascunhoAtual.setor,
    }));
  }

  function adicionarEstruturaCadastro() {
    if (
      !estruturaRascunho.codigoUnidade.trim() ||
      !estruturaRascunho.unidade.trim() ||
      !estruturaRascunho.tipo.trim() ||
      !estruturaRascunho.cargo.trim() ||
      !estruturaRascunho.setor.trim()
    ) {
      alert("Preencha unidade, tipo, cargo e setor.");
      return;
    }

    const codigoNumero = Number(estruturaRascunho.codigoUnidade);
    if (
      !Number.isInteger(codigoNumero) ||
      codigoNumero < 1 ||
      codigoNumero > LIMITE_UNIDADES
    ) {
      alert("Informe um código entre 001 e 020.");
      return;
    }

    const novoItem = criarItemEstruturaCadastro(estruturaRascunho);
    const jaExiste = estruturaCadastro.some(
      (item) =>
        item.id !== estruturaEditandoId &&
        item.codigoUnidade === novoItem.codigoUnidade &&
        item.cargo === novoItem.cargo &&
        item.setor === novoItem.setor,
    );

    if (jaExiste) {
      alert("Esta estrutura já está cadastrada.");
      return;
    }

    const novaEstrutura = estruturaEditandoId
      ? estruturaCadastro.map((item) =>
          item.id === estruturaEditandoId
            ? { ...novoItem, id: estruturaEditandoId }
            : item,
        )
      : [...estruturaCadastro, novoItem];
    setEstruturaCadastro(novaEstrutura);
    salvarEstruturaCadastro(novaEstrutura);
    setEstruturaEditandoId(null);
    setEstruturaRascunho({
      codigoUnidade: novoItem.codigoUnidade,
      unidade: novoItem.unidade,
      tipo: "",
      cargo: "",
      setor: "",
    });
  }

  function editarEstruturaCadastro(item: ItemEstruturaCadastro) {
    setEstruturaEditandoId(item.id);
    setEstruturaRascunho({
      codigoUnidade: item.codigoUnidade,
      unidade: item.unidade,
      tipo: item.tipo,
      cargo: item.cargo,
      setor: item.setor,
    });
  }

  function cancelarEdicaoEstrutura() {
    setEstruturaEditandoId(null);
    setEstruturaRascunho({
      codigoUnidade: "",
      unidade: "",
      tipo: "",
      cargo: "",
      setor: "",
    });
  }

  function excluirEstruturaCadastro(id: string) {
    const novaEstrutura = estruturaCadastro.filter(
      (item) => item.id !== id,
    );
    setEstruturaCadastro(novaEstrutura);
    salvarEstruturaCadastro(novaEstrutura);

    if (estruturaEditandoId === id) {
      cancelarEdicaoEstrutura();
    }
  }

  const gestoresOrdenados = useMemo(
    () =>
      [...gestoresVisiveis].sort((a, b) =>
        a.unidade.localeCompare(
          b.unidade,
          "pt-BR",
          {
            sensitivity: "base",
          }
        )
      ),
    [gestoresVisiveis]
  );

  const gestorSelecionado = useMemo(
    () =>
      gestores.find(
        (gestor) =>
          gestor.codigo ===
          codigoSelecionado
      ),
    [gestores, codigoSelecionado]
  );

  function atualizarMetricaRecrutamento(
    chave: ChaveMetricaRecrutamento,
    indice: number,
    valor: string
  ) {
    const valorNumericoBase = Math.max(
      0,
      Number(valor || 0)
    );

    setMetricasRecrutamento((metricasAtuais) => {
      const itemAtual = metricasAtuais[chave][indice];
      const valorNumerico = itemAtual?.nome === "Média Demitidos"
        ? Math.min(100, valorNumericoBase)
        : valorNumericoBase;
      const metricasAtualizadas: MetricasRecrutamento = {
        ...metricasAtuais,
        [chave]: metricasAtuais[chave].map(
          (item, itemIndice) =>
            itemIndice === indice
              ? {
                  ...item,
                  valor: valorNumerico,
                }
              : item
        ),
      };

      salvarMetricasRecrutamento(
        metricasAtualizadas
      );
      sincronizarIndicadoresNuvem();

      return metricasAtualizadas;
    });
  }

  function atualizarRegistroSemanal(
    campo: CampoRegistroSemanal,
    valor: string
  ) {
    setRegistroSemanal((registroAtual) => ({
      ...registroAtual,
      [campo]: Math.max(0, Number(valor || 0)),
    }));
  }

  function sincronizarFunilSemanal(
    registros: RegistroSemanalRecrutamento[]
  ) {
    const metricasAtualizadas: MetricasRecrutamento = {
      ...metricasRecrutamento,
      funil: somarFunilRecrutamento(registros),
    };

    setMetricasRecrutamento(metricasAtualizadas);
    salvarMetricasRecrutamento(metricasAtualizadas);
    sincronizarIndicadoresNuvem();
  }

  function adicionarRegistroSemanal() {
    const valores = Object.entries(registroSemanal)
      .filter(([campo]) => campo !== "data")
      .map(([, valor]) => Number(valor || 0));

    if (!registroSemanal.data || valores.every((valor) => valor <= 0)) {
      alert("Informe a data e pelo menos um valor.");
      return;
    }

    const novoRegistro: RegistroSemanalRecrutamento = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      ...registroSemanal,
    };
    const novoHistorico = [novoRegistro, ...historicoRecrutamento]
      .sort((a, b) => b.data.localeCompare(a.data));

    setHistoricoRecrutamento(novoHistorico);
    salvarHistoricoRecrutamento(novoHistorico);
    sincronizarFunilSemanal(novoHistorico);
    setRegistroSemanal(criarRegistroSemanalVazio());
  }

  function excluirRegistroSemanal(id: string) {
    if (!window.confirm("Excluir este lançamento semanal?")) {
      return;
    }

    const novoHistorico = historicoRecrutamento.filter(
      (registro) => registro.id !== id
    );
    setHistoricoRecrutamento(novoHistorico);
    salvarHistoricoRecrutamento(novoHistorico);
    sincronizarFunilSemanal(novoHistorico);
  }

  function selecionarGestor(
    codigo: string
  ) {
    const gestor =
      gestores.find(
        (item) =>
          item.codigo === codigo
      );

    setCodigoSelecionado(codigo);

    if (!gestor) {
      setNomeEdicao("");
      setTelefoneEdicao("");
      setEmailEdicao("");
      setOperacionaisEdicao(0);
      setGestoresEdicao(0);
      setDiretoriaEdicao(0);
      setTelefoneAlternativoEdicao("");
      setAtivoEdicao(true);
      return;
    }

    setNomeEdicao(
      obterNomeGestor(gestor)
    );
    setTelefoneEdicao(
      obterTelefoneGestor(gestor)
    );
    setEmailEdicao(gestor.email || "");
    setOperacionaisEdicao(
      Math.max(
        0,
        Number(
          gestor.colaboradoresOperacionais ??
            gestor.colaboradores ??
            0,
        ),
      ),
    );
    setGestoresEdicao(
      Math.max(0, Number(gestor.colaboradoresGestores || 0)),
    );
    setDiretoriaEdicao(
      Math.max(0, Number(gestor.colaboradoresDiretoria || 0)),
    );
    setTelefoneAlternativoEdicao(
      gestor.telefoneAlternativo || ""
    );
    setAtivoEdicao(gestor.ativo);
  }

  useEffect(() => {
    localStorage.setItem(
      CHAVE_GESTORES,
      JSON.stringify(gestores)
    );
    window.dispatchEvent(new Event("sistema-rh-gestores-atualizados"));
  }, [gestores]);

  useEffect(() => {
    localStorage.setItem(
      CHAVE_MONITOR,
      JSON.stringify(monitor)
    );
  }, [monitor]);

  useEffect(() => {
    function concluirSolicitacoes(
      dados?: unknown
    ) {
      const payload =
        dados as CadastroAtualizadoPayload;

      const ids =
        payload?.solicitacaoIds || [];

      if (ids.length === 0) {
        return;
      }

      setMonitor((listaAtual) =>
        listaAtual.filter(
          (item) =>
            !ids.includes(item.id)
        )
      );


      const filaAtual =
        carregarLista<SolicitacaoGestor>(
          CHAVE_SOLICITACOES,
          []
        );

      const novaFila =
        filaAtual.filter(
          (item) =>
            !ids.includes(item.id)
        );

      localStorage.setItem(
        CHAVE_SOLICITACOES,
        JSON.stringify(novaFila)
      );
    }

    eventBus.on(
      "CADASTRO_ATUALIZADO",
      concluirSolicitacoes
    );

    return () => {
      eventBus.off(
        "CADASTRO_ATUALIZADO",
        concluirSolicitacoes
      );
    };
  }, []);

  useEffect(() => {
    function sincronizarMonitor() {
      setMonitor(carregarMonitor());
    }

    let ativo = true;

    async function sincronizarMonitorRemoto() {
      try {
        const registros =
          await carregarMonitorRemoto();

        if (ativo) {
          setMonitor(registros);
        }
      } catch {
        if (ativo) {
          sincronizarMonitor();
        }
      }
    }

    window.addEventListener(
      "sistema-rh-monitor-atualizado",
      sincronizarMonitor
    );

    window.addEventListener(
      "storage",
      sincronizarMonitor
    );

    sincronizarMonitor();
    sincronizarMonitorRemoto();

    const intervalo =
      window.setInterval(
        sincronizarMonitorRemoto,
        15000
      );

    return () => {
      ativo = false;

      window.removeEventListener(
        "sistema-rh-monitor-atualizado",
        sincronizarMonitor
      );

      window.removeEventListener(
        "storage",
        sincronizarMonitor
      );

      window.clearInterval(intervalo);
    };
  }, []);

  function cadastrarGestor(
    novoGestor: Gestor
  ) {
    const unidadeJaCadastrada =
      gestores.some(
        (gestor) =>
          gestor.codigo ===
            novoGestor.codigo ||
          gestor.unidade
            .trim()
            .toUpperCase() ===
            novoGestor.unidade
              .trim()
              .toUpperCase()
      );

    if (unidadeJaCadastrada) {
      alert(
        "Esta unidade já possui um gestor cadastrado. Selecione o gestor na lista para editar."
      );
      return;
    }

    setGestores((listaAtual) =>
      [...listaAtual, novoGestor].sort(
        (a, b) =>
          a.codigo.localeCompare(
            b.codigo
          )
      )
    );

    setCodigoSelecionado(
      novoGestor.codigo
    );
    setNomeEdicao(
      obterNomeGestor(novoGestor)
    );
    setTelefoneEdicao(
      obterTelefoneGestor(novoGestor)
    );
    setEmailEdicao(novoGestor.email || "");
    setOperacionaisEdicao(
      Math.max(0, Number(novoGestor.colaboradoresOperacionais || 0)),
    );
    setGestoresEdicao(
      Math.max(0, Number(novoGestor.colaboradoresGestores || 0)),
    );
    setDiretoriaEdicao(
      Math.max(0, Number(novoGestor.colaboradoresDiretoria || 0)),
    );
    setTelefoneAlternativoEdicao(
      novoGestor.telefoneAlternativo || ""
    );
    setAtivoEdicao(
      novoGestor.ativo
    );

    alert(
      "Gestor cadastrado com sucesso."
    );
  }

  function salvarEdicaoGestor() {
    if (!gestorSelecionado) {
      alert(
        "Selecione um gestor cadastrado para editar."
      );
      return;
    }

    if (!nomeEdicao.trim()) {
      alert(
        "Informe o nome do gestor."
      );
      return;
    }

    if (!telefoneEdicao.trim()) {
      alert(
        "Informe o WhatsApp do gestor."
      );
      return;
    }

    if (emailEdicao.trim() && !emailEdicao.includes("@")) {
      alert("Informe um e-mail válido.");
      return;
    }

    setGestores((listaAtual) =>
      listaAtual.map((gestor) => {
        if (
          gestor.codigo !==
          gestorSelecionado.codigo
        ) {
          return gestor;
        }

        const gestorAtual =
          gestor as GestorEditavel;

        const gestorAtualizado: GestorEditavel =
          {
            ...gestorAtual,
            ativo: ativoEdicao,
            email: emailEdicao.trim().toLowerCase(),
            colaboradoresOperacionais:
              gestorAtual.tipoContato === "GESTOR"
                ? Math.max(0, operacionaisEdicao)
                : 0,
            colaboradoresGestores:
              gestorAtual.tipoContato === "GESTOR"
                ? Math.max(0, gestoresEdicao)
                : 0,
            colaboradoresDiretoria:
              gestorAtual.tipoContato === "GESTOR"
                ? Math.max(0, diretoriaEdicao)
                : 0,
            colaboradores:
              gestorAtual.tipoContato === "GESTOR"
                ? Math.max(0, operacionaisEdicao) +
                  Math.max(0, gestoresEdicao) +
                  Math.max(0, diretoriaEdicao)
                : 0,
            telefoneAlternativo: telefoneAlternativoEdicao.replace(
              /\D/g,
              ""
            ),
            atualizadoEm:
              new Date().toISOString(),
          };

        if (
          Object.prototype.hasOwnProperty.call(
            gestorAtual,
            "gerente"
          )
        ) {
          gestorAtualizado.gerente =
            nomeEdicao.trim();
        } else {
          gestorAtualizado.nome =
            nomeEdicao.trim();
        }

        if (
          Object.prototype.hasOwnProperty.call(
            gestorAtual,
            "whatsapp"
          )
        ) {
          gestorAtualizado.whatsapp =
            telefoneEdicao.replace(
              /\D/g,
              ""
            );
        } else {
          gestorAtualizado.telefone =
            telefoneEdicao.replace(
              /\D/g,
              ""
            );
        }

        return gestorAtualizado as Gestor;
      })
    );

    alert(
      "Dados do gestor atualizados."
    );
  }

  function cancelarEdicao() {
    selecionarGestor("");
  }

  function atualizarSolicitacao(
    solicitacao: SolicitacaoGestor
  ) {
    if (idsProcessando.includes(solicitacao.id)) {
      return;
    }

    const filaAtual = carregarLista<SolicitacaoGestor>(
      CHAVE_SOLICITACOES,
      []
    );

    const jaExisteNaFila = filaAtual.some(
      (item) => item.id === solicitacao.id
    );

    const solicitacaoCadastro: SolicitacaoGestor = {
      ...solicitacao,
      quantidade: Number(solicitacao.quantidade),
      atualizado: true,
    };

    if (!jaExisteNaFila) {
      localStorage.setItem(
        CHAVE_SOLICITACOES,
        JSON.stringify([...filaAtual, solicitacaoCadastro])
      );
    }

    setIdsProcessando((listaAtual) => [
      ...listaAtual,
      solicitacao.id,
    ]);

    setMonitor((listaAtual) =>
      listaAtual.map((item) =>
        item.id === solicitacao.id
          ? { ...item, atualizado: true }
          : item
      )
    );

    eventBus.emit(
      "SOLICITACAO_APROVADA",
      solicitacaoCadastro
    );
  }

  async function excluirSolicitacao(
    solicitacao: SolicitacaoGestor
  ) {
    const confirmar = window.confirm(
      `Excluir a resposta de teste da unidade ${solicitacao.unidade}?`
    );

    if (!confirmar) {
      return;
    }

    setMonitor((listaAtual) =>
      listaAtual.filter((item) => item.id !== solicitacao.id)
    );

    setIdsProcessando((listaAtual) =>
      listaAtual.filter((id) => id !== solicitacao.id)
    );

    const filaAtual = carregarLista<SolicitacaoGestor>(
      CHAVE_SOLICITACOES,
      []
    );

    localStorage.setItem(
      CHAVE_SOLICITACOES,
      JSON.stringify(
        filaAtual.filter((item) => item.id !== solicitacao.id)
      )
    );

    await arquivarRegistroMonitor(solicitacao.id);
  }

  const painelMetricas = metricasRecrutamento;

  function sincronizarIndicadoresNuvem() {
    void salvarBackupCompletoAdmin().catch((erro: unknown) => {
      console.error("Falha ao sincronizar indicadores.", erro);
    });
  }

  async function sincronizarArquivoCompleto() {
    setSincronizandoTudo(true);
    try {
      await salvarBackupCompletoAdmin();
      alert("Arquivo completo sincronizado com a outra máquina.");
    } catch (erro) {
      alert(erro instanceof Error ? erro.message : "Falha na sincronização completa.");
    } finally {
      setSincronizandoTudo(false);
    }
  }

  if (!modoCompleto) {
    return (
      <div className="gestores-container gestores-container-monitor">
        <section className="painel-monitor-gestores">
          <div className="titulo-painel-gestores">
            <div>
              <h2>Monitor diário de respostas</h2>

              <p>
                Solicitações recebidas dos gestores para atualização do Cadastro.
              </p>
            </div>

            <strong className="contador-monitor">
              {monitor.length} respostas
            </strong>
          </div>

          <div className="tabela-monitor-wrapper">
            <table className="tabela-monitor-gestores">
              <thead>
                <tr>
                  <th>Unidade</th>
                  <th>Tipo</th>
                  <th>Cargo</th>
                  <th>Quantidade de vagas</th>
                  <th>Turno</th>
                  <th>Motivo</th>
                  <th>Emergência</th>
                  <th>Ação</th>
                </tr>
              </thead>

              <tbody>
                {monitor.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="monitor-sem-respostas">
                      Nenhuma resposta recebida hoje.
                    </td>
                  </tr>
                ) : (
                  monitor.map((solicitacao) => {
                    const processando = idsProcessando.includes(
                      solicitacao.id
                    );

                    return (
                      <tr key={solicitacao.id}>
                        <td>{solicitacao.unidade}</td>
                        <td>{solicitacao.tipo}</td>
                        <td>{solicitacao.cargo}</td>
                        <td>{solicitacao.quantidade}</td>
                        <td>{solicitacao.turno}</td>
                        <td>{solicitacao.motivo}</td>
                        <td>
                          <span
                            className={
                              solicitacao.emergencia.trim().toUpperCase() ===
                              "SIM"
                                ? "emergencia-sim"
                                : "emergencia-nao"
                            }
                          >
                            {solicitacao.emergencia}
                          </span>
                        </td>
                        <td>
                          <div className="acoes-monitor-gestores">
                            <button
                              type="button"
                              className={
                                processando
                                  ? "botao-atualizar-monitor atualizado"
                                  : "botao-atualizar-monitor"
                              }
                              disabled={processando}
                              onClick={() => atualizarSolicitacao(solicitacao)}
                            >
                              {processando ? "PROCESSANDO" : "ATUALIZAR"}
                            </button>

                            <button
                              type="button"
                              className="botao-excluir-monitor"
                              onClick={() => excluirSolicitacao(solicitacao)}
                            >
                              EXCLUIR
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={modoCompleto ? "gestores-container" : "gestores-container gestores-container-monitor"}>
      {modoCompleto && (
        <>
      <div className="gestores-header">
        <h1>Central de Gestores</h1>

        <p>
          Gerencie os contatos e
          acompanhe as solicitações
          diárias das unidades.
        </p>
      </div>

      <div className="cards-gestores">
        <div className="card-gestor">
          <span>Capacidade de unidades</span>
          <strong>
            {totalUnidades}
          </strong>
        </div>

        <div className="card-gestor">
          <span>Gestores</span>
          <strong>
            {totalGestores}
          </strong>
        </div>

        <div className="card-gestor">
          <span>Ativos</span>
          <strong>
            {totalAtivos}
          </strong>
        </div>

        <div className="card-gestor">
          <span>Pendentes</span>
          <strong>
            {totalPendentes}
          </strong>
        </div>
      </div>

      <section className="painel-quadro-colaboradores">
        <div className="quadro-colaboradores-cabecalho">
          <div>
            <h2>Quadro Geral de Colaboradores</h2>
            <p>Estes números alimentam o Consolidado Geral do Dashboard.</p>
          </div>

          <div className="quadro-colaboradores-total">
            <span>Total geral</span>
            <strong>{totalColaboradores}</strong>
          </div>
        </div>

        <div className="quadro-colaboradores-grid">
          {([
            ["operacionais", "Operacionais"],
            ["gestores", "Gestores"],
            ["diretoria", "Diretoria"],
            ["rh", "RH"],
            ["dp", "DP"],
          ] as [keyof QuadroColaboradores, string][]).map(
            ([campo, titulo]) => (
              <label key={campo}>
                <span>{titulo}</span>
                <input
                  type="number"
                  min="0"
                  value={quadroColaboradores[campo]}
                  onChange={(evento) =>
                    atualizarQuadroColaboradores(
                      campo,
                      evento.target.value,
                    )
                  }
                />
              </label>
            ),
          )}
        </div>

        <button
          type="button"
          className="botao-salvar-quadro"
          onClick={salvarQuadroGeral}
        >
          SALVAR QUADRO GERAL
        </button>
      </section>

      <section className="painel-estrutura-cadastro">
        <div className="estrutura-cadastro-cabecalho">
          <div>
            <h2>Estrutura da Central de Cadastro</h2>
            <p>Configure as opções usadas no cadastro de vagas.</p>
          </div>
          <strong>{estruturaCadastro.length} configurações</strong>
        </div>

        <div className="estrutura-cadastro-formulario">
          <label>
            <span>Código</span>
            <input
              value={estruturaRascunho.codigoUnidade}
              onChange={(evento) =>
                atualizarEstruturaRascunho("codigoUnidade", evento.target.value)
              }
              placeholder="001 a 020"
              inputMode="numeric"
              maxLength={3}
            />
          </label>
          <label>
            <span>Unidade</span>
            <input
              list="estrutura-unidades"
              value={estruturaRascunho.unidade}
              onChange={(evento) =>
                selecionarUnidadeEstrutura(evento.target.value)
              }
              placeholder="Matriz"
            />
          </label>
          <label>
            <span>Tipo de cargo</span>
            <input
              list="estrutura-tipos"
              value={estruturaRascunho.tipo}
              onChange={(evento) =>
                atualizarEstruturaRascunho("tipo", evento.target.value)
              }
              placeholder="Operacional"
            />
          </label>
          <label>
            <span>Cargo</span>
            <input
              list="estrutura-cargos"
              value={estruturaRascunho.cargo}
              onChange={(evento) =>
                selecionarCargoEstrutura(evento.target.value)
              }
              placeholder="Auxiliar operacional"
            />
          </label>
          <label>
            <span>Setor</span>
            <input
              list="estrutura-setores"
              value={estruturaRascunho.setor}
              onChange={(evento) =>
                atualizarEstruturaRascunho("setor", evento.target.value)
              }
              placeholder="Operações"
            />
          </label>
          <div className="estrutura-cadastro-acoes-formulario">
            <button type="button" onClick={adicionarEstruturaCadastro}>
              {estruturaEditandoId ? "ATUALIZAR" : "ADICIONAR"}
            </button>
            {estruturaEditandoId && (
              <button type="button" onClick={cancelarEdicaoEstrutura}>
                CANCELAR
              </button>
            )}
          </div>
        </div>

        <datalist id="estrutura-unidades">
          {opcoesEstrutura.unidades.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <datalist id="estrutura-tipos">
          {opcoesEstrutura.tipos.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <datalist id="estrutura-cargos">
          {opcoesEstrutura.cargos.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <datalist id="estrutura-setores">
          {opcoesEstrutura.setores.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>

        {estruturaCadastro.length > 0 && (
          <div className="estrutura-cadastro-tabela">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Unidade</th>
                  <th>Tipo</th>
                  <th>Cargo</th>
                  <th>Setor</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {estruturaCadastro.map((item) => (
                  <tr key={item.id}>
                    <td>{item.codigoUnidade}</td>
                    <td>{item.unidade}</td>
                    <td>{item.tipo}</td>
                    <td>{item.cargo}</td>
                    <td>{item.setor}</td>
                    <td>
                      <div className="estrutura-cadastro-acoes-linha">
                        <button
                          type="button"
                          onClick={() => editarEstruturaCadastro(item)}
                        >
                          EDITAR
                        </button>
                        <button
                          type="button"
                          onClick={() => excluirEstruturaCadastro(item.id)}
                        >
                          EXCLUIR
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

          <section className="painel-metricas-recrutamento">
            <div className="titulo-painel-gestores">
              <div>
                <h2>Indicadores do Dashboard</h2>

                <p>
                  Atualize os números que alimentam a Central de Inteligência RH.
                </p>
              </div>
            </div>

            <div className="registro-semanal-recrutamento">
              <div className="registro-semanal-cabecalho">
                <div>
                  <h3>Lançamento semanal geral</h3>
                  <p>Os valores serão somados automaticamente no ciclo atual.</p>
                </div>
                <label>
                  <span>Data</span>
                  <input
                    type="date"
                    value={registroSemanal.data}
                    onChange={(evento) =>
                      setRegistroSemanal((registroAtual) => ({
                        ...registroAtual,
                        data: evento.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="registro-semanal-campos">
                {([
                  ["curriculosRecebidos", "Currículos recebidos"],
                  ["entrevistasRh", "Entrevistas pelo RH"],
                  ["enviadosGestores", "Enviados aos gestores"],
                  ["aprovadosGestores", "Aprovados pelos gestores"],
                  ["emProcesso", "Em processo"],
                  ["asoFinalizados", "ASO finalizado"],
                ] as [CampoRegistroSemanal, string][]).map(([campo, nome]) => (
                  <label key={campo}>
                    <span>{nome}</span>
                    <input
                      type="number"
                      min="0"
                      value={registroSemanal[campo]}
                      onChange={(evento) =>
                        atualizarRegistroSemanal(campo, evento.target.value)
                      }
                    />
                  </label>
                ))}
              </div>

              <button
                type="button"
                className="botao-salvar-semana"
                onClick={adicionarRegistroSemanal}
              >
                SALVAR SEMANA
              </button>

              <div className="historico-semanal-recrutamento">
                <h3>Histórico do ciclo</h3>
                {historicoRecrutamento.length > 0 ? (
                  <div className="historico-semanal-tabela">
                    <table>
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Currículos</th>
                          <th>Entrevistas RH</th>
                          <th>Enviados</th>
                          <th>Aprovados</th>
                          <th>Em processo</th>
                            <th>ASO finalizado</th>
                          <th>Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historicoRecrutamento.map((registro) => (
                          <tr key={registro.id}>
                            <td>{registro.data.split("-").reverse().join("/")}</td>
                            <td>{registro.curriculosRecebidos}</td>
                            <td>{registro.entrevistasRh}</td>
                            <td>{registro.enviadosGestores}</td>
                            <td>{registro.aprovadosGestores}</td>
                            <td>{registro.emProcesso}</td>
                            <td>{registro.asoFinalizados}</td>
                            <td>
                              <button
                                type="button"
                                onClick={() => excluirRegistroSemanal(registro.id)}
                              >
                                Excluir
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="historico-semanal-vazio">Nenhuma semana lançada neste ciclo.</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => void sincronizarArquivoCompleto()}
                disabled={sincronizandoTudo}
              >
                {sincronizandoTudo ? "Sincronizando..." : "Sincronizar arquivo completo"}
              </button>
            </div>

            <div className="metricas-recrutamento-grid">
              {gruposMetricasRecrutamento.map((grupo) => (
                <article
                  key={grupo.chave}
                  className="metricas-recrutamento-bloco"
                >
                  <h3>{grupo.titulo}</h3>

                  {(grupo.chave === "recusaGestao" ||
                    grupo.chave === "desistencias") && (
                    <p className="metricas-recrutamento-instrucao">
                      Informe a quantidade de pessoas. O Dashboard calcula os percentuais.
                    </p>
                  )}

                  <div className="metricas-recrutamento-campos">
                    {painelMetricas[grupo.chave].map(
                      (item, indice) => (
                        <label key={`${grupo.chave}-${item.nome}`}>
                          <span>{item.nome}</span>

                          <input
                            type="number"
                            min="0"
                            max={item.nome === "Média Demitidos" ? 100 : undefined}
                            value={item.valor}
                            onChange={(evento) =>
                              atualizarMetricaRecrutamento(
                                grupo.chave,
                                indice,
                                evento.target.value
                              )
                            }
                          />
                        </label>
                      )
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

      <section className="painel-cadastro-gestores">
        <div className="titulo-painel-gestores">
          <div>
            <h2>
              Cadastro e edição de
              contato
            </h2>

            <p>
              Cadastre um novo gestor
              ou selecione um contato
              já cadastrado para editar.
            </p>
          </div>
        </div>

        <div className="busca-gestor-cadastrado">
          <label htmlFor="gestor-cadastrado">
            Buscar gestor cadastrado
          </label>

          <select
            id="gestor-cadastrado"
            value={codigoSelecionado}
            onChange={(evento) =>
              selecionarGestor(
                evento.target.value
              )
            }
          >
            <option value="">
              Selecione um gestor
            </option>

            {gestoresOrdenados.map(
              (gestor) => (
                <option
                  key={gestor.codigo}
                  value={gestor.codigo}
                >
                  {gestor.unidade} —{" "}
                  {obterNomeGestor(
                    gestor
                  ) ||
                    "Gestor sem nome"}
                </option>
              )
            )}
          </select>
        </div>

        {gestorSelecionado ? (
          <div className="formulario-edicao-gestor">
            <div className="campo-edicao-gestor">
              <label>Código</label>

              <input
                type="text"
                value={
                  gestorSelecionado.codigo
                }
                disabled
              />
            </div>

            <div className="campo-edicao-gestor">
              <label>Unidade</label>

              <input
                type="text"
                value={
                  gestorSelecionado.unidade
                }
                disabled
              />
            </div>

            <div className="campo-edicao-gestor">
              <label>Gestor</label>

              <input
                type="text"
                value={nomeEdicao}
                onChange={(evento) =>
                  setNomeEdicao(
                    evento.target.value
                  )
                }
                placeholder="Nome do gestor"
              />
            </div>

            <div className="campo-edicao-gestor">
              <label>WhatsApp</label>

              <input
                type="text"
                value={telefoneEdicao}
                onChange={(evento) =>
                  setTelefoneEdicao(
                    evento.target.value
                  )
                }
                placeholder="Número com DDD"
              />
            </div>

            <div className="campo-edicao-gestor">
              <label>E-mail</label>

              <input
                type="email"
                value={emailEdicao}
                onChange={(evento) =>
                  setEmailEdicao(evento.target.value)
                }
                placeholder="nome@empresa.com.br"
              />
            </div>

            <div className="campo-edicao-gestor">
              <label>Telefone alternativo</label>

              <input
                type="text"
                value={telefoneAlternativoEdicao}
                onChange={(evento) =>
                  setTelefoneAlternativoEdicao(evento.target.value)
                }
                placeholder="Número com DDD"
              />
            </div>

            <div className="campo-edicao-gestor campo-status-gestor">
              <label>Status</label>

              <select
                value={
                  ativoEdicao
                    ? "ATIVO"
                    : "INATIVO"
                }
                onChange={(evento) =>
                  setAtivoEdicao(
                    evento.target.value ===
                      "ATIVO"
                  )
                }
              >
                <option value="ATIVO">
                  Ativo
                </option>

                <option value="INATIVO">
                  Inativo
                </option>
              </select>
            </div>

            <div className="acoes-edicao-gestor">
              <button
                type="button"
                className="botao-salvar-gestor"
                onClick={
                  salvarEdicaoGestor
                }
              >
                SALVAR ALTERAÇÕES
              </button>

              <button
                type="button"
                className="botao-cancelar-gestor"
                onClick={cancelarEdicao}
              >
                CANCELAR
              </button>
            </div>
          </div>
        ) : (
          <FormularioGestor
            onCadastrar={
              cadastrarGestor
            }
          />
        )}
      </section>

        </>
      )}

      <section className="painel-contatos-internos">
        <div className="titulo-painel-gestores">
          <div>
            <h2>Gestores cadastrados</h2>

            <p>
              Contatos ativos e internos usados nos links dos gestores.
            </p>
          </div>

          <strong className="contador-monitor">
            {gestoresVisiveis.length} cadastros
          </strong>
        </div>

        <div className="tabela-contatos-wrapper">
          <table className="tabela-contatos-internos">
            <thead>
              <tr>
                <th>Código</th>
                <th>Unidade</th>
                <th>Gestor</th>
                <th>WhatsApp</th>
                <th>Telefone alternativo</th>
                <th>E-mail</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>

            <tbody>
              {gestoresOrdenados.map((gestor) => {
                const nomeGestor = obterNomeGestor(gestor) || "-";
                const telefoneGestor = obterTelefoneGestor(gestor) || "-";

                return (
                  <tr key={gestor.codigo}>
                    <td>{gestor.codigo}</td>
                    <td>{gestor.unidade}</td>
                    <td>{nomeGestor}</td>
                    <td>{telefoneGestor}</td>
                    <td>{gestor.telefoneAlternativo || "-"}</td>
                    <td>{gestor.email || "-"}</td>
                    <td>{gestor.tipoContato || "GESTOR"}</td>
                    <td>
                      <span className={gestor.ativo ? "status-ativo" : "status-inativo"}>
                        {gestor.ativo ? "ATIVO" : "INATIVO"}
                      </span>
                    </td>
                    <td>
                      <div className="acoes-contato-premium">
                        <button
                          type="button"
                          onClick={() => selecionarGestor(gestor.codigo)}
                        >
                          EDITAR
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default TelaGestores;
