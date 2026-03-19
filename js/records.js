/**
 * Módulo de Registros (Notas de Evolución) - MedControl
 * ======================================================
 * CRUD de notas de evolución clínica para cada paciente.
 * Cada registro contiene: hallazgos, signos vitales, plan e indicaciones.
 */

import { collection, addDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { showModal, hideModal, showToast } from './ui.js';
import { getActivePatientId } from './patients.js';
import { APP_ID } from './firebase-config.js';

// ─── Referencia global a db y dataId (se inyectan desde app.js) ───
let _db = null;
let _dataId = null;

/**
 * Inicializa el módulo de registros.
 * Conecta el formulario y el botón de agregar registro.
 * @param {object} db - Instancia de Firestore
 * @param {string} dataId - ID del espacio de datos del usuario
 */
export function initRecords(db, dataId) {
  _db = db;
  _dataId = dataId;

  // Botón de agregar registro → abrir modal
  document.getElementById('addRecordBtn').addEventListener('click', () => {
    if (!getActivePatientId()) {
      showToast('⚠️ Seleccione un paciente primero');
      return;
    }
    showModal('mRecord');
  });

  // Formulario de nueva nota de evolución
  document.getElementById('fRecord').addEventListener('submit', async (e) => {
    e.preventDefault();
    const activeId = getActivePatientId();
    if (!activeId) return;

    const fd = new FormData(e.target);

    try {
      const recordsRef = collection(
        _db, 'artifacts', APP_ID, 'data', _dataId, 'patients', activeId, 'records'
      );

      await addDoc(recordsRef, {
        hallazgos: fd.get('hallazgos')?.trim() || '',
        antecedentes: fd.get('antecedentes')?.trim() || '',
        interrogatorio: fd.get('interrogatorio')?.trim() || '',
        laboratorios: fd.get('laboratorios')?.trim() || '',
        imagen: fd.get('imagen')?.trim() || '',
        signos: {
          fc: fd.get('fc')?.trim() || '',
          ta: fd.get('ta')?.trim() || '',
          fr: fd.get('fr')?.trim() || '',
          temp: fd.get('temp')?.trim() || '',
          spo2: fd.get('spo2')?.trim() || ''
        },
        indicaciones: fd.get('indicaciones')?.trim() || '',
        plan: fd.get('plan')?.trim() || '',
        pendientes: fd.get('pendientes')?.trim() || '',
        createdAt: serverTimestamp()
      });

      hideModal('mRecord');
      e.target.reset();
      showToast('✅ Nota guardada');
    } catch (error) {
      console.error('Error al guardar registro:', error);
      showToast('❌ Error al guardar registro');
    }
  });
}

/**
 * Carga los registros de un paciente en tiempo real.
 * Renderiza la tabla con las notas de evolución.
 * @param {string} patientId - ID del paciente
 * @returns {Function} Función para desuscribirse del listener
 */
export function loadRecords(patientId) {
  const recordsRef = collection(
    _db, 'artifacts', APP_ID, 'data', _dataId, 'patients', patientId, 'records'
  );

  const unsubscribe = onSnapshot(recordsRef, (snapshot) => {
    const records = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    renderRecordsTable(records);
  });

  return unsubscribe;
}

/**
 * Renderiza la tabla de registros clínicos.
 * @param {Array} records - Lista de registros ordenados por fecha desc
 */
function renderRecordsTable(records) {
  const tbody = document.getElementById('tableBody');

  if (records.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="p-8 text-center text-slate-400">
          <p class="text-sm">Sin registros clínicos</p>
          <p class="text-xs mt-1">Presione + para agregar una nota</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = records.map((record, index) => {
    const num = records.length - index;

    // Formato compacto de fecha: DD/MM HH:MM (24h)
    let fecha = '';
    if (record.createdAt) {
      const d = new Date(record.createdAt.seconds * 1000);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      fecha = `${dd}/${mm} ${hh}:${min}`;
    }

    return `
      <tr class="border-b hover:bg-slate-50/50 transition-colors record-row">
        <td class="p-2 border-r text-center align-top" data-label="Nota">
          <span class="font-bold text-slate-400">${num}</span>
          <div class="text-[7px] text-slate-300 mt-1 fecha-sub">${fecha}</div>
        </td>
        <td class="p-2 border-r align-top" data-label="Antecedentes">
          <div class="text-slate-700 whitespace-pre-line">${escapeHTML(record.antecedentes)}</div>
        </td>
        <td class="p-2 border-r align-top" data-label="Hallazgos Qx">
          <div class="font-semibold text-slate-800 whitespace-pre-line">${escapeHTML(record.hallazgos)}</div>
        </td>
        <td class="p-2 border-r align-top" data-label="Signos">
          <div class="space-y-0.5 text-slate-600">
            ${formatSigno('FC', record.signos?.fc)}
            ${formatSigno('TA', record.signos?.ta)}
            ${formatSigno('FR', record.signos?.fr)}
            ${formatSigno('T°', record.signos?.temp)}
            ${formatSigno('SpO2', record.signos?.spo2)}
          </div>
        </td>
        <td class="p-2 border-r align-top" data-label="Interrogatorio">
          <div class="text-slate-700 whitespace-pre-line">${escapeHTML(record.interrogatorio)}</div>
        </td>
        <td class="p-2 border-r align-top" data-label="Laboratorios">
          <div class="text-emerald-700 whitespace-pre-line">${escapeHTML(record.laboratorios)}</div>
        </td>
        <td class="p-2 border-r align-top" data-label="Imagen">
          <div class="text-violet-700 whitespace-pre-line">${escapeHTML(record.imagen)}</div>
        </td>
        <td class="p-2 border-r align-top" data-label="Indicaciones">
          <div class="text-blue-700 font-medium whitespace-pre-line">${escapeHTML(record.indicaciones)}</div>
        </td>
        <td class="p-2 border-r align-top" data-label="Plan">
          <div class="text-slate-600 whitespace-pre-line">${escapeHTML(record.plan)}</div>
        </td>
        <td class="p-2 align-top" data-label="Pendientes">
          <span class="font-bold text-red-600 whitespace-pre-line">${escapeHTML(record.pendientes)}</span>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Formatea un signo vital para mostrar en la tabla
 * @param {string} label - Etiqueta (FC, TA, etc.)
 * @param {string} value - Valor del signo
 * @returns {string} HTML formateado o cadena vacía si no hay valor
 */
function formatSigno(label, value) {
  if (!value) return '';
  return `<div><span class="font-medium text-slate-500">${label}:</span> ${escapeHTML(value)}</div>`;
}

/**
 * Escapa caracteres HTML para prevenir XSS
 * @param {string} text - Texto a escapar
 * @returns {string} Texto seguro para insertar en HTML
 */
function escapeHTML(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
