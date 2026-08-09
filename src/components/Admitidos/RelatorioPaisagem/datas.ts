export function converterDataParaInput(data?: string) {
  if (!data) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return data;
  }

  const partes = data.split("/");

  if (partes.length !== 3) {
    return "";
  }

  const [dia, mes, ano] = partes;

  return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
}

export function formatarDataBrasileira(data?: string) {
  if (!data) {
    return "-";
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
    return data;
  }

  const partes = data.split("-");

  if (partes.length !== 3) {
    return data;
  }

  const [ano, mes, dia] = partes;

  return `${dia}/${mes}/${ano}`;
}

export function obterDataHojeInput() {
  const hoje = new Date();

  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

export function obterDataHojeBrasileira() {
  return formatarDataBrasileira(obterDataHojeInput());
}