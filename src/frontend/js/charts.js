/* =========================================================
   CHARTS — canvas-based line and bar chart helpers
   ========================================================= */

function css(v) {
  return getComputedStyle(document.documentElement).getPropertyValue(v).trim();
}

function drawLine(ctx, data, labels) {
  const dpr = window.devicePixelRatio || 1;
  const W = ctx.canvas.clientWidth;
  if (!W) return;
  ctx.canvas.width  = W * dpr;
  ctx.canvas.height = 160 * dpr;
  ctx.scale(dpr, dpr);

  const w = W, h = 160, pad = 38, bot = 22;
  ctx.clearRect(0, 0, w, h);

  const lineC = css('--line') || '#e2cfa4';
  const ink   = css('--ink')  || '#1c1207';
  const acc   = css('--saffron') || '#e07020';
  const mut   = css('--muted') || '#7a6348';

  /* grid lines */
  ctx.strokeStyle = lineC; ctx.lineWidth = 1;
  [0, 25, 50, 75, 100].forEach(v => {
    const y = pad + (h - pad - bot) * (1 - v / 100);
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - 10, y); ctx.stroke();
    ctx.fillStyle = mut; ctx.font = '10px Hind'; ctx.textAlign = 'right';
    ctx.fillText(v, pad - 4, y + 4);
  });

  const sx = (w - pad - 14) / (data.length - 1);

  /* area fill */
  ctx.beginPath();
  data.forEach((v, i) => {
    const x = pad + sx * i, y = pad + (h - pad - bot) * (1 - v / 100);
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  });
  ctx.lineTo(pad + sx * (data.length - 1), h - bot);
  ctx.lineTo(pad, h - bot);
  ctx.closePath();
  ctx.fillStyle = 'rgba(224,112,32,0.10)'; ctx.fill();

  /* line */
  ctx.beginPath();
  data.forEach((v, i) => {
    const x = pad + sx * i, y = pad + (h - pad - bot) * (1 - v / 100);
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  });
  ctx.strokeStyle = acc; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();

  /* dots + value labels */
  data.forEach((v, i) => {
    const x = pad + sx * i, y = pad + (h - pad - bot) * (1 - v / 100);
    ctx.beginPath(); ctx.arc(x, y, 4, 0, 7);
    ctx.fillStyle = acc; ctx.fill();
    ctx.fillStyle = ink; ctx.font = 'bold 11px Hind'; ctx.textAlign = 'center';
    ctx.fillText(v, x, y - 10);
    ctx.fillStyle = mut; ctx.font = '10px Hind';
    ctx.fillText(labels[i], x, h - 6);
  });

  ctx.textAlign = 'left';
}

function drawBar(ctx, labels, series) {
  const dpr = window.devicePixelRatio || 1;
  const W = ctx.canvas.clientWidth;
  if (!W) return;
  ctx.canvas.width  = W * dpr;
  ctx.canvas.height = 180 * dpr;
  ctx.scale(dpr, dpr);

  const w = W, h = 180, pad = 38, bot = 24;
  ctx.clearRect(0, 0, w, h);

  const lineC = css('--line') || '#e2cfa4';
  const ink   = css('--ink')  || '#1c1207';
  const mut   = css('--muted') || '#7a6348';

  /* grid lines */
  ctx.strokeStyle = lineC; ctx.lineWidth = 1;
  [0, 25, 50, 75, 100].forEach(v => {
    const y = pad + (h - pad - bot) * (1 - v / 100);
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - 6, y); ctx.stroke();
  });

  const gw = (w - pad - 10) / labels.length;
  const bw = gw / (series.length + 1.5);

  labels.forEach((lab, gi) => {
    series.forEach((s, si) => {
      const v  = s.data[gi];
      const bh = (h - pad - bot) * (v / 100);
      const x  = pad + gi * gw + si * bw + 6;
      const y  = pad + (h - pad - bot) - bh;
      ctx.fillStyle = s.color;
      ctx.fillRect(x, y, bw - 3, bh);
    });
    ctx.fillStyle = ink; ctx.font = '10px Hind'; ctx.textAlign = 'center';
    ctx.fillText(lab, pad + gi * gw + gw / 2 - bw / 2, h - 8);
  });

  /* legend */
  ctx.textAlign = 'left'; let lx = pad;
  series.forEach(s => {
    ctx.fillStyle = s.color; ctx.fillRect(lx, 6, 10, 10);
    ctx.fillStyle = mut; ctx.font = '9px Hind';
    ctx.fillText(s.label, lx + 13, 15);
    lx += ctx.measureText(s.label).width + 28;
  });
}
