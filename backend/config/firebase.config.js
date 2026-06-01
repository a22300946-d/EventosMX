const admin = require('firebase-admin');
require('dotenv').config();

const rawKey = process.env.FIREBASE_PRIVATE_KEY;

// LOG TEMPORAL - borrar después de confirmar
console.log('🔑 FIREBASE_PRIVATE_KEY primeros 60 chars:', rawKey?.substring(0, 60));
console.log('🔑 Contiene \\\\n literal:', rawKey?.includes('\\n'));
console.log('🔑 Contiene salto real:', rawKey?.includes('\n'));

const privateKey = rawKey?.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: privateKey,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  })
});

console.log('✅ Firebase Admin inicializado');
module.exports = admin;