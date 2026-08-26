# Firebase setup สำหรับ Blue Penguin

## 1. ใส่ Firebase Web config

เปิดไฟล์ `firebase-config.js` แล้วแทนค่าที่ขึ้นต้นด้วย `PASTE_` ด้วยค่าจาก Firebase Console > Project settings > Your apps > Web app

ไฟล์นี้ใช้กับหน้าเว็บโดยตรง จึงไม่มี private key อยู่ในไฟล์นี้

## 2. เปิด Google Login

ไปที่ Firebase Console > Authentication > Sign-in method > Google > Enable

เพิ่มโดเมนที่ใช้ทดสอบใน Authentication > Settings > Authorized domains เช่น

```text
localhost
127.0.0.1
```

## 3. ใส่ Backend credentials

เปิดไฟล์ `backend/.env` แล้วแทนค่าเหล่านี้ด้วย Service account จาก Firebase Console > Project settings > Service accounts > Generate new private key

```env
FIREBASE_PROJECT_ID=ชื่อโปรเจกต์
FIREBASE_CLIENT_EMAIL=อีเมลของ service account
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nคีย์ส่วนตัว\\n-----END PRIVATE KEY-----\\n"
PORT=3000
```

ห้ามนำ `backend/.env` ขึ้น Git หรือส่งให้ผู้อื่น

## 4. รันเว็บและ backend

เปิด Terminal ที่โฟลเดอร์ backend แล้วรันทั้งเว็บไซต์และ backend พร้อมกัน:

```powershell
cd "C:\Users\Teerathat\Documents\ChatGPT\DODEE FUTURE\backend"
npm install
npm start
```

เว็บไซต์จะเปิดที่ [http://localhost:3000](http://localhost:3000) และตรวจสอบ backend ได้ที่ [http://localhost:3000/api/health](http://localhost:3000/api/health)

## ไฟล์ที่เตรียมไว้

- `login.html` — หน้า Login ด้วย Google
- `firebase-config.js` — Firebase Web SDK
- `firebase-auth.js` — Login และ session ผู้ใช้
- `firebase-data.js` — ฟังก์ชัน Firestore สำหรับ Portfolio, Review และ Path Finding
- `firebase-storage.js` — อัปโหลด PDF/รูปภาพขนาดไม่เกิน 20 MB
- `backend/server.js` — Backend ตรวจสอบ Firebase ID token
- `backend/.env` — ค่าลับของ Firebase Admin สำหรับเครื่อง local
