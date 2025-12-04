import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { HashRouter } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary' // <--- IMPORTANTE

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary> {/* <--- ATRAPA ERRORES AQUÍ */}
    <HashRouter>
      <App />
    </HashRouter>
  </ErrorBoundary>
)