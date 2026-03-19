/**
 * Módulo de Exportación PDF - MedControl
 * ========================================
 * Genera un PDF profesional con el expediente del paciente
 * usando jsPDF + autoTable.
 */

import { getActivePatientId, getPatients } from './patients.js';
import { showToast } from './ui.js';

/**
 * Inicializa el botón de exportación PDF
 */
export function initPDFExport() {
  document.getElementById('exportBtn').addEventListener('click', exportPDF);
}

/**
 * Exporta el expediente del paciente activo a PDF.
 * Incluye encabezado con datos del paciente y tabla con registros.
 */
function exportPDF() {
  const activeId = getActivePatientId();
  if (!activeId) {
    showToast('⚠️ Seleccione un paciente primero');
    return;
  }

  const patient = getPatients().find(p => p.id === activeId);
  if (!patient) return;

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape para más espacio

    // ─── Encabezado ───
    doc.setFillColor(30, 58, 138); // blue-900
    doc.rect(0, 0, 297, 25, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('REGISTRO CLÍNICO - MedControl', 14, 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de impresión: ${new Date().toLocaleDateString('es-MX', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })}`, 14, 19);

    // ─── Datos del paciente ───
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(10, 30, 277, 14, 'F');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Paciente: ${patient.name}`, 14, 38);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const metaParts = [];
    if (patient.age) metaParts.push(`Edad: ${patient.age} años`);
    if (patient.dx) metaParts.push(`Dx: ${patient.dx}`);
    if (patient.cama) metaParts.push(`Cama: ${patient.cama}`);
    if (metaParts.length) {
      doc.text(metaParts.join('  |  '), 14, 42);
    }

    // ─── Tabla de registros ───
    doc.autoTable({
      html: '#recordsTable',
      startY: 50,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],   // slate-800
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 6,
        halign: 'center',
        cellPadding: 2
      },
      bodyStyles: {
        fontSize: 6,
        cellPadding: 2,
        valign: 'top'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]  // slate-50
      },
      columnStyles: {
        0: { cellWidth: 18, halign: 'center' }, // C (número + fecha)
        1: { cellWidth: 28 },  // Antecedentes
        2: { cellWidth: 32 },  // Hallazgos Qx
        3: { cellWidth: 24 },  // Signos
        4: { cellWidth: 28 },  // Interrogatorio
        5: { cellWidth: 28 },  // Laboratorios
        6: { cellWidth: 22 },  // Imagen
        7: { cellWidth: 30 },  // Indicaciones
        8: { cellWidth: 28 },  // Plan
        9: { cellWidth: 28 }   // Pendientes
      },
      margin: { top: 50, left: 10, right: 10 },
      didDrawPage: (data) => {
        // Pie de página en cada página
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(
          `MedControl - Página ${data.pageNumber} de ${pageCount}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 8
        );
      }
    });

    // Guardar PDF
    const fileName = `Expediente_${patient.name.replace(/\s+/g, '_')}_${
      new Date().toISOString().split('T')[0]
    }.pdf`;

    doc.save(fileName);
    showToast('📄 PDF descargado');
  } catch (error) {
    console.error('Error al generar PDF:', error);
    showToast('❌ Error al generar PDF');
  }
}
