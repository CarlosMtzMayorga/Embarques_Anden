import { formatDateMX, formatNumber } from './date';

export function generarHtmlFormatoSalida({ folio, fecha, cliente_nombre, entregado_por, observaciones, items }) {
  // Agrupar por producto para el resumen
  const resumenMap = new Map();
  let totalCajas = 0;
  let totalKilos = 0;

  for (const it of items) {
    const key = `${it.codigo || 'SIN-COD'}__${it.producto || 'SIN PRODUCTO'}__${it.tipo_ganado || ''}`;
    if (!resumenMap.has(key)) {
      resumenMap.set(key, {
        codigo: it.codigo || '—',
        producto: it.producto || '—',
        tipo_ganado: it.tipo_ganado || '—',
        cajas: 0,
        kilos: 0,
      });
    }
    const r = resumenMap.get(key);
    const c = Number(it.cajas || 0);
    const k = Number(it.kilos || 0);
    r.cajas += c;
    r.kilos += k;
    totalCajas += c;
    totalKilos += k;
  }

  const resumenRows = Array.from(resumenMap.values());
  const fechaStr = fecha ? formatDateMX(fecha) : formatDateMX(new Date().toISOString().split('T')[0]);
  const fechaImpresion = new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Formato de Salida — Folio ${folio}</title>
  <style>
    @page {
      size: letter portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1a1a1a;
      background: #f8fafc;
      font-size: 11px;
      line-height: 1.35;
    }
    .no-print-bar {
      background: #1e293b;
      color: #fff;
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    .btn {
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-print {
      background: #2563eb;
      color: white;
    }
    .btn-print:hover { background: #1d4ed8; }
    .btn-close {
      background: #475569;
      color: #f1f5f9;
      margin-left: 8px;
    }
    .btn-close:hover { background: #334155; }
    
    .doc-page {
      background: white;
      max-width: 800px;
      margin: 20px auto;
      padding: 24px 30px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.06);
      border-radius: 4px;
    }
    @media print {
      body { background: white; }
      .no-print-bar { display: none !important; }
      .doc-page {
        box-shadow: none;
        margin: 0;
        padding: 0;
        max-width: 100%;
        border-radius: 0;
      }
    }

    /* Encabezado */
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .company-title {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      text-transform: uppercase;
    }
    .company-sub {
      font-size: 11px;
      color: #475569;
      margin-top: 2px;
    }
    .folio-box {
      border: 2px solid #0f172a;
      background: #f8fafc;
      padding: 6px 14px;
      text-align: right;
      border-radius: 6px;
    }
    .folio-label {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .folio-number {
      font-size: 22px;
      font-weight: 900;
      color: #b91c1c;
      line-height: 1.1;
    }

    /* Metadatos */
    .meta-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 10px;
      background: #f1f5f9;
      padding: 10px 14px;
      border-radius: 6px;
      margin-bottom: 16px;
    }
    .meta-item {
      display: flex;
      flex-direction: column;
    }
    .meta-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 1px;
    }
    .meta-val {
      font-size: 12px;
      font-weight: 600;
      color: #0f172a;
    }

    /* Secciones */
    .section-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      color: #0f172a;
      border-left: 4px solid #b91c1c;
      padding-left: 8px;
      margin-top: 14px;
      margin-bottom: 8px;
    }

    /* Tablas */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 5px 8px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    td {
      padding: 4px 8px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 10.5px;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }

    /* Totales */
    .totales-card {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 16px;
      display: flex;
      justify-content: flex-end;
      gap: 28px;
      margin-top: 8px;
      margin-bottom: 24px;
    }
    .total-item {
      text-align: right;
    }
    .total-title {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }
    .total-val {
      font-size: 17px;
      font-weight: 900;
      color: #0f172a;
    }
    .total-val.destacado {
      color: #b91c1c;
    }

    /* Firmas */
    .firmas-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      margin-top: 36px;
      padding-top: 10px;
      page-break-inside: avoid;
    }
    .firma-box {
      text-align: center;
      border-top: 1.5px solid #334155;
      padding-top: 8px;
    }
    .firma-label {
      font-weight: 700;
      font-size: 10px;
      color: #0f172a;
      text-transform: uppercase;
    }
    .firma-sub {
      font-size: 9px;
      color: #64748b;
      margin-top: 2px;
    }

    .footer {
      margin-top: 24px;
      padding-top: 8px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      color: #94a3b8;
      font-size: 9px;
    }
  </style>
</head>
<body>

  <div class="no-print-bar">
    <div>
      <span style="font-weight:700; font-size:14px;">Vista de Impresión — Folio #${folio}</span>
      <span style="color:#94a3b8; margin-left:12px; font-size:12px;">(${items.length} cajas registradas)</span>
    </div>
    <div>
      <button class="btn btn-print" onclick="window.print()">
        🖨️ Imprimir / Guardar PDF
      </button>
      <button class="btn btn-close" onclick="window.close()">
        ✖ Cerrar
      </button>
    </div>
  </div>

  <div class="doc-page">
    <div class="header">
      <div>
        <div class="company-title">Carnes Finas el Andén</div>
        <div class="company-sub">Empacadora de Carnes Finas — TIF No. 680</div>
        <div style="font-size:13px; font-weight:800; color:#b91c1c; margin-top:6px; letter-spacing:0.5px;">
          NOTA DE EMBARQUE / FORMATO DE SALIDA
        </div>
      </div>
      <div class="folio-box">
        <div class="folio-label">Folio Salida</div>
        <div class="folio-number">#${folio}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <span class="meta-label">Cliente / Destino:</span>
        <span class="meta-val">${cliente_nombre || '—'}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Fecha de Embarque:</span>
        <span class="meta-val">${fechaStr}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Entregado por / Chofer:</span>
        <span class="meta-val">${entregado_por || '—'}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Observaciones:</span>
        <span class="meta-val">${observaciones || 'Sin observaciones'}</span>
      </div>
    </div>

    <!-- Resumen agrupado por producto -->
    <div class="section-title">Resumen por Producto</div>
    <table>
      <thead>
        <tr>
          <th style="width: 12%;">Código</th>
          <th style="width: 48%;">Descripción del Producto</th>
          <th style="width: 16%;">Línea / Tipo</th>
          <th style="width: 12%; text-align: right;">Cajas</th>
          <th style="width: 12%; text-align: right;">Kilos</th>
        </tr>
      </thead>
      <tbody>
        ${resumenRows
          .map(
            (r) => `
          <tr>
            <td class="font-mono">${r.codigo}</td>
            <td><strong>${r.producto}</strong></td>
            <td>${r.tipo_ganado}</td>
            <td class="text-right"><strong>${r.cajas}</strong></td>
            <td class="text-right font-mono">${formatNumber(r.kilos, 2)} kg</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <!-- Totales -->
    <div class="totales-card">
      <div class="total-item">
        <div class="total-title">Total de Cajas</div>
        <div class="total-val">${totalCajas}</div>
      </div>
      <div class="total-item">
        <div class="total-title">Peso Neto Total</div>
        <div class="total-val destacado">${formatNumber(totalKilos, 2)} kg</div>
      </div>
    </div>

    <!-- Detalle de cajas escaneadas -->
    <div class="section-title">Detalle de Cajas Embarcadas (${items.length} cajas)</div>
    <table>
      <thead>
        <tr>
          <th style="width: 5%; text-align:center;">#</th>
          <th style="width: 10%;">Código</th>
          <th style="width: 35%;">Producto</th>
          <th style="width: 10%; text-align:center;">Lote</th>
          <th style="width: 8%; text-align:center;">Caja</th>
          <th style="width: 12%; text-align:right;">Kilos</th>
          <th style="width: 20%; text-align:right;">Código de Barras</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map(
            (it, idx) => `
          <tr>
            <td class="text-center" style="color:#64748b;">${idx + 1}</td>
            <td class="font-mono">${it.codigo || '—'}</td>
            <td>${it.producto || '—'}</td>
            <td class="text-center font-mono">${it.lote_canal || it.lote_num || '—'}</td>
            <td class="text-center font-mono">${it.caja ?? '—'}</td>
            <td class="text-right font-mono"><strong>${formatNumber(it.kilos, 2)}</strong></td>
            <td class="text-right font-mono" style="font-size:9.5px; color:#475569;">${it.barcode || '—'}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <!-- Firmas de entrega y recepción -->
    <div class="firmas-grid">
      <div class="firma-box">
        <div class="firma-label">Entrega (Andén / Almacén)</div>
        <div class="firma-sub">Nombre y Firma</div>
      </div>
      <div class="firma-box">
        <div class="firma-label">Recibe (Cliente / Chofer)</div>
        <div class="firma-sub">Nombre, Firma e INE</div>
      </div>
      <div class="firma-box">
        <div class="firma-label">Vigilancia / Caseta</div>
        <div class="firma-sub">Sello y Salida</div>
      </div>
    </div>

    <div class="footer">
      <span>Sistema de Embarques — Carnes Finas el Andén</span>
      <span>Impreso el: ${fechaImpresion}</span>
    </div>
  </div>

  <script>
    // Lanzar diálogo de impresión automáticamente tras cargar
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 300);
    });
  </script>
</body>
</html>`;
}

export function imprimirFormatoSalida(datos) {
  const html = generarHtmlFormatoSalida(datos);
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor permite las ventanas emergentes en tu navegador para ver e imprimir el formato.');
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
