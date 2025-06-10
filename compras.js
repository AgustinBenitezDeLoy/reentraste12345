// public/admin/compras.js

export async function cargarCompras() {
  try {
    const res = await fetch('/api/admin/compras', {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    });
    const data = await res.json();
    const contenedor = document.getElementById('adminCompras');
    contenedor.innerHTML = '';

    if (!data.success || data.data.compras.length === 0) {
      contenedor.innerHTML = '<p>No hay compras registradas.</p>';
      return;
    }

    data.data.compras.forEach(c => {
      const div = document.createElement('div');
      div.innerHTML = `
        <strong>Evento:</strong> ${c.evento}<br>
        <strong>Comprador:</strong> ${c.comprador}<br>
        <strong>Precio:</strong> $${c.precio}<br>
        <strong>Fecha:</strong> ${new Date(c.fecha).toLocaleString()}<br>
        <hr>
      `;
      contenedor.appendChild(div);
    });
  } catch (err) {
    console.error('Error al cargar compras:', err);
    document.getElementById('adminCompras').innerHTML = '<p>Error al cargar compras.</p>';
  }
}