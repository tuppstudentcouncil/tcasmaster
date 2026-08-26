import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

import { auth, storage } from "./firebase-config.js";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export async function uploadPortfolioFile(file, onProgress) {
  if (!auth.currentUser) {
    throw new Error("กรุณาเข้าสู่ระบบก่อนอัปโหลดไฟล์");
  }

  if (!file) {
    throw new Error("กรุณาเลือกไฟล์");
  }

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("รองรับเฉพาะ PDF, JPG, PNG และ WEBP");
  }

  if (file.size > 20 * 1024 * 1024) {
    throw new Error("ไฟล์ต้องมีขนาดไม่เกิน 20 MB");
  }

  const uid = auth.currentUser.uid;
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `portfolios/${uid}/${Date.now()}-${safeName}`;
  const fileRef = ref(storage, filePath);

  try {
    const downloadURL = await new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(fileRef, file);

      const timeoutId = setTimeout(() => {
        uploadTask.cancel();
        reject(new Error("การอัปโหลดใช้เวลานานเกินไป (Timeout)"));
      }, 45000);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          if (typeof onProgress === "function") {
            onProgress(progress);
          }
        },
        (error) => {
          clearTimeout(timeoutId);
          let msg = "อัปโหลดไปยัง Firebase Storage ไม่สำเร็จ";
          if (error.code === "storage/unauthorized") {
            msg = "ไม่มีสิทธิ์อัปโหลดไฟล์ใน Firebase Storage (Storage Permission)";
          } else if (error.code === "storage/canceled") {
            msg = "ยกเลิกการอัปโหลดเนื่องจากใช้เวลานานเกินไป";
          }
          reject(new Error(msg));
        },
        async () => {
          clearTimeout(timeoutId);
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          } catch (err) {
            reject(err);
          }
        }
      );
    });

    return {
      filePath,
      downloadURL,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    };
  } catch (storageError) {
    if (file.size <= 3 * 1024 * 1024) {
      console.warn("Firebase Storage failed, using Data URL fallback:", storageError);
      const dataUrl = await fileToDataUrl(file);
      return {
        filePath: "",
        downloadURL: dataUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      };
    }
    throw storageError;
  }
}

export async function removePortfolioFile(filePath) {
  if (!auth.currentUser || !filePath) {
    return;
  }

  try {
    await deleteObject(ref(storage, filePath));
  } catch (err) {
    console.warn("Remove storage object failed:", err);
  }
}