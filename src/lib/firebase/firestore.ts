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
  getCountFromServer,
  QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase';
import type { Track } from '@/types/track';

const TRACKS_COLLECTION = 'tracks';

export async function addTrack(trackData: Omit<Track, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const newTrackData = {
    ...trackData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  const docRef = await addDoc(collection(db, TRACKS_COLLECTION), newTrackData);
  return docRef.id;
}

export async function getTrack(trackId: string, userId: string): Promise<Track | null> {
  const docRef = doc(db, TRACKS_COLLECTION, trackId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const track = { id: docSnap.id, ...docSnap.data() } as Track;
    if (track.userId === userId) {
      return track;
    }
  }
  return null;
}

export interface GetTracksParams {
  userId: string;
  sortBy?: keyof Track;
  sortOrder?: 'asc' | 'desc';
  searchTerm?: string;
  genreFilter?: string;
  bpmRangeFilter?: [number, number];
  pageSize?: number;
  lastVisible?: Track | null;
}

export async function getTracks(params: GetTracksParams): Promise<{ tracks: Track[]; hasMore: boolean; lastVisibleTrack: Track | null }> {
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
  
  // Note: Firestore requires composite indexes for multiple range/inequality filters or orderBy on a different field than where.
  // Simple text search like this is limited. For advanced search, consider Algolia or Typesense.
  // This basic search will only work if title/artist/tags are specifically indexed or if we fetch all and filter client-side (not recommended for large datasets).
  // For this implementation, we'll keep it simple and assume basic sorting/filtering.
  // A true text search across multiple fields usually requires a different approach or filtering client-side after a broader query.

  constraints.push(orderBy(sortBy, sortOrder));
  
  if (lastVisible) {
     // This assumes lastVisible is the actual document snapshot from the previous query.
     // For simplicity, if it's just the track object, we need to re-fetch the document to use as startAfter,
     // or construct the startAfter value based on the sorted field.
     // Let's assume lastVisible[sortBy] can be used if it's a simple field.
     // For Timestamp fields:
     if (lastVisible[sortBy] instanceof Timestamp) {
        constraints.push(startAfter(lastVisible[sortBy] as Timestamp));
     } else {
        constraints.push(startAfter(lastVisible[sortBy]));
     }
  }
  constraints.push(limit(pageSize + 1)); // Fetch one more to check if there are more pages

  const q = query(collection(db, TRACKS_COLLECTION), ...constraints);
  const querySnapshot = await getDocs(q);
  
  let tracks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Track));

  // Implementing searchTerm filtering client-side for this example due to Firestore limitations on complex text search.
  // This is not efficient for large datasets.
  if (searchTerm) {
    const lowerSearchTerm = searchTerm.toLowerCase();
    tracks = tracks.filter(track => 
      track.title.toLowerCase().includes(lowerSearchTerm) ||
      track.artist.toLowerCase().includes(lowerSearchTerm) ||
      (track.tags && track.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)))
    );
  }
  
  const hasMore = tracks.length > pageSize;
  if (hasMore) {
    tracks.pop(); // Remove the extra item
  }

  const lastVisibleTrack = tracks.length > 0 ? tracks[tracks.length - 1] : null;

  return { tracks, hasMore, lastVisibleTrack };
}


export async function updateTrack(trackId: string, userId: string, trackData: Partial<Omit<Track, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
  const trackRef = doc(db, TRACKS_COLLECTION, trackId);
  // Optional: Verify ownership before update if not handled by security rules thoroughly
  const currentTrack = await getTrack(trackId, userId);
  if (!currentTrack) {
    throw new Error("Track not found or access denied.");
  }

  const updatedTrackData = {
    ...trackData,
    updatedAt: Timestamp.now(),
  };
  await updateDoc(trackRef, updatedTrackData);
}

export async function deleteTrack(trackId: string, userId: string): Promise<void> {
  // Optional: Verify ownership before delete if not handled by security rules thoroughly
  const currentTrack = await getTrack(trackId, userId);
  if (!currentTrack) {
    throw new Error("Track not found or access denied.");
  }
  await deleteDoc(doc(db, TRACKS_COLLECTION, trackId));
}

export async function getUniqueGenres(userId: string): Promise<string[]> {
  const q = query(collection(db, TRACKS_COLLECTION), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  const genres = new Set<string>();
  querySnapshot.forEach(doc => {
    const data = doc.data() as Track;
    if (data.genre) {
      genres.add(data.genre);
    }
  });
  return Array.from(genres).sort();
}
