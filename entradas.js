// public/admin/entradas.js

export async function cargarEntradasAdmin() {
    try {
      const res = await fetch('/api/admin/entradas', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      const data = await res.json();
      const contenedor = document.getElementById('adminEntradas');
      contenedor.innerHTML = '';
  
      if (!data.success || data.data.entradas.length === 0) {
        contenedor.innerHTML = '<p>No hay entradas publicadas.</p>';
        return;
      }
  
      data.data.entradas.forEach(e => {
        const div = document.createElement('div');
        div.innerHTML = `
          <strong>${e.evento}</strong><br>
          Precio: $${e.precio}<br>
          Publicado por: ${e.vendedor}<br>
          ${e.archivo ? `<a href="/uploads/${e.archivo}" target="_blank">Ver archivo</a><br>` : ''}
          <button onclick="eliminarEntrada(${e.id})">Eliminar</button>
          <hr>
        `;
        contenedor.appendChild(div);
      });
    } catch (err) {
      console.error('Error al cargar entradas:', err);
      document.getElementById('adminEntradas').innerHTML = '<p>Error al cargar entradas.</p>';
    }
  }
  
  window.eliminarEntrada = async function(id) {
    if (!confirm('¿Eliminar esta entrada?')) return;
    try {
      const res = await fetch(`/api/admin/entradas/${id}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      const data = await res.json();
      if (data.success) {
        alert('Entrada eliminada');
        cargarEntradasAdmin();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error('Error eliminando entrada:', err);
      alert('Error al eliminar entrada');
    }
  }