import {
  Component,
  type ErrorInfo,
  type ReactNode,
} from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  mensagem: string;
};

class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    mensagem: "",
  };

  static getDerivedStateFromError(
    erro: Error
  ): ErrorBoundaryState {
    return {
      mensagem:
        erro.message ||
        "Erro ao abrir o sistema.",
    };
  }

  componentDidCatch(
    erro: Error,
    info: ErrorInfo
  ) {
    console.error(
      "Erro DINIZ RH:",
      erro,
      info
    );
  }

  render() {
    if (!this.state.mensagem) {
      return this.props.children;
    }

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          background: "#f3f6fb",
          color: "#0f172a",
          fontFamily:
            "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            width: "min(100%, 460px)",
            padding: "24px",
            borderRadius: "14px",
            background: "#fff",
            boxShadow:
              "0 10px 28px rgba(15,23,42,.12)",
          }}
        >
          <strong
            style={{
              display: "block",
              marginBottom: "10px",
              color: "#005eb8",
              fontSize: "22px",
            }}
          >
            DINIZ RH
          </strong>

          <p
            style={{
              margin: "0 0 12px",
              fontWeight: 700,
            }}
          >
            Erro ao carregar o sistema.
          </p>

          <small
            style={{
              display: "block",
              color: "#64748b",
              lineHeight: 1.5,
              wordBreak: "break-word",
            }}
          >
            {this.state.mensagem}
          </small>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
