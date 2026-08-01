import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

const BATCHES_COLLECTION = 'batches';

// ── Batch Operations ───────────────────────────────────

export const getBatches = async () => {
  const q = query(collection(db, BATCHES_COLLECTION), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const getBatchById = async (batchId) => {
  const docRef = doc(db, BATCHES_COLLECTION, batchId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

export const createBatch = async (batchData) => {
  const docRef = await addDoc(collection(db, BATCHES_COLLECTION), {
    ...batchData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
};

export const updateBatch = async (batchId, updateData) => {
  const docRef = doc(db, BATCHES_COLLECTION, batchId);
  await updateDoc(docRef, {
    ...updateData,
    updatedAt: serverTimestamp()
  });
};

export const deleteBatch = async (batchId) => {
  const docRef = doc(db, BATCHES_COLLECTION, batchId);
  await deleteDoc(docRef);
};
