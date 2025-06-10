/**
 * REENTRASTE - LOGIN PAGE JAVASCRIPT
 * ==================================
 * Funcionalidad del formulario de inicio de sesión
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
const form = document.getElementById('loginForm');
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
    case 'email':
      if (!input.value || !isValidEmail(input.value)) {
        showFieldError(formGroup, errorElement, 'Ingresa un email válido');
        return false;
      }
      break;
    case 'password':
      if (!input.value || input.value.length < 1) {
        showFieldError(formGroup, errorElement, 'La contraseña es requerida');
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
// MANEJO DEL LOGIN EXITOSO
// ==========================================================================

/**
 * Maneja el flujo después de un login exitoso
 * @param {string} token - Token de autenticación
 */
async function handleSuccessfulLogin(token) {
  localStorage.setItem('token', token);

  try {
    const kycResponse = await fetch('/api/kyc/estado', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const contentType = kycResponse.headers.get('content-type');
    if (kycResponse.ok && contentType && contentType.includes('application/json')) {
      const kycData = await kycResponse.json();
      const status = kycData.data?.status;

      if (!status || status === 'pendiente') {
        return window.location.href = 'kyc-status.html';
      }

      if (status === 'aprobado') {
        return window.location.href = 'index.html';
      }

      if (['iniciado', 'en_proceso', 'rechazado'].includes(status)) {
        return window.location.href = 'kyc-status.html';
      }
    }

    // Fallback
    window.location.href = 'kyc-status.html';

  } catch (error) {
    console.error('❌ Error verificando KYC:', error);
    window.location.href = 'kyc-status.html';
  }
}

// ==========================================================================
// MANEJO DEL FORMULARIO
// ==========================================================================

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Limpiar errores previos
  clearAllErrors();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  // Validaciones básicas
  if (!validateForm()) {
    return;
  }
  
  // UI de loading
  setLoadingState(true);

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ 
        email, 
        password 
      })
    });

    const data = await res.json();
    const token = data?.data?.token;

    if (data.success && token) {
      // Verificar si es redirección a admin
      const urlParams = new URLSearchParams(window.location.search);
      const returnTo = urlParams.get('returnTo');

      if (returnTo === 'admin') {
        localStorage.setItem('token', token);
        showSuccess('¡Acceso autorizado! Redirigiendo al panel de administración...');
        setTimeout(() => {
          window.location.href = 'admin.html';
        }, 1500);
        return;
      }

      // Flujo normal de login
      showSuccess('¡Bienvenido de vuelta! Verificando tu cuenta...');
      setTimeout(async () => {
        await handleSuccessfulLogin(token);
      }, 1000);

    } else {
      showGeneralError(data.error || 'Credenciales incorrectas. Verifica tu email y contraseña.');
    }

  } catch (error) {
    console.error('❌ Error en login:', error);
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
 * @returns {boolean} - true si es válido, false si no
 */
function validateForm() {
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
    btnText.innerHTML = '<span class="loading"></span> Iniciando sesión...';
  } else {
    submitBtn.disabled = false;
    btnText.textContent = 'Iniciar Sesión';
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
// FUNCIONALIDADES ADICIONALES
// ==========================================================================

// Botones de redes sociales (placeholder para futuras integraciones)
document.querySelector('.google-btn')?.addEventListener('click', () => {
  showGeneralError('Inicio de sesión con Google próximamente disponible.');
});

document.querySelector('.facebook-btn')?.addEventListener('click', () => {
  showGeneralError('Inicio de sesión con Facebook próximamente disponible.');
});

// Manejar "Recordarme" 
const rememberMe = document.getElementById('rememberMe');
rememberMe?.addEventListener('change', (e) => {
  if (e.target.checked) {
    console.log('Usuario eligió ser recordado');
    // Aquí puedes agregar lógica para recordar al usuario
  }
});

// Focus automático en el primer campo
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('email')?.focus();
});

// Enter en password debería hacer submit
document.getElementById('password')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    form.dispatchEvent(new Event('submit'));
  }
});