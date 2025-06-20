import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage, auth } from '../lib/firebase/config'

// Types matching ELM models
export interface Komposition {
  id?: string
  userId: string
  name: string
  revision: string
  dvlType: string
  bpm: number
  segments: Segment[]
  sources: Source[]
  config: VideoConfig
  beatpattern?: BeatPattern
  createdAt?: any
  updatedAt?: any
  createdBy?: string
  lastModifiedBy?: string
  isPublic?: boolean
  sharedWith?: string[]
  tags?: string[]
  description?: string
}

export interface Segment {
  id: string
  sourceId: string
  start: number
  duration: number
  end: number
}

export interface Source {
  id: string
  url: string
  startingOffset?: number
  checksum: string
  format: string
  extensionType: string
  mediaType: string
  width?: number
  height?: number
}

export interface VideoConfig {
  width: number
  height: number
  framerate: number
  extensionType: string
}

export interface BeatPattern {
  fromBeat: number
  toBeat: number
  masterBPM: number
}

export interface KompositionSaveResult {
  success: boolean
  kompositionId?: string
  komposition?: Komposition
  error?: string
}

export interface SourceUploadResult {
  success: boolean
  sourceId?: string
  url?: string
  error?: string
}

export interface FirebaseError {
  operation: string
  message: string
  code?: string
}

export class FirebaseKompostService {
  
  // ==============================================
  // KOMPOSITION CRUD OPERATIONS
  // ==============================================
  
  async saveKomposition(komposition: Komposition): Promise<KompositionSaveResult> {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        throw new Error('User not authenticated')
      }
      
      const kompoData = {
        ...komposition,
        userId,
        updatedAt: serverTimestamp(),
        lastModifiedBy: auth.currentUser?.email || auth.currentUser?.uid || userId
      }
      
      if (komposition.id) {
        // Update existing komposition
        const docRef = doc(db, 'kompositions', komposition.id)
        await updateDoc(docRef, kompoData)
        
        return {
          success: true,
          kompositionId: komposition.id,
          komposition: { ...komposition, id: komposition.id }
        }
      } else {
        // Create new komposition
        const docRef = await addDoc(collection(db, 'kompositions'), {
          ...kompoData,
          createdAt: serverTimestamp(),
          createdBy: auth.currentUser?.email || auth.currentUser?.uid || userId,
          isPublic: false,
          sharedWith: []
        })
        
        const newKomposition = { ...komposition, id: docRef.id }
        
        return {
          success: true,
          kompositionId: docRef.id,
          komposition: newKomposition
        }
      }
    } catch (error: any) {
      console.error('Error saving komposition:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
  
  async loadKomposition(kompositionId: string): Promise<Komposition> {
    try {
      const docSnap = await getDoc(doc(db, 'kompositions', kompositionId))
      
      if (!docSnap.exists()) {
        throw new Error('Komposition not found')
      }
      
      const data = docSnap.data()
      
      // Verify user has access
      const userId = auth.currentUser?.uid
      if (!userId) {
        throw new Error('User not authenticated')
      }
      
      if (data.userId !== userId && !data.isPublic && !(data.sharedWith?.includes(userId))) {
        throw new Error('Access denied to this komposition')
      }
      
      return { 
        id: docSnap.id, 
        ...data,
        // Convert Firestore timestamps to ISO strings for ELM
        createdAt: data.createdAt?.toDate?.()?.toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString()
      } as Komposition
      
    } catch (error: any) {
      console.error('Error loading komposition:', error)
      throw error
    }
  }
  
  async deleteKomposition(kompositionId: string): Promise<void> {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        throw new Error('User not authenticated')
      }
      
      // Verify ownership before deletion
      const docSnap = await getDoc(doc(db, 'kompositions', kompositionId))
      if (!docSnap.exists()) {
        throw new Error('Komposition not found')
      }
      
      const data = docSnap.data()
      if (data.userId !== userId) {
        throw new Error('Access denied: You can only delete your own kompositions')
      }
      
      await deleteDoc(doc(db, 'kompositions', kompositionId))
      
    } catch (error: any) {
      console.error('Error deleting komposition:', error)
      throw error
    }
  }
  
  async searchKompositions(searchQuery: string = '', limitCount: number = 20): Promise<Komposition[]> {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        return []
      }
      
      let q
      
      if (searchQuery.trim() === '') {
        // Get all user's kompositions
        q = query(
          collection(db, 'kompositions'),
          where('userId', '==', userId),
          orderBy('updatedAt', 'desc'),
          limit(limitCount)
        )
      } else {
        // Search by name (prefix matching)
        q = query(
          collection(db, 'kompositions'),
          where('userId', '==', userId),
          where('name', '>=', searchQuery),
          where('name', '<=', searchQuery + '\uf8ff'),
          orderBy('name', 'asc'),
          limit(limitCount)
        )
      }
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamps
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString()
      })) as Komposition[]
      
    } catch (error: any) {
      console.error('Error searching kompositions:', error)
      return []
    }
  }
  
  async getRecentKompositions(limitCount: number = 10): Promise<Komposition[]> {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return []
      
      const q = query(
        collection(db, 'kompositions'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString()
      })) as Komposition[]
      
    } catch (error: any) {
      console.error('Error fetching recent kompositions:', error)
      return []
    }
  }
  
  // ==============================================
  // SOURCE/MEDIA OPERATIONS
  // ==============================================
  
  async uploadSource(file: File, onProgress?: (progress: number) => void): Promise<SourceUploadResult> {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        throw new Error('User not authenticated')
      }
      
      // Validate file size (100MB limit)
      const MAX_FILE_SIZE = 100 * 1024 * 1024
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size exceeds 100MB limit')
      }
      
      // Generate unique filename
      const timestamp = Date.now()
      const filename = `${timestamp}_${file.name}`
      
      // Upload to Firebase Storage
      const storageRef = ref(storage, `media/${userId}/${filename}`)
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      
      // Calculate checksum (simplified - using file size + name)
      const checksum = `${file.size}_${file.name}_${timestamp}`
      
      // Save metadata to Firestore
      const sourceData = {
        userId,
        url: downloadURL,
        filename: file.name,
        checksum,
        format: file.name.split('.').pop()?.toLowerCase() || '',
        extensionType: this.getExtensionType(file.type),
        mediaType: file.type,
        fileSize: file.size,
        createdAt: serverTimestamp(),
        uploadedAt: serverTimestamp(),
        isShared: false,
        sharedWith: []
      }
      
      // Add media properties if it's video/image
      const mediaSourceData: any = sourceData
      if (file.type.startsWith('video/') || file.type.startsWith('image/')) {
        // For now, we'll set placeholder dimensions
        // In a real implementation, you'd analyze the media file
        mediaSourceData.width = 1920
        mediaSourceData.height = 1080
      }
      
      const docRef = await addDoc(collection(db, 'sources'), mediaSourceData)
      
      return {
        success: true,
        sourceId: docRef.id,
        url: downloadURL
      }
      
    } catch (error: any) {
      console.error('Error uploading source:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
  
  async deleteSource(sourceId: string): Promise<void> {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        throw new Error('User not authenticated')
      }
      
      // Get source document to verify ownership
      const docSnap = await getDoc(doc(db, 'sources', sourceId))
      if (!docSnap.exists()) {
        throw new Error('Source not found')
      }
      
      const data = docSnap.data()
      if (data.userId !== userId) {
        throw new Error('Access denied: You can only delete your own sources')
      }
      
      // Delete from Firebase Storage
      try {
        const storageRef = ref(storage, data.url)
        await deleteObject(storageRef)
      } catch (storageError) {
        console.warn('Could not delete file from storage:', storageError)
        // Continue with Firestore deletion even if storage deletion fails
      }
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'sources', sourceId))
      
    } catch (error: any) {
      console.error('Error deleting source:', error)
      throw error
    }
  }
  
  // ==============================================
  // REAL-TIME SUBSCRIPTIONS
  // ==============================================
  
  subscribeToKomposition(
    kompositionId: string, 
    callback: (komposition: Komposition | null) => void
  ): () => void {
    return onSnapshot(
      doc(db, 'kompositions', kompositionId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data()
          const komposition = {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString()
          } as Komposition
          callback(komposition)
        } else {
          callback(null)
        }
      },
      (error) => {
        console.error('Error in komposition subscription:', error)
        callback(null)
      }
    )
  }
  
  subscribeToUserKompositions(
    callback: (kompositions: Komposition[]) => void
  ): () => void {
    const userId = auth.currentUser?.uid
    if (!userId) {
      callback([])
      return () => {}
    }
    
    const q = query(
      collection(db, 'kompositions'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc'),
      limit(50)
    )
    
    return onSnapshot(
      q,
      (querySnapshot) => {
        const kompositions = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString()
        })) as Komposition[]
        callback(kompositions)
      },
      (error) => {
        console.error('Error in kompositions subscription:', error)
        callback([])
      }
    )
  }
  
  // ==============================================
  // UTILITY METHODS
  // ==============================================
  
  private getExtensionType(mimeType: string): string {
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.startsWith('image/')) return 'image'
    return 'unknown'
  }
  
  // Create a new komposition with default values
  createDefaultKomposition(name: string = 'New Komposition'): Komposition {
    const userId = auth.currentUser?.uid
    if (!userId) {
      throw new Error('User not authenticated')
    }
    
    return {
      userId,
      name,
      revision: '1.0',
      dvlType: 'video',
      bpm: 120,
      segments: [],
      sources: [],
      config: {
        width: 1920,
        height: 1080,
        framerate: 30,
        extensionType: 'mp4'
      },
      isPublic: false,
      sharedWith: [],
      tags: []
    }
  }
}

// Singleton instance
export const firebaseKompostService = new FirebaseKompostService()