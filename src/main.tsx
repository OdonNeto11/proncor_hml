import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // <--- O INGREDIENTE QUE FALTAVA
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* O BrowserRouter precisa ser o PAI de todos */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)