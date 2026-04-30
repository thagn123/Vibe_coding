import type { Query } from 'firebase-admin/firestore';
import { getFirestore } from '../integrations/firebase/firebase-admin';

export class FirestoreRepository<T extends { id: string }> {
  constructor(private readonly collectionName: string) {}

  collection() {
    return getFirestore().collection(this.collectionName);
  }

  async getById(id: string) {
    const snapshot = await this.collection().doc(id).get();
    if (!snapshot.exists) {
      return null;
    }

    return snapshot.data() as T;
  }

  async upsert(id: string, data: T) {
    await this.collection().doc(id).set(data, { merge: true });
    return data;
  }

  async create(id: string, data: T) {
    await this.collection().doc(id).set(data);
    return data;
  }

  async delete(id: string) {
    await this.collection().doc(id).delete();
  }

  async list(queryBuilder?: (query: Query) => Query) {
    const query = queryBuilder ? queryBuilder(this.collection()) : this.collection();
    const snapshot = await query.get();
    return snapshot.docs.map((doc) => doc.data() as T);
  }
}
