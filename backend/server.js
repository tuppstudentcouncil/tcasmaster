import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import multer from "multer";
import cloudinary from "./cloudinary-config.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const siteRoot = path.join(currentDir, "..");

dotenv.config({ path: path.join(currentDir, ".env") });
dotenv.config({ path: path.join(siteRoot, ".env") });

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "2mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    callback(null, allowedTypes.includes(file.mimetype));
  },
});

const portfolioUpload = upload.fields([
  { name: "file", maxCount: 1 },
  { name: "coverFile", maxCount: 1 },
]);

// Serve the existing static website from the same localhost:3000 server.
app.use(express.static(siteRoot));

app.use((req, res, next) => {
  const allowedOrigins = new Set(["http://localhost:3000", "http://localhost:4173"]);
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const hasAdminCredentials = Boolean(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  privateKey &&
  !privateKey.includes("FAKE_PRIVATE_KEY_FOR_FORMAT_TEST_ONLY")
);

let firestore = null;
let firebaseAuth = null;

if (hasAdminCredentials) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey
    })
  });

  firestore = getFirestore();
  firebaseAuth = getAuth();
} else {
  console.warn("Firebase Admin ยังไม่พร้อม: กำลังใช้โหมด preview โดยใช้ค่า fake ใน backend/.env");
}

async function requireSignedIn(req, res, next) {
  try {
    if (!firebaseAuth) {
      return res.status(503).json({
        error: "Firebase Admin ยังไม่ได้ตั้งค่า",
      });
    }

    const authorization = req.headers.authorization || "";
    const idToken = authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";

    if (!idToken) {
      return res.status(401).json({
        error: "กรุณาเข้าสู่ระบบ",
      });
    }

    const decodedToken = await firebaseAuth.verifyIdToken(idToken);

    req.firebaseUser = decodedToken;
    next();
  } catch {
    return res.status(401).json({
      error: "Token ไม่ถูกต้องหรือหมดอายุ",
    });
  }
}

async function requireAdmin(req, res, next) {
  await requireSignedIn(req, res, () => {
    if (req.firebaseUser?.admin !== true) {
      return res.status(403).json({
        error: "บัญชีนี้ไม่มีสิทธิ์ Admin",
      });
    }

    next();
  });
}

function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    stream.end(buffer);
  });
}

function hasCloudinaryCredentials() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "blue-penguin-backend", firebaseAdmin: hasAdminCredentials });
});

app.post("/api/auth/verify", async (req, res) => {
  try {
    if (!firebaseAuth) return res.status(503).json({ error: "Firebase Admin ยังไม่ได้ตั้งค่าคีย์จริง" });
    const idToken = req.body?.idToken;
    if (!idToken) return res.status(400).json({ error: "ไม่พบ Firebase ID Token" });

    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    res.json({ success: true, uid: decodedToken.uid, email: decodedToken.email || "" });
  } catch {
    res.status(401).json({ error: "Token ไม่ถูกต้องหรือหมดอายุ" });
  }
});

app.post("/api/admin/portfolios/upload", requireAdmin, portfolioUpload, async (req, res) => {
  try {
    if (!firestore) {
      return res.status(503).json({ error: "Firestore ยังไม่ได้ตั้งค่า" });
    }

    if (!hasCloudinaryCredentials()) {
      return res.status(503).json({ error: "Cloudinary ยังไม่ได้ตั้งค่า" });
    }

    const portfolioFile = req.files?.file?.[0];
    const coverFile = req.files?.coverFile?.[0];

    if (!portfolioFile) {
      return res.status(400).json({ error: "กรุณาเลือกไฟล์ Portfolio" });
    }

    if (coverFile && !coverFile.mimetype.startsWith("image/")) {
      return res.status(400).json({ error: "รูปปกต้องเป็นไฟล์รูปภาพเท่านั้น" });
    }

    const ownerName = String(req.body?.ownerName || req.firebaseUser.name || req.firebaseUser.email || "").trim();
    const faculty = String(req.body?.faculty || req.body?.track || "").trim();
    const major = String(req.body?.major || "").trim();
    const university = String(req.body?.university || "").trim();
    const generation = String(req.body?.generation || "").trim();
    const studyPlan = String(req.body?.studyPlan || req.body?.school || "").trim();
    const school = studyPlan;
    const studentInfo = [generation, studyPlan].filter(Boolean).join("\n") || String(req.body?.studentInfo || req.body?.school || "").trim();
    const contact = String(req.body?.contact || "").trim();
    const advice = String(req.body?.advice || req.body?.description || "").trim();
    const description = advice;
    const title = String(req.body?.title || (ownerName ? `Portfolio ของ ${ownerName}` : "Portfolio ผลงาน TCAS")).trim();
    const track = major ? `${faculty} (${major})` : faculty;

    if (!ownerName) {
      return res.status(400).json({ error: "กรุณาระบุชื่อเจ้าของผลงาน" });
    }

    const uploaded = await uploadBufferToCloudinary(portfolioFile.buffer, {
      folder: "blue-penguin/portfolios",
      resource_type: portfolioFile.mimetype === "application/pdf" ? "raw" : "image",
    });

    const uploadedCover = coverFile
      ? await uploadBufferToCloudinary(coverFile.buffer, {
          folder: "blue-penguin/portfolio-covers",
          resource_type: "image",
        })
      : null;

    const created = await firestore.collection("portfolios").add({
      ownerId: req.firebaseUser.uid,
      title,
      description,
      advice,
      university,
      faculty,
      major,
      track,
      generation,
      studyPlan,
      school,
      studentInfo,
      contact,
      ownerName,
      fileURL: uploaded.secure_url,
      filePath: uploaded.public_id,
      cloudinaryResourceType: uploaded.resource_type,
      originalName: portfolioFile.originalname,
      mimeType: portfolioFile.mimetype,
      size: portfolioFile.size,
      coverURL: uploadedCover?.secure_url || "",
      coverPath: uploadedCover?.public_id || "",
      coverCloudinaryResourceType: uploadedCover?.resource_type || "image",
      coverOriginalName: coverFile?.originalname || "",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      success: true,
      id: created.id,
      fileURL: uploaded.secure_url,
      coverURL: uploadedCover?.secure_url || "",
    });
  } catch (error) {
    console.error("Portfolio upload failed:", error);
    res.status(500).json({ error: "อัปโหลด Portfolio ไม่สำเร็จ" });
  }
});

app.put("/api/admin/portfolios/:portfolioId", requireAdmin, portfolioUpload, async (req, res) => {
  try {
    if (!firestore) {
      return res.status(503).json({ error: "Firestore ยังไม่ได้ตั้งค่า" });
    }

    const portfolioRef = firestore.collection("portfolios").doc(req.params.portfolioId);
    const portfolioSnapshot = await portfolioRef.get();

    if (!portfolioSnapshot.exists) {
      return res.status(404).json({ error: "ไม่พบ Portfolio นี้" });
    }

    const previous = portfolioSnapshot.data() || {};
    const portfolioFile = req.files?.file?.[0];
    const coverFile = req.files?.coverFile?.[0];

    if (coverFile && !coverFile.mimetype.startsWith("image/")) {
      return res.status(400).json({ error: "รูปปกต้องเป็นไฟล์รูปภาพเท่านั้น" });
    }

    const ownerName = String(req.body?.ownerName ?? previous.ownerName ?? "").trim();
    const faculty = String(req.body?.faculty ?? previous.faculty ?? req.body?.track ?? previous.track ?? "").trim();
    const major = String(req.body?.major ?? previous.major ?? "").trim();
    const university = String(req.body?.university ?? previous.university ?? "").trim();
    const generation = String(req.body?.generation ?? previous.generation ?? "").trim();
    const studyPlan = String(req.body?.studyPlan ?? previous.studyPlan ?? req.body?.school ?? previous.school ?? "").trim();
    const school = studyPlan;
    const studentInfo = [generation, studyPlan].filter(Boolean).join("\n") || String(req.body?.studentInfo ?? previous.studentInfo ?? "").trim();
    const contact = String(req.body?.contact ?? previous.contact ?? "").trim();
    const advice = String(req.body?.advice ?? req.body?.description ?? previous.advice ?? previous.description ?? "").trim();
    const description = advice;
    const title = String(req.body?.title ?? previous.title ?? (ownerName ? `Portfolio ของ ${ownerName}` : "Portfolio ผลงาน TCAS")).trim();
    const track = major ? `${faculty} (${major})` : (faculty || String(req.body?.track ?? previous.track ?? ""));

    const updates = {
      title,
      description,
      advice,
      university,
      faculty,
      major,
      track,
      generation,
      studyPlan,
      school,
      studentInfo,
      contact,
      ownerName,
      updatedAt: FieldValue.serverTimestamp(),
    };

    let replacement = null;
    let coverReplacement = null;
    if (portfolioFile) {
      if (!hasCloudinaryCredentials()) {
        return res.status(503).json({ error: "Cloudinary ยังไม่ได้ตั้งค่า" });
      }

      replacement = await uploadBufferToCloudinary(portfolioFile.buffer, {
        folder: "blue-penguin/portfolios",
        resource_type: portfolioFile.mimetype === "application/pdf" ? "raw" : "image",
      });

      Object.assign(updates, {
        fileURL: replacement.secure_url,
        filePath: replacement.public_id,
        cloudinaryResourceType: replacement.resource_type,
        originalName: portfolioFile.originalname,
        mimeType: portfolioFile.mimetype,
        size: portfolioFile.size,
      });
    }

    if (coverFile) {
      if (!hasCloudinaryCredentials()) {
        return res.status(503).json({ error: "Cloudinary ยังไม่ได้ตั้งค่า" });
      }

      coverReplacement = await uploadBufferToCloudinary(coverFile.buffer, {
        folder: "blue-penguin/portfolio-covers",
        resource_type: "image",
      });

      Object.assign(updates, {
        coverURL: coverReplacement.secure_url,
        coverPath: coverReplacement.public_id,
        coverCloudinaryResourceType: coverReplacement.resource_type,
        coverOriginalName: coverFile.originalname,
      });
    }

    await portfolioRef.update(updates);

    if (replacement && previous.filePath) {
      try {
        await cloudinary.uploader.destroy(previous.filePath, {
          resource_type: previous.cloudinaryResourceType || "image",
          type: "upload",
        });
      } catch (error) {
        console.warn("ลบไฟล์ Portfolio เดิมจาก Cloudinary ไม่สำเร็จ:", error.message);
      }
    }

    if (coverReplacement && previous.coverPath) {
      try {
        await cloudinary.uploader.destroy(previous.coverPath, {
          resource_type: previous.coverCloudinaryResourceType || "image",
          type: "upload",
        });
      } catch (error) {
        console.warn("ลบรูปปกเดิมจาก Cloudinary ไม่สำเร็จ:", error.message);
      }
    }

    res.json({
      success: true,
      id: portfolioRef.id,
      fileURL: replacement?.secure_url || previous.fileURL || "",
      coverURL: coverReplacement?.secure_url || previous.coverURL || "",
    });
  } catch (error) {
    console.error("Portfolio update failed:", error);
    res.status(500).json({ error: "แก้ไข Portfolio ไม่สำเร็จ" });
  }
});

app.post("/api/admin/activities", requireAdmin, async (req, res) => {
  try {
    if (!firestore) {
      return res.status(503).json({ error: "Firestore ยังไม่ได้ตั้งค่า" });
    }

    const allowedCategories = new Set([
      "general",
      "technology",
      "design",
      "business",
      "education",
      "research",
      "communication",
      "music",
      "sport",
    ]);
    const title = String(req.body?.title || "").trim();
    const description = String(req.body?.description || "").trim();
    const category = String(req.body?.category || "general").trim();
    const date = String(req.body?.date || "").trim();
    const fee = String(req.body?.fee || "ฟรี").trim();
    const registrationUrl = String(req.body?.registrationUrl || "").trim();

    if (!title) {
      return res.status(400).json({ error: "กรุณาระบุชื่อกิจกรรมหรือค่าย" });
    }

    if (!allowedCategories.has(category)) {
      return res.status(400).json({ error: "หมวดหมู่กิจกรรมไม่ถูกต้อง" });
    }

    const created = await firestore.collection("activities").add({
      ownerId: req.firebaseUser.uid,
      title,
      description,
      category,
      date,
      fee: fee || "ฟรี",
      registrationUrl,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    res.status(201).json({ success: true, id: created.id });
  } catch (error) {
    console.error("Activity create failed:", error);
    res.status(500).json({ error: "เพิ่มกิจกรรมไม่สำเร็จ" });
  }
});

function serializeFirestoreDocument(snapshot) {
  const data = snapshot.data() || {};
  const serialized = { id: snapshot.id, ...data };

  for (const key of ["createdAt", "updatedAt"]) {
    if (serialized[key]?.toDate) {
      serialized[key] = serialized[key].toDate().toISOString();
    }
  }

  return serialized;
}

function makePortfolioPdfFileName(portfolio, portfolioId) {
  const source = portfolio.title || portfolio.originalName || `portfolio-${portfolioId}`;
  const baseName = String(source)
    .replace(/\.pdf$/i, "")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .trim() || `portfolio-${portfolioId}`;
  return `${baseName}.pdf`;
}

app.get("/api/mock-exams", requireSignedIn, async (req, res) => {
  try {
    if (!firestore) {
      return res.status(503).json({ error: "Firestore ยังไม่ได้ตั้งค่า" });
    }

    let snapshot;
    try {
      snapshot = await firestore.collection("mockExams").orderBy("createdAt", "desc").get();
    } catch {
      snapshot = await firestore.collection("mockExams").get();
    }

    res.json({ success: true, exams: snapshot.docs.map(serializeFirestoreDocument) });
  } catch (error) {
    console.error("Mock exam list failed:", error);
    res.status(500).json({ error: "โหลดข้อสอบจำลองไม่สำเร็จ" });
  }
});

app.get("/api/mock-exams/:examId/questions", requireSignedIn, async (req, res) => {
  try {
    if (!firestore) {
      return res.status(503).json({ error: "Firestore ยังไม่ได้ตั้งค่า" });
    }

    const snapshot = await firestore
      .collection("mockQuestions")
      .where("examId", "==", req.params.examId)
      .get();

    res.json({ success: true, questions: snapshot.docs.map(serializeFirestoreDocument) });
  } catch (error) {
    console.error("Mock exam questions failed:", error);
    res.status(500).json({ error: "โหลดคำถามไม่สำเร็จ" });
  }
});

app.post("/api/admin/mock-exams", requireAdmin, async (req, res) => {
  try {
    if (!firestore) {
      return res.status(503).json({ error: "Firestore ยังไม่ได้ตั้งค่า" });
    }

    const allowedCategories = new Set(["a-level", "tgat", "general"]);
    const allowedTypes = new Set(["online", "pdf"]);
    const title = String(req.body?.title || "").trim();
    const description = String(req.body?.description || "").trim();
    const category = String(req.body?.category || "general").trim();
    const type = String(req.body?.type || "online").trim();
    const duration = Math.max(0, Number.parseInt(req.body?.duration, 10) || 0);
    const score = Math.max(0, Number.parseInt(req.body?.score, 10) || 0);
    const questionCount = Math.max(0, Number.parseInt(req.body?.questionCount, 10) || 0);
    const questionText = String(req.body?.questionText || "").trim();
    const options = ["A", "B", "C", "D"].map((letter) => String(req.body?.[`option${letter}`] || "").trim());
    const correctOption = String(req.body?.correctOption || "A").trim().toUpperCase();

    if (!title) {
      return res.status(400).json({ error: "กรุณาระบุชื่อชุดข้อสอบ" });
    }

    if (!allowedCategories.has(category) || !allowedTypes.has(type)) {
      return res.status(400).json({ error: "ประเภทข้อสอบไม่ถูกต้อง" });
    }

    if (!questionText && questionCount > 0) {
      return res.status(400).json({ error: "กรุณาใส่คำถามตัวอย่าง หรือกำหนดจำนวนข้อเป็น 0" });
    }

    if (questionText && (options.some((option) => !option) || !["A", "B", "C", "D"].includes(correctOption))) {
      return res.status(400).json({ error: "กรุณาใส่ตัวเลือกให้ครบ 4 ข้อและเลือกคำตอบที่ถูกต้อง" });
    }

    const examRef = await firestore.collection("mockExams").add({
      ownerId: req.firebaseUser.uid,
      title,
      description,
      category,
      type,
      duration,
      score,
      questionCount: questionText ? Math.max(questionCount, 1) : questionCount,
      attemptCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (questionText) {
      await firestore.collection("mockQuestions").add({
        examId: examRef.id,
        questionText,
        options,
        correctOption,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    res.status(201).json({ success: true, id: examRef.id });
  } catch (error) {
    console.error("Mock exam create failed:", error);
    res.status(500).json({ error: "เพิ่มข้อสอบจำลองไม่สำเร็จ" });
  }
});

app.delete("/api/admin/portfolios/:portfolioId", requireAdmin, async (req, res) => {
  try {
    if (!firestore) {
      return res.status(503).json({ error: "Firestore ยังไม่ได้ตั้งค่า" });
    }

    const portfolioRef = firestore.collection("portfolios").doc(req.params.portfolioId);
    const portfolioSnapshot = await portfolioRef.get();

    if (!portfolioSnapshot.exists) {
      return res.status(404).json({ error: "ไม่พบ Portfolio นี้" });
    }

    const portfolio = portfolioSnapshot.data() || {};

    if ((portfolio.filePath || portfolio.coverPath) && !hasCloudinaryCredentials()) {
      return res.status(503).json({ error: "Cloudinary ยังไม่ได้ตั้งค่า จึงยังลบไฟล์ไม่ได้" });
    }

    if (portfolio.filePath) {
      await cloudinary.uploader.destroy(portfolio.filePath, {
        resource_type: portfolio.cloudinaryResourceType || "image",
        type: "upload",
      });
    }

    if (portfolio.coverPath) {
      await cloudinary.uploader.destroy(portfolio.coverPath, {
        resource_type: portfolio.coverCloudinaryResourceType || "image",
        type: "upload",
      });
    }

    await portfolioRef.delete();
    res.json({ success: true });
  } catch (error) {
    console.error("Portfolio delete failed:", error);
    res.status(500).json({ error: "ลบ Portfolio ไม่สำเร็จ" });
  }
});

let cachedPortfolios = null;
let lastPortfoliosFetch = 0;

let cachedReviews = null;
let lastReviewsFetch = 0;

app.get("/api/portfolios", async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  const now = Date.now();
  if (cachedPortfolios && now - lastPortfoliosFetch < 5000) {
    return res.json({ success: true, portfolios: cachedPortfolios });
  }

  try {
    if (!firestore) {
      return res.status(503).json({ error: "Firestore ยังไม่ได้ตั้งค่า" });
    }

    let snapshot;
    try {
      snapshot = await firestore.collection("portfolios").orderBy("createdAt", "desc").get();
    } catch {
      snapshot = await firestore.collection("portfolios").get();
    }

    cachedPortfolios = snapshot.docs.map(serializeFirestoreDocument);
    lastPortfoliosFetch = now;
    res.json({ success: true, portfolios: cachedPortfolios });
  } catch (error) {
    console.error("Portfolio list failed:", error);
    if (cachedPortfolios) {
      return res.json({ success: true, portfolios: cachedPortfolios });
    }
    res.status(500).json({ error: "โหลด Portfolio ไม่สำเร็จ" });
  }
});

app.get("/api/reviews", async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  const now = Date.now();
  if (cachedReviews && now - lastReviewsFetch < 5000) {
    return res.json({ success: true, reviews: cachedReviews });
  }

  try {
    if (!firestore) {
      return res.status(503).json({ error: "Firestore ยังไม่ได้ตั้งค่า" });
    }

    let snapshot;
    try {
      snapshot = await firestore.collection("reviews").orderBy("createdAt", "desc").get();
    } catch {
      snapshot = await firestore.collection("reviews").get();
    }

    cachedReviews = snapshot.docs.map(serializeFirestoreDocument);
    lastReviewsFetch = now;
    res.json({ success: true, reviews: cachedReviews });
  } catch (error) {
    console.error("Reviews list failed:", error);
    if (cachedReviews) {
      return res.json({ success: true, reviews: cachedReviews });
    }
    res.status(500).json({ error: "โหลดรีวิวไม่สำเร็จ" });
  }
});

app.get("/api/portfolios/:portfolioId/download", async (req, res) => {
  try {
    if (!firestore) {
      return res.status(503).json({ error: "Firestore ยังไม่ได้ตั้งค่า" });
    }

    const portfolioSnapshot = await firestore.collection("portfolios").doc(req.params.portfolioId).get();
    if (!portfolioSnapshot.exists) {
      return res.status(404).json({ error: "ไม่พบ Portfolio นี้" });
    }

    const portfolio = portfolioSnapshot.data() || {};
    if (!portfolio.fileURL) {
      return res.status(404).json({ error: "Portfolio นี้ยังไม่มีไฟล์ PDF" });
    }

    try {
      const upstream = await fetch(portfolio.fileURL, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });
      if (upstream.ok) {
        const fileName = makePortfolioPdfFileName(portfolio, portfolioSnapshot.id);
        const asciiFileName = fileName.replace(/[^\x20-\x7E]/g, "_");
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${asciiFileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
        );
        return res.send(Buffer.from(await upstream.arrayBuffer()));
      }
    } catch (fetchErr) {
      console.warn("Upstream fetch failed, redirecting to fileURL:", fetchErr);
    }

    return res.redirect(portfolio.fileURL);
  } catch (error) {
    console.error("Portfolio download failed:", error);
    res.status(500).json({ error: "ดาวน์โหลด Portfolio ไม่สำเร็จ" });
  }
});

const pdfBufferCache = new Map();

app.get("/api/pdf-proxy", async (req, res) => {
  try {
    const rawUrl = String(req.query.url || "").trim();
    if (!rawUrl || !rawUrl.startsWith("http")) {
      return res.status(400).json({ error: "URL ไม่ถูกต้อง" });
    }
    const cleanUrl = rawUrl.replace(/\/fl_attachment:[^/]+\//, "/");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=86400");

    if (pdfBufferCache.has(cleanUrl)) {
      return res.send(pdfBufferCache.get(cleanUrl));
    }

    const upstream = await fetch(cleanUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `ไม่สามารถดึงไฟล์ PDF จากต้นทางได้ (${upstream.status})` });
    }

    const arrayBuffer = await upstream.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    pdfBufferCache.set(cleanUrl, buffer);
    return res.send(buffer);
  } catch (error) {
    console.error("PDF Proxy error:", error);
    res.status(500).json({ error: "เปิดดูไฟล์ PDF ไม่สำเร็จ" });
  }
});

app.post("/api/portfolios", requireAdmin, async (req, res) => {
  try {
    if (!firestore) return res.status(503).json({ error: "Firebase Admin ยังไม่ได้ตั้งค่าคีย์จริง" });
    const { title = "", description = "", fileURL = "", filePath = "" } = req.body || {};

    const created = await firestore.collection("portfolios").add({
      ownerId: req.firebaseUser.uid,
      title,
      description,
      fileURL,
      filePath,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    res.json({ success: true, id: created.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "บันทึก Portfolio ไม่สำเร็จ" });
  }
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error instanceof multer.MulterError) {
    const message = error.code === "LIMIT_FILE_SIZE"
      ? "ไฟล์มีขนาดเกิน 10 MB"
      : error.code === "LIMIT_UNEXPECTED_FILE"
        ? "พบช่องอัปโหลดไฟล์ที่ระบบไม่รู้จัก กรุณารีสตาร์ต backend แล้วลองใหม่"
        : "รูปแบบการอัปโหลดไฟล์ไม่ถูกต้อง";
    return res.status(400).json({ error: message });
  }

  console.error("Unhandled backend error:", error);
  return res.status(500).json({ error: "เซิร์ฟเวอร์ประมวลผลการอัปโหลดไม่สำเร็จ" });
});

async function preloadPortfolioPdfs() {
  if (!firestore) return;
  try {
    const now = Date.now();
    // 1. Preload Portfolios
    const pSnap = await firestore.collection("portfolios").orderBy("createdAt", "desc").get().catch(() => firestore.collection("portfolios").get());
    cachedPortfolios = pSnap.docs.map(serializeFirestoreDocument);
    lastPortfoliosFetch = now;
    console.log(`Preloaded ${cachedPortfolios.length} portfolios in memory`);

    // 2. Preload Reviews
    const rSnap = await firestore.collection("reviews").orderBy("createdAt", "desc").get().catch(() => firestore.collection("reviews").get());
    cachedReviews = rSnap.docs.map(serializeFirestoreDocument);
    lastReviewsFetch = now;
    console.log(`Preloaded ${cachedReviews.length} reviews in memory`);

    // 3. Preload PDF Buffers in background
    for (const doc of pSnap.docs) {
      const data = doc.data() || {};
      const furl = data.fileURL;
      if (furl && furl.startsWith("http")) {
        const cleanUrl = furl.replace(/\/fl_attachment:[^/]+\//, "/");
        if (!pdfBufferCache.has(cleanUrl)) {
          fetch(cleanUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
          })
            .then((res) => (res.ok ? res.arrayBuffer() : null))
            .then((ab) => {
              if (ab) {
                pdfBufferCache.set(cleanUrl, Buffer.from(ab));
                console.log(`Preloaded PDF in RAM: ${data.ownerName || doc.id} (${(ab.byteLength / 1024).toFixed(0)} KB)`);
              }
            })
            .catch(() => {});
        }
      }
    }
  } catch (e) {
    console.warn("Preload note:", e.message);
  }
}

app.listen(port, () => {
  console.log(`TCAS Master backend running at http://localhost:${port}`);
  preloadPortfolioPdfs();
});
