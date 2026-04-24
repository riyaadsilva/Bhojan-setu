import React from "react";

interface AppErrorBoundaryState {
  error?: Error;
}

export default class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("BhojanSetu render error", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={{ minHeight: "100vh", background: "#0f0d0a", color: "#f5f0eb", padding: 32, fontFamily: "'DM Sans', sans-serif" }}>
        <h1 style={{ color: "#FF5722", fontFamily: "'Playfair Display', serif" }}>BhojanSetu could not render this page</h1>
        <p style={{ color: "#a89b85" }}>A runtime error occurred. The details below are shown only during development.</p>
        <pre style={{ whiteSpace: "pre-wrap", background: "#17130f", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: 16 }}>
          {this.state.error.message}
          {"\n\n"}
          {this.state.error.stack}
        </pre>
      </div>
    );
  }
}
