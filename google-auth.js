/**
 * REENTRASTE - GOOGLE AUTHENTICATION
 * ==================================
 * Manejo de autenticación con Google OAuth
 */

// ==========================================================================
// CONFIGURACIÓN
// ==========================================================================

const GOOGLE_CLIENT_ID = '1025977436092-krrda2hrlhc7julccgrj5cc0ivp5eqag.apps.googleusercontent.com';

// ==========================================================================
// INICIALIZACIÓN DE GOOGLE AUTH
// ==========================================================================

/**
 * Inicializa Google Identity Services
 */
function initializeGoogleAuth() {
  // Cargar la librería de Google si no está cargada
  if (!window.google) {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = setupGoogleAuth;
    document.head.appendChild(script);
  } else {
    setupGoogleAuth();
  }
}

/**
 * Configura Google Auth después de cargar la librería
 */
function setupGoogleAuth() {
  // Inicializar Google Identity Services
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleResponse,
    auto_select: false,
    cancel_on_tap_outside: true
  });

  // Configurar botones de Google
  setupGoogleButtons();
}

// ==========================================================================
// CONFIGURACIÓN DE BOTONES
// ==========================================================================

/**
 * Configura los botones de Google en las páginas
 */
function setupGoogleButtons() {
  const loginGoogleBtn = document.querySelector('.google-btn.login');
  const registerGoogleBtn = document.querySelector('.google-btn.register');

  if (loginGoogleBtn) {
    loginGoogleBtn.addEventListener('click', () => initiateGoogleAuth('login'));
  }

  if (registerGoogleBtn) {
    registerGoogleBtn.addEventListener('click', () => initiateGoogleAuth('register'));
  }
}

/**
 * Inicia el flujo de autenticación con Google
 * @param {string} mode - 'login' o 'register'
 */
function initiateGoogleAuth(mode) {
  // Guardar el modo en sessionStorage para usar después
  sessionStorage.setItem('google_auth_mode', mode);
  
  // Mostrar el popup de Google
  window.google.accounts.id.prompt((notification) => {
    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      // Fallback: usar el método tradicional de popup
      showGooglePopup(mode);
    }
  });
}

/**
 * Método alternativo usando popup tradicional
 * @param {string} mode - 'login' o 'register'
 */
function showGooglePopup(mode) {
  const redirectUri = `${window.location.origin}/auth/google/callback`;
  const scope = 'openid email profile';
  const responseType = 'code';
  const state = btoa(JSON.stringify({ mode, timestamp: Date.now() }));
  
  const googleAuthUrl = `https://accounts.google.com/oauth/authorize?` +
    `client_id=${GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `response_type=${responseType}&` +
    `state=${state}`;

  // Abrir popup
  const popup = window.open(
    googleAuthUrl,
    'google-auth',
    'width=500,height=600,scrollbars=yes,resizable=yes'
  );

  // Escuchar cuando se cierre el popup
  const checkClosed = setInterval(() => {
    if (popup.closed) {
      clearInterval(checkClosed);
      // Verificar si el login fue exitoso
      checkAuthStatus();
    }
  }, 1000);
}

// ==========================================================================
// MANEJO DE RESPUESTAS
// ==========================================================================

/**
 * Maneja la respuesta de Google Identity Services
 * @param {Object} response - Respuesta de Google
 */
async function handleGoogleResponse(response) {
  const mode = sessionStorage.getItem('google_auth_mode') || 'login';
  
  try {
    showLoadingState(mode, true);
    
    // Enviar el token a nuestro backend
    const result = await fetch(`/api/auth/google-${mode}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        credential: response.credential,
        client_id: GOOGLE_CLIENT_ID
      })
    });

    const data = await result.json();

    if (data.success && data.data.token) {
      await handleSuccessfulGoogleAuth(data, mode);
    } else {
      throw new Error(data.error || 'Error en autenticación con Google');
    }

  } catch (error) {
    console.error('❌ Error en Google Auth:', error);
    showGoogleError(mode, error.message);
  } finally {
    showLoadingState(mode, false);
    sessionStorage.removeItem('google_auth_mode');
  }
}

/**
 * Maneja una autenticación exitosa con Google
 * @param {Object} data - Datos del backend
 * @param {string} mode - 'login' o 'register'
 */
async function handleSuccessfulGoogleAuth(data, mode) {
  const { token, user, isNewUser } = data.data;
  
  // Guardar token
  localStorage.setItem('token', token);
  
  if (mode === 'register' || isNewUser) {
    showGoogleSuccess('register', `¡Bienvenido ${user.nombre}! Tu cuenta ha sido creada exitosamente.`);
    
    // Redirigir a KYC después de registro
    setTimeout(() => {
      window.location.href = 'kyc-status.html';
    }, 2000);
    
  } else {
    showGoogleSuccess('login', `¡Bienvenido de vuelta ${user.nombre}!`);
    
    // Para login, seguir el flujo normal de verificación KYC
    setTimeout(async () => {
      if (typeof handleSuccessfulLogin === 'function') {
        await handleSuccessfulLogin(token);
      } else {
        window.location.href = 'index.html';
      }
    }, 1500);
  }
}

// ==========================================================================
// FUNCIONES DE UI
// ==========================================================================

/**
 * Muestra estado de loading en botones de Google
 * @param {string} mode - 'login' o 'register'
 * @param {boolean} loading - Si está cargando
 */
function showLoadingState(mode, loading) {
  const btn = document.querySelector(`.google-btn.${mode}`);
  if (!btn) return;

  if (loading) {
    btn.disabled = true;
    btn.innerHTML = `
      <span class="loading"></span>
      ${mode === 'login' ? 'Iniciando...' : 'Creando cuenta...'}
    `;
  } else {
    btn.disabled = false;
    btn.innerHTML = `
      <span class="social-icon">🔍</span>
      Google
    `;
  }
}

/**
 * Muestra mensaje de éxito para Google Auth
 * @param {string} mode - 'login' o 'register'
 * @param {string} message - Mensaje a mostrar
 */
function showGoogleSuccess(mode, message) {
  const successElement = document.getElementById('successMessage');
  if (successElement) {
    successElement.innerHTML = `✅ ${message}`;
  }
}

/**
 * Muestra error de Google Auth
 * @param {string} mode - 'login' o 'register'
 * @param {string} message - Mensaje de error
 */
function showGoogleError(mode, message) {
  const errorElement = document.getElementById('generalError');
  if (errorElement) {
    errorElement.innerHTML = `⚠️ ${message}`;
  }
}

/**
 * Verifica el estado de autenticación después del popup
 */
function checkAuthStatus() {
  const token = localStorage.getItem('token');
  if (token && token !== 'null') {
    window.location.reload();
  }
}

// ==========================================================================
// INICIALIZACIÓN AUTOMÁTICA
// ==========================================================================

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', initializeGoogleAuth);

// Exportar funciones para uso global
window.GoogleAuth = {
  initialize: initializeGoogleAuth,
  initiateAuth: initiateGoogleAuth
};