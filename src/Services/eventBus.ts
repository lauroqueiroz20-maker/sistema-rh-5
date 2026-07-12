export type Evento =
  | "GESTOR_ENVIOU_SOLICITACAO"
  | "SOLICITACAO_RECEBIDA"
  | "SOLICITACAO_APROVADA"
  | "SOLICITACAO_CANCELADA"
  | "CADASTRO_ATUALIZADO"
  | "VAGA_CRIADA"
  | "DASHBOARD_ATUALIZADO"
  | "RELATORIO_ATUALIZADO"
  | "BACKUP_EXECUTADO";

type Callback = (dados?: unknown) => void;

class EventBus {
  private eventos = new Map<
    Evento,
    Set<Callback>
  >();

  on(
    evento: Evento,
    callback: Callback
  ) {
    const callbacks =
      this.eventos.get(evento) ||
      new Set<Callback>();

    callbacks.add(callback);
    this.eventos.set(
      evento,
      callbacks
    );
  }

  off(
    evento: Evento,
    callback: Callback
  ) {
    const callbacks =
      this.eventos.get(evento);

    if (!callbacks) {
      return;
    }

    callbacks.delete(callback);

    if (callbacks.size === 0) {
      this.eventos.delete(evento);
    }
  }

  emit(
    evento: Evento,
    dados?: unknown
  ) {
    const callbacks =
      this.eventos.get(evento);

    if (!callbacks) {
      return;
    }

    callbacks.forEach(
      (callback) => {
        try {
          callback(dados);
        } catch (erro) {
          console.error(
            `Erro no evento ${evento}:`,
            erro
          );
        }
      }
    );
  }

  clear(evento?: Evento) {
    if (evento) {
      this.eventos.delete(evento);
      return;
    }

    this.eventos.clear();
  }
}

const eventBus = new EventBus();

export default eventBus;