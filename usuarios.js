// public/admin/usuarios.js

export async function cargarUsuarios() {
  try {
    const res = await fetch('/api/admin/usuarios', {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    });
    const data = await res.json();
    const contenedor = document.getElementById('adminUsuarios');
    contenedor.innerHTML = '';

    if (!data.success || data.data.usuarios.length === 0) {
      contenedor.innerHTML = '<p>No hay usuarios registrados.</p>';
      return;
    }

    data.data.usuarios.forEach(user => {
      const div = document.createElement('div');
      div.innerHTML = `
        <strong>${user.full_name}</strong> (${user.email})<br>
        Cédula: ${user.cedula_number}<br>
        Teléfono: ${user.phone}<br>
        Estado: ${user.bloqueado ? 'Bloqueado' : 'Activo'}<br>
      `;

      const btn = document.createElement('button');
      btn.textContent = user.bloqueado ? 'Desbloquear' : 'Bloquear';
      btn.onclick = async () => {
        btn.disabled = true;
        btn.textContent = 'Procesando...';
        if (user.bloqueado) {
          await desbloquearUsuario(user.id);
        } else {
          await bloquearUsuario(user.id);
        }
      };

      div.appendChild(btn);
      const hr = document.createElement('hr');
      div.appendChild(hr);
      contenedor.appendChild(div);
    });
  } catch (err) {
    console.error('Error al cargar usuarios:', err);
    document.getElementById('adminUsuarios').innerHTML = '<p>Error al cargar usuarios.</p>';
  }
}

export async function bloquearUsuario(id) {
  try {
    const res = await fetch(`/api/admin/usuarios/${id}/bloquear`, {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    });
    const data = await res.json();
    if (data.success) {
      alert('Usuario bloqueado');
      cargarUsuarios();
    } else {
      alert('Error: ' + data.error);
    }
  } catch (err) {
    console.error('Error al bloquear usuario:', err);
    alert('Error al bloquear usuario');
  }
}

export async function desbloquearUsuario(id) {
  try {
    const res = await fetch(`/api/admin/usuarios/${id}/desbloquear`, {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    });
    const data = await res.json();
    if (data.success) {
      alert('Usuario desbloqueado');
      cargarUsuarios();
    } else {
      alert('Error: ' + data.error);
    }
  } catch (err) {
    console.error('Error al desbloquear usuario:', err);
    alert('Error al desbloquear usuario');
  }
}