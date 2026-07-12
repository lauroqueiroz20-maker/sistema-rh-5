export function gerarId() {
  if (
    typeof crypto !==
      "undefined" &&
    crypto.randomUUID
  ) {
    return crypto.randomUUID();
  }

  return (
    "ID-" +
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()
  );
}

export function gerarProtocolo() {
  const agora =
    new Date();

  const ano =
    agora
      .getFullYear()
      .toString()
      .substring(2);

  const mes = String(
    agora.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    agora.getDate()
  ).padStart(2, "0");

  const numero = String(
    Math.floor(
      Math.random() * 9999
    )
  ).padStart(4, "0");

  return `RH-${ano}${mes}${dia}-${numero}`;
}

export function obterSaudacao() {
  const hora =
    new Date().getHours();

  if (hora < 12) {
    return "Bom dia";
  }

  if (hora < 18) {
    return "Boa tarde";
  }

  return "Boa noite";
}

export function dataCompleta() {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  ).format(new Date());
}

export function dataHora() {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    }
  ).format(new Date());
}