/**
 * Módulo de UI - MedControl
 * ==========================
 * Maneja la lógica de interfaz: drawer, modales, toasts
 * y el prompt de instalación PWA.
 */

// ─── Estado interno del módulo ───
let deferredInstallPrompt = null;

/**
 * Inicializa todos los elementos de UI:
 * drawer lateral, modales, búsqueda y PWA install prompt.
 */
export function initUI() {
  setupDrawer();
  setupModals();
  setupHelpButton();
  setupPWAInstall();
}

// ──────────────── Drawer / Sidebar ────────────────

/** Configura el drawer lateral con overlay para móvil */
function setupDrawer() {
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('drawerOverlay');
  const menuBtn = document.getElementById('menuBtn');
  const closeBtn = document.getElementById('closeDrawer');

  menuBtn.addEventListener('click', () => openDrawer(drawer, overlay));
  closeBtn.addEventListener('click', () => closeDrawer(drawer, overlay));
  overlay.addEventListener('click', () => closeDrawer(drawer, overlay));
}

/**
 * Abre el drawer lateral
 * @param {HTMLElement} drawer - El elemento aside del drawer
 * @param {HTMLElement} overlay - El overlay de fondo oscuro
 */
export function openDrawer(drawer, overlay) {
  drawer.classList.remove('-translate-x-full');
  overlay.classList.add('active');
}

/**
 * Cierra el drawer lateral
 * @param {HTMLElement} drawer - El elemento aside del drawer
 * @param {HTMLElement} overlay - El overlay de fondo oscuro
 */
export function closeDrawer(drawer, overlay) {
  drawer.classList.add('-translate-x-full');
  overlay.classList.remove('active');
}

/** Cierra el drawer en dispositivos móviles (< 1024px) */
export function closeDrawerMobile() {
  if (window.innerWidth < 1024) {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('drawerOverlay');
    closeDrawer(drawer, overlay);
  }
}

// ──────────────── Modales ────────────────

/** Configura los botones de cierre de todos los modales */
function setupModals() {
  const allModals = ['mPatient', 'mRecord', 'mGuide', 'mConfirm'];

  document.querySelectorAll('.closeM').forEach(btn => {
    btn.addEventListener('click', () => {
      allModals.forEach(id => hideModal(id));
    });
  });

  // Cerrar modal al hacer click en el backdrop
  allModals.forEach(id => {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) hideModal(id);
    });
  });
}

/** Configura el botón de ayuda para abrir la guía rápida */
function setupHelpButton() {
  const helpBtn = document.getElementById('helpBtn');
  if (helpBtn) {
    helpBtn.addEventListener('click', () => showModal('mGuide'));
  }
}

/**
 * Muestra un modal por su ID
 * @param {string} modalId - ID del elemento modal
 */
export function showModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.replace('hidden', 'flex');
  // Aplicar clases de animación
  const content = modal.querySelector('[class*="bg-white"]');
  if (content) content.classList.add('modal-content');
}

/**
 * Oculta un modal por su ID
 * @param {string} modalId - ID del elemento modal
 */
export function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.replace('flex', 'hidden');
}

// ──────────────── Toast Notifications ────────────────

/**
 * Muestra una notificación toast temporal
 * @param {string} message - Texto a mostrar
 * @param {number} duration - Duración en ms (default: 3000)
 */
export function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  toast.innerText = message;
  toast.classList.add('toast-enter');
  toast.classList.remove('toast-exit');

  setTimeout(() => {
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-exit');
  }, duration);
}

// ──────────────── PWA Install Prompt ────────────────

/** Captura el evento beforeinstallprompt y muestra el banner de instalación */
function setupPWAInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;

    const banner = document.getElementById('installBanner');
    if (banner) {
      banner.classList.add('show');
      banner.addEventListener('click', async () => {
        if (deferredInstallPrompt) {
          deferredInstallPrompt.prompt();
          const result = await deferredInstallPrompt.userChoice;
          if (result.outcome === 'accepted') {
            showToast('¡App instalada correctamente!');
          }
          deferredInstallPrompt = null;
          banner.classList.remove('show');
        }
      });
    }
  });
}
