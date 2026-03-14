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
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROYECTO.firebasestorage.app",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

/**
 * ID de la aplicación para organizar datos en Firestore.
 * Se usa como prefijo en la ruta: artifacts/{appId}/users/{uid}/patients
 * Esto permite que múltiples apps compartan la misma instancia de Firebase.
 */
export const APP_ID = 'med-control-app';
