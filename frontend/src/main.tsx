import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ProvedorTema } from './tema'
import { App } from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ProvedorTema>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ProvedorTema>
  </React.StrictMode>,
)
