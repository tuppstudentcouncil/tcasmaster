import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import { auth, db } from "./firebase-config.js";

function requireUser() {
  if (!auth.currentUser) {
    throw new Error("กรุณาเข้าสู่ระบบก่อน");
  }

  return auth.currentUser;
}

export async function addPortfolio(data) {
  const user = requireUser();

  return await addDoc(collection(db, "portfolios"), {
    ...data,
    order: 0,
    ownerId: user.uid,
    ownerName: user.displayName || "",
    ownerEmail: user.email || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function getPortfolios() {
  let result;

  try {
    result = await getDocs(collection(db, "portfolios"));
  } catch (error) {
    console.warn("โหลด Portfolio ไม่สำเร็จ", error);
    return [];
  }

  const list = result.docs.map((item) => ({
    id: item.id,
    ...item.data()
  }));

  // Sort by custom order (ascending) first, then createdAt (descending)
  return list.sort((a, b) => {
    const orderA = typeof a.order === "number" ? a.order : 999999;
    const orderB = typeof b.order === "number" ? b.order : 999999;
    if (orderA !== orderB) return orderA - orderB;

    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });
}

export async function getPortfolio(id) {
  const result = await getDoc(doc(db, "portfolios", id));

  if (!result.exists()) {
    return null;
  }

  return {
    id: result.id,
    ...result.data()
  };
}

export async function updatePortfolio(id, data) {
  requireUser();

  return await updateDoc(doc(db, "portfolios", id), {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export async function deletePortfolio(id) {
  requireUser();

  return await deleteDoc(doc(db, "portfolios", id));
}

// Reorder Portfolios in Batch
export async function reorderPortfolios(orderedIds) {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) return;

  try {
    const batch = writeBatch(db);
    orderedIds.forEach((id, index) => {
      batch.update(doc(db, "portfolios", id), {
        order: index,
        updatedAt: serverTimestamp()
      });
    });
    await batch.commit();
  } catch (error) {
    console.warn("Batch reorder portfolios fallback to individual updates:", error);
    for (let i = 0; i < orderedIds.length; i++) {
      try {
        await updateDoc(doc(db, "portfolios", orderedIds[i]), {
          order: i,
          updatedAt: serverTimestamp()
        });
      } catch (_) {}
    }
  }
}

export async function getReviews() {
  let result;

  try {
    result = await getDocs(collection(db, "reviews"));
  } catch (error) {
    console.warn("โหลด Review ไม่สำเร็จ", error);
    return [];
  }

  const list = result.docs.map((item) => ({
    id: item.id,
    ...item.data()
  }));

  // Sort by custom order (ascending) first, then createdAt (descending)
  return list.sort((a, b) => {
    const orderA = typeof a.order === "number" ? a.order : 999999;
    const orderB = typeof b.order === "number" ? b.order : 999999;
    if (orderA !== orderB) return orderA - orderB;

    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });
}

export async function getReview(id) {
  const result = await getDoc(doc(db, "reviews", id));

  if (!result.exists()) {
    return null;
  }

  return {
    id: result.id,
    ...result.data()
  };
}

export async function addReview(data) {
  const user = auth.currentUser;

  return await addDoc(collection(db, "reviews"), {
    ...data,
    order: 0,
    authorId: user?.uid || "admin",
    authorName: data.author || user?.displayName || "Admin",
    authorEmail: user?.email || "",
    authorPhoto: user?.photoURL || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateReview(id, data) {
  return await updateDoc(doc(db, "reviews", id), {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export async function deleteReview(id) {
  return await deleteDoc(doc(db, "reviews", id));
}

// Reorder Reviews in Batch
export async function reorderReviews(orderedIds) {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) return;

  try {
    const batch = writeBatch(db);
    orderedIds.forEach((id, index) => {
      batch.update(doc(db, "reviews", id), {
        order: index,
        updatedAt: serverTimestamp()
      });
    });
    await batch.commit();
  } catch (error) {
    console.warn("Batch reorder reviews fallback to individual updates:", error);
    for (let i = 0; i < orderedIds.length; i++) {
      try {
        await updateDoc(doc(db, "reviews", orderedIds[i]), {
          order: i,
          updatedAt: serverTimestamp()
        });
      } catch (_) {}
    }
  }
}

export async function savePathfinderResult(result) {
  const user = requireUser();

  return await setDoc(
    doc(db, "pathfinderResults", user.uid),
    {
      ...result,
      userId: user.uid,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}
