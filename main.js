// public/admin/main.js

import { cargarUsuarios } from './usuarios.js';
import { cargarEntradasAdmin } from './entradas.js';
import { cargarCompras } from './compras.js';
import { cargarDashboardUsuario } from './dashboard.js';
import { setupEventoForm } from './eventos.js';

// Escucha de navegación en botones (con delegación del HTML)
window.mostrar = function (seccion) {
  document.querySelectorAll('.content > div').forEach(d => d.classList.add('hidden'));
  document.getElementById(seccion).classList.remove('hidden');

  switch (seccion) {
    case 'usuarios': cargarUsuarios(); break;
    case 'entradas': cargarEntradasAdmin(); break;
    case 'compras': cargarCompras(); break;
    case 'dashboardUsuario': cargarDashboardUsuario(); break;
    case 'eventos': setupEventoForm(); break;
  }
};

// Protección
window.logout = function () {
  localStorage.removeItem('token');
  location.href = 'login.html';
};