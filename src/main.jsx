import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { HashRouter } from 'react-router-dom' // HashRouter es VITAL para Capacitor
import ErrorBoundary from './components/ErrorBoundary'

const rootElement = document.getElementById('root');

if (!rootElement) {
  alert("Error Fatal: No se encontró el elemento root en index.html");
} else {
  ReactDOM.createRoot(rootElement).render(
    <ErrorBoundary>
      <HashRouter>
        <App />
      </HashRouter>
    </ErrorBoundary>
  )
}