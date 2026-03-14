/**
 * Módulo de Pacientes - MedControl
 * ==================================
 * CRUD de pacientes en Firestore.
 * Maneja la lista lateral, búsqueda y formulario de creación.
 */

import { collection, addDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { showModal, hideModal, showToast, closeDrawerMobile } from './ui.js';
import { loadRecords } from './records.js';
import { APP_ID } from './firebase-config.js';

// ─── Estado del módulo ───
let patients = [];
let activePatientId = null;
let unsubscribeRecords = null; // Para limpiar el listener anterior

/**
 * Retorna el ID del paciente actualmente seleccionado
 * @returns {string|null}
 */
export function getActivePatientId() {
  return activePatientId;
}

/**
 * Retorna la lista completa de pacientes cargados
 * @returns {Array}
 */
export function getPatients() {
  return patients;
}

/**
 * Inicializa el módulo de pacientes:
 * - Listener en tiempo real de Firestore
 * - Formulario de creación
 * - Búsqueda
 * @param {object} db - Instancia de Firestore
 * @param {string} uid - ID del usuario autenticado
 */
export function initPatients(db, uid) {
  // Botón de agregar paciente → abrir modal
  document.getElementById('addPatientBtn').addEventListener('click', () => {
    showModal('mPatient');
  });

  // Listener en tiempo real: sincroniza pacientes desde Firestore
  const patientsRef = collection(db, 'artifacts', APP_ID, 'users', uid, 'patients');

  onSnapshot(patientsRef, (snapshot) => {
    patients = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    renderPatientList();
  });

  // Formulario de creación de paciente
  document.getElementById('fPatient').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      await addDoc(patientsRef, {
        name: formData.get('name').trim(),
        age: formData.get('age') || '',
        dx: formData.get('dx') || '',
        cama: formData.get('cama') || '',
        createdAt: serverTimestamp()
      });
      hideModal('mPatient');
      e.target.reset();
      showToast('✅ Paciente creado');
    } catch (error) {
      console.error('Error al crear paciente:', error);
      showToast('❌ Error al crear paciente');
    }
  });

  // Búsqueda de pacientes
  document.getElementById('pSearch').addEventListener('input', renderPatientList);
}

/**
 * Renderiza la lista de pacientes en el sidebar.
 * Filtra por el término de búsqueda actual.
 */
function renderPatientList() {
  const searchTerm = document.getElementById('pSearch').value.toLowerCase();
  const listContainer = document.getElementById('pList');

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm)
  );

  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div class="text-center py-8 text-slate-400">
        <p class="text-sm">No se encontraron pacientes</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = filtered.map(p => {
    const isActive = activePatientId === p.id;
    const initials = p.name.charAt(0).toUpperCase();
    const cama = p.cama ? `| Cama ${p.cama}` : '';

    return `
      <button data-patient-id="${p.id}"
        class="patient-item w-full flex items-center gap-3 p-3 rounded-2xl transition-all
          ${isActive
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
            : 'bg-white border text-slate-600 hover:bg-slate-50'
          }">
        <div class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0
          ${isActive ? 'bg-white/20' : 'bg-blue-50 text-blue-600'}">
          ${initials}
        </div>
        <div class="text-left truncate">
          <div class="font-bold text-sm truncate">${p.name}</div>
          <div class="text-[10px] ${isActive ? 'text-blue-200' : 'text-slate-400'} truncate">
            ${p.age ? p.age + ' años' : ''} ${cama}
          </div>
        </div>
      </button>
    `;
  }).join('');

  // Event listeners para selección
  listContainer.querySelectorAll('.patient-item').forEach(btn => {
    btn.addEventListener('click', () => {
      selectPatient(btn.dataset.patientId);
    });
  });
}

/**
 * Selecciona un paciente y carga su vista principal con registros.
 * @param {string} patientId - ID del paciente en Firestore
 */
function selectPatient(patientId) {
  activePatientId = patientId;
  const patient = patients.find(p => p.id === patientId);
  if (!patient) return;

  // Mostrar vista del paciente
  document.getElementById('emptyState').classList.add('hidden');
  document.getElementById('patientView').classList.remove('hidden');

  // Actualizar datos del header del paciente
  document.getElementById('pActiveName').innerText = patient.name;

  const metaParts = [];
  if (patient.age) metaParts.push(`Edad: ${patient.age} años`);
  if (patient.dx) metaParts.push(`Dx: ${patient.dx}`);
  if (patient.cama) metaParts.push(`Cama: ${patient.cama}`);
  document.getElementById('pActiveMeta').innerText = metaParts.join(' | ') || 'Sin datos adicionales';

  // Cerrar drawer en móvil
  closeDrawerMobile();

  // Actualizar estilos de la lista
  renderPatientList();

  // Limpiar listener anterior y cargar registros del paciente seleccionado
  if (unsubscribeRecords) unsubscribeRecords();
  unsubscribeRecords = loadRecords(patientId);
}
