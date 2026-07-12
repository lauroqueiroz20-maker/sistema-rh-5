import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import {
  dirname,
  resolve,
} from "node:path";
import type {
  IncomingMessage,
  ServerResponse,
} from "node:http";

import {
  defineConfig,
  type PluginOption,
} from "vite";
import react from "@vitejs/plugin-react";

type SolicitacaoLocal = {
  id: string;
  protocolo: string;
  codigoGestor: string;
  gestor: string;
  unidade: string;
  itens: unknown[];
  totalVagas: number;
  dataResposta: string;
  status: string;
};

const arquivoSolicitacoes = resolve(
  process.cwd(),
  ".dinizrh",
  "solicitacoes.json"
);

function enviarJson(
  resposta: ServerResponse,
  status: number,
  dados: unknown
) {
  resposta.statusCode = status;
  resposta.setHeader(
    "Content-Type",
    "application/json; charset=utf-8"
  );
  resposta.end(JSON.stringify(dados));
}

function carregarSolicitacoesLocais():
  SolicitacaoLocal[] {
  try {
    const dados =
      readFileSync(
        arquivoSolicitacoes,
        "utf-8"
      );

    const convertido:
      unknown = JSON.parse(dados);

    return Array.isArray(convertido)
      ? (
          convertido as SolicitacaoLocal[]
        )
      : [];
  } catch {
    return [];
  }
}

function salvarSolicitacoesLocais(
  solicitacoes: SolicitacaoLocal[]
) {
  mkdirSync(
    dirname(arquivoSolicitacoes),
    {
      recursive: true,
    }
  );

  writeFileSync(
    arquivoSolicitacoes,
    JSON.stringify(
      solicitacoes,
      null,
      2
    ),
    "utf-8"
  );
}

function lerCorpoJson(
  requisicao: IncomingMessage
): Promise<unknown> {
  return new Promise(
    (resolvePromise, reject) => {
      const partes: Buffer[] = [];

      requisicao.on(
        "data",
        (parte: Buffer) => {
          partes.push(parte);
        }
      );

      requisicao.on("end", () => {
        try {
          resolvePromise(
            JSON.parse(
              Buffer.concat(
                partes
              ).toString("utf-8")
            )
          );
        } catch (erro) {
          reject(erro);
        }
      });

      requisicao.on(
        "error",
        reject
      );
    }
  );
}

function isSolicitacaoLocal(
  valor: unknown
): valor is SolicitacaoLocal {
  if (
    typeof valor !== "object" ||
    valor === null
  ) {
    return false;
  }

  const dados =
    valor as Partial<SolicitacaoLocal>;

  return (
    typeof dados.id === "string" &&
    typeof dados.protocolo === "string" &&
    typeof dados.codigoGestor === "string" &&
    typeof dados.gestor === "string" &&
    typeof dados.unidade === "string" &&
    Array.isArray(dados.itens) &&
    typeof dados.totalVagas === "number" &&
    typeof dados.dataResposta === "string" &&
    typeof dados.status === "string"
  );
}

function apiSolicitacoesPlugin():
  PluginOption {
  return {
    name: "diniz-rh-api-local",
    configureServer(server) {
      server.middlewares.use(
        "/api/solicitacoes",
        async (requisicao, resposta) => {
          resposta.setHeader(
            "Access-Control-Allow-Origin",
            "*"
          );
          resposta.setHeader(
            "Access-Control-Allow-Headers",
            "Content-Type"
          );
          resposta.setHeader(
            "Access-Control-Allow-Methods",
            "GET,POST,OPTIONS"
          );

          if (
            requisicao.method ===
            "OPTIONS"
          ) {
            resposta.statusCode = 204;
            resposta.end();
            return;
          }

          if (
            requisicao.method === "GET"
          ) {
            enviarJson(
              resposta,
              200,
              carregarSolicitacoesLocais()
            );
            return;
          }

          if (
            requisicao.method !==
            "POST"
          ) {
            enviarJson(
              resposta,
              405,
              {
                erro:
                  "Metodo nao permitido",
              }
            );
            return;
          }

          try {
            const corpo =
              await lerCorpoJson(
                requisicao
              );

            if (
              !isSolicitacaoLocal(
                corpo
              )
            ) {
              enviarJson(
                resposta,
                400,
                {
                  erro:
                    "Solicitacao invalida",
                }
              );
              return;
            }

            const solicitacoes =
              carregarSolicitacoesLocais();

            salvarSolicitacoesLocais([
              corpo,
              ...solicitacoes.filter(
                (solicitacao) =>
                  solicitacao.id !==
                  corpo.id
              ),
            ]);

            enviarJson(
              resposta,
              201,
              {
                ok: true,
              }
            );
          } catch {
            enviarJson(
              resposta,
              500,
              {
                erro:
                  "Falha ao salvar",
              }
            );
          }
        }
      );
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    apiSolicitacoesPlugin(),
  ],

  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
  },
});
