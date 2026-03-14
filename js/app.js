/**
 * App Principal - MedControl
 * ============================
 * Punto de entrada de la aplicación.
 * 
 * Flujo de arranque:
 * 1. Inicializar Firebase + Auth anónima
 * 2. Verificar PIN guardado en localStorage
 * 3. Si hay PIN válido → iniciar app directo
 * 4. Si no hay PIN → mostrar pantalla de login
 * 5. Tras login exitoso → inicializar módulos
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import { firebaseConfig } from './firebase-config.js';
import { initUI, showToast } from './ui.js';
import { initPatients } from './patients.js';
import { initRecords } from './records.js';
import { initPDFExport } from './pdf-export.js';
import { initPinAuth, registerPin, loginWithPin, logout, getDataId } from './auth-pin.js';

// ──────────────── Inicialización de Firebase ────────────────

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ──────────────── Autenticación Anónima ────────────────

try {
  await signInAnonymously(auth);
} catch (error) {
  console.error('Error de autenticación:', error);
}

// ──────────────── Listener de Auth ────────────────

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log(`✅ Firebase Auth OK | Anonymous UID: ${user.uid}`);

    // Intentar auto-login con PIN guardado
    const dataId = await initPinAuth(db);

    if (dataId) {
      // Tiene PIN guardado y válido → entrar directo a la app
      showApp(dataId);
    } else {
      // No tiene PIN → mostrar pantalla de login
      showLoginScreen();
    }
  }
});

// ──────────────── Pantalla de Login/Registro ────────────────

/** Muestra la pantalla de login y oculta la app */
function showLoginScreen() {
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('appScreen').classList.add('hidden');
  setupLoginHandlers();
}

/** Configura los event handlers del formulario de login */
function setupLoginHandlers() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const switchToRegister = document.getElementById('switchToRegister');
  const switchToLogin = document.getElementById('switchToLogin');

  // Tabs de cambio entre Login y Registro
  switchToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginPanel').classList.add('hidden');
    document.getElementById('registerPanel').classList.remove('hidden');
  });

  switchToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('registerPanel').classList.add('hidden');
    document.getElementById('loginPanel').classList.remove('hidden');
  });

  // Formulario de Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pin = document.getElementById('loginPin').value;
    const btn = loginForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerText = 'Verificando...';

    const result = await loginWithPin(pin);

    if (result.success) {
      showApp(result.dataId);
    } else {
      document.getElementById('loginError').innerText = result.error;
      document.getElementById('loginError').classList.remove('hidden');
      btn.disabled = false;
      btn.innerText = 'Ingresar';
    }
  });

  // Formulario de Registro
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pin = document.getElementById('registerPin').value;
    const pinConfirm = document.getElementById('registerPinConfirm').value;
    const btn = registerForm.querySelector('button[type="submit"]');

    // Validar que coincidan
    if (pin !== pinConfirm) {
      document.getElementById('registerError').innerText = 'Los PINs no coinciden';
      document.getElementById('registerError').classList.remove('hidden');
      return;
    }

    btn.disabled = true;
    btn.innerText = 'Creando...';

    const result = await registerPin(pin);

    if (result.success) {
      showApp(result.dataId);
    } else {
      document.getElementById('registerError').innerText = result.error;
      document.getElementById('registerError').classList.remove('hidden');
      btn.disabled = false;
      btn.innerText = 'Crear Cuenta';
    }
  });
}

// ──────────────── Inicializar App ────────────────

/**
 * Muestra la app principal e inicializa todos los módulos.
 * @param {string} dataId - ID del espacio de datos del usuario
 */
function showApp(dataId) {
  // Ocultar login, mostrar app
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('appScreen').classList.remove('hidden');

  // Mostrar PIN actual en el footer
  const savedPin = localStorage.getItem('medcontrol_pin');
  document.getElementById('uidDisplay').innerText = `PIN: ${savedPin || '...'}`;

  // Inicializar módulos
  initUI();
  initPatients(db, dataId);
  initRecords(db, dataId);
  initPDFExport();

  // Botón de cerrar sesión
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('¿Cerrar sesión? Deberás ingresar tu PIN de nuevo.')) {
        logout();
      }
    });
  }

  // Inicializar iconos de Lucide
  if (window.lucide) {
    lucide.createIcons();
  }

  showToast('✅ Bienvenido a MedControl');
}

// ──────────────── Service Worker (PWA) ────────────────

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('📦 Service Worker registrado:', registration.scope);
    } catch (error) {
      console.error('Error registrando SW:', error);
    }
  });
}
