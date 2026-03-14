/**
 * Configuración de Firebase para MedControl
 * ==========================================
 * 
 * INSTRUCCIONES DE SETUP:
 * 1. Ve a https://console.firebase.google.com
 * 2. Crea un proyecto nuevo (o usa uno existente)
 * 3. En Configuración del proyecto > General, copia tu firebaseConfig
 * 4. Reemplaza los valores de abajo con los tuyos
 * 5. Habilita Authentication > Sign-in method > Anonymous
 * 6. Habilita Cloud Firestore en modo "test" o configura las reglas
 */

// ─── Configuración de Firebase ───
// ⚠️ REEMPLAZA estos valores con tu configuración real de Firebase Console
export const firebaseConfig = {
  apiKey: "AIzaSyA1TfaXEXb0BSKlqH7qJ9fz07xbI8KieRY",
  authDomain: "medcontrol-28fd2.firebaseapp.com",
  projectId: "medcontrol-28fd2",
  storageBucket: "medcontrol-28fd2.firebasestorage.app",
  messagingSenderId: "473542578852",
  appId: "1:473542578852:web:b4abb6875437bff0970c31",
  measurementId: "G-VYH9X4ZDP3"
};

/**
 * ID de la aplicación para organizar datos en Firestore.
 * Se usa como prefijo en la ruta: artifacts/{appId}/users/{uid}/patients
 * Esto permite que múltiples apps compartan la misma instancia de Firebase.
 */
export const APP_ID = 'med-control-app';
