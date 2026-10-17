// outputs/pitstop/dist/multiple-pdf.js?v=20261015
async function multiplePaymentPdf(q) {
  const logo = new Image();
  logo.src = new URL("./assets/logo.jpeg", import.meta.url).href;
  await logo.decode();
  const pages = [], W = 1200, H = 1697, crc = (n) => q.currency === "USD" ? "US$ " + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n / 100) : "\u20A1" + new Intl.NumberFormat("es-CR").format(n / 100);
  let canvas, c, y;
  const text = (s, x, yy, size = 24, bold = false, right = false) => {
    c.font = `${bold ? 700 : 400} ${size}px Arial`;
    c.fillStyle = "#202126";
    c.textAlign = right ? "right" : "left";
    c.fillText(s, x, yy);
  };
  function page() {
    canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    c = canvas.getContext("2d");
    c.fillStyle = "#fff";
    c.fillRect(0, 0, W, H);
    c.fillStyle = "#101114";
    c.fillRect(0, 0, W, 200);
    c.drawImage(logo, 45, 5, 190, 190);
    c.font = "bold 35px Arial";
    c.fillStyle = "#fff";
    c.textAlign = "right";
    c.fillText("COMPROBANTE DE PAGO", 1130, 85);
    c.font = "24px Arial";
    c.fillText(q.number, 1130, 130);
    c.fillStyle = "#dd1222";
    c.fillRect(0, 200, W, 8);
    text(q.customerName || "Cliente", 70, 260, 27, true);
    text("Tel\xE9fono: " + q.customerPhone, 70, 300);
    text("Fecha: " + new Intl.DateTimeFormat("es-CR").format(new Date(q.issuedAt)), 1130, 300, 23, false, true);
    y = 355;
  }
  async function finish() {
    text("Seguimiento: " + q.trackingCode, 70, H - 105, 24, true);
    text("PITSTOP REPUESTOS \xB7 Gracias por tu confianza", 70, H - 55, 21);
    text("P\xE1gina " + (pages.length + 1), 1130, H - 55, 21, false, true);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.94));
    pages.push(new Uint8Array(await blob.arrayBuffer()));
  }
  function wrap(s, width) {
    c.font = "24px Arial";
    let line = "", lines = [];
    for (const word of String(s).split(/\s+/)) {
      for (const ch of (line ? " " : "") + word) {
        if (c.measureText(line + ch).width > width) {
          lines.push(line);
          line = "";
        }
        line += ch;
      }
    }
    if (line) lines.push(line);
    return lines;
  }
  function headings() {
    c.fillStyle = "#f8e8eb";
    c.fillRect(70, y - 28, 1060, 48);
    text("REPUESTO", 85, y, 21, true);
    text("TOTAL", 760, y, 21, true, true);
    text(q.customPayment ? "ABONADO" : "ADELANTO 20%", 950, y, 21, true, true);
    text("SALDO", 1120, y, 21, true, true);
    y += 55;
  }
  page();
  headings();
  for (const item of q.items) {
    const lines = wrap(item.product, 465), height = Math.max(80, lines.length * 30 + 28);
    if (y + height > 1330) {
      await finish();
      page();
      headings();
    }
    lines.forEach((s, i) => text(s, 85, y + i * 30));
    text(crc(item.totalMinor), 760, y, 23, true, true);
    text(crc(item.paidMinor), 950, y, 23, true, true);
    text(crc(item.balanceMinor), 1120, y, 23, true, true);
    y += height;
    c.fillStyle = "#e2e4e8";
    c.fillRect(70, y - 38, 1060, 1);
  }
  if (y + 390 > 1450) {
    await finish();
    page();
  }
  for (const [label, value] of [["Env\xEDo GRATIS (0%)", 0], ["Total de la compra", q.totalMinor], [q.customPayment ? "Monto abonado" : "Adelanto recibido \xB7 20%", q.paidMinor], ["Saldo pendiente", q.balanceMinor]]) {
    text(label, 85, y, 28, true);
    text(crc(value), 1120, y, 30, true, true);
    y += 65;
  }
  text("El saldo se cancela al momento de la entrega personal.", 85, y + 15, 24);
  text("Llegada estimada: " + q.arrival, 85, y + 58, 24);
  await finish();
  return pdf(pages, W, H);
}
function pdf(pages, width, height) {
  const enc = new TextEncoder(), parts = [], offsets = [0];
  let size = 0;
  const add = (x2) => {
    const b = typeof x2 === "string" ? enc.encode(x2) : x2;
    parts.push(b);
    size += b.length;
  }, obj = (n, s) => {
    offsets[n] = size;
    add(`${n} 0 obj
${s}
endobj
`);
  };
  add("%PDF-1.4\n");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, `<< /Type /Pages /Kids [${pages.map((_, i) => `${3 + i * 3} 0 R`).join(" ")}] /Count ${pages.length} >>`);
  pages.forEach((bytes, i) => {
    const p = 3 + i * 3;
    obj(p, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 ${p + 1} 0 R >> >> /Contents ${p + 2} 0 R >>`);
    offsets[p + 1] = size;
    add(`${p + 1} 0 obj
<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>
stream
`);
    add(bytes);
    add("\nendstream\nendobj\n");
    const content = "q 595.28 0 0 841.89 0 0 cm /Im0 Do Q\n";
    obj(p + 2, `<< /Length ${content.length} >>
stream
${content}endstream`);
  });
  const x = size;
  add(`xref
0 ${offsets.length}
0000000000 65535 f 
`);
  for (let i = 1; i < offsets.length; i++) add(String(offsets[i]).padStart(10, "0") + " 00000 n \n");
  add(`trailer
<< /Size ${offsets.length} /Root 1 0 R >>
startxref
${x}
%%EOF`);
  return new Blob(parts, { type: "application/pdf" });
}

// outputs/pitstop/dist/payment-pdf.js?v=20261015
function jpegPdf(jpeg, width, height) {
  const enc = new TextEncoder(), parts = [], offsets = [0];
  let length = 0;
  const add = (value) => {
    const bytes = typeof value === "string" ? enc.encode(value) : value;
    parts.push(bytes);
    length += bytes.length;
  };
  const obj = (n, value) => {
    offsets[n] = length;
    add(`${n} 0 obj
${value}
endobj
`);
  };
  add("%PDF-1.4\n");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  obj(3, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>");
  offsets[4] = length;
  add(`4 0 obj
<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>
stream
`);
  add(jpeg);
  add("\nendstream\nendobj\n");
  const scale = Math.min(595.28 / width, 841.89 / height), w = width * scale, h = height * scale;
  const content = `q ${w.toFixed(3)} 0 0 ${h.toFixed(3)} ${((595.28 - w) / 2).toFixed(3)} ${(841.89 - h).toFixed(3)} cm /Im0 Do Q
`;
  obj(5, `<< /Length ${enc.encode(content).length} >>
stream
${content}endstream`);
  const start2 = length;
  add("xref\n0 6\n0000000000 65535 f \n");
  for (let i = 1; i <= 5; i++) add(String(offsets[i]).padStart(10, "0") + " 00000 n \n");
  add(`trailer
<< /Size 6 /Root 1 0 R >>
startxref
${start2}
%%EOF
`);
  return new Blob(parts, { type: "application/pdf" });
}
async function paymentPdf(q) {
  const crc = (value) => q.currency === "USD" ? "US$ " + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 100) : "\u20A1" + new Intl.NumberFormat("es-CR", { maximumFractionDigits: 2 }).format(value / 100);
  if (q.items?.length) return multiplePaymentPdf(q);
  const logo = new Image();
  logo.src = new URL("./assets/logo.jpeg", import.meta.url).href;
  await logo.decode();
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  const c = canvas.getContext("2d");
  const font = (size, bold = false) => {
    c.font = `${bold ? "700" : "400"} ${size}px Arial, sans-serif`;
  };
  function wrap(value, width, size = 28) {
    font(size);
    const lines = [];
    let line = "";
    for (const word of String(value).replace(/\s+/g, " ").trim().split(" ")) {
      const next = line ? line + " " + word : word;
      if (c.measureText(next).width <= width) {
        line = next;
        continue;
      }
      if (line) lines.push(line);
      line = "";
      for (const char of word) {
        if (c.measureText(line + char).width > width) {
          lines.push(line);
          line = "";
        }
        line += char;
      }
    }
    if (line) lines.push(line);
    return lines;
  }
  const product = wrap(q.product, 700), name = wrap(q.customerName || "Cliente", 1060, 30), productHeight = Math.max(110, product.length * 38 + 46), nameHeight = name.length * 38;
  canvas.height = Math.max(1697, 1350 + productHeight + nameHeight);
  const box = (x, y2, w, h, color) => {
    c.fillStyle = color;
    c.fillRect(x, y2, w, h);
  };
  const text = (value, x, y2, size = 28, color = "#202126", bold = false, right = false) => {
    font(size, bold);
    c.fillStyle = color;
    c.textAlign = right ? "right" : "left";
    c.fillText(value, x, y2);
  };
  box(0, 0, 1200, canvas.height, "#fff");
  box(0, 0, 1200, 290, "#090a0c");
  box(0, 290, 1200, 12, "#e20a18");
  c.drawImage(logo, 46, 8, 280, 280);
  text("COMPROBANTE DE PAGO", 1130, 100, 43, "#fff", true, true);
  text(q.number, 1130, 158, 28, "#fff", true, true);
  const date = new Intl.DateTimeFormat("es-CR", { timeZone: "America/Costa_Rica", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(q.issuedAt));
  text("Fecha: " + date, 1130, 210, 25, "#c4c6cc", false, true);
  text("RECIBIDO DE", 70, 365, 22, "#dd1222", true);
  name.forEach((line, i) => text(line, 70, 411 + i * 38, 30, "#202126", true));
  let y = 420 + nameHeight;
  const phone = String(q.customerPhone).replace(/^\+?/, "+");
  text("Tel\xE9fono: " + phone, 70, y, 26, "#5f626b");
  y += 60;
  box(70, y, 1060, 62, "#dd1222");
  text("DESCRIPCI\xD3N", 92, y + 41, 23, "#fff", true);
  text("IMPORTE", 1108, y + 41, 23, "#fff", true, true);
  y += 62;
  product.forEach((line, i) => text(line, 92, y + 45 + i * 38));
  text(crc(q.totalMinor), 1108, y + 45, 30, "#202126", true, true);
  y += productHeight;
  box(70, y, 1060, 2, "#e8e9ec");
  text("Costo del env\xEDo \xB7 GRATIS (0%)", 92, y + 50, 27);
  text(crc(q.shippingMinor), 1108, y + 50, 30, "#202126", true, true);
  y += 92;
  box(70, y, 1060, 2, "#e8e9ec");
  text("Total de la compra", 92, y + 50, 28);
  text(crc(q.totalMinor), 1108, y + 50, 32, "#202126", true, true);
  y += 92;
  box(70, y, 1060, 125, "#101114");
  text(q.customPayment ? "MONTO ABONADO" : "MONTO PAGADO \xB7 ADELANTO 20%", 94, y + 43, 24, "#fff", true);
  text(crc(q.paidMinor), 1106, y + 94, 48, "#fff", true, true);
  y += 150;
  box(70, y, 1060, 90, "#fff0f1");
  text("SALDO PENDIENTE", 94, y + 56, 27, "#dd1222", true);
  text(crc(q.balanceMinor), 1106, y + 56, 38, "#dd1222", true, true);
  y += 146;
  text("El saldo pendiente se cancela al momento de la entrega personal.", 70, y, 26);
  y += 80;
  text("\xA1Gracias por tu compra y por confiar en PitStop!", 70, y, 30, "#202126", true);
  text("Tu adelanto nos permite encargar el repuesto para vos.", 70, y + 44, 26, "#5f626b");
  if (q.trackingCode) text("Seguimiento: " + q.trackingCode, 70, canvas.height - 140, 23, "#202126", true);
  box(70, canvas.height - 100, 1060, 2, "#e8e9ec");
  text("PITSTOP REPUESTOS", 70, canvas.height - 48, 23, "#202126", true);
  text("CALIDAD QUE TE MUEVE", 1130, canvas.height - 48, 21, "#dd1222", true, true);
  const jpeg = await new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("No se pudo crear el PDF.")), "image/jpeg", 0.95));
  return jpegPdf(new Uint8Array(await jpeg.arrayBuffer()), canvas.width, canvas.height);
}

// outputs/pitstop/dist/receipt-file.js
async function receiptFile(file) {
  if (!file) return null;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 4 * 1024 * 1024 || file.size === 0) throw new Error("Selecciona una imagen JPG, PNG o WEBP de hasta 4 MB.");
  const data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });
  return { contentType: file.type, base64: data.slice(data.indexOf(",") + 1) };
}

// outputs/pitstop/dist/multiple-sale-ui.js?v=20261015
function initMultipleSale({ call, context = () => ({}), check = () => true, owner = false, onSaved = () => {
} }) {
  const dialog = document.createElement("dialog");
  dialog.className = "multi-dialog";
  dialog.setAttribute("aria-label", owner ? "Editar venta m\xFAltiple" : "Generar venta m\xFAltiple");
  dialog.innerHTML = `<div class="multi-heading"><h2>${owner ? "Editar" : "Generar"} venta m\xFAltiple</h2><button type="button" data-close aria-label="Cerrar">\xD7</button></div><p>Selecciona las cotizaciones del mismo cliente. El adelanto y el saldo se suman por producto.</p><form data-search><label>Tel\xE9fono del cliente<input data-phone type="tel" required placeholder="+506 8888 8888"></label><button class="button" type="submit">Buscar cotizaciones</button></form><label>Filtrar por nombre del repuesto<input data-filter type="search" placeholder="Nombre del repuesto"></label><div data-list class="multi-list"></div><button type="button" data-more hidden>Ver m\xE1s cotizaciones</button><div data-totals class="multi-totals" aria-live="polite"></div><form data-save><fieldset data-fields><label class="payment-currency-choice"><input data-usd type="checkbox"> Pagado en d\xF3lares <small>El comprobante completo se emitir\xE1 en USD.</small></label><label class="paid-field">Monto abonado (opcional)<input data-paid inputmode="decimal" maxlength="15" placeholder="En blanco: adelanto del 20%"><small data-paid-hint>Es el total pagado, no solo la diferencia.</small></label>${owner ? "" : '<label>Nombre del cliente (opcional)<input data-name maxlength="120"></label><label>Direcci\xF3n de entrega<textarea data-address required maxlength="1000" rows="2"></textarea></label><label>Comprobante de pago (opcional)<input data-receipt type="file" accept="image/jpeg,image/png,image/webp"></label>'}<p>${owner ? "Los importes, el PDF y el seguimiento se actualizar\xE1n. Se conserva el c\xF3digo." : "Estas cotizaciones se convertir\xE1n en una sola venta por aprobar."}</p><button type="submit" class="button" data-submit>${owner ? "Guardar cambios" : "Crear venta m\xFAltiple y PDF"}</button></fieldset></form><p data-status role="status"></p><div data-success hidden><label>C\xF3digo de seguimiento<input data-code readonly></label><button type="button" data-copy>Copiar c\xF3digo</button><button type="button" data-pdf>Descargar PDF nuevamente</button></div>`;
  document.body.append(dialog);
  const $2 = (s) => dialog.querySelector(s), money2 = (n) => $2("[data-usd]").checked ? "US$ " + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n / 100) : "\u20A1" + new Intl.NumberFormat("es-CR").format(n / 100);
  let selected = /* @__PURE__ */ new Map(), rows = /* @__PURE__ */ new Map(), cursor = null, phone = "", sale = null, busy = false, requestId2, documentData;
  function render() {
    const list = $2("[data-list]");
    list.replaceChildren();
    const term = $2("[data-filter]").value.toLocaleLowerCase("es");
    for (const row of rows.values()) {
      if (term && !row.product.toLocaleLowerCase("es").includes(term)) continue;
      const label = document.createElement("label"), input = document.createElement("input"), span = document.createElement("span");
      label.className = "multi-option";
      input.type = "checkbox";
      input.checked = selected.has(row.id);
      input.disabled = busy;
      span.textContent = `${row.product} \xB7 ${new Intl.DateTimeFormat("es-CR").format(new Date(row.createdAt))} \xB7 ${money2($2("[data-usd]").checked ? row.totalCents : row.totalMinor)} \xB7 ${row.arrival}`;
      input.addEventListener("change", () => {
        if (input.checked) selected.set(row.id, row);
        else selected.delete(row.id);
        requestId2 = null;
        render();
      });
      label.append(input, span);
      list.append(label);
    }
    const values = [...selected.values()], total = values.reduce((n, r) => n + ($2("[data-usd]").checked ? r.totalCents : r.totalMinor), 0), defaultPaid = values.reduce((n, r) => n + ($2("[data-usd]").checked ? r.paidUsdMinor : r.paidMinor), 0);
    const raw = $2("[data-paid]").value.trim().replace(",", "."), paid = raw ? Math.round(Number(raw) * 100) : defaultPaid, valid = (!raw || /^\d{1,12}(?:\.\d{1,2})?$/.test(raw)) && Number.isSafeInteger(paid) && paid >= 0 && paid <= total;
    $2("[data-paid]").setCustomValidity(valid ? "" : "El abono debe estar entre cero y el total.");
    $2("[data-paid-hint]").textContent = "Monto total pagado en " + ($2("[data-usd]").checked ? "USD" : "CRC") + ". En blanco: 20% habitual. Sin separadores de miles.";
    $2("[data-totals]").textContent = !valid ? "Revisa el monto abonado." : `${values.length} seleccionadas \xB7 Total: ${money2(total)} \xB7 Abonado: ${money2(paid)} \xB7 Saldo: ${money2(total - paid)}`;
    $2("[data-submit]").disabled = busy || !valid || values.length < 2 || values.length > 20;
    $2("[data-more]").hidden = !cursor;
  }
  async function search(more = false) {
    if (busy || !check()) return;
    busy = true;
    $2("[data-phone]").disabled = true;
    render();
    try {
      const newPhone = $2("[data-phone]").value.trim();
      if (!more) {
        phone = newPhone;
        selected.clear();
        rows.clear();
        cursor = null;
        requestId2 = null;
      }
      const { data } = await call("multiQuoteOptions", { ...context(), phone, cursor: more ? cursor : null, ...sale ? { saleId: sale.id } : {} });
      for (const row of [...data.rows, ...data.selected || []]) rows.set(row.id, row);
      if (!more) for (const row of data.selected || []) selected.set(row.id, row);
      cursor = data.next;
      $2("[data-status]").textContent = rows.size ? "Selecciona al menos dos cotizaciones." : "No hay cotizaciones disponibles.";
    } catch (e) {
      $2("[data-status]").textContent = e.message || "No se pudo buscar.";
    } finally {
      busy = false;
      $2("[data-phone]").disabled = false;
      render();
    }
  }
  $2("[data-search]").addEventListener("submit", (e) => {
    e.preventDefault();
    search();
  });
  $2("[data-more]").onclick = () => search(true);
  $2("[data-filter]").oninput = render;
  $2("[data-paid]").oninput = () => {
    requestId2 = null;
    render();
  };
  $2("[data-usd]").onchange = () => {
    requestId2 = null;
    $2("[data-paid]").value = "";
    render();
  };
  $2("[data-phone]").oninput = () => {
    selected.clear();
    rows.clear();
    cursor = null;
    requestId2 = null;
    render();
  };
  async function download() {
    const blob = await paymentPdf(documentData), url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url;
    a.download = "PitStop-" + documentData.number + ".pdf";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 6e4);
  }
  $2("[data-save]").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy || !check()) return;
    busy = true;
    $2("[data-phone]").disabled = true;
    render();
    $2("[data-fields]").disabled = true;
    $2("[data-status]").textContent = "Guardando venta\u2026";
    try {
      requestId2 ??= crypto.randomUUID();
      const payload = { ...context(), paidAmount: $2("[data-paid]").value.trim(), paymentCurrency: $2("[data-usd]").checked ? "USD" : "CRC", requestId: requestId2, items: [...selected.values()].map((r) => ({ id: r.id, quoteVersion: r.quoteVersion })), ...sale ? { saleId: sale.id, version: sale.version } : { customer: { phone, name: $2("[data-name]").value.trim(), address: $2("[data-address]").value.trim() }, receipt: await receiptFile($2("[data-receipt]").files[0]) } };
      const { data } = await call("saveMultipleSale", payload);
      documentData = { ...data.paymentDocument, trackingCode: data.trackingCode };
      $2("[data-code]").value = data.trackingCode;
      $2("[data-success]").hidden = false;
      $2("[data-save]").hidden = true;
      $2("[data-search]").hidden = true;
      $2("[data-list]").replaceChildren();
      $2("[data-more]").hidden = true;
      $2("[data-status]").textContent = sale ? "Venta actualizada." : "Venta m\xFAltiple creada.";
      onSaved();
      try {
        await download();
      } catch {
        $2("[data-status]").textContent += " No se pudo descargar; usa Descargar PDF nuevamente.";
      }
    } catch (e2) {
      $2("[data-status]").textContent = e2.message || "No se pudo guardar. Vuelve a buscar las cotizaciones.";
    } finally {
      busy = false;
      $2("[data-phone]").disabled = false;
      $2("[data-fields]").disabled = false;
      if (!documentData) render();
    }
  });
  $2("[data-pdf]").onclick = () => download().catch(() => {
    $2("[data-status]").textContent = "No se pudo generar el PDF. Intenta nuevamente.";
  });
  $2("[data-copy]").onclick = async () => {
    try {
      await navigator.clipboard.writeText($2("[data-code]").value);
      $2("[data-status]").textContent = "C\xF3digo copiado.";
    } catch {
      $2("[data-code]").select();
      $2("[data-status]").textContent = "Copia el c\xF3digo seleccionado.";
    }
  };
  $2("[data-close]").onclick = () => {
    if (!busy) dialog.close();
  };
  dialog.addEventListener("cancel", (e) => {
    if (busy) e.preventDefault();
  });
  const open = async (item) => {
    if (!check()) return;
    sale = item || null;
    selected.clear();
    rows.clear();
    cursor = null;
    phone = "";
    requestId2 = null;
    documentData = null;
    $2("[data-filter]").value = "";
    $2("[data-phone]").value = sale?.customer?.phone || "";
    $2("[data-phone]").readOnly = !!sale;
    $2("[data-save]").reset();
    $2("[data-usd]").checked = sale?.paymentDocument?.currency === "USD";
    $2("[data-paid]").value = sale?.paymentDocument?.customPayment ? (sale.paymentDocument.paidMinor / 100).toFixed(2) : "";
    $2("[data-save]").hidden = false;
    $2("[data-search]").hidden = false;
    $2("[data-success]").hidden = true;
    $2("[data-status]").textContent = "";
    render();
    dialog.showModal();
    if (sale) await search();
  };
  open.close = () => {
    dialog.close();
    selected.clear();
    rows.clear();
    documentData = null;
    $2("[data-list]").replaceChildren();
    $2("[data-code]").value = "";
  };
  return open;
}

// outputs/pitstop/dist/clipboard.js
async function copyMessage(message) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(message);
      return;
    }
  } catch {
  }
  const field = document.createElement("textarea");
  field.value = message;
  field.readOnly = true;
  field.style.cssText = "position:fixed;left:-9999px;top:0";
  document.body.append(field);
  const previous = document.activeElement;
  try {
    field.select();
    field.setSelectionRange(0, field.value.length);
    if (!document.execCommand("copy")) throw new Error("Copia manual requerida");
  } finally {
    field.remove();
    previous?.focus({ preventScroll: true });
  }
}

// outputs/pitstop/dist/sales-search.js?v=20261015
function initSalesSearch({ call, checkSeller: checkSeller2, context }) {
  const $2 = (id) => document.getElementById(id);
  let rows = [], cursor = null, phone = "", generation = 0, busy = false;
  async function search(reset) {
    if (busy || !checkSeller2()) return;
    busy = true;
    const stamp = ++generation;
    if (reset) {
      phone = $2("sales-search-phone").value.trim();
      rows = [];
      cursor = null;
    }
    $2("sales-search-button").disabled = true;
    $2("sales-search-more").disabled = true;
    $2("sales-search-state").textContent = "Buscando ventas\u2026";
    try {
      const { data } = await call("searchSales", { ...context(), phone, cursor: reset ? null : cursor });
      if (stamp !== generation) return;
      rows = reset ? data.rows : [...rows, ...data.rows];
      cursor = data.next;
      render();
      $2("sales-search-state").textContent = rows.length ? `${rows.length} ventas encontradas.` : "No hay ventas para este tel\xE9fono.";
    } catch {
      $2("sales-search-state").textContent = "No se pudo buscar. Revisa el tel\xE9fono y vuelve a intentarlo.";
    } finally {
      busy = false;
      $2("sales-search-button").disabled = false;
      $2("sales-search-more").disabled = false;
    }
  }
  function render() {
    const list = $2("sales-search-results");
    list.replaceChildren();
    for (const sale of rows) {
      const card = document.createElement("article");
      card.className = "quote-card";
      const title = document.createElement("h3"), info = document.createElement("p"), state = document.createElement("p"), pdf2 = document.createElement("button"), copy = document.createElement("button"), code = document.createElement("input");
      title.textContent = sale.product;
      info.textContent = `+${sale.customerPhone} \xB7 ${new Intl.DateTimeFormat("es-CR", { timeZone: "America/Costa_Rica", dateStyle: "short" }).format(new Date(sale.createdAt))} \xB7 ${sale.status === "cancelled" ? "Cancelada" : sale.status === "pending" ? "Por aprobar" : "Aprobada"}`;
      pdf2.textContent = "Descargar comprobante PDF";
      copy.textContent = "Copiar c\xF3digo de seguimiento";
      for (const b of [pdf2, copy]) {
        b.type = "button";
        b.className = "button";
      }
      code.readOnly = true;
      code.hidden = true;
      code.setAttribute("aria-label", "C\xF3digo de seguimiento");
      state.setAttribute("role", "status");
      let data;
      async function action(mode) {
        if (!checkSeller2()) return;
        pdf2.disabled = copy.disabled = true;
        state.textContent = "Preparando\u2026";
        try {
          data = (await call("saleDocuments", { ...context(), phone: sale.customerPhone, saleId: sale.saleId })).data;
          code.value = data.trackingCode;
          code.hidden = false;
          if (mode === "copy") {
            try {
              await copyMessage(data.trackingCode);
              state.textContent = "C\xF3digo copiado. El cliente puede usarlo en pitstop-cbe24.web.app.";
            } catch {
              code.focus();
              code.select();
              state.textContent = "Copia el c\xF3digo seleccionado.";
            }
          } else {
            const blob = await paymentPdf({ ...data.paymentDocument, trackingCode: data.trackingCode }), url = URL.createObjectURL(blob), a = document.createElement("a");
            a.href = url;
            a.download = "PitStop-" + data.paymentDocument.number + ".pdf";
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 6e4);
            state.textContent = "PDF listo. Revisa las descargas del navegador.";
          }
        } catch {
          state.textContent = "No se pudo recuperar esta venta. Busca nuevamente e int\xE9ntalo otra vez.";
        } finally {
          pdf2.disabled = copy.disabled = false;
        }
      }
      pdf2.addEventListener("click", () => action("pdf"));
      copy.addEventListener("click", () => action("copy"));
      card.append(title, info, pdf2, copy, code, state);
      list.append(card);
    }
    $2("sales-search-more").hidden = !cursor;
  }
  $2("sales-search-form").addEventListener("submit", (e) => {
    e.preventDefault();
    search(true);
  });
  $2("sales-search-more").addEventListener("click", () => search(false));
}

// outputs/pitstop/dist/quotation-image.js?v=20261002c
async function quotationImage(q) {
  const crc = (value) => q.currency === "USD" ? "US$ " + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 100) : "\u20A1" + new Intl.NumberFormat("es-CR", { maximumFractionDigits: 2 }).format(value / 100);
  const logo = new Image();
  logo.src = new URL("./assets/logo.jpeg", import.meta.url).href;
  await logo.decode();
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  const ctx = canvas.getContext("2d");
  const font = (size = 28, bold = false) => {
    ctx.font = `${bold ? "700" : "400"} ${size}px Arial, sans-serif`;
  };
  function wrap(text2, width, size = 28) {
    font(size);
    const lines = [];
    let line = "";
    for (const word of String(text2).replace(/\s+/g, " ").trim().split(" ")) {
      const candidate = line ? line + " " + word : word;
      if (ctx.measureText(candidate).width <= width) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      line = "";
      for (const char of word) {
        if (ctx.measureText(line + char).width > width) {
          lines.push(line);
          line = "";
        }
        line += char;
      }
    }
    if (line) lines.push(line);
    return lines;
  }
  const product = wrap(q.product, 700), rowHeight = Math.max(105, product.length * 38 + 48);
  canvas.height = 1700 + rowHeight;
  const rect = (x, y2, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y2, w, h);
  };
  const text = (value, x, y2, size = 28, color = "#202126", bold = false, align = "left") => {
    font(size, bold);
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(value, x, y2);
  };
  rect(0, 0, 1200, canvas.height, "#ffffff");
  rect(0, 0, 1200, 290, "#090a0c");
  rect(0, 290, 1200, 12, "#e20a18");
  ctx.drawImage(logo, 46, 8, 280, 280);
  text("COTIZACI\xD3N", 1130, 105, 58, "#ffffff", true, "right");
  text(q.number, 1130, 162, 28, "#ffffff", true, "right");
  const date = new Intl.DateTimeFormat("es-CR", { timeZone: "America/Costa_Rica", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(q.issuedAt));
  text("Fecha: " + date, 1130, 210, 25, "#c4c6cc", false, "right");
  text("COTIZADO PARA", 70, 365, 21, "#dd1222", true);
  text("Cliente \xB7 +" + q.customerPhone, 70, 410, 30, "#202126", true);
  text("Repuestos por encargo \xB7 Pedido especial", 70, 458, 25, "#5f626b");
  rect(70, 510, 1060, 62, "#dd1222");
  text("DESCRIPCI\xD3N", 92, 551, 23, "#fff", true);
  text("IMPORTE", 1108, 551, 23, "#fff", true, "right");
  let y = 572;
  product.forEach((line, i) => text(line, 92, y + 45 + i * 38, 28));
  text(crc(q.productMinor), 1108, y + 45, 30, "#202126", true, "right");
  y += rowHeight;
  rect(70, y, 1060, 2, "#e8e9ec");
  text("Env\xEDo", 92, y + 50);
  text("GRATIS", 240, y + 50, 24, "#dd1222", true);
  text(crc(q.shippingMinor), 1108, y + 50, 28, "#202126", false, "right");
  y += 90;
  rect(70, y, 1060, 2, "#e8e9ec");
  text("Subtotal", 730, y + 54, 27);
  text(crc(q.subtotalMinor), 1108, y + 54, 30, "#202126", true, "right");
  y += 86;
  rect(70, y, 1060, 104, "#101114");
  text("TOTAL", 94, y + 65, 30, "#fff", true);
  text(crc(q.totalMinor), 1106, y + 69, 48, "#fff", true, "right");
  y += 164;
  text("CONDICIONES DE PAGO", 70, y, 23, "#dd1222", true);
  y += 28;
  const rows = [["Total", q.totalMinor], ["Adelanto \xB7 20%", q.advanceMinor], ["Saldo pendiente", q.balanceMinor]];
  for (const [label, amount] of rows) {
    rect(70, y, 1060, 66, label.startsWith("Adelanto") ? "#fff0f1" : "#f4f5f7");
    text(label, 94, y + 43, 27, "#202126", true);
    text(crc(amount), 1106, y + 43, 30, "#202126", true, "right");
    y += 70;
  }
  y += 40;
  text("Con el adelanto procedemos a encargar tu repuesto.", 70, y, 26);
  text("El saldo se cancela al momento de la entrega personal.", 70, y + 40, 26);
  y += 108;
  text("LLEGADA ESTIMADA", 70, y, 20, "#dd1222", true);
  wrap(q.arrival, 510, 28).forEach((line, i) => text(line, 70, y + 40 + i * 34, 28, "#202126", true));
  text("GARANT\xCDA", 680, y, 20, "#dd1222", true);
  wrap(q.warranty, 450, 28).forEach((line, i) => text(line, 680, y + 40 + i * 34, 28, "#202126", true));
  rect(70, canvas.height - 100, 1060, 2, "#e8e9ec");
  text("Gracias por la confianza.", 70, canvas.height - 48, 26, "#5f626b");
  text("CALIDAD QUE TE MUEVE", 1130, canvas.height - 48, 21, "#dd1222", true, "right");
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("No se pudo crear la imagen.")), "image/png"));
}

// outputs/pitstop/dist/whatsapp.js?v=20260927-copy-message2
function costaRicaPhone(value) {
  if (typeof value !== "string") throw new Error("Revisa el tel\xE9fono del cliente. Debe tener +506 y 8 d\xEDgitos.");
  let phone = value.trim().replace(/[\s().-]/g, "");
  if (/^\d{8}$/.test(phone)) phone = "506" + phone;
  if (!/^\+?506\d{8}$/.test(phone)) throw new Error("Revisa el tel\xE9fono del cliente. Debe tener +506 y 8 d\xEDgitos.");
  return phone.replace(/^\+/, "");
}
function whatsappQuotation(item) {
  const phone = costaRicaPhone(item?.customerPhone), total = item?.paymentCurrency === "USD" ? item?.totalCents : item?.totalCrcMinor;
  if (!Number.isSafeInteger(total) || total <= 0) throw new Error("Calcula la cotizaci\xF3n en colones antes de enviarla.");
  const product = String(item.product || "").trim().replace(/\s+/g, " ");
  if (!product) throw new Error("Falta el nombre del repuesto. Calcula nuevamente.");
  const advance = item.paymentCurrency === "USD" ? Math.round(total / 5) : Math.min(total, Math.ceil(total / 5e5) * 1e5), balance = total - advance;
  const crc = (minor) => item.paymentCurrency === "USD" ? "US$ " + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(minor / 100) : "\u20A1" + new Intl.NumberFormat("es-CR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(minor / 100);
  const message = `Perfecto, excelente. \u{1F44D}\u{1F3FB} Ya confirmamos que el repuesto es el correcto y podemos solicitarlo por encargo como pedido especial.

El precio del repuesto (${product}) ser\xEDa de ${crc(total)} y para realizar el pedido se requiere un adelanto del 20% ${crc(advance)}. El restante ${crc(balance)} se cancela al momento de la entrega personal.

\u23F1\uFE0F Tiempo estimado de llegada: 8\u201312 d\xEDas
\u{1F6E1}\uFE0F Garant\xEDa: 1 mes

Una vez realizado el adelanto, procedemos a encargarlo. \xA1Muchas gracias por la confianza!`;
  return { phone, message, total, advance, balance, url: `https://wa.me/${phone}?text=${encodeURIComponent(message)}` };
}

// outputs/pitstop/dist/config.js
var firebaseConfig = {
  apiKey: "AIzaSyATSzfKdW4KHc5IRsZh5rDJoOQyqroojQ4",
  authDomain: "pitstop-cbe24.firebaseapp.com",
  projectId: "pitstop-cbe24",
  appId: "1:90657894963:web:9f7ae390f8c679a7c46946"
};
var region = "us-central1";
var appCheckSiteKey = "6LeDqMotAAAAAJ_CNs1-e59S8--oW2IQP43-1n1O";

// outputs/pitstop/dist/app.js
var $ = (id) => document.getElementById(id);
var money = (minor, currency = "USD") => new Intl.NumberFormat("es-CR", { style: "currency", currency }).format(minor / 100);
var api;
var requestId;
var pendingPayload;
var lastResult;
var sellerDay;
var saleBusy = false;
var today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Costa_Rica", year: "numeric", month: "2-digit", day: "2-digit" }).format(/* @__PURE__ */ new Date());
try {
  const saved = JSON.parse(localStorage.getItem("pitstop-seller") || "null");
  if (saved?.day === today()) {
    $("seller").value = saved.name;
    sellerDay = saved.day;
  }
} catch {
}
function checkSeller() {
  if (sellerDay !== today()) {
    $("seller").value = "";
    clearResult();
    notice("Escribe el nombre del vendedor para este nuevo d\xEDa.", true);
    $("seller").focus();
    return false;
  }
  if ($("seller").value.trim().length < 2) {
    notice("El vendedor es obligatorio. Escribe tu nombre.", true);
    $("seller").focus();
    return false;
  }
  return true;
}
$("seller").addEventListener("input", () => {
  sellerDay = today();
  try {
    localStorage.setItem("pitstop-seller", JSON.stringify({ name: $("seller").value.trim(), day: sellerDay }));
  } catch {
  }
  if (lastResult) {
    clearResult();
    notice("Vendedor actualizado. Calcula nuevamente.");
  }
});
for (const id of ["product", "cost", "weight", "quote-phone", "product-url", "product-url-2"]) $(id).addEventListener("input", () => {
  if (lastResult) {
    clearResult();
    notice("Datos actualizados. Calcula nuevamente.");
  }
});
$("quote-phone").addEventListener("blur", () => {
  try {
    $("quote-phone").value = "+" + costaRicaPhone($("quote-phone").value);
  } catch {
  }
});
var copyBusy = false;
$("send-whatsapp").addEventListener("click", async () => {
  if (!lastResult || quoteBusy || saleBusy || copyBusy || !checkSeller()) return;
  let message;
  try {
    message = whatsappQuotation({ ...lastResult, paymentCurrency: $("quote-paid-usd").checked ? "USD" : "CRC" }).message;
  } catch (error) {
    $("whatsapp-status").textContent = error.message;
    return;
  }
  const snapshot = lastResult;
  copyBusy = true;
  $("send-whatsapp").disabled = true;
  $("copy-message").hidden = true;
  try {
    await copyMessage(message);
    if (lastResult === snapshot) $("whatsapp-status").textContent = "Mensaje copiado. Ya puedes pegarlo en WhatsApp.";
  } catch {
    if (lastResult === snapshot) {
      $("copy-message").value = message;
      $("copy-message").hidden = false;
      $("copy-message").focus();
      $("copy-message").select();
      $("whatsapp-status").textContent = "El navegador no permiti\xF3 copiar. Copia el texto seleccionado con Ctrl+C o mant\xE9n presionado y elige Copiar.";
    }
  } finally {
    copyBusy = false;
    $("send-whatsapp").disabled = quoteBusy;
  }
});
$("create-sale").addEventListener("click", () => {
  if (!checkSeller() || !lastResult) return;
  $("sale-form").reset();
  $("sale-paid-usd").checked = $("quote-paid-usd").checked;
  $("customer-phone").value = lastResult.customerPhone || $("quote-phone").value;
  $("sale-error").textContent = "";
  $("sale-summary").textContent = `${lastResult.product} \xB7 ${money(lastResult.totalCents)} \xB7 Vendedor: ${lastResult.seller}`;
  updateSalePayment();
  $("sale-dialog").showModal();
});
$("cancel-sale").addEventListener("click", () => {
  $("sale-dialog").close();
});
$("sale-dialog").addEventListener("cancel", (e) => {
  if (saleBusy) e.preventDefault();
});
$("sale-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (saleBusy || !lastResult || !checkSeller()) return;
  const snapshot = lastResult, customer = { phone: $("customer-phone").value.trim(), name: $("customer-name").value.trim(), address: $("customer-address").value.trim() };
  if (!/^\+?\d{8,15}$/.test(customer.phone.replace(/[\s().-]/g, ""))) {
    $("sale-error").textContent = "Ingresa un tel\xE9fono de 8 a 15 d\xEDgitos, con c\xF3digo de pa\xEDs si corresponde.";
    return;
  }
  saleBusy = true;
  $("sale-fields").disabled = true;
  $("save-sale").textContent = "Guardando\u2026";
  $("sale-error").textContent = "";
  try {
    const receipt = await receiptFile($("payment-receipt").files[0]);
    const { data: saleResult } = await api("createSale")({ paidAmount: $("sale-paid-amount").value.trim(), paymentCurrency: $("sale-paid-usd").checked ? "USD" : "CRC", terms: { arrival: $("image-arrival").value.trim(), warranty: $("image-warranty").value.trim() }, calculationId: snapshot.calculationId, quoteVersion: snapshot.quoteVersion ?? 0, seller: $("seller").value.trim(), sellerDay, customer, receipt });
    $("sale-dialog").close();
    removeSearchQuote(snapshot.calculationId);
    resetCalculation();
    $("sale-form").reset();
    notice("Venta creada. Puedes iniciar un nuevo c\xE1lculo.");
    $("sale-success").showModal();
    lastPaymentDocument = saleResult.paymentDocument ? { ...saleResult.paymentDocument, trackingCode: saleResult.trackingCode } : null;
    $("sale-tracking-code").value = saleResult.trackingCode || "";
    paymentPdfBlob = null;
    $("receipt-pdf-status").textContent = "";
    $("download-receipt-pdf").hidden = !lastPaymentDocument;
    if (lastPaymentDocument) await downloadPaymentPdf();
  } catch (error) {
    $("sale-error").textContent = !error.code || error.code === "functions/invalid-argument" ? error.message : error.code === "functions/already-exists" ? "Este c\xE1lculo ya tiene una venta registrada." : error.code === "functions/failed-precondition" ? "Recupera la cotizaci\xF3n nuevamente: su descuento o estado pudo cambiar." : "No se confirm\xF3 el guardado. Revisa los datos e intenta nuevamente; no se duplicar\xE1 la venta.";
  } finally {
    saleBusy = false;
    $("sale-fields").disabled = false;
    $("save-sale").textContent = "Guardar venta";
  }
});
try {
  $("exchange-rate").value = localStorage.getItem("pitstop-exchange-rate") || "";
} catch {
}
$("exchange-rate").addEventListener("input", () => {
  try {
    localStorage.setItem("pitstop-exchange-rate", $("exchange-rate").value);
  } catch {
  }
  if (lastResult) {
    clearResult();
    notice("Tipo de cambio actualizado. Pulsa Calcular repuesto para actualizar tu cotizaci\xF3n.");
  }
});
$("shipping-origin").addEventListener("change", () => {
  if (lastResult) {
    clearResult();
    notice("Origen actualizado. Pulsa Calcular repuesto para actualizar tu cotizaci\xF3n.");
  }
});
function notice(message, error = false) {
  $("notice").textContent = message;
  $("notice").classList.toggle("error", error);
}
function clearResult() {
  closeImage();
  lastResult = void 0;
  $("sale-status").textContent = "";
  $("create-sale").disabled = false;
  $("result-data").hidden = true;
  $("result-empty").hidden = false;
}
function currencyChanged() {
  if (lastResult) renderResult(lastResult);
}
$("currency").addEventListener("change", currencyChanged);
function renderResult(item) {
  lastResult = item;
  $("copy-message").hidden = true;
  $("copy-message").value = "";
  $("whatsapp-status").textContent = "Copia el texto para pegarlo en WhatsApp.";
  $("discount").value = String(item.discountPercent ?? 0);
  $("result-empty").hidden = true;
  $("result-data").hidden = false;
  const crc = $("currency").value === "CRC", valid = !!item.exchangeRateCents, rate = item.exchangeRateCents;
  const discount = item.discountPercent ?? 0;
  $("discount-summary").hidden = !discount;
  $("discount-summary").textContent = discount ? `Antes: ${money(crc ? item.crcRoundingUnit === 1e3 ? Math.ceil(item.totalBeforeDiscountCents * rate / 1e7) * 1e5 : Math.round(item.totalBeforeDiscountCents * rate / 100) : item.totalBeforeDiscountCents, crc ? "CRC" : "USD")} \xB7 Descuento aplicado: ${discount}%` : "";
  $("total").textContent = crc ? valid ? money(item.totalCrcMinor, "CRC") : "\u2014" : money(item.totalCents);
  $("total-caption").textContent = crc ? valid ? item.crcRoundingUnit === 1e3 ? "Colones \xB7 Redondeado hacia arriba a \u20A11.000" : "Colones costarricenses \xB7 CRC" : "Conversi\xF3n no disponible. Selecciona d\xF3lares o intenta de nuevo en unos momentos." : "D\xF3lares estadounidenses \xB7 USD";
  $("conversion").hidden = !crc || !valid;
  if (crc && valid) {
    $("converted-total").textContent = `Total en d\xF3lares: ${money(item.totalCents)}`;
    $("used-rate").textContent = `US$ 1 = ${money(rate, "CRC")} \xB7 Tipo de cambio ingresado`;
  }
  $("result-origin").textContent = item.shippingOrigin === "COLOMBIA" ? "Colombia" : "USA";
  $("result-product").textContent = item.product;
  $("result-cost").textContent = money(item.costCents);
  $("result-weight").textContent = `${item.weightGrams / 1e3} kg`;
}
function resetCalculation() {
  $("quote-paid-usd").checked = false;
  $("quote-phone").value = "";
  $("product-url").value = "";
  $("product-url-2").value = "";
  $("second-product-link").hidden = true;
  $("add-product-link").hidden = false;
  $("add-product-link").setAttribute("aria-expanded", "false");
  $("product").value = "";
  $("cost").value = "";
  $("weight").value = "";
  requestId = void 0;
  pendingPayload = void 0;
  clearResult();
}
$("discount").addEventListener("change", async () => {
  if (!lastResult || quoteBusy || saleBusy) return;
  if (!checkSeller()) return;
  const snapshot = lastResult, discountPercent = Number($("discount").value);
  quoteBusy = true;
  for (const id of ["discount", "seller", "fields", "exchange-rate", "new", "create-sale", "send-whatsapp", "quotation-image"]) $(id).disabled = true;
  renderSearch();
  notice("Aplicando descuento\u2026");
  try {
    const { data } = await api("setQuoteDiscount")({ calculationId: snapshot.calculationId, customerPhone: snapshot.customerPhone, quoteVersion: snapshot.quoteVersion ?? 0, discountPercent, seller: $("seller").value.trim(), sellerDay });
    renderResult(data);
    searchRows = searchRows.map((row) => row.calculationId === data.calculationId ? { ...row, ...data } : row);
    notice(discountPercent ? `Descuento del ${discountPercent}% aplicado.` : "Cotizaci\xF3n sin descuento.");
  } catch (error) {
    clearResult();
    notice(error.code === "functions/failed-precondition" ? "Esta cotizaci\xF3n ya tiene una venta." : error.code === "functions/aborted" ? "La cotizaci\xF3n cambi\xF3. B\xFAscala y recup\xE9rala nuevamente." : "No se confirm\xF3 el descuento. Busca y recupera la cotizaci\xF3n antes de continuar.", true);
  } finally {
    quoteBusy = false;
    for (const id of ["discount", "seller", "fields", "exchange-rate", "new", "create-sale", "send-whatsapp", "quotation-image"]) $(id).disabled = false;
    renderSearch();
  }
});
$("new").addEventListener("click", () => {
  resetCalculation();
  notice("Ingresa los datos del siguiente repuesto.");
  $("product").focus();
});
$("sale-success-ok").addEventListener("click", () => {
  $("sale-success").close();
  $("product").focus();
});
$("calculator-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (quoteBusy || !checkSeller()) return;
  const clean = (id) => $(id).value.trim().replace(",", ".");
  const product = $("product").value.trim(), cost = clean("cost"), weight = clean("weight"), exchangeRate = clean("exchange-rate"), shippingOrigin = $("shipping-origin").value;
  if (!/^\+?\d{8,15}$/.test($("quote-phone").value.trim().replace(/[\s().-]/g, ""))) {
    notice("Ingresa el tel\xE9fono completo del cliente, de 8 a 15 d\xEDgitos.", true);
    $("quote-phone").focus();
    return;
  }
  try {
    const url = new URL($("product-url").value.trim());
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error();
  } catch {
    notice("Ingresa un enlace v\xE1lido del repuesto que comience con https:// o http://.", true);
    $("product-url").focus();
    return;
  }
  if (product.length < 3 || !/^\d{1,9}(\.\d{1,2})?$/.test(cost) || Number(cost) <= 0 || !/^\d{1,4}(\.\d{1,3})?$/.test(weight) || Number(weight) <= 0 || Number(weight) > 1e3) {
    notice("Revisa el nombre (m\xEDnimo 3 caracteres), el costo positivo (2 decimales) y el peso (hasta 1.000 kg, con 3 decimales).", true);
    return;
  }
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(exchangeRate) || Number(exchangeRate) < 1 || Number(exchangeRate) > 1e4) {
    notice("Ingresa un tipo de cambio entre \u20A11 y \u20A110.000 por d\xF3lar, con hasta 2 decimales.", true);
    $("exchange-rate").focus();
    return;
  }
  for (const id of ["product-url-2"]) {
    const value = $(id).value.trim();
    if (value) {
      try {
        const url = new URL(value);
        if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error();
      } catch {
        notice("Revisa el segundo enlace o deja la casilla vac\xEDa.", true);
        $(id).focus();
        return;
      }
    }
  }
  const payload = JSON.stringify({ productUrl2: $("product-url-2").value.trim(), customerPhone: $("quote-phone").value.trim(), productUrl: $("product-url").value.trim(), product, cost, weight, currency: "USD", exchangeRate, shippingOrigin, seller: $("seller").value.trim(), sellerDay });
  if (payload !== pendingPayload) {
    requestId = crypto.randomUUID();
    pendingPayload = payload;
  }
  $("seller").disabled = true;
  $("fields").disabled = true;
  $("exchange-rate").disabled = true;
  $("new").disabled = true;
  quoteBusy = true;
  renderSearch();
  $("calculate").textContent = "Calculando\u2026";
  clearResult();
  try {
    const { data } = await api("calculate")({ ...JSON.parse(payload), requestId });
    renderResult(data);
    notice("Tu cotizaci\xF3n est\xE1 lista.");
    requestId = void 0;
    pendingPayload = void 0;
  } catch (error) {
    const messages = { "functions/resource-exhausted": "Espera unos segundos antes de realizar otro c\xE1lculo.", "functions/invalid-argument": "Revisa el costo en d\xF3lares y el peso. El costo debe ser de al menos US$ 0,01 y no superar US$ 999.999,99.", "functions/unauthenticated": "No se pudo validar la sesi\xF3n. Recarga la p\xE1gina." };
    notice(messages[error.code] || "No se pudo completar el c\xE1lculo. Revisa tu conexi\xF3n e intenta de nuevo.", true);
  } finally {
    quoteBusy = false;
    renderSearch();
    $("seller").disabled = false;
    $("fields").disabled = false;
    $("exchange-rate").disabled = false;
    $("new").disabled = false;
    $("calculate").innerHTML = 'Calcular repuesto <span aria-hidden="true">\u2197</span>';
  }
});
async function start() {
  if (!firebaseConfig.apiKey || !firebaseConfig.appId || !appCheckSiteKey) {
    notice("La calculadora est\xE1 pendiente de activaci\xF3n.");
    return;
  }
  try {
    const base = "https://www.gstatic.com/firebasejs/12.19.0/";
    const [app, authentication, functions, check] = await Promise.all([import(base + "firebase-app.js"), import(base + "firebase-auth.js"), import(base + "firebase-functions.js"), import(base + "firebase-app-check.js")]);
    const firebase = app.initializeApp(firebaseConfig);
    check.initializeAppCheck(firebase, { provider: new check.ReCaptchaEnterpriseProvider(appCheckSiteKey), isTokenAutoRefreshEnabled: true });
    const auth = authentication.getAuth(firebase);
    await authentication.setPersistence(auth, authentication.browserSessionPersistence);
    await authentication.signInAnonymously(auth);
    const backend = functions.getFunctions(firebase, region);
    api = (name) => functions.httpsCallable(backend, name);
    $("fields").disabled = false;
    $("calculate").disabled = false;
    $("search-button").disabled = false;
    $("sales-search-button").disabled = false;
    notice("");
  } catch {
    notice("No se pudo conectar la calculadora. Revisa tu conexi\xF3n o int\xE9ntalo m\xE1s tarde.", true);
  }
}
var searchRows = [];
var searchCursor = null;
var searchPhone = "";
var searchBusy = false;
var quoteBusy = false;
function removeSearchQuote(id) {
  searchRows = searchRows.filter((row) => row.calculationId !== id);
  renderSearch();
}
function renderSearch() {
  const target = $("quote-results");
  target.replaceChildren();
  for (const item of searchRows) {
    const card = document.createElement("article"), title = document.createElement("h3"), info = document.createElement("p"), button = document.createElement("button");
    card.className = "quote-card";
    title.textContent = item.product;
    info.textContent = `+${item.customerPhone} \xB7 ${new Intl.DateTimeFormat("es-CR", { timeZone: "America/Costa_Rica", dateStyle: "short", timeStyle: "short" }).format(new Date(item.createdAt))}`;
    button.type = "button";
    button.textContent = "Recuperar cotizaci\xF3n";
    button.className = "button";
    button.disabled = quoteBusy || saleBusy;
    button.addEventListener("click", () => {
      if (!checkSeller() || quoteBusy || saleBusy) return;
      $("quote-paid-usd").checked = item.customerTerms?.currency === "USD";
      if (item.customerTerms) {
        $("image-arrival").value = item.customerTerms.arrival;
        $("image-warranty").value = item.customerTerms.warranty;
      }
      $("product").value = item.product;
      $("quote-phone").value = "+" + item.customerPhone;
      $("product-url").value = item.productUrl;
      $("product-url-2").value = item.productUrl2 || "";
      $("second-product-link").hidden = !item.productUrl2;
      $("add-product-link").hidden = !!item.productUrl2;
      $("add-product-link").setAttribute("aria-expanded", String(!!item.productUrl2));
      $("cost").value = (item.costCents / 100).toFixed(2);
      $("weight").value = String(item.weightGrams / 1e3);
      $("shipping-origin").value = item.shippingOrigin;
      $("exchange-rate").value = (item.exchangeRateCents / 100).toFixed(2);
      try {
        localStorage.setItem("pitstop-exchange-rate", $("exchange-rate").value);
      } catch {
      }
      requestId = void 0;
      pendingPayload = void 0;
      renderResult({ ...item, seller: $("seller").value.trim() });
      notice("Cotizaci\xF3n recuperada con su precio y tipo de cambio originales. Ya puedes crear la venta.");
      $("calculator-title").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    card.append(title, info, button);
    target.append(card);
  }
  $("search-more").hidden = !searchCursor;
}
async function searchQuotes(reset = true) {
  if (searchBusy || !api || !checkSeller()) return;
  searchBusy = true;
  $("search-button").disabled = true;
  $("search-more").disabled = true;
  if (reset) {
    searchPhone = $("search-phone").value.trim();
    searchRows = [];
    searchCursor = null;
    renderSearch();
  }
  $("search-state").textContent = "Buscando cotizaciones\u2026";
  try {
    const { data } = await api("searchQuotes")({ phone: searchPhone, seller: $("seller").value.trim(), sellerDay, cursor: reset ? null : searchCursor });
    searchRows = reset ? data.rows : [...searchRows, ...data.rows];
    searchCursor = data.next;
    renderSearch();
    $("search-state").textContent = searchRows.length ? `${searchRows.length} cotizaciones disponibles.` : "No hay cotizaciones sin venta para este tel\xE9fono.";
  } catch (error) {
    $("search-state").textContent = error.code === "functions/invalid-argument" ? "Ingresa el tel\xE9fono completo, de 8 a 15 d\xEDgitos." : error.code === "functions/resource-exhausted" ? "Espera unos segundos antes de buscar otra vez." : "No se pudo completar la b\xFAsqueda. Intenta nuevamente.";
  } finally {
    searchBusy = false;
    $("search-button").disabled = false;
    $("search-more").disabled = false;
  }
}
$("quote-search-form").addEventListener("submit", (e) => {
  e.preventDefault();
  searchQuotes();
});
$("search-more").addEventListener("click", () => searchQuotes(false));
currencyChanged();
start();
var imageBlob = null;
var imageUrl = null;
function closeImage() {
  if ($("image-dialog").open) $("image-dialog").close();
  if (imageUrl) URL.revokeObjectURL(imageUrl);
  imageUrl = null;
  imageBlob = null;
  $("image-preview").removeAttribute("src");
  $("download-image").removeAttribute("href");
}
$("close-image").addEventListener("click", closeImage);
$("quotation-image").addEventListener("click", async () => {
  if (!lastResult || quoteBusy || saleBusy || !checkSeller()) return;
  const terms = { arrival: $("image-arrival").value.trim(), warranty: $("image-warranty").value.trim() };
  if (!terms.arrival || !terms.warranty) {
    $("image-status").textContent = "Completa la llegada estimada y la garant\xEDa.";
    return;
  }
  const snapshot = lastResult;
  quoteBusy = true;
  const locked = ["quote-paid-usd", "image-arrival", "image-warranty", "quotation-image", "discount", "seller", "fields", "exchange-rate", "new", "create-sale", "send-whatsapp"];
  for (const id of locked) $(id).disabled = true;
  renderSearch();
  $("image-status").textContent = "Preparando cotizaci\xF3n\u2026";
  try {
    const { data } = await api("issueCustomerQuotation")({ paymentCurrency: $("quote-paid-usd").checked ? "USD" : "CRC", terms, calculationId: snapshot.calculationId, customerPhone: snapshot.customerPhone, quoteVersion: snapshot.quoteVersion ?? 0, seller: $("seller").value.trim(), sellerDay });
    const blob = await quotationImage(data);
    if (lastResult !== snapshot) return;
    closeImage();
    imageBlob = blob;
    imageUrl = URL.createObjectURL(blob);
    $("image-preview").src = imageUrl;
    $("download-image").href = imageUrl;
    $("download-image").download = "PitStop-" + data.number + ".png";
    $("image-copy-status").textContent = "";
    $("image-dialog").showModal();
    $("image-status").textContent = "Cotizaci\xF3n lista: " + data.number;
  } catch (error) {
    $("image-status").textContent = error.code === "functions/failed-precondition" ? "La cotizaci\xF3n cambi\xF3. Recup\xE9rala nuevamente." : "No se pudo preparar la imagen. Revisa tu conexi\xF3n e intenta nuevamente.";
  } finally {
    quoteBusy = false;
    for (const id of locked) $(id).disabled = false;
    renderSearch();
  }
});
$("copy-image").addEventListener("click", async () => {
  if (!imageBlob) return;
  $("copy-image").disabled = true;
  try {
    if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") throw new Error();
    await navigator.clipboard.write([new ClipboardItem({ "image/png": imageBlob })]);
    $("image-copy-status").textContent = "Imagen copiada. Abre el chat de WhatsApp y pega con Ctrl+V o Pegar.";
  } catch {
    $("image-copy-status").textContent = "Este navegador no permiti\xF3 copiar la imagen. Puedes descargar el PNG y adjuntarlo en WhatsApp.";
  } finally {
    $("copy-image").disabled = false;
  }
});
var lastPaymentDocument = null;
var paymentPdfBlob = null;
var paymentPdfBusy = false;
async function downloadPaymentPdf() {
  if (!lastPaymentDocument || paymentPdfBusy) return;
  paymentPdfBusy = true;
  $("download-receipt-pdf").disabled = true;
  $("receipt-pdf-status").textContent = "Preparando comprobante PDF\u2026";
  try {
    paymentPdfBlob ??= await paymentPdf(lastPaymentDocument);
    const url = URL.createObjectURL(paymentPdfBlob), link = document.createElement("a");
    link.href = url;
    link.download = "PitStop-" + lastPaymentDocument.number + ".pdf";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 6e4);
    $("receipt-pdf-status").textContent = "Comprobante listo. Si no comenz\xF3 la descarga, pulsa Descargar comprobante PDF.";
  } catch {
    $("receipt-pdf-status").textContent = "La venta se guard\xF3. No se pudo generar el PDF; pulsa Descargar comprobante PDF para reintentar.";
  } finally {
    paymentPdfBusy = false;
    $("download-receipt-pdf").disabled = false;
  }
}
$("download-receipt-pdf").addEventListener("click", downloadPaymentPdf);
initSalesSearch({ call: (name, payload) => api(name)(payload), checkSeller, context: () => ({ seller: $("seller").value.trim(), sellerDay }) });
$("copy-sale-code").addEventListener("click", async () => {
  try {
    await copyMessage($("sale-tracking-code").value);
    $("sale-code-status").textContent = "C\xF3digo copiado para el cliente.";
  } catch {
    $("sale-tracking-code").focus();
    $("sale-tracking-code").select();
    $("sale-code-status").textContent = "Selecciona y copia el c\xF3digo.";
  }
});
$("add-product-link").addEventListener("click", () => {
  $("second-product-link").hidden = false;
  $("add-product-link").hidden = true;
  $("add-product-link").setAttribute("aria-expanded", "true");
  $("product-url-2").focus();
});
$("remove-product-link").addEventListener("click", () => {
  const hadValue = !!$("product-url-2").value;
  $("product-url-2").value = "";
  $("second-product-link").hidden = true;
  $("add-product-link").hidden = false;
  $("add-product-link").setAttribute("aria-expanded", "false");
  if (hadValue && lastResult) {
    clearResult();
    notice("Enlace actualizado. Calcula nuevamente.");
  }
  $("add-product-link").focus();
});
var openMultiple = initMultipleSale({ call: (name, data) => api(name)(data), context: () => ({ seller: $("seller").value.trim(), sellerDay }), check: () => {
  if (!api) {
    notice("Espera a que conecte la calculadora.", true);
    return false;
  }
  return checkSeller();
}, onSaved: () => {
  searchRows = [];
  renderSearch();
  resetCalculation();
} });
$("open-multiple-sale").addEventListener("click", () => openMultiple());
$("quote-paid-usd").addEventListener("change", () => {
  closeImage();
  $("copy-message").hidden = true;
  $("whatsapp-status").textContent = $("quote-paid-usd").checked ? "Cotizaci\xF3n en d\xF3lares \xB7 USD" : "Cotizaci\xF3n en colones \xB7 CRC";
});
function updateSalePayment() {
  if (!lastResult) return;
  const usd = $("sale-paid-usd").checked, currency = usd ? "USD" : "CRC", total = usd ? lastResult.totalCents : lastResult.totalCrcMinor;
  const raw = $("sale-paid-amount").value.trim().replace(",", "."), paid = raw ? Math.round(Number(raw) * 100) : usd ? Math.round(total / 5) : Math.min(total, Math.ceil(total / 5e5) * 1e5);
  const valid = (!raw || /^\d{1,12}(?:\.\d{1,2})?$/.test(raw)) && Number.isSafeInteger(paid) && paid >= 0 && paid <= total;
  $("sale-paid-amount").setCustomValidity(valid ? "" : "El abono debe estar entre cero y el total, con hasta dos decimales.");
  $("sale-paid-hint").textContent = "Total pagado por el cliente en " + currency + ". Sin separadores de miles. En blanco se usa el 20% habitual.";
  $("sale-payment-preview").textContent = valid ? `Total: ${money(total, currency)} \xB7 Abonado: ${money(paid, currency)} \xB7 Pendiente: ${money(total - paid, currency)}` : "Revisa el monto abonado.";
}
$("sale-paid-amount").addEventListener("input", updateSalePayment);
$("sale-paid-usd").addEventListener("change", () => {
  $("sale-paid-amount").value = "";
  updateSalePayment();
});
var themeButton = $("theme-toggle");
function showTheme() {
  const dark = document.documentElement.dataset.theme === "dark";
  themeButton.textContent = dark ? "\u2600 Modo claro" : "\u263E Modo oscuro";
  themeButton.setAttribute("aria-pressed", String(dark));
}
themeButton.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem("pitstop-theme", next);
  } catch {
  }
  showTheme();
});
showTheme();
