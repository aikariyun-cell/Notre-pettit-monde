// api/livekit-token.js
// Emite tokens de acceso de LiveKit para las llamadas de audio/video de "Notre petit monde".
// El API Secret NUNCA se envía al navegador: este endpoint corre en el servidor de Vercel,
// firma el token con HMAC-SHA256 (formato JWT que espera LiveKit) y solo devuelve el token
// ya firmado + la URL pública del servidor LiveKit.
//
// Variables de entorno requeridas en Vercel (Project Settings → Environment Variables):
//   LIVEKIT_URL         wss://lingua-rgkmy7ud.livekit.cloud
//   LIVEKIT_API_KEY     APIPQUsdDMF5qxG
//   LIVEKIT_API_SECRET  DYbygWA3kippus0196DfcXooBveKoTmPpkPD7ufm0WrA
//
// No dependencias externas (usa solo el módulo "crypto" de Node) para que funcione
// también en despliegues simples de Vercel sin paso de build/npm install.

const crypto = require('crypto');

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function firmarToken({ apiKey, apiSecret, identity, room, name, ttlSeconds }) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const ahora = Math.floor(Date.now() / 1000);
  const payload = {
    iss: apiKey,
    sub: identity,
    nbf: ahora - 10,
    exp: ahora + ttlSeconds,
    jti: `${identity}-${ahora}`,
    name: name || identity,
    video: {
      room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    },
  };
  const encHeader = base64url(JSON.stringify(header));
  const encPayload = base64url(JSON.stringify(payload));
  const aFirmar = `${encHeader}.${encPayload}`;
  const firma = crypto
    .createHmac('sha256', apiSecret)
    .update(aFirmar)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${aFirmar}.${firma}`;
}

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL || null;

    if (!apiKey || !apiSecret) {
      res.status(500).json({
        error:
          'Faltan las variables de entorno LIVEKIT_API_KEY / LIVEKIT_API_SECRET en Vercel.',
      });
      return;
    }

    const datos = req.method === 'GET' ? req.query : req.body || {};
    const room = datos.room;
    const identity = datos.identity;
    const name = datos.name;

    if (!room || !identity) {
      res.status(400).json({ error: 'Faltan los parámetros "room" e "identity".' });
      return;
    }

    const token = firmarToken({
      apiKey,
      apiSecret,
      identity: String(identity),
      room: String(room),
      name: name ? String(name) : undefined,
      ttlSeconds: 60 * 60 * 6, // 6 horas
    });

    res.status(200).json({ token, url: livekitUrl });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Error generando el token' });
  }
};
