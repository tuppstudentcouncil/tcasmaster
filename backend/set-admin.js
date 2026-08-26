import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
dotenv.config({ path: path.join(currentDir, ".env") });
dotenv.config({ path: path.join(currentDir, "..", ".env") });

const adminEmail = String(process.argv[2] || "").trim().toLowerCase();
const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");


if (!adminEmail) {
  throw new Error("กรุณาระบุอีเมล เช่น node .\\set-admin.js user@gmail.com");
}

if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
  throw new Error("ไม่พบ Firebase Admin credentials ใน backend/.env");
}

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey,
  }),
});

const auth = getAuth();
let user;

try {
  user = await auth.getUserByEmail(adminEmail);
} catch (error) {
  if (error.code === "auth/user-not-found") {
    throw new Error("ไม่พบบัญชีนี้ใน Firebase Authentication ให้บัญชีล็อกอิน Google ในเว็บก่อน แล้วลองใหม่");
  }
  throw error;
}

await auth.setCustomUserClaims(user.uid, {
  ...(user.customClaims || {}),
  admin: true,
});

console.log(`ตั้ง ${adminEmail} เป็น Admin สำเร็จ`);
