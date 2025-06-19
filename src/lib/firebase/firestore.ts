
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  Timestamp,
  orderBy,
  limit,
  startAfter,
  QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase';
import type { Multimedia } from '@/types/multimedia';

const MULTIMEDIA_COLLECTION = 'multimedia_items'; // Changed from 'tracks'

export async function addMultimediaItem(multimediaData: Omit<Multimedia, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const newMultimediaData = {
    ...multimediaData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  const docRef = await addDoc(collection(db, MULTIMEDIA_COLLECTION), newMultimediaData);
  return docRef.id;
}

export async function getMultimediaItem(multimediaId: string, userId: string): Promise<Multimedia | null> {
  const docRef = doc(db, MULTIMEDIA_COLLECTION, multimediaId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const item = { id: docSnap.id, ...docSnap.data() } as Multimedia;
    if (item.userId === userId) {
      return item;
    }
  }
  return null;
}

export interface GetMultimediaItemsParams {
  userId: string;
  sortBy?: keyof Multimedia;
  sortOrder?: 'asc' | 'desc';
  searchTerm?: string;
  genreFilter?: string;
  bpmRangeFilter?: [number, number];
  pageSize?: number;
  lastVisible?: Multimedia | null;
}

export async function getMultimediaItems(params: GetMultimediaItemsParams): Promise<{ items: Multimedia[]; hasMore: boolean; lastVisibleItem: Multimedia | null }> {
  const { 
    userId, 
    sortBy = 'createdAt', 
    sortOrder = 'desc', 
    searchTerm, 
    genreFilter, 
    bpmRangeFilter,
    pageSize = 10,
    lastVisible = null,
  } = params;

  const constraints: QueryConstraint[] = [where('userId', '==', userId)];

  if (genreFilter) {
    constraints.push(where('genre', '==', genreFilter));
  }
  if (bpmRangeFilter) {
    constraints.push(where('bpm', '>=', bpmRangeFilter[0]));
    constraints.push(where('bpm', '<=', bpmRangeFilter[1]));
  }
  
  constraints.push(orderBy(sortBy, sortOrder));
  
  if (lastVisible) {
     if (lastVisible[sortBy] instanceof Timestamp) {
        constraints.push(startAfter(lastVisible[sortBy] as Timestamp));
     } else {
        constraints.push(startAfter(lastVisible[sortBy]));
     }
  }
  constraints.push(limit(pageSize + 1)); 

  const q = query(collection(db, MULTIMEDIA_COLLECTION), ...constraints);
  const querySnapshot = await getDocs(q);
  
  let items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Multimedia));

  if (searchTerm) {
    const lowerSearchTerm = searchTerm.toLowerCase();
    items = items.filter(item => 
      item.title.toLowerCase().includes(lowerSearchTerm) ||
      item.artist.toLowerCase().includes(lowerSearchTerm) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)))
    );
  }
  
  const hasMore = items.length > pageSize;
  if (hasMore) {
    items.pop(); 
  }

  const lastVisibleItem = items.length > 0 ? items[items.length - 1] : null;

  return { items, hasMore, lastVisibleItem };
}


export async function updateMultimediaItem(multimediaId: string, userId: string, multimediaData: Partial<Omit<Multimedia, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
  const itemRef = doc(db, MULTIMEDIA_COLLECTION, multimediaId);
  const currentItem = await getMultimediaItem(multimediaId, userId);
  if (!currentItem) {
    throw new Error("Multimedia item not found or access denied.");
  }

  const updatedMultimediaData = {
    ...multimediaData,
    updatedAt: Timestamp.now(),
  };
  await updateDoc(itemRef, updatedMultimediaData);
}

export async function deleteMultimediaItem(multimediaId: string, userId: string): Promise<void> {
  const currentItem = await getMultimediaItem(multimediaId, userId);
  if (!currentItem) {
    throw new Error("Multimedia item not found or access denied.");
  }
  await deleteDoc(doc(db, MULTIMEDIA_COLLECTION, multimediaId));
}

export async function getUniqueGenres(userId: string): Promise<string[]> {
  const q = query(collection(db, MULTIMEDIA_COLLECTION), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  const genres = new Set<string>();
  querySnapshot.forEach(doc => {
    const data = doc.data() as Multimedia;
    if (data.genre) {
      genres.add(data.genre);
    }
  });
  return Array.from(genres).sort();
}
