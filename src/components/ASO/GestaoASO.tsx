import html2pdf from "html2pdf.js";
import { useEffect, useMemo, useState } from "react";

import type { RegistroAdmitido } from "../Admitidos/Admitidos";
import cargos from "../../data/cargos";
import unidades from "../../data/unidades";
import "./GestaoASO.css";

type StatusASO =
  | "AGENDADO"
  | "REALIZADO"
  | "APTO"
  | "INAPTO"
  | "PENDENTE";

type TipoExame =
  | "ADMISSIONAL"
  | "PERIÓDICO"
  | "DEMISSIONAL"
  | "RETORNO AO TRABALHO"
  | "MUDANÇA DE RISCO";

type ResultadoAprovacao = "" | "APTO" | "INAPTO";
type ExameRealizado = "" | "SIM" | "NÃO";

type RegistroASO = {
  id: string;
  codigo: string;
  origemAdmitidoId?: string;
  nome: string;
  telefone: string;
  email: string;
  unidade: string;
  tipo: string;
  cargo: string;
  setor: string;
  turno: string;
  dataAdmissao: string;
  tipoExame: TipoExame;
  clinica: string;
  dataAprovacao: string;
  resultadoAprovacao: ResultadoAprovacao;
  dataExame: string;
  exameRealizado: ExameRealizado;
  status: StatusASO;
  observacoes: string;
  criadoEm: string;
  atualizadoEm: string;
};

type FormularioASO = Omit<
  RegistroASO,
  "id" | "codigo" | "criadoEm" | "atualizadoEm"
>;

const CHAVE_ASO = "sistema-rh-registros-aso";
const CHAVE_ASO_EXCLUIDOS = "sistema-rh-registros-aso-excluidos";

const FORMULARIO_VAZIO: FormularioASO = {
  nome: "",
  telefone: "",
  email: "",
  unidade: "",
  tipo: "",
  cargo: "",
  setor: "",
  turno: "",
  dataAdmissao: "",
  tipoExame: "ADMISSIONAL",
  clinica: "",
  dataAprovacao: "",
  resultadoAprovacao: "",
  dataExame: "",
  exameRealizado: "",
  status: "PENDENTE",
  observacoes: "",
};

type GestaoASOProps = {
  admitidos: RegistroAdmitido[];
};

function carregarExcluidos() {
  try {
    const dados = JSON.parse(
      localStorage.getItem(CHAVE_ASO_EXCLUIDOS) || "[]",
    ) as unknown;
    return Array.isArray(dados) ? dados.map(String) : [];
  } catch {
    return [];
  }
}

function quantidadeAdmitida(registro: RegistroAdmitido) {
  return Math.max(
    1,
    Number(registro.admissoes || 0),
    Number(registro.quantidade || 0),
  );
}

function sincronizarComAdmitidos(
  registros: RegistroASO[],
  admitidos: RegistroAdmitido[],
) {
  const excluidos = new Set(carregarExcluidos());
  const porOrigem = new Map(
    registros
      .filter((item) => item.origemAdmitidoId)
      .map((item) => [item.origemAdmitidoId as string, item]),
  );
  const agora = new Date().toISOString();
  const sincronizados: RegistroASO[] = [];

  admitidos.forEach((admitido) => {
    const quantidade = quantidadeAdmitida(admitido);

    for (let indice = 1; indice <= quantidade; indice += 1) {
      const origemAdmitidoId = `${admitido.id}-${indice}`;
      if (excluidos.has(origemAdmitidoId)) continue;

      const existente = porOrigem.get(origemAdmitidoId);
      sincronizados.push({
        ...(existente || {
          id: crypto.randomUUID(),
          codigo: `ASO-ADM-${admitido.id}-${indice}`,
          nome: "",
          telefone: "",
          email: "",
          tipoExame: "ADMISSIONAL" as TipoExame,
          clinica: "",
          dataAprovacao: "",
          resultadoAprovacao: "" as ResultadoAprovacao,
          dataExame: "",
          exameRealizado: "" as ExameRealizado,
          status: "PENDENTE" as StatusASO,
          observacoes: "",
          criadoEm: agora,
          atualizadoEm: agora,
        }),
        origemAdmitidoId,
        unidade: admitido.unidade,
        tipo: admitido.tipo,
        cargo: admitido.cargo,
        setor: admitido.setor,
        turno: admitido.turno,
        dataAdmissao: admitido.dataAdmissao || admitido.data,
      });
    }
  });

  const origensSincronizadas = new Set(
    sincronizados.map((item) => item.origemAdmitidoId),
  );
  const preservados = registros.filter(
    (item) =>
      !item.origemAdmitidoId ||
      !origensSincronizadas.has(item.origemAdmitidoId),
  );

  return [...sincronizados, ...preservados];
}

function carregarRegistros(): RegistroASO[] {
  try {
    const dados = JSON.parse(localStorage.getItem(CHAVE_ASO) || "[]") as unknown;
    return Array.isArray(dados)
      ? dados.map((item) => ({
          ...FORMULARIO_VAZIO,
          ...(item as RegistroASO),
        }))
      : [];
  } catch {
    return [];
  }
}

function salvarRegistros(registros: RegistroASO[]) {
  localStorage.setItem(CHAVE_ASO, JSON.stringify(registros));
}

function gerarCodigo(registros: RegistroASO[]) {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const sequencia = String(registros.length + 1).padStart(4, "0");
  return `ASO-${ano}${mes}-${sequencia}`;
}

function escaparHtml(valor: unknown) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function GestaoASO({ admitidos }: GestaoASOProps) {
  const [registros, setRegistros] = useState<RegistroASO[]>(carregarRegistros);
  const [formulario, setFormulario] = useState<FormularioASO>({ ...FORMULARIO_VAZIO });
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  function atualizarListaAdmitidos() {
    const sincronizados = sincronizarComAdmitidos(registros, admitidos);
    salvarRegistros(sincronizados);
    setRegistros(sincronizados);
  }

  useEffect(() => {
    const sincronizados = sincronizarComAdmitidos(
      carregarRegistros(),
      admitidos,
    );
    salvarRegistros(sincronizados);
    setRegistros(sincronizados);
  }, [admitidos]);

  const resumo = useMemo(
    () => ({
      total: registros.length,
      agendados: registros.filter((item) => item.status === "AGENDADO").length,
      aptos: registros.filter((item) => item.status === "APTO").length,
      pendentes: registros.filter((item) => item.status === "PENDENTE").length,
    }),
    [registros],
  );

  const registrosFiltrados = useMemo(() => {
    const termo = busca.trim().toUpperCase();
    if (!termo) return registros;

    return registros.filter((item) =>
      [item.codigo, item.nome, item.unidade, item.tipo, item.cargo, item.setor, item.clinica]
        .join(" ")
        .toUpperCase()
        .includes(termo),
    );
  }, [busca, registros]);

  function atualizarCampo<K extends keyof FormularioASO>(
    campo: K,
    valor: FormularioASO[K],
  ) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  function salvar() {
    if (!formulario.nome.trim() || !formulario.telefone.trim()) {
      alert("Informe nome e telefone do candidato.");
      return;
    }

    if (!formulario.unidade || !formulario.cargo || !formulario.clinica.trim()) {
      alert("Informe unidade, cargo e clínica.");
      return;
    }

    if (formulario.email && !formulario.email.includes("@")) {
      alert("Informe um e-mail válido.");
      return;
    }

    const agora = new Date().toISOString();
    const novosRegistros = editandoId
      ? registros.map((item) =>
          item.id === editandoId
            ? { ...item, ...formulario, atualizadoEm: agora }
            : item,
        )
      : [
          {
            ...formulario,
            id: crypto.randomUUID(),
            codigo: gerarCodigo(registros),
            criadoEm: agora,
            atualizadoEm: agora,
          },
          ...registros,
        ];

    setRegistros(novosRegistros);
    salvarRegistros(novosRegistros);
    setFormulario(FORMULARIO_VAZIO);
    setEditandoId(null);
  }

  function editar(registro: RegistroASO) {
    const { id: _id, codigo: _codigo, criadoEm: _criado, atualizadoEm: _atualizado, ...dados } = registro;
    setFormulario(dados);
    setEditandoId(registro.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function excluir(registro: RegistroASO) {
    if (!window.confirm("Excluir este registro ASO?")) return;

    if (registro.origemAdmitidoId) {
      const excluidos = new Set(carregarExcluidos());
      excluidos.add(registro.origemAdmitidoId);
      localStorage.setItem(
        CHAVE_ASO_EXCLUIDOS,
        JSON.stringify(Array.from(excluidos)),
      );
    }

    const novosRegistros = registros.filter((item) => item.id !== registro.id);
    setRegistros(novosRegistros);
    salvarRegistros(novosRegistros);
  }

  function atualizarRegistroLinha<K extends keyof RegistroASO>(
    id: string,
    campo: K,
    valor: RegistroASO[K],
  ) {
    const atualizados = registros.map((registro) => {
      if (registro.id !== id) return registro;

      const alterado = {
        ...registro,
        [campo]: valor,
        atualizadoEm: new Date().toISOString(),
      };

      if (
        campo === "resultadoAprovacao" &&
        (valor === "APTO" || valor === "INAPTO")
      ) {
        return { ...alterado, status: valor } as RegistroASO;
      }

      return alterado;
    });

    setRegistros(atualizados);
    salvarRegistros(atualizados);
  }

  function gerarPDFGeral() {
    if (registros.length === 0) {
      alert("Nenhum registro disponível para gerar o PDF.");
      return;
    }

    const documento = document.createElement("section");
    documento.className = "aso-pdf-documento aso-pdf-geral";
    const linhas = registros
      .map((registro) => `
        <tr>
          <td>${escaparHtml(registro.nome || "Aguardando complemento")}</td>
          <td>${escaparHtml(registro.telefone || "-")}</td>
          <td>${escaparHtml(registro.email || "-")}</td>
          <td>${escaparHtml(registro.unidade || "-")}</td>
          <td>${escaparHtml(registro.tipo || "-")}</td>
          <td>${escaparHtml(registro.cargo || "-")}</td>
          <td>${escaparHtml(registro.setor || "-")}</td>
          <td>${escaparHtml(registro.turno || "-")}</td>
          <td>${escaparHtml(registro.dataAdmissao || "-")}</td>
          <td>${escaparHtml(registro.clinica || "-")}</td>
          <td>${escaparHtml(registro.resultadoAprovacao || "-")}</td>
          <td>${escaparHtml(registro.exameRealizado || "-")}</td>
          <td>${escaparHtml(registro.status)}</td>
        </tr>
      `)
      .join("");

    documento.innerHTML = `
      <header>
        <h1>DINIZ RH</h1>
        <h2>Acompanhamento Geral ASO</h2>
        <p>${registros.length} registros</p>
      </header>
      <table>
        <thead><tr><th>Candidato</th><th>Telefone</th><th>E-mail</th><th>Unidade</th><th>Tipo</th><th>Cargo</th><th>Setor</th><th>Turno</th><th>Admissão</th><th>Clínica</th><th>Aprovação</th><th>Exame</th><th>Status</th></tr></thead>
        <tbody>${linhas}</tbody>
      </table>
      <footer>Documento administrativo gerado pelo Sistema Diniz RH.</footer>
    `;

    void html2pdf()
      .set({
        margin: 10,
        filename: "acompanhamento-geral-aso.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
      })
      .from(documento)
      .save();
  }

  return (
    <div className="aso-container">
      <header className="aso-hero">
        <div>
          <span>Gestão ocupacional</span>
          <h1>Central Premium ASO</h1>
          <p>Acompanhe candidatos, exames e documentos em um único fluxo.</p>
        </div>
        <div className="aso-resumo">
          <article><span>Total</span><strong>{resumo.total}</strong></article>
          <article><span>Agendados</span><strong>{resumo.agendados}</strong></article>
          <article><span>Aptos</span><strong>{resumo.aptos}</strong></article>
          <article><span>Pendentes</span><strong>{resumo.pendentes}</strong></article>
        </div>
      </header>

      <section className="aso-formulario-card">
        <div className="aso-titulo-card">
          <div>
            <h2>{editandoId ? "Editar candidato" : "Novo candidato"}</h2>
            <p>O código individual será gerado automaticamente.</p>
          </div>
          {editandoId && <strong>Modo de edição</strong>}
        </div>

        <div className="aso-formulario-grid">
          <label><span>Nome completo *</span><input value={formulario.nome} onChange={(e) => atualizarCampo("nome", e.target.value)} /></label>
          <label><span>Telefone *</span><input value={formulario.telefone} onChange={(e) => atualizarCampo("telefone", e.target.value)} /></label>
          <label><span>E-mail</span><input type="email" value={formulario.email} onChange={(e) => atualizarCampo("email", e.target.value)} /></label>
          <label><span>Unidade *</span><select value={formulario.unidade} onChange={(e) => atualizarCampo("unidade", e.target.value)}><option value="">Selecione</option>{unidades.map((item) => <option key={item.codigo} value={item.nome}>{item.nome}</option>)}</select></label>
          <label><span>Tipo</span><input value={formulario.tipo} onChange={(e) => atualizarCampo("tipo", e.target.value)} /></label>
          <label><span>Cargo *</span><select value={formulario.cargo} onChange={(e) => atualizarCampo("cargo", e.target.value)}><option value="">Selecione</option>{cargos.filter((item) => item.ativo).map((item) => <option key={`${item.cargo}-${item.setor}`} value={item.cargo}>{item.cargo}</option>)}</select></label>
          <label><span>Setor</span><input value={formulario.setor} onChange={(e) => atualizarCampo("setor", e.target.value)} /></label>
          <label><span>Turno</span><select value={formulario.turno} onChange={(e) => atualizarCampo("turno", e.target.value)}><option value="">Selecione</option><option value="D">Diurno</option><option value="N">Noturno</option><option value="ESTÁVEL">Estável</option></select></label>
          <label><span>Data da admissão</span><input value={formulario.dataAdmissao} placeholder="DD/MM/AAAA" onChange={(e) => atualizarCampo("dataAdmissao", e.target.value)} /></label>
          <label><span>Tipo de exame</span><select value={formulario.tipoExame} onChange={(e) => atualizarCampo("tipoExame", e.target.value as TipoExame)}>{["ADMISSIONAL", "PERIÓDICO", "DEMISSIONAL", "RETORNO AO TRABALHO", "MUDANÇA DE RISCO"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Clínica *</span><select value={formulario.clinica} onChange={(e) => atualizarCampo("clinica", e.target.value)}><option value="">Selecione</option><option value="CENTERCLIN">CENTERCLIN</option><option value="PREVINIR">PREVINIR</option></select></label>
          <label><span>Aprovação</span><select value={formulario.resultadoAprovacao} onChange={(e) => atualizarCampo("resultadoAprovacao", e.target.value as ResultadoAprovacao)}><option value="">Selecione</option><option value="APTO">APTO</option><option value="INAPTO">INAPTO</option></select></label>
          <label><span>Exame realizado</span><select value={formulario.exameRealizado} onChange={(e) => atualizarCampo("exameRealizado", e.target.value as ExameRealizado)}><option value="">Selecione</option><option value="SIM">SIM</option><option value="NÃO">NÃO</option></select></label>
          <label><span>Data do exame</span><input type="date" value={formulario.dataExame} onChange={(e) => atualizarCampo("dataExame", e.target.value)} /></label>
          <label><span>Status</span><select value={formulario.status} onChange={(e) => atualizarCampo("status", e.target.value as StatusASO)}>{["PENDENTE", "AGENDADO", "REALIZADO", "APTO", "INAPTO"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="aso-observacoes"><span>Observações administrativas</span><textarea value={formulario.observacoes} onChange={(e) => atualizarCampo("observacoes", e.target.value)} /></label>
        </div>

        <p className="aso-aviso">Não registre diagnósticos ou detalhes médicos neste módulo.</p>

        <div className="aso-acoes-formulario">
          <button type="button" onClick={salvar}>{editandoId ? "SALVAR ALTERAÇÕES" : "CADASTRAR CANDIDATO"}</button>
          {editandoId && <button type="button" onClick={() => { setEditandoId(null); setFormulario(FORMULARIO_VAZIO); }}>CANCELAR</button>}
        </div>
      </section>

      <section className="aso-listagem-card">
        <div className="aso-listagem-cabecalho">
          <div><h2>Acompanhamento dos candidatos</h2><p>{registrosFiltrados.length} registros encontrados</p></div>
          <div className="aso-listagem-ferramentas">
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar código, nome, unidade..." />
            <button type="button" onClick={atualizarListaAdmitidos}>ATUALIZAR ADMITIDOS</button>
            <button type="button" onClick={gerarPDFGeral}>GERAR PDF GERAL</button>
          </div>
        </div>

        <div className="aso-tabela-wrapper">
          <table>
            <thead><tr><th className="aso-col-candidato">Candidato</th><th>Telefone</th><th className="aso-col-email">E-mail</th><th>Unidade</th><th>Tipo</th><th>Cargo</th><th>Setor</th><th>Turno</th><th>Admissão</th><th>Clínica</th><th>Aprovação</th><th>Exame</th><th className="aso-col-status">Status</th><th>Ações</th></tr></thead>
            <tbody>
              {registrosFiltrados.length === 0 ? (
                <tr><td colSpan={14} className="aso-vazio">Nenhum candidato cadastrado.</td></tr>
              ) : registrosFiltrados.map((item) => (
                <tr key={item.id}>
                  <td className="aso-col-candidato">{item.nome || <span className="aso-incompleto">Aguardando complemento</span>}</td>
                  <td>{item.telefone || "-"}</td>
                  <td className="aso-col-email">{item.email || "-"}</td>
                  <td>{item.unidade || "-"}</td>
                  <td>{item.tipo || "-"}</td>
                  <td>{item.cargo || "-"}<small>{item.tipoExame}</small></td>
                  <td>{item.setor || "-"}</td>
                  <td>{item.turno || "-"}</td>
                  <td>{item.dataAdmissao || "-"}</td>
                  <td><select className="aso-select-linha" value={item.clinica} onChange={(evento) => atualizarRegistroLinha(item.id, "clinica", evento.target.value)}><option value="">Selecione</option><option value="CENTERCLIN">CENTERCLIN</option><option value="PREVINIR">PREVINIR</option></select></td>
                  <td><select className="aso-select-linha" value={item.resultadoAprovacao} onChange={(evento) => atualizarRegistroLinha(item.id, "resultadoAprovacao", evento.target.value as ResultadoAprovacao)}><option value="">Selecione</option><option value="APTO">APTO</option><option value="INAPTO">INAPTO</option></select></td>
                  <td><select className="aso-select-linha" value={item.exameRealizado} onChange={(evento) => atualizarRegistroLinha(item.id, "exameRealizado", evento.target.value as ExameRealizado)}><option value="">Selecione</option><option value="SIM">SIM</option><option value="NÃO">NÃO</option></select><small>{item.dataExame || ""}</small></td>
                  <td className="aso-col-status"><span className={`aso-status status-${item.status.toLowerCase()}`}>{item.status}</span></td>
                  <td><div className="aso-acoes-linha"><button type="button" onClick={() => editar(item)}>EDITAR</button><button type="button" onClick={() => excluir(item)}>EXCLUIR</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default GestaoASO;
