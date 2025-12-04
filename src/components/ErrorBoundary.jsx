import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Error capturado por ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: 'white', color: 'black', height: '100vh', overflow: 'auto' }}>
          <h1 style={{ color: 'red' }}>¡Algo salió mal!</h1>
          <p>Por favor toma una captura de este error y envíala al desarrollador.</p>
          <hr />
          <h3 style={{ color: '#d32f2f' }}>{this.state.error && this.state.error.toString()}</h3>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <br />
          <button 
            onClick={() => window.location.reload()} 
            style={{ padding: '10px 20px', fontSize: '18px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>
            Recargar Aplicación
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;