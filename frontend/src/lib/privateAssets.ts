import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export async function loadSigningAssets(): Promise<{ signature: string; stamp: string }> {
  if (!auth.currentUser) throw new Error('Sign in to generate a signed document.');
  const snapshot = await getDoc(doc(db, 'privateAssets', 'signing'));
  const data = snapshot.data();
  if (!data || !['signature', 'stamp'].every(k => typeof data[k] === 'string' && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(data[k]))) throw new Error('Signing assets are unavailable. Contact the administrator.');
  return { signature: data.signature, stamp: data.stamp };
}
