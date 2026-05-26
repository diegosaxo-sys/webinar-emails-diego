const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const supabase = createClient(
  'https://zpumfpjxkahxffkixjsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwdW1mcGp4a2FoeGZma2l4anNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MDMzNzgsImV4cCI6MjA5MjI3OTM3OH0.ykmBkcfiAf2HJorylZsnFVn2h_nI8HCSbQyTxjLVdf0'
);

const resend = new Resend('re_JCRR8Vsy_KHCgga19BeV8nG7LWmspwYqn');

const ZOOM_LINK = 'https://us06web.zoom.us/j/88920748454?pwd=Yxe3KpgUe6chg3Vkaqpj1MWEm3Vb3A.1';
const WEBINAR_DATE = new Date('2026-06-08T20:00:00+02:00');
const FROM_EMAIL = 'onboarding@resend.dev'; // Temporal hasta verificar dominio

function emailConfirmacion(nombre) {
  return {
    subject: '✅ Tu plaza está reservada — Artista de Alto Valor',
    html: `
      <div style="font-family: Georgia, serif; max-width: 580px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: #0a0908; padding: 32px; text-align: center;">
          <p style="color: #c9a84c; letter-spacing: 0.2em; font-size: 12px; text-transform: uppercase; margin: 0;">Diego Caride</p>
          <h1 style="color: #f5f0e8; font-size: 28px; font-weight: 300; margin: 12px 0 0;">Artista de Alto Valor</h1>
        </div>
        <div style="padding: 40px 32px;">
          <p style="font-size: 18px;">Hola ${nombre},</p>
          <p style="line-height: 1.7; color: #333;">Tu plaza está reservada para el webinar del <strong>lunes 8 de junio a las 20:00h (hora española)</strong>.</p>
          <p style="line-height: 1.7; color: #333;">En 60 minutos vamos a ver cómo multiplicar tus tarifas, poner tus condiciones y automatizar tu negocio con IA.</p>
          <div style="background: #f9f6f0; border-left: 3px solid #c9a84c; padding: 24px 28px; margin: 32px 0;">
            <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: #c9a84c;">Tu enlace al webinar</p>
            <a href="${ZOOM_LINK}" style="color: #0a0908; font-size: 16px; word-break: break-all;">${ZOOM_LINK}</a>
            <p style="margin: 16px 0 0; font-size: 13px; color: #666;">Guarda este enlace. Te mando recordatorio 24h antes y 2h antes.</p>
          </div>
          <p style="line-height: 1.7; color: #333;">Nos vemos el 8 de junio,</p>
          <p style="color: #c9a84c; font-size: 16px;">Diego Caride</p>
          <p style="font-size: 12px; color: #999;">@diegocaridemusic</p>
        </div>
      </div>
    `
  };
}

function emailRecordatorio(nombre, horasAntes) {
  const es24h = horasAntes === 24;
  return {
    subject: es24h ? '⏰ Mañana es el webinar — Artista de Alto Valor' : '🔴 En 2 horas empieza — Artista de Alto Valor',
    html: `
      <div style="font-family: Georgia, serif; max-width: 580px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: #0a0908; padding: 32px; text-align: center;">
          <p style="color: #c9a84c; letter-spacing: 0.2em; font-size: 12px; text-transform: uppercase; margin: 0;">Diego Caride</p>
          <h1 style="color: #f5f0e8; font-size: 28px; font-weight: 300; margin: 12px 0 0;">Artista de Alto Valor</h1>
        </div>
        <div style="padding: 40px 32px;">
          <p style="font-size: 18px;">Hola ${nombre},</p>
          <p style="line-height: 1.7; color: #333;">
            ${es24h ? 'Mañana lunes 8 de junio a las 20:00h (hora española) es el webinar. Aquí tienes el enlace.' : 'En 2 horas empieza. Aquí tienes el enlace directo.'}
          </p>
          <div style="background: #f9f6f0; border-left: 3px solid #c9a84c; padding: 24px 28px; margin: 32px 0;">
            <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: #c9a84c;">Entrar al webinar</p>
            <a href="${ZOOM_LINK}" style="color: #0a0908; font-size: 16px; word-break: break-all;">${ZOOM_LINK}</a>
          </div>
          <p style="line-height: 1.7; color: #333;">Nos vemos dentro.</p>
          <p style="color: #c9a84c; font-size: 16px;">Diego</p>
        </div>
      </div>
    `
  };
}

async function enviarConfirmacion(nombre, email) {
  const { subject, html } = emailConfirmacion(nombre);
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject,
    html
  });
  if (error) throw new Error(JSON.stringify(error));
  console.log(`✅ Confirmación enviada a ${email}`);
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
      const { subject, html } = emailRecordatorio(r.nombre, 24);
      await resend.emails.send({ from: FROM_EMAIL, to: r.email, subject, html });
      await supabase.from('webinar_registros').update({ recordatorio_24h: true }).eq('email', r.email);
      console.log(`⏰ Recordatorio 24h → ${r.email}`);
    }
    if (es2h && !r.recordatorio_2h) {
      const { subject, html } = emailRecordatorio(r.nombre, 2);
      await resend.emails.send({ from: FROM_EMAIL, to: r.email, subject, html });
      await supabase.from('webinar_registros').update({ recordatorio_2h: true }).eq('email', r.email);
      console.log(`🔴 Recordatorio 2h → ${r.email}`);
    }
  }
}

const http = require('http');
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  if (req.method === 'POST' && req.url === '/confirmar') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { nombre, email } = JSON.parse(body);
        await enviarConfirmacion(nombre, email);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        console.error('Error email:', e.message);
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200);
    res.end('Servidor webinar OK');
    return;
  }

  res.writeHead(404);
  res.end();
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Servidor emails en puerto ${PORT}`));
setInterval(enviarRecordatorios, 30 * 60 * 1000);
