import { useEffect, useState } from "react";

type RodapeProps = {
  responsavel?: string;
  cargoResponsavel?: string;
  dataEmissao?: string;
  horaEmissao?: string;
  mostrarAssinatura?: boolean;
};

const obterDataEmissao = () => new Date().toLocaleDateString("pt-BR");

const obterHoraEmissao = () =>
  new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

export default function Rodape({
  responsavel = "Tatyana Travassos",
  cargoResponsavel = "Coordenação de Recrutamento e Seleção",
  dataEmissao = obterDataEmissao(),
  horaEmissao = obterHoraEmissao(),
  mostrarAssinatura = true,
}: RodapeProps) {
  const [horaAtual, setHoraAtual] =
    useState(horaEmissao);

  useEffect(() => {
    const intervalo = window.setInterval(
      () => setHoraAtual(obterHoraEmissao()),
      1000
    );

    return () => window.clearInterval(intervalo);
  }, []);

  return (
    <footer className={`rpaisagem-rodape${mostrarAssinatura ? "" : " rpaisagem-rodape-sem-assinatura"}`}>
      {mostrarAssinatura && (
        <div className="rpaisagem-rodape-esquerda">
          <div className="rpaisagem-rodape-assinatura">
            <strong>{responsavel}</strong>

            <small>{cargoResponsavel}</small>
          </div>
        </div>
      )}

      <div className="rpaisagem-rodape-direita">
        <div className="rpaisagem-rodape-item">
          <span>SISTEMA</span>
          <strong>DINIZ RH</strong>
        </div>

        <div className="rpaisagem-rodape-item">
          <span>EMISSÃO</span>
          <strong>{dataEmissao}</strong>
        </div>

        <div className="rpaisagem-rodape-item">
          <span>HORA</span>
          <strong>{horaAtual}</strong>
        </div>
      </div>
    </footer>
  );
}
