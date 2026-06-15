import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from './firebase';

// --- CLIENTS ---
export async function loadClients() {
  const querySnapshot = await getDocs(collection(db, 'clients'));
  const data = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  return { data };
}

export async function createClient(body: any) {
  const docRef = await addDoc(collection(db, 'clients'), {
    ...body,
    createdAt: new Date().toISOString()
  });
  return { data: { id: docRef.id, ...body } };
}

export async function updateClient(id: string, body: any) {
  const docRef = doc(db, 'clients', id);
  await updateDoc(docRef, { ...body, updatedAt: new Date().toISOString() });
}

export async function deleteClient(id: string) {
  await deleteDoc(doc(db, 'clients', id));
}

// --- PRODUCTS ---
export async function loadProducts() {
  const querySnapshot = await getDocs(collection(db, 'products'));
  const data = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  return { data };
}

export async function createProduct(body: any) {
  const docRef = await addDoc(collection(db, 'products'), {
    ...body,
    createdAt: new Date().toISOString()
  });
  return { data: { id: docRef.id, ...body } };
}

export async function updateProduct(id: string, body: any) {
  const docRef = doc(db, 'products', id);
  await updateDoc(docRef, { ...body, updatedAt: new Date().toISOString() });
}

export async function deleteProduct(id: string) {
  await deleteDoc(doc(db, 'products', id));
}

// --- INVOICES & QUOTATIONS ---
export async function loadInvoices() {
  const q = query(collection(db, 'invoices'), orderBy('invoiceDate', 'desc'));
  const querySnapshot = await getDocs(q);
  const data = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  return { data };
}

export async function loadInvoice(id: string) {
  const docSnap = await getDoc(doc(db, 'invoices', id));
  if (!docSnap.exists()) throw new Error('Record not found');
  return { data: { id: docSnap.id, ...docSnap.data() } };
}

// --- SMART SEQUENCE GENERATOR FOR INVOICES & QUOTATIONS ---
export async function loadNextSequence(clientId: number | string, recordType: 'invoice' | 'quotation') {
  // 1. Get the Client Prefix (e.g., "PT" or "ARC")
  const clientSnap = await getDoc(doc(db, 'clients', String(clientId)));
  if (!clientSnap.exists()) throw new Error('Client not found');
  const clientCode = clientSnap.data().clientCode || 'INV';

  // 2. Add "QT-" prefix if it is a quotation
  const prefix = recordType === 'quotation' ? `QT-${clientCode}` : clientCode;

  // 3. Dynamically scan existing records to find the true highest number for this specific type
  const querySnapshot = await getDocs(collection(db, 'invoices'));
  let maxSequence = 0;
  
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    // Match the specific client AND the specific record type (invoice vs quotation)
    if (String(data.clientId) === String(clientId) && (data.recordType || 'invoice') === recordType) {
      const seq = Number(data.invoiceSequence) || 0;
      if (seq > maxSequence) {
        maxSequence = seq;
      }
    }
  });

  // 4. Add +1 to whatever the highest existing sequence is
  const nextSequence = maxSequence + 1;
  const formattedNumber = `${prefix}-${String(nextSequence).padStart(3, '0')}`;
  
  return { data: { clientId, nextSequence, invoiceNumber: formattedNumber } };
}

export async function createInvoice(body: any) {
  const docRef = await addDoc(collection(db, 'invoices'), {
    ...body,
    createdAt: new Date().toISOString()
  });
  
  return { data: { id: docRef.id, ...body } };
}

export async function updateInvoice(id: string, body: any) {
  const docRef = doc(db, 'invoices', id);
  await updateDoc(docRef, { ...body, updatedAt: new Date().toISOString() });
}

export async function deleteInvoice(id: string) {
  await deleteDoc(doc(db, 'invoices', id));
}