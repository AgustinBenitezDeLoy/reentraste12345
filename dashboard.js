// public/admin/dashboard.js

export async function cargarDashboardUsuario() {
  const form = document.getElementById('formDash');
  form.onsubmit = async e => {
    e.preventDefault();
    const id = form.id.value;
    
    try {
      const res = await fetch(`/api/admin/usuarios/${id}/dashboard`, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      const data = await res.json();
      const contenedor = document.getElementById('resumenUsuario');
      contenedor.innerHTML = '';

      if (!data.success) {
        contenedor.innerHTML = '<p>Error al obtener datos del usuario.</p>';
        return;
      }

      contenedor.innerHTML = `
        <h3>Resumen del Usuario ID: ${id}</h3>
        <p><strong>Total de Ventas:</strong> ${data.data.ventas?.total_ventas || 0}</p>
        <p><strong>Ingresos Generados:</strong> $${data.data.ventas?.total_ganado || 0}</p>
        <p><strong>Total de Compras:</strong> ${data.data.compras?.total_compras || 0}</p>
      `;
    } catch (err) {
      console.error('Error al cargar dashboard usuario:', err);
      document.getElementById('resumenUsuario').innerHTML = '<p>Error al cargar datos.</p>';
    }
  };
}