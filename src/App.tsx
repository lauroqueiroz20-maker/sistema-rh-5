import { useEffect, useRef, useState } from "react";

import { lazy, Suspense } from "react";

import "./App.css";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Cards from "./components/Cards";
import Cadastro from "./components/Cadastro";
import TelaCadastro from "./components/TelaCadastro";

import type { RegistroAdmitido } from "./components/Admitidos/Admitidos";
import vagasIniciais, { type Vaga } from "./data/vagas";
import AuthGate from "./apps/DinizRH/AuthGate";

import { carregarCiclo, carregarVagas, salvarCiclo, salvarVagas } from "./Services/storageService";
import {
  aplicarArmazenamentoLocal,
  carregarEstadoAdmin,
  salvarEstadoAdmin,
} from "./Services/adminCloudService";
import {
  carregarHistoricoRecrutamento,
  carregarMetricasRecrutamento,
  salvarHistoricoRecrutamento,
  salvarMetricasRecrutamento,
  type MetricasRecrutamento,
  type RegistroSemanalRecrutamento,
} from "./Services/recrutamentoMetricasService";
import eventBus from "./Services/eventBus";

const Admitidos = lazy(() => import("./components/Admitidos/Admitidos"));
const RelatorioGerencial = lazy(() => import("./components/RelatorioGerencial"));
const RelatorioA4 = lazy(() => import("./components/RelatorioA4"));
const RelatorioPaisagem = lazy(() => import("./components/Admitidos/RelatorioPaisagem/RelatorioPaisagem"));
const DashboardRH = lazy(() => import("./components/DashboardRH/DashboardRH"));
const TelaGestores = lazy(() => import("./components/Gestores/Gestores"));
const GestaoASO = lazy(() => import("./components/ASO/GestaoASO"));
const AppGestor = lazy(() => import("./apps/DinizRH/AppGestor"));

const CHAVE_ADMITIDOS = "sistema-rh-admitidos";
const CHAVE_BACKUPS_CICLO = "sistema-rh-backups-ciclo";
const CHAVE_MIGRACAO_DATA_CADASTRO = "sistema-rh-migracao-cadastro-03-07-2026";
const CHAVE_MIGRACAO_DATA_ADMITIDOS = "sistema-rh-migracao-admitidos-03-07-2026-10-07-2026";
const EH_LOCAL_ADMIN = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const EH_LOCAL_PRINCIPAL = EH_LOCAL_ADMIN && window.location.port === "5173";

function assinaturaEstado(
  vagas: Vaga[],
  admitidos: RegistroAdmitido[],
  ciclo: { inicio: string; fim: string },
) {
  return JSON.stringify({ vagas, admitidos, ciclo });
}

function obterDataISOHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function obterPrimeiroDiaUtilMes(dataReferencia = new Date()) {
  const data = new Date(
    dataReferencia.getFullYear(),
    dataReferencia.getMonth(),
    1,
  );

  while (data.getDay() === 0 || data.getDay() === 6) {
    data.setDate(data.getDate() + 1);
  }

  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return {
    iso: `${ano}-${mes}-${dia}`,
    brasil: `${dia}/${mes}/${ano}`,
    chave: `${ano}-${mes}`,
  };
}

function ajustarManifestAplicativo(codigoGestor: string) {
  const manifest =
    document.querySelector<HTMLLinkElement>(
      'link[rel="manifest"]',
    );

  if (!manifest) {
    return;
  }

  const codigo = String(codigoGestor || "000")
    .trim()
    .padStart(3, "0");
  const startUrl = `/?gestor=${codigo}&app=diniz-rh`;
  const nome =
    codigo === "000"
      ? "DINIZ RH Tatyana"
      : `DINIZ RH Gestor ${codigo}`;

  const conteudo = {
    id: startUrl,
    name: nome,
    short_name: "DINIZ RH",
    description: "Portal do Gestor - Diniz Supermercados",
    start_url: startUrl,
    scope: "/",
    display: "standalone",
    background_color: "#f4f7fb",
    theme_color: "#005eb8",
    orientation: "portrait",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/diniz-rh-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/diniz-rh-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };

  const blob = new Blob([JSON.stringify(conteudo)], {
    type: "application/manifest+json",
  });

  manifest.href = URL.createObjectURL(blob);
  document.title = nome;
}

const CICLO_PADRAO = { inicio: "2026-07-01", fim: obterDataISOHoje() };

function normalizarVagas(vagas: Vaga[]): Vaga[] {
  const migracaoJaExecutada = localStorage.getItem(CHAVE_MIGRACAO_DATA_CADASTRO) === "SIM";
  const vagasNormalizadas = vagas.map((vaga) => {
    const ehEstavel = vaga.tipo === "ESTÁVEL";
    return {
      ...vaga,
      data: migracaoJaExecutada ? vaga.data : "03/07/2026",
      quantidade: ehEstavel ? 0 : Number(vaga.quantidade || 0),
      admissoes: ehEstavel ? 0 : Number(vaga.admissoes || 0),
    };
  });
  if (!migracaoJaExecutada) {
    localStorage.setItem(CHAVE_MIGRACAO_DATA_CADASTRO, "SIM");
    salvarVagas(vagasNormalizadas);
  }
  return vagasNormalizadas;
}

function carregarAdmitidos(): RegistroAdmitido[] {
  try {
    const salvo = localStorage.getItem(CHAVE_ADMITIDOS);
    if (!salvo) return [];
    const dados: unknown = JSON.parse(salvo);
    if (!Array.isArray(dados)) return [];
    const registros = dados as RegistroAdmitido[];
    const migracaoJaExecutada = localStorage.getItem(CHAVE_MIGRACAO_DATA_ADMITIDOS) === "SIM";
    const registrosNormalizados = registros.map((registro) => ({
      ...registro,
      data: migracaoJaExecutada ? registro.data : "03/07/2026",
      dataAdmissao: migracaoJaExecutada ? registro.dataAdmissao : "10/07/2026",
      ativo: false,
    }));
    if (!migracaoJaExecutada) localStorage.setItem(CHAVE_MIGRACAO_DATA_ADMITIDOS, "SIM");
    return registrosNormalizados;
  } catch { return []; }
}

function quantidadeAdmitida(registro: RegistroAdmitido) {
  return Math.max(1, Number(registro.admissoes || registro.quantidade || 1));
}

function consolidarAdmitidos(registros: RegistroAdmitido[]): RegistroAdmitido[] {
  const mapa = new Map<number, RegistroAdmitido>();
  for (const registro of registros) {
    const quantidade = quantidadeAdmitida(registro);
    const existente = mapa.get(registro.id);
    if (!existente) {
      mapa.set(registro.id, { ...registro, quantidade, admissoes: quantidade, ativo: false });
      continue;
    }
    const maiorQuantidade = Math.max(quantidadeAdmitida(existente), quantidade);
    mapa.set(registro.id, {
      ...existente, ...registro, quantidade: maiorQuantidade, admissoes: maiorQuantidade,
      dataAdmissao: registro.dataAdmissao || existente.dataAdmissao, ativo: false,
    });
  }
  return Array.from(mapa.values());
}

function criarRegistroAdmitido(vaga: Vaga, dataAdmissao: string, quantidade = 1): RegistroAdmitido {
  const total = Math.max(1, Number(quantidade || 1));
  return { ...vaga, quantidade: total, admissoes: total, ativo: false, dataAdmissao };
}

function organizarBases(vagasRecebidas: Vaga[], admitidosRecebidos: RegistroAdmitido[]) {
  const admitidosConsolidados = consolidarAdmitidos(admitidosRecebidos);
  const mapaAdmitidos = new Map<number, RegistroAdmitido>(admitidosConsolidados.map((r) => [r.id, r]));
  const vagasAbertas: Vaga[] = [];

  for (const vaga of normalizarVagas(vagasRecebidas)) {
    const ehEstavel = vaga.tipo === "ESTÁVEL";
    if (ehEstavel) { vagasAbertas.push({ ...vaga, quantidade: 0, admissoes: 0 }); continue; }
    const quantidadeOriginal = Math.max(0, Number(vaga.quantidade || 0));
    const admissoesNaCentral = Math.max(0, Number(vaga.admissoes || 0));
    const admitidoExistente = mapaAdmitidos.get(vaga.id);
    const totalAdmitido = Math.min(quantidadeOriginal, Math.max(admissoesNaCentral, admitidoExistente ? quantidadeAdmitida(admitidoExistente) : 0));

    if (totalAdmitido > 0) {
      mapaAdmitidos.set(vaga.id, criarRegistroAdmitido(
        { ...vaga, quantidade: quantidadeOriginal, admissoes: totalAdmitido },
        admitidoExistente?.dataAdmissao || vaga.data, totalAdmitido
      ));
    }
    const concluida = quantidadeOriginal > 0 && totalAdmitido >= quantidadeOriginal;
    if (!concluida) vagasAbertas.push({ ...vaga, quantidade: quantidadeOriginal, admissoes: totalAdmitido });
  }
  return { vagasAbertas, admitidos: consolidarAdmitidos(Array.from(mapaAdmitidos.values())) };
}

function prepararDadosIniciais() {
  const dados = organizarBases(carregarVagas(vagasIniciais), carregarAdmitidos());

  if (!EH_LOCAL_PRINCIPAL) {
    return dados;
  }

  const primeiroDiaUtil = obterPrimeiroDiaUtilMes();
  const chaveMigracao = `sistema-rh-data-inicial-ciclo-${primeiroDiaUtil.chave}`;

  if (localStorage.getItem(chaveMigracao) === "SIM") {
    return dados;
  }

  const vagasAtualizadas = dados.vagasAbertas.map((vaga) => ({
    ...vaga,
    data: primeiroDiaUtil.brasil,
  }));

  salvarVagas(vagasAtualizadas);
  localStorage.setItem(chaveMigracao, "SIM");

  return { ...dados, vagasAbertas: vagasAtualizadas };
}

type BackupCiclo = {
  id: string;
  dataGeracao: string;
  ciclo: {
    inicio: string;
    fim: string;
  };
  vagas: Vaga[];
  admitidos: RegistroAdmitido[];
  metricasRecrutamento: MetricasRecrutamento;
  historicoRecrutamento: RegistroSemanalRecrutamento[];
};

function baixarBackupCiclo(backup: BackupCiclo) {
  const conteudo = JSON.stringify(backup, null, 2);
  const blob = new Blob([conteudo], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${backup.id}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function registrarBackupCiclo(backup: BackupCiclo) {
  try {
    const salvo = localStorage.getItem(CHAVE_BACKUPS_CICLO);
    const lista: BackupCiclo[] = salvo ? JSON.parse(salvo) as BackupCiclo[] : [];
    localStorage.setItem(
      CHAVE_BACKUPS_CICLO,
      JSON.stringify([backup, ...lista].slice(0, 12)),
    );
  } catch {
    localStorage.setItem(CHAVE_BACKUPS_CICLO, JSON.stringify([backup]));
  }

  baixarBackupCiclo(backup);
}

function normalizarTextoChave(valor: string) {
  return String(valor || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function vagaEhEstavel(vaga: Pick<Vaga, "tipo" | "motivo">) {
  const tipo = normalizarTextoChave(vaga.tipo);
  const motivo = normalizarTextoChave(vaga.motivo);

  return tipo === "ESTAVEL" || motivo === "ESTAVEL";
}

function converterAdmitidoEmDemanda(registro: RegistroAdmitido): Vaga {
  return {
    ...registro,
    quantidade: quantidadeAdmitida(registro),
    admissoes: 0,
    ativo: true,
  };
}

function calcularDemandasAbertas(
  vagasAtuais: Vaga[],
  admitidosAtuais: RegistroAdmitido[],
): Vaga[] {
  const demandas = new Map<string, Vaga>();
  const estaveis = new Map<string, Vaga>();
  const idsAdmitidos = new Set(admitidosAtuais.map((registro) => registro.id));

  const registrarDemanda = (vaga: Vaga) => {
    if (vagaEhEstavel(vaga)) {
      estaveis.set(normalizarTextoChave(vaga.unidade), {
        ...vaga,
        quantidade: 0,
        admissoes: 0,
        ativo: true,
      });
      return;
    }

    const quantidade = Math.max(0, Number(vaga.quantidade || 0));
    const admissoes = Math.min(
      quantidade,
      Math.max(0, Number(vaga.admissoes || 0)),
    );
    const pendentes = Math.max(0, quantidade - admissoes);

    if (pendentes <= 0) {
      return;
    }

    const demanda = {
      ...vaga,
      quantidade: pendentes,
      admissoes: 0,
      ativo: true,
    };

    demandas.set(chaveVagaOperacional(demanda), demanda);
  };

  vagasAtuais
    .filter((vaga) => !idsAdmitidos.has(vaga.id) || vagaEhEstavel(vaga))
    .forEach(registrarDemanda);
  admitidosAtuais.forEach((registro) => {
    registrarDemanda(converterAdmitidoEmDemanda(registro));
  });

  return [
    ...Array.from(demandas.values()),
    ...Array.from(estaveis.values()),
  ];
}

function zerarValoresMetricasRecrutamento() {
  const metricasAtuais = carregarMetricasRecrutamento();
  const zerarGrupo = <T extends { valor: number }>(grupo: T[]) =>
    grupo.map((item) => ({ ...item, valor: 0 }));

  salvarMetricasRecrutamento({
    funil: zerarGrupo(metricasAtuais.funil),
    fontes: zerarGrupo(metricasAtuais.fontes),
    recusaGestao: zerarGrupo(metricasAtuais.recusaGestao),
    desistencias: zerarGrupo(metricasAtuais.desistencias),
    divisaoDesistencia: zerarGrupo(metricasAtuais.divisaoDesistencia),
  });
  salvarHistoricoRecrutamento([]);
}
function chaveVagaOperacional(vaga: Pick<Vaga, "codigo" | "unidade" | "tipo" | "cargo" | "setor" | "turno" | "motivo" | "emergencia" | "data">) {
  return [
    vaga.codigo,
    vaga.unidade,
    vaga.tipo,
    vaga.cargo,
    vaga.setor,
    vaga.turno,
    vaga.motivo,
    vaga.emergencia,
    vaga.data,
  ]
    .map((valor) =>
      String(valor || "")
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""),
    )
    .join("|");
}

function AppAdministrativo() {
  const modoTatyana = new URLSearchParams(window.location.search).get("app") === "tatyana";
  const areaCadastroRef = useRef<HTMLDivElement>(null);
  const [dadosIniciais] = useState(prepararDadosIniciais);
  
  const cicloSalvo = carregarCiclo(CICLO_PADRAO);
  const inicioCicloLocal = obterPrimeiroDiaUtilMes().iso;
  const [ciclo, setCiclo] = useState({
    ...cicloSalvo,
    inicio: EH_LOCAL_PRINCIPAL
      ? inicioCicloLocal
      : cicloSalvo.inicio || CICLO_PADRAO.inicio,
    fim: obterDataISOHoje(),
  });

  const [vagas, setVagas] = useState<Vaga[]>(dadosIniciais.vagasAbertas);
  const [admitidos, setAdmitidos] = useState<RegistroAdmitido[]>(dadosIniciais.admitidos);
  const [, setLixeira] = useState<Vaga[]>([]);
  const [codigoFiltro, setCodigoFiltro] = useState("001");
  const [modoTela, setModoTela] = useState<"novo" | "atualizar">("novo");
  const [admissoesPendentes, setAdmissoesPendentes] = useState<number[]>([]);
  const [
    idsVagasDestacadas,
    setIdsVagasDestacadas,
  ] = useState<number[]>([]);
  const idsUltimasVagasAdicionadasRef =
    useRef<number[]>([]);
  const [paginaAtual, setPaginaAtual] = useState<
    | "cadastro"
    | "admitidos"
    | "relatorio"
    | "relatorio2"
    | "relatorioPaisagem"
    | "dashboard"
    | "aso"
    | "gestores"
    | "aplicativo"
    | "portalgestor"
  >(() => {
    const paginaUrl = new URLSearchParams(window.location.search).get("pagina");

    if (
      paginaUrl === "cadastro" ||
      paginaUrl === "admitidos" ||
      paginaUrl === "relatorio" ||
      paginaUrl === "relatorio2" ||
      paginaUrl === "relatorioPaisagem" ||
      paginaUrl === "dashboard" ||
      paginaUrl === "aso" ||
      paginaUrl === "gestores" ||
      paginaUrl === "aplicativo" ||
      paginaUrl === "portalgestor"
    ) {
      return paginaUrl;
    }

    return modoTatyana ? "cadastro" : "dashboard";
  });
  const [salvandoNuvem, setSalvandoNuvem] = useState(false);
  const [impressaoPendente, setImpressaoPendente] = useState(false);
  const [carregandoEstadoNuvem, setCarregandoEstadoNuvem] = useState(true);
  const [erroEstadoNuvem, setErroEstadoNuvem] = useState("");
  const [estadoNuvemDisponivel, setEstadoNuvemDisponivel] = useState(false);
  const estadoNuvemCarregadoRef = useRef(false);
  const assinaturaNuvemRef = useRef("");
  const temAtualizacaoPendente = admissoesPendentes.length > 0;

  useEffect(() => {
    let ativo = true;

    async function receberDadosDaNuvem() {
      try {
        const estado = await carregarEstadoAdmin();

        if (!ativo) return;
        if (!estado) throw new Error("Estado principal não localizado.");

        const cicloNuvem = {
          inicio: estado.ciclo.inicio || CICLO_PADRAO.inicio,
          fim: estado.ciclo.fim || obterDataISOHoje(),
        };

        assinaturaNuvemRef.current = assinaturaEstado(
          estado.vagas,
          estado.admitidos,
          cicloNuvem,
        );
        estadoNuvemCarregadoRef.current = true;
        setEstadoNuvemDisponivel(true);
        setVagas(estado.vagas);
        setAdmitidos(estado.admitidos);
        setCiclo(cicloNuvem);
        setErroEstadoNuvem("");
        setCarregandoEstadoNuvem(false);

        const chaveSincronizacao = "sistema-rh-sincronizacao-nuvem-aplicada";
        const sincronizacaoJaAplicada =
          sessionStorage.getItem(chaveSincronizacao) === estado.atualizadoEm;

        if (!sincronizacaoJaAplicada) {
          sessionStorage.setItem(chaveSincronizacao, estado.atualizadoEm);
          if (aplicarArmazenamentoLocal(estado.armazenamentoLocal)) {
            window.location.reload();
          }
        }
      } catch (erro) {
        if (!ativo) return;
        setErroEstadoNuvem(
          erro instanceof Error ? erro.message : "Falha ao carregar a nuvem.",
        );
        setCarregandoEstadoNuvem(false);
      }
    }

    void receberDadosDaNuvem();

    const atualizarAoRetornar = () => {
      void receberDadosDaNuvem();
    };

    window.addEventListener("focus", atualizarAoRetornar);
    const intervalo = window.setInterval(atualizarAoRetornar, 15000);

    return () => {
      ativo = false;
      window.clearInterval(intervalo);
      window.removeEventListener("focus", atualizarAoRetornar);
    };
  }, []);

  useEffect(() => {
    if (!estadoNuvemCarregadoRef.current) return;

    const assinaturaAtual = assinaturaEstado(vagas, admitidos, ciclo);
    if (assinaturaAtual === assinaturaNuvemRef.current) return;

    const temporizador = window.setTimeout(() => {
      void salvarEstadoAdmin({ vagas, admitidos, ciclo })
        .then(() => {
          assinaturaNuvemRef.current = assinaturaAtual;
          setErroEstadoNuvem("");
        })
        .catch((erro: unknown) => {
          setErroEstadoNuvem(
            erro instanceof Error ? erro.message : "Falha ao salvar na nuvem.",
          );
        });
    }, 800);

    return () => window.clearTimeout(temporizador);
  }, [vagas, admitidos, ciclo]);

  const dadosCompletosParaCards = (() => {
    const mapaCompleto = new Map<number, Vaga>();
    vagas.forEach(v => mapaCompleto.set(v.id, v));
    admitidos.forEach(adm => {
      const existente = mapaCompleto.get(adm.id);
      mapaCompleto.set(adm.id, { ...existente, ...adm, quantidade: existente?.quantidade || adm.quantidade } as Vaga);
    });
    return Array.from(mapaCompleto.values());
  })();
  const dadosRelatorioPaisagem = [...vagas, ...admitidos];



  useEffect(() => {
    const atualizarPaginaPelaUrl = () => {
      const paginaUrl = new URLSearchParams(window.location.search).get("pagina");

      if (
        paginaUrl === "cadastro" ||
        paginaUrl === "admitidos" ||
        paginaUrl === "relatorio" ||
        paginaUrl === "relatorio2" ||
        paginaUrl === "relatorioPaisagem" ||
        paginaUrl === "dashboard" ||
        paginaUrl === "aso" ||
        paginaUrl === "gestores" ||
        paginaUrl === "aplicativo" ||
        paginaUrl === "portalgestor"
      ) {
        setPaginaAtual(paginaUrl);
      }
    };

    window.addEventListener("popstate", atualizarPaginaPelaUrl);

    return () => {
      window.removeEventListener("popstate", atualizarPaginaPelaUrl);
    };
  }, []);

  useEffect(() => {
    async function importarExcel(
      evento: Event,
    ) {
      const eventoImportacao =
        evento as CustomEvent<{
          arquivo?: File;
        }>;

      const arquivo =
        eventoImportacao.detail?.arquivo;

      if (!arquivo) {
        return;
      }

      const confirmar = window.confirm(
        "Deseja substituir os dados atuais pelas informações da planilha selecionada?",
      );

      if (!confirmar) {
        return;
      }

      try {
        const idsExistentes = [
          ...vagas.map((vaga) =>
            Number(vaga.id || 0),
          ),
          ...admitidos.map((registro) =>
            Number(registro.id || 0),
          ),
        ];

        const proximoId =
          idsExistentes.length > 0
            ? Math.max(...idsExistentes) + 1
            : 1;

        const { importarPlanilhaExcel } = await import("./Services/excelImportService");
        const resultado =
          await importarPlanilhaExcel(
            arquivo,
            proximoId,
          );

        setVagas(resultado.vagas);
        setAdmitidos(resultado.admitidos);
        setAdmissoesPendentes([]);
        setCodigoFiltro("0");
        setModoTela("novo");
        setPaginaAtual("cadastro");

        salvarVagas(resultado.vagas);

        localStorage.setItem(
          CHAVE_ADMITIDOS,
          JSON.stringify(
            resultado.admitidos,
          ),
        );

        const mensagemAvisos =
          resultado.avisos.length > 0
            ? `\n\nAvisos:\n${resultado.avisos
                .slice(0, 8)
                .join("\n")}`
            : "";

        alert(
          `Planilha importada com sucesso.\n\n` +
            `Vagas importadas: ${resultado.totalVagasImportadas}\n` +
            `Admitidos importados: ${resultado.totalAdmitidosImportados}` +
            mensagemAvisos,
        );
      } catch (erro) {
        alert(
          erro instanceof Error
            ? erro.message
            : "Não foi possível importar a planilha.",
        );
      }
    }

    window.addEventListener(
      "sistema-rh-importar-excel",
      importarExcel,
    );

    return () => {
      window.removeEventListener(
        "sistema-rh-importar-excel",
        importarExcel,
      );
    };
  }, [vagas, admitidos]);

  useEffect(() => {
    const executar = () => {
      if (paginaAtual === "cadastro" && areaCadastroRef.current) {
        areaCadastroRef.current.scrollIntoView({ behavior: "auto", block: "start" });
        return;
      }
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    requestAnimationFrame(executar);
  }, [paginaAtual]);

  useEffect(() => {
    function abrirCadastroParaProcessar() {
      setCodigoFiltro("0");
      setPaginaAtual("cadastro");
    }

    eventBus.on(
      "SOLICITACAO_APROVADA",
      abrirCadastroParaProcessar,
    );

    return () => {
      eventBus.off(
        "SOLICITACAO_APROVADA",
        abrirCadastroParaProcessar,
      );
    };
  }, []);

  useEffect(() => {
    function destacarVagasCriadas(dados?: unknown) {
      const payload = dados as {
        origem?: string;
        vagas?: Vaga[];
      };

      if (
        payload?.origem !== "CENTRAL_GESTORES" ||
        !Array.isArray(payload.vagas)
      ) {
        idsUltimasVagasAdicionadasRef.current =
          [];
        return;
      }

      const idsRecentes =
        idsUltimasVagasAdicionadasRef.current;

      const ids = (
        idsRecentes.length > 0
          ? idsRecentes
          : payload.vagas.map((vaga) =>
              Number(vaga.id),
            )
      ).filter(Number.isFinite);

      idsUltimasVagasAdicionadasRef.current =
        [];

      if (ids.length === 0) {
        return;
      }

      setIdsVagasDestacadas((atuais) =>
        Array.from(new Set([...ids, ...atuais])),
      );
      setCodigoFiltro("0");
      setPaginaAtual("cadastro");

      window.setTimeout(() => {
        setIdsVagasDestacadas((atuais) =>
          atuais.filter((id) => !ids.includes(id)),
        );
      }, 60000);
    }

    eventBus.on("VAGA_CRIADA", destacarVagasCriadas);

    return () => {
      eventBus.off("VAGA_CRIADA", destacarVagasCriadas);
    };
  }, []);

  useEffect(() => {
    if (!impressaoPendente || paginaAtual !== "relatorioPaisagem") {
      return;
    }

    const id = window.setTimeout(() => {
      window.print();
      setImpressaoPendente(false);
    }, 800);

    return () => window.clearTimeout(id);
  }, [impressaoPendente, paginaAtual]);

  useEffect(() => { salvarCiclo(ciclo); }, [ciclo]);
  useEffect(() => { salvarVagas(vagas); }, [vagas]);
  useEffect(() => { localStorage.setItem(CHAVE_ADMITIDOS, JSON.stringify(admitidos)); }, [admitidos]);



  async function publicarDadosNaNuvem() {
    const confirmar = window.confirm("Publicar os dados deste computador na nuvem agora?");

    if (!confirmar) {
      return;
    }

    try {
      setSalvandoNuvem(true);
      await salvarEstadoAdmin({
        vagas,
        admitidos,
        ciclo,
      });
      alert("Nuvem atualizada com os dados deste computador.");
    } catch (erro) {
      alert(
        erro instanceof Error
          ? `Erro ao atualizar nuvem: ${erro.message}`
          : "Erro ao atualizar nuvem.",
      );
    } finally {
      setSalvandoNuvem(false);
    }
  }

  function gerarPDF() {
    const hoje = obterDataISOHoje();
    setCiclo((c) => {
      const cicloAtualizado = {
        ...c,
        inicio: c.inicio || CICLO_PADRAO.inicio,
        fim: hoje,
      };

      salvarCiclo(cicloAtualizado);
      return cicloAtualizado;
    });
    window.history.pushState(
      {},
      "",
      `${window.location.pathname}?pagina=relatorioPaisagem`,
    );
    setPaginaAtual("relatorioPaisagem");
    setImpressaoPendente(true);
  }

  function zerarCiclo() {
    const confirmar = window.confirm(
      "Zerar ciclo agora? O sistema vai baixar um backup, remover os admitidos e manter somente as demandas em aberto.",
    );

    if (!confirmar) {
      return;
    }

    const agora = new Date();
    const hoje = obterDataISOHoje();
    const idBackup = `backup-ciclo-rh-${hoje}-${String(agora.getHours()).padStart(2, "0")}${String(agora.getMinutes()).padStart(2, "0")}${String(agora.getSeconds()).padStart(2, "0")}`;
    const backup: BackupCiclo = {
      id: idBackup,
      dataGeracao: agora.toISOString(),
      ciclo,
      vagas,
      admitidos,
      metricasRecrutamento: carregarMetricasRecrutamento(),
      historicoRecrutamento: carregarHistoricoRecrutamento(),
    };
    const demandasAbertas = calcularDemandasAbertas(vagas, admitidos);
    const novoCiclo = {
      inicio: hoje,
      fim: hoje,
    };

    registrarBackupCiclo(backup);
    setVagas(demandasAbertas);
    setAdmitidos([]);
    setAdmissoesPendentes([]);
    setCodigoFiltro("0");
    setModoTela("novo");
    setCiclo(novoCiclo);
    salvarVagas(demandasAbertas);
    salvarCiclo(novoCiclo);
    localStorage.setItem(CHAVE_ADMITIDOS, JSON.stringify([]));
    zerarValoresMetricasRecrutamento();
    alert("Ciclo zerado. Backup salvo na pasta de downloads.");
  }

  async function persistirEstadoNaNuvem(
    vagasAtualizadas: Vaga[],
    admitidosAtualizados: RegistroAdmitido[],
    mensagemSucesso: string,
    cicloAtualizado = ciclo,
  ) {
    try {
      await salvarEstadoAdmin({
        vagas: vagasAtualizadas,
        admitidos: admitidosAtualizados,
        ciclo: cicloAtualizado,
      });
      assinaturaNuvemRef.current = assinaturaEstado(
        vagasAtualizadas,
        admitidosAtualizados,
        cicloAtualizado,
      );
      alert(mensagemSucesso);
    } catch (erro) {
      alert(
        erro instanceof Error
          ? `Alteração não sincronizada: ${erro.message}`
          : "Alteração não sincronizada com a nuvem.",
      );
    }
  }

  const vagasFiltradas = vagas.filter(v => codigoFiltro === "0" || v.codigo === codigoFiltro);
  function alterarModo(modo: "novo" | "atualizar") { setModoTela(modo); setAdmissoesPendentes([]); }
  function encerrarVaga(id: number) {
    if (!window.confirm("Encerrar vaga?")) return;
    const v = vagas.find(i => i.id === id); if (!v) return;
    setLixeira(l => [{ ...v, ativo: false, motivo: "ENCERRAR VAGA" }, ...l]);
    const vagasAtualizadas = vagas.filter((item) => item.id !== id);
    setVagas(vagasAtualizadas);
    setAdmissoesPendentes(l => l.filter(i => i !== id));
    void persistirEstadoNaNuvem(
      vagasAtualizadas,
      admitidos,
      "Encerramento sincronizado com a nuvem.",
    );
  }
  function excluirVaga(id: number) {
    if (!window.confirm("Excluir cadastro?")) return;
    const v = vagas.find(i => i.id === id);
    if (v) setLixeira(l => [{ ...v, ativo: false, motivo: "EXCLUÍDO" }, ...l]);
    const vagasAtualizadas = vagas.filter((item) => item.id !== id);
    setVagas(vagasAtualizadas);
    setAdmissoesPendentes(l => l.filter(i => i !== id));
    void persistirEstadoNaNuvem(
      vagasAtualizadas,
      admitidos,
      "Exclusão sincronizada com a nuvem.",
    );
  }

  function excluirAdmitido(indice: number) {
    const admitidosAtualizados = admitidos.filter(
      (_, indiceAtual) => indiceAtual !== indice,
    );
    setAdmitidos(admitidosAtualizados);
    void persistirEstadoNaNuvem(
      vagas,
      admitidosAtualizados,
      "Exclusão sincronizada com a nuvem.",
    );
  }
  function adicionarVagas(novas: Vaga[]) {
    const hoje = new Date().toLocaleDateString("pt-BR");
    const dataSolicitacao = hoje;

    const normalizarUnidade = (valor: string) =>
      String(valor || "")
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    setVagas((listaAtual) => {
      const idsExistentes = [
        ...listaAtual.map((vaga) =>
          Number(vaga.id || 0),
        ),
        ...admitidos.map((registro) =>
          Number(registro.id || 0),
        ),
      ];

      let proximoId =
        idsExistentes.length > 0
          ? Math.max(...idsExistentes) + 1
          : 1;
      const idsUsados = new Set(idsExistentes);

      const novasNormalizadas = novas.map(
        (vaga) => {
          const idRecebido = Number(vaga.id || 0);
          const idFinal =
            idRecebido > 0 && !idsUsados.has(idRecebido)
              ? idRecebido
              : proximoId;

          idsUsados.add(idFinal);

          const vagaNormalizada: Vaga = {
            ...vaga,
            id: idFinal,
            data: vaga.data || dataSolicitacao,
            quantidade:
              vaga.tipo === "ESTÁVEL"
                ? 0
                : Number(vaga.quantidade || 0),
            admissoes:
              vaga.tipo === "ESTÁVEL"
                ? 0
                : Number(vaga.admissoes || 0),
          };

          while (idsUsados.has(proximoId)) {
            proximoId += 1;
          }

          return vagaNormalizada;
        },
      );

      idsUltimasVagasAdicionadasRef.current =
        novasNormalizadas.map(
          (vaga) => vaga.id,
        );

      const unidadesComNovaVagaAtiva =
        novasNormalizadas
          .filter(
            (vaga) =>
              normalizarUnidade(vaga.tipo) !==
              "ESTAVEL",
          )
          .map((vaga) =>
            normalizarUnidade(vaga.unidade),
          );

      const listaSemEstaveis =
        listaAtual.filter((vagaAtual) => {
          const ehEstavel =
            normalizarUnidade(vagaAtual.tipo) ===
              "ESTAVEL" ||
            normalizarUnidade(vagaAtual.motivo) ===
              "ESTAVEL";

          if (!ehEstavel) {
            return true;
          }

          const unidadeAtual =
            normalizarUnidade(vagaAtual.unidade);

          return !unidadesComNovaVagaAtiva.includes(
            unidadeAtual,
          );
        });

      const listaAtualizada = [
        ...listaSemEstaveis,
        ...novasNormalizadas,
      ];

      salvarVagas(listaAtualizada);
      void persistirEstadoNaNuvem(
        listaAtualizada,
        admitidos,
        "Cadastro sincronizado com a nuvem.",
      );

      return listaAtualizada;
    });
  }
  function atualizarMotivo(id: number, m: string) { if (m === "ENCERRAR VAGA") { encerrarVaga(id); return; } setVagas((listaAtual) => { const listaAtualizada = listaAtual.map((vaga) => vaga.id === id ? { ...vaga, motivo: m } : vaga);  return listaAtualizada; }); }
  function atualizarCargo(id: number, c: string, s: string) { setVagas((listaAtual) => { const listaAtualizada = listaAtual.map((vaga) => vaga.id === id ? { ...vaga, cargo: c, setor: s } : vaga);  return listaAtualizada; }); }
  function atualizarTipo(id: number, tipo: string) { setVagas((listaAtual) => listaAtual.map((vaga) => vaga.id === id ? { ...vaga, tipo } : vaga)); }
  function atualizarTurno(id: number, turno: string) { setVagas((listaAtual) => listaAtual.map((vaga) => vaga.id === id ? { ...vaga, turno: turno as Vaga["turno"] } : vaga)); }
  function atualizarEmergencia(id: number, e: "SIM" | "NÃO") { setVagas((listaAtual) => { const listaAtualizada = listaAtual.map((vaga) => vaga.id === id ? { ...vaga, emergencia: e } : vaga);  return listaAtualizada; }); }
  function atualizarDataCadastro(id: number, data: string) {
    const vagasAtualizadas = vagas.map((vaga) =>
      vaga.id === id ? { ...vaga, data } : vaga,
    );
    setVagas(vagasAtualizadas);
    salvarVagas(vagasAtualizadas);
    void persistirEstadoNaNuvem(
      vagasAtualizadas,
      admitidos,
      "Data do cadastro sincronizada.",
    );
  }
  function alternarAdmissao(id: number) {
    const v = vagas.find(i => i.id === id);
    if (!v || Number(v.admissoes || 0) >= Number(v.quantidade || 0)) return;
    setAdmissoesPendentes(l => l.includes(id) ? l.filter(i => i !== id) : [...l, id]);
  }
  function confirmarAtualizacaoCadastro() {
    if (!codigoFiltro) { alert("Informe o código!"); return; }
    if (admissoesPendentes.length === 0) { alert("Nenhuma admissão selecionada!"); return; }
    const hoje = new Date().toLocaleDateString("pt-BR");
    const ids = new Set(admissoesPendentes);
    const mapa = new Map(consolidarAdmitidos(admitidos).map(r => [r.id, r]));
    const atualizadas: Vaga[] = [];
    let total = 0;
    for (const v of vagas) {
      if (!ids.has(v.id)) { atualizadas.push(v); continue; }
      const qtd = Math.max(0, Number(v.quantidade || 0));
      const existente = mapa.get(v.id);
      const atuais = Math.max(0, Number(v.admissoes || 0), existente ? quantidadeAdmitida(existente) : 0);
      if (qtd <= 0 || atuais >= qtd) continue;
      const novas = Math.min(atuais + 1, qtd);
      mapa.set(v.id, criarRegistroAdmitido({ ...v, quantidade: qtd, admissoes: novas }, hoje, novas));
      if (novas < qtd) atualizadas.push({ ...v, quantidade: qtd, admissoes: novas });
      total++;
    }
    if (total === 0) { alert("Nenhuma alteração!"); return; }
    const novaLista = consolidarAdmitidos(Array.from(mapa.values()));
    setVagas(atualizadas); setAdmitidos(novaLista); salvarVagas(atualizadas);
    localStorage.setItem(CHAVE_ADMITIDOS, JSON.stringify(novaLista));
    setAdmissoesPendentes([]);
    alert("Admissão registrada!");
  }

  function alterarRegistroAdmitido(i: number, d: Partial<RegistroAdmitido>) {
    const nova = [...admitidos];
    nova[i] = { ...nova[i], ...d };
    setAdmitidos(nova);
    localStorage.setItem(CHAVE_ADMITIDOS, JSON.stringify(nova));
    void persistirEstadoNaNuvem(
      vagas,
      nova,
      "Data do admitido sincronizada.",
    );
  }

  function alterarDataRelatorio(
    id: number,
    campo: "solicitacao" | "admissao",
    valor: string,
  ) {
    const vagasAtualizadas = campo === "solicitacao"
      ? vagas.map((vaga) => vaga.id === id ? { ...vaga, data: valor } : vaga)
      : vagas;
    const admitidosAtualizados = admitidos.map((registro) => {
      if (registro.id !== id) return registro;
      return campo === "solicitacao"
        ? { ...registro, data: valor }
        : { ...registro, dataAdmissao: valor };
    });

    setVagas(vagasAtualizadas);
    setAdmitidos(admitidosAtualizados);
    salvarVagas(vagasAtualizadas);
    localStorage.setItem(CHAVE_ADMITIDOS, JSON.stringify(admitidosAtualizados));
    void persistirEstadoNaNuvem(
      vagasAtualizadas,
      admitidosAtualizados,
      "Data do relatório sincronizada.",
    );
  }

  function alterarCiclo(cicloAtualizado: typeof ciclo) {
    setCiclo(cicloAtualizado);
    salvarCiclo(cicloAtualizado);
    void persistirEstadoNaNuvem(
      vagas,
      admitidos,
      "Período sincronizado.",
      cicloAtualizado,
    );
  }

  function reativarAdmitido(i: number) {
    const registro = admitidos[i];

    if (!registro) return;

    const quantidade = Math.max(
      Number(registro.quantidade || 0),
      Number(registro.admissoes || 0),
      1,
    );

    const vagaReativada: Vaga = {
      id: registro.id,
      codigo: registro.codigo,
      unidade: registro.unidade,
      data: registro.data,
      tipo: registro.tipo,
      cargo: registro.cargo,
      setor: registro.setor,
      turno: registro.turno,
      motivo: registro.motivo,
      emergencia: registro.emergencia,
      quantidade,
      admissoes: 0,
      ativo: true,
    };

    setVagas((listaAtual) => [
      vagaReativada,
      ...listaAtual.filter((vaga) => vaga.id !== registro.id),
    ]);

    const nova = [...admitidos];
    nova.splice(i, 1);
    setAdmitidos(nova);
    localStorage.setItem(CHAVE_ADMITIDOS, JSON.stringify(nova));
  }

  if (carregandoEstadoNuvem) {
    return <div className="estado-nuvem">Carregando dados oficiais...</div>;
  }

  if (!estadoNuvemDisponivel) {
    return (
      <div className="estado-nuvem estado-nuvem-erro">
        <strong>Não foi possível carregar os dados oficiais.</strong>
        <span>{erroEstadoNuvem}</span>
        <button type="button" onClick={() => window.location.reload()}>
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className={modoTatyana ? "app app-tatyana" : "app"}>
      {!modoTatyana && <Sidebar />}
      <main className="principal">
        {erroEstadoNuvem && (
          <div className="aviso-sincronizacao">
            Sincronização interrompida: {erroEstadoNuvem}
          </div>
        )}
        {!modoTatyana && (
          <Header
            paginaAtual={paginaAtual}
            setPaginaAtual={setPaginaAtual}
            onPublicarNuvem={publicarDadosNaNuvem}
            mostrarNuvem={EH_LOCAL_ADMIN}

            salvandoNuvem={salvandoNuvem}
          />
        )}

        <Suspense fallback={<div className="estado-nuvem">Carregando tela...</div>}>
        {paginaAtual === "cadastro" && (
          <>
            <Cards
              vagas={dadosCompletosParaCards}
              vagasAbertas={vagas}
              admitidos={admitidos}
            />
            <div ref={areaCadastroRef} className="area-trabalho">
              <Cadastro
                vagas={vagas} onAdicionarVagas={adicionarVagas} onSelecionarCodigo={setCodigoFiltro}
                onAlterarModo={alterarModo} onConfirmarAtualizacao={confirmarAtualizacaoCadastro}
                temAtualizacaoPendente={temAtualizacaoPendente} onGerarPDF={gerarPDF}
                onZerarCiclo={zerarCiclo}
              />
              <TelaCadastro
                vagas={vagasFiltradas} modo={modoTela} admissoesPendentes={admissoesPendentes}
                onAtualizarCargo={atualizarCargo} onAtualizarTipo={atualizarTipo} onAtualizarTurno={atualizarTurno} onAtualizarMotivo={atualizarMotivo}
                onAtualizarEmergencia={atualizarEmergencia} onAtualizarData={atualizarDataCadastro} onAlternarAdmissao={alternarAdmissao}
                onExcluirVaga={excluirVaga}
                idsVagasDestacadas={idsVagasDestacadas}
              />
            </div>
          </>
        )}

        {paginaAtual === "admitidos" && (
          <>
            <Admitidos
              admitidos={admitidos}
              onExcluir={excluirAdmitido}
              onReativar={reativarAdmitido}
              onAlterarRegistro={alterarRegistroAdmitido}
            />
          </>
        )}

        {paginaAtual === "relatorio" && <RelatorioGerencial vagas={[...vagas, ...admitidos]} ciclo={ciclo} />}
        {paginaAtual === "relatorio2" && <RelatorioA4 vagas={[...vagas, ...admitidos]} ciclo={ciclo} />}
        {paginaAtual === "relatorioPaisagem" && (
          <RelatorioPaisagem
            vagas={dadosRelatorioPaisagem}
            ciclo={ciclo}
            onAlterarCiclo={alterarCiclo}
            onAlterarData={alterarDataRelatorio}
          />
        )}
        {paginaAtual === "dashboard" && <DashboardRH vagas={dadosCompletosParaCards} admitidos={admitidos} />}
        {paginaAtual === "aplicativo" && <TelaGestores modo="monitor" />}
        {paginaAtual === "gestores" && <TelaGestores />}
        {paginaAtual === "portalgestor" && <AppGestor />}
        {paginaAtual === "aso" && <GestaoASO admitidos={admitidos} />}
        </Suspense>
      </main>
    </div>
  );
}

function App() {
  const p = new URLSearchParams(window.location.search);
  const gestor = Boolean(p.get("gestor") || p.get("codigo"));
  const cod = p.get("gestor") || p.get("codigo") || "001";

  useEffect(() => {
    if (gestor) {
      ajustarManifestAplicativo(cod);
    }
  }, [gestor, cod]);

  if (gestor) {
    return <AuthGate perfil="GESTOR" codigoGestor={cod}><Suspense fallback={<div className="estado-nuvem">Carregando aplicativo...</div>}><AppGestor /></Suspense></AuthGate>;
  }
  return <AuthGate perfil="ADMIN"><AppAdministrativo /></AuthGate>;
}

export default App;























