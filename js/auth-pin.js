/**
 * Módulo de Autenticación por PIN - MedControl
 * ===============================================
 * Permite a los usuarios acceder a sus datos desde cualquier
 * dispositivo usando un PIN de 6 dígitos.
 * 
 * Flujo:
 * 1. Primer uso → Registrar PIN → Se genera un dataId único
 * 2. Siguiente uso (mismo dispositivo) → Auto-login desde localStorage
 * 3. Otro dispositivo → Ingresar PIN → Se busca el dataId asociado
 * 
 * Estructura Firestore:
 *   artifacts/{appId}/pins/{pin} → { dataId, createdAt }
 *   artifacts/{appId}/data/{dataId}/patients/... → datos del usuario
 */

import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { APP_ID } from './firebase-config.js';

// ─── Constantes ───
const LS_KEY_PIN = 'medcontrol_pin';
const LS_KEY_DATA_ID = 'medcontrol_dataId';

// ─── Estado del módulo ───
let _db = null;
let _currentDataId = null;

/**
 * Retorna el dataId del usuario actualmente autenticado.
 * Se usa en lugar del UID de Firebase Auth para las rutas de datos.
 * @returns {string|null}
 */
export function getDataId() {
  return _currentDataId;
}

/**
 * Inicializa el módulo de autenticación por PIN.
 * Verifica si hay una sesión guardada en localStorage.
 * @param {object} db - Instancia de Firestore
 * @returns {Promise<string|null>} dataId si hay sesión, null si debe mostrar login
 */
export async function initPinAuth(db) {
  _db = db;

  // Verificar si hay sesión guardada
  const savedPin = localStorage.getItem(LS_KEY_PIN);
  const savedDataId = localStorage.getItem(LS_KEY_DATA_ID);

  if (savedPin && savedDataId) {
    // Verificar que el PIN sigue siendo válido en Firestore
    try {
      const pinDoc = await getDoc(doc(db, 'artifacts', APP_ID, 'pins', savedPin));
      if (pinDoc.exists() && pinDoc.data().dataId === savedDataId) {
        _currentDataId = savedDataId;
        return savedDataId;
      }
    } catch (error) {
      console.warn('Error verificando PIN guardado:', error);
    }
    // Si falló la verificación, limpiar localStorage
    localStorage.removeItem(LS_KEY_PIN);
    localStorage.removeItem(LS_KEY_DATA_ID);
  }

  return null; // Necesita login
}

/**
 * Registra un nuevo PIN y crea un espacio de datos.
 * @param {string} pin - PIN de 6 dígitos
 * @returns {Promise<{success: boolean, dataId?: string, error?: string}>}
 */
export async function registerPin(pin) {
  if (!validatePin(pin)) {
    return { success: false, error: 'El PIN debe ser de 6 dígitos numéricos' };
  }

  try {
    // Verificar si el PIN ya existe
    const pinRef = doc(_db, 'artifacts', APP_ID, 'pins', pin);
    const pinDoc = await getDoc(pinRef);

    if (pinDoc.exists()) {
      return { success: false, error: 'Este PIN ya está en uso. Elige otro.' };
    }

    // Generar un dataId único
    const dataId = generateDataId();

    // Guardar en Firestore
    await setDoc(pinRef, {
      dataId: dataId,
      createdAt: serverTimestamp()
    });

    // Guardar en localStorage
    localStorage.setItem(LS_KEY_PIN, pin);
    localStorage.setItem(LS_KEY_DATA_ID, dataId);
    _currentDataId = dataId;

    return { success: true, dataId };
  } catch (error) {
    console.error('Error al registrar PIN:', error);
    return { success: false, error: 'Error de conexión. Intente de nuevo.' };
  }
}

/**
 * Inicia sesión con un PIN existente.
 * @param {string} pin - PIN de 6 dígitos
 * @returns {Promise<{success: boolean, dataId?: string, error?: string}>}
 */
export async function loginWithPin(pin) {
  if (!validatePin(pin)) {
    return { success: false, error: 'El PIN debe ser de 6 dígitos numéricos' };
  }

  try {
    const pinRef = doc(_db, 'artifacts', APP_ID, 'pins', pin);
    const pinDoc = await getDoc(pinRef);

    if (!pinDoc.exists()) {
      return { success: false, error: 'PIN no encontrado. Verifique o cree uno nuevo.' };
    }

    const { dataId } = pinDoc.data();

    // Guardar en localStorage
    localStorage.setItem(LS_KEY_PIN, pin);
    localStorage.setItem(LS_KEY_DATA_ID, dataId);
    _currentDataId = dataId;

    return { success: true, dataId };
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    return { success: false, error: 'Error de conexión. Intente de nuevo.' };
  }
}

/**
 * Cierra sesión y limpia localStorage.
 */
export function logout() {
  localStorage.removeItem(LS_KEY_PIN);
  localStorage.removeItem(LS_KEY_DATA_ID);
  _currentDataId = null;
  window.location.reload();
}

/**
 * Valida que el PIN sea de 6 dígitos numéricos.
 * @param {string} pin
 * @returns {boolean}
 */
function validatePin(pin) {
  return /^\d{6}$/.test(pin);
}

/**
 * Genera un ID único para el espacio de datos del usuario.
 * Usa crypto.randomUUID si está disponible, sino genera uno manual.
 * @returns {string}
 */
function generateDataId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback para navegadores sin crypto.randomUUID
  return 'xxxx-xxxx-xxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
}
