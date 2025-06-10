/**
 * REENTRASTE - REGISTER PAGE JAVASCRIPT
 * =====================================
 * Funcionalidad del formulario de registro
 */

// ==========================================================================
// INICIALIZACIÓN
// ==========================================================================

// Verificar si ya está logueado y redirigir
const token = localStorage.getItem('token');
if (token && token !== 'null' && token !== 'undefined') {
  window.location.href = 'index.html';
}

// Referencias a elementos del DOM
const form = document.getElementById('registerForm');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');

// ==========================================================================
// VALIDACIÓN EN TIEMPO REAL
// ==========================================================================

// Configurar validación en tiempo real para todos los campos requeridos
const inputs = form.querySelectorAll('input[required]');
inputs.forEach(input => {
  input.addEventListener('blur', () => validateField(input));
  input.addEventListener('input', () => clearFieldError(input));
});

/**
 * Valida un campo específico
 * @param {HTMLInputElement} input - El campo a validar
 * @returns {boolean} - true si es válido, false si no
 */
function validateField(input) {
  const formGroup = input.closest('.form-group');
  const errorElement = formGroup.querySelector('.error');
  
  switch(input.id) {
    case 'nombre':
      if (!input.value.trim() || input.value.trim().length < 2) {
        showFieldError(formGroup, errorElement, 'El nombre debe tener al menos 2 caracteres');
        return false;
      }
      break;
    case 'email':
      if (!input.value || !isValidEmail(input.value)) {
        showFieldError(formGroup, errorElement, 'Ingresa un email válido');
        return false;
      }
      break;
    case 'phone':
      if (!input.value.trim() || input.value.trim().length < 6) {
        showFieldError(formGroup, errorElement, 'Ingresa un número de teléfono válido');
        return false;
      }
      break;
    case 'password':
      if (!input.value || input.value.length < 8) {
        showFieldError(formGroup, errorElement, 'La contraseña debe tener al menos 8 caracteres');
        return false;
      }
      break;
    case 'confirmPassword':
      const password = document.getElementById('password').value;
      if (input.value !== password) {
        showFieldError(formGroup, errorElement, 'Las contraseñas no coinciden');
        return false;
      }
      break;
  }
  
  showFieldSuccess(formGroup, errorElement);
  return true;
}

/**
 * Muestra error en un campo específico
 */
function showFieldError(formGroup, errorElement, message) {
  formGroup.classList.remove('success');
  formGroup.classList.add('error');
  errorElement.innerHTML = `⚠️ ${message}`;
}

/**
 * Muestra éxito en un campo específico
 */
function showFieldSuccess(formGroup, errorElement) {
  formGroup.classList.remove('error');
  formGroup.classList.add('success');
  errorElement.textContent = '';
}

/**
 * Limpia el error de un campo específico
 */
function clearFieldError(input) {
  const formGroup = input.closest('.form-group');
  formGroup.classList.remove('error', 'success');
}

// ==========================================================================
// MANEJO DEL FORMULARIO
// ==========================================================================

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Limpiar errores previos
  clearAllErrors();
  
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  
  // Validaciones
  if (!validateForm(data)) {
    return;
  }
  
  // UI de loading
  setLoadingState(true);
  
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre: data.nombre,
        email: data.email,
        phone: document.getElementById('countryCode').value + data.phone, // Combinar código país + número
        password: data.password
      })
    });
    
    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      const errorText = await response.text();
      console.error('❌ Respuesta no JSON del servidor:', errorText);
      showGeneralError('Error inesperado del servidor. Intenta nuevamente.');
      return;
    }
    
    const result = await response.json();
    
    if (result.success) {
      showSuccess('¡Cuenta creada exitosamente! Iniciando sesión...');
      
      // Auto-login después del registro
      try {
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: data.email,
            password: data.password
          })
        });
        
        const loginResult = await loginResponse.json();
        
        if (loginResult.success && loginResult.data.token) {
          // Guardar token
          localStorage.setItem('token', loginResult.data.token);
          
          showSuccess('¡Bienvenido a Reentraste! Redirigiendo...');
          
          setTimeout(() => {
            window.location.href = 'kyc-status.html';
          }, 2000);
        } else {
          showSuccess('Cuenta creada. Redirigiendo al login...');
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 2000);
        }
      } catch (loginError) {
        console.error('❌ Error en auto-login:', loginError);
        showSuccess('Cuenta creada. Redirigiendo al login...');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
      }
    } else {
      showGeneralError(result.error || 'Error al crear la cuenta');
    }
  } catch (error) {
    console.error('❌ Error de red:', error);
    showGeneralError('Error de conexión. Verifica tu internet e intenta nuevamente.');
  } finally {
    setLoadingState(false);
  }
});

// ==========================================================================
// FUNCIONES DE VALIDACIÓN
// ==========================================================================

/**
 * Valida todo el formulario
 * @param {Object} data - Los datos del formulario
 * @returns {boolean} - true si es válido, false si no
 */
function validateForm(data) {
  let isValid = true;
  
  inputs.forEach(input => {
    if (!validateField(input)) {
      isValid = false;
    }
  });
  
  return isValid;
}

/**
 * Valida formato de email
 * @param {string} email - El email a validar
 * @returns {boolean} - true si es válido, false si no
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ==========================================================================
// FUNCIONES DE UI
// ==========================================================================

/**
 * Activa/desactiva el estado de loading del botón
 * @param {boolean} loading - Si está cargando o no
 */
function setLoadingState(loading) {
  if (loading) {
    submitBtn.disabled = true;
    btnText.innerHTML = '<span class="loading"></span> Creando cuenta...';
  } else {
    submitBtn.disabled = false;
    btnText.textContent = 'Crear mi cuenta';
  }
}

/**
 * Muestra un error general
 * @param {string} message - El mensaje de error
 */
function showGeneralError(message) {
  const errorElement = document.getElementById('generalError');
  errorElement.innerHTML = `⚠️ ${message}`;
}

/**
 * Muestra un mensaje de éxito
 * @param {string} message - El mensaje de éxito
 */
function showSuccess(message) {
  const successElement = document.getElementById('successMessage');
  successElement.innerHTML = `✅ ${message}`;
}

/**
 * Limpia todos los errores del formulario
 */
function clearAllErrors() {
  const errorElements = document.querySelectorAll('.error');
  errorElements.forEach(el => el.textContent = '');
  document.getElementById('successMessage').textContent = '';
  
  // Limpiar estados de validación visual
  const formGroups = document.querySelectorAll('.form-group');
  formGroups.forEach(group => {
    group.classList.remove('error', 'success');
  });
}

// ==========================================================================
// FORMATEO AUTOMÁTICO
// ==========================================================================

// Formateo automático del teléfono - solo números
document.getElementById('phone').addEventListener('input', function(e) {
  let value = e.target.value.replace(/\D/g, '');
  e.target.value = value;
});