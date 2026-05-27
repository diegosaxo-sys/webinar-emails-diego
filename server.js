const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zpumfpjxkahxffkixjsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwdW1mcGp4a2FoeGZma2l4anNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MDMzNzgsImV4cCI6MjA5MjI3OTM3OH0.ykmBkcfiAf2HJorylZsnFVn2h_nI8HCSbQyTxjLVdf0'
);

const MAKE_WEBHOOK = 'https://hook.eu1.make.com/vnl8egluhddx86e908sw4bdwta3zff2s';
const WEBINAR_DATE = new Date('2026-06-08T20:00:00+02:00');

async function notificarMake(payload) {
  const res = await fetch(MAKE_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Make error: ${res.status}`);
  console.log(`✅ Make notificado: ${payload.tipo} → ${payload.email}`);
}

async function enviarRecordatorios() {
  const ahora = new Date();
  const horasHasta = (WEBINAR_DATE - ahora) / (1000 * 60 * 60);
  const es24h = horasHasta <= 24 && horasHasta > 23;
  const es2h = horasHasta <= 2 && horasHasta > 1;
  if (!es24h && !es2h) return;

  const { data: registros } = await supabase
    .from('webinar_registros')
    .select('nombre, email, recordatorio_24h, recordatorio_2h');

  for (const r of registros || []) {
    if (es24h && !r.recordatorio_24h) {
      await notificarMake({ tipo: 'recordatorio_24h', nombre: r.nombre, email: r.email });
      await supabase.from('webinar_registros').update({ recordatorio_24h: true }).eq('email', r.email);
    }
    if (es2h && !r.recordatorio_2h) {
      await notificarMake({ tipo: 'recordatorio_2h', nombre: r.nombre, email: r.email });
      await supabase.from('webinar_registros').update({ recordatorio_2h: true }).eq('email', r.email);
    }
  }
}

const http = require('http');
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200); res.end('Servidor webinar OK'); return;
  }

  if (req.method === 'POST' && req.url === '/confirmar') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { nombre, email, disciplina } = JSON.parse(body);
        await notificarMake({ tipo: 'confirmacion', nombre, email, disciplina });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        console.error('Error:', e.message);
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404); res.end();
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Servidor emails en puerto ${PORT}`));
setInterval(enviarRecordatorios, 30 * 60 * 1000);
