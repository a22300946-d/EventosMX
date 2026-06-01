const admin = require('firebase-admin');
require('dotenv').config();

const rawKey = process.env.FIREBASE_PRIVATE_KEY;

const privateKey = rawKey
  ?.replace(/^"|"$/g, '')  // elimina comillas al inicio y al final
  ?.replace(/\\n/g, '\n'); // convierte \n literales en saltos reales

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: privateKey,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  })
});

console.log('✅ Firebase Admin inicializado');
module.exports = admin;