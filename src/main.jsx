import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { HashRouter } from 'react-router-dom' // <--- Importa HashRouter

ReactDOM.createRoot(document.getElementById('root')).render(
  <HashRouter> {/* <--- Usa HashRouter */}
    <App />
  </HashRouter>
)