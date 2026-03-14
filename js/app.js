/**
 * App Principal - MedControl
 * ============================
 * Punto de entrada de la aplicación.
 * Inicializa Firebase, autenticación y todos los módulos.
 * 
 * Flujo de arranque:
 * 1. Inicializar Firebase
 * 2. Autenticar usuario (anónimo)
 * 3. Inicializar módulos UI, Pacientes, Registros y PDF
 * 4. Registrar Service Worker para PWA
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import { firebaseConfig, APP_ID } from './firebase-config.js';
import { initUI, showToast } from './ui.js';
import { initPatients } from './patients.js';
import { initRecords } from './records.js';
import { initPDFExport } from './pdf-export.js';

// ──────────────── Inicialización de Firebase ────────────────

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ──────────────── Autenticación Anónima ────────────────

/**
 * Inicia sesión anónima en Firebase Auth.
 * Es la estrategia más simple: cada dispositivo obtiene un UID único 
 * que persiste mientras no se borre el storage del navegador.
 */
try {
  await signInAnonymously(auth);
} catch (error) {
  console.error('Error de autenticación:', error);
}

/**
 * Listener del estado de autenticación.
 * Cuando el usuario está autenticado, inicializa toda la app.
 */
onAuthStateChanged(auth, (user) => {
  if (user) {
    const uid = user.uid;
    console.log(`✅ MedControl iniciado | UID: ${uid}`);
    document.getElementById('uidDisplay').innerText = uid.substring(0, 12) + '...';

    // ─── Inicializar todos los módulos ───
    initUI();
    initPatients(db, uid);
    initRecords(db, uid);
    initPDFExport();

    // Inicializar iconos de Lucide
    if (window.lucide) {
      lucide.createIcons();
    }
  }
});

// ──────────────── Service Worker (PWA) ────────────────

/**
 * Registra el Service Worker si el navegador lo soporta.
 * Esto habilita: instalación como app, cache offline, y push notifications (futuro).
 */
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
