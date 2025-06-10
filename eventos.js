// public/admin/eventos.js

export function setupEventoForm() {
    const form = document.getElementById('formEvento');
    if (!form) return;

    form.onsubmit = async e => {
      e.preventDefault();

      const name = form.name.value.trim();
      const date = form.date.value;
      const location = form.location.value.trim();

      if (!name || !date || !location) {
        alert('Todos los campos son obligatorios');
        return;
      }

      try {
        const res = await fetch('/api/admin/eventos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + localStorage.getItem('token')
          },
          body: JSON.stringify({ name, date, location })
        });

        const data = await res.json();
        if (data.success) {
          alert('Evento creado correctamente');
          form.reset();
        } else {
          alert('Error al crear evento: ' + data.error);
        }
      } catch (err) {
        console.error('Error al crear evento:', err);
        alert('Error al crear evento');
      }
    };
  }