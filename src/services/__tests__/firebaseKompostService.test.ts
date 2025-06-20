/**
 * Firebase Kompost Service Tests
 * 
 * Comprehensive tests for Firebase CRUD operations, ensuring all
 * database interactions work correctly with proper error handling.
 */

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
  serverTimestamp
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { 
  firebaseKompostService,
  Komposition,
  KompositionSaveResult,
  SourceUploadResult
} from '../firebaseKompostService'

// Mock Firebase modules
jest.mock('firebase/firestore')
jest.mock('firebase/storage')
jest.mock('@/lib/firebase/config', () => ({
  db: { firestore: 'mock' },
  storage: { storage: 'mock' },
  auth: {
    currentUser: {
      uid: 'test-user-123',
      email: 'test@example.com'
    }
  }
}))

// Type the mocked functions
const mockCollection = collection as jest.MockedFunction<typeof collection>
const mockDoc = doc as jest.MockedFunction<typeof doc>
const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>
const mockDeleteDoc = deleteDoc as jest.MockedFunction<typeof deleteDoc>
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>
const mockQuery = query as jest.MockedFunction<typeof query>
const mockWhere = where as jest.MockedFunction<typeof where>
const mockOrderBy = orderBy as jest.MockedFunction<typeof orderBy>
const mockLimit = limit as jest.MockedFunction<typeof limit>
const mockOnSnapshot = onSnapshot as jest.MockedFunction<typeof onSnapshot>
const mockRef = ref as jest.MockedFunction<typeof ref>
const mockUploadBytes = uploadBytes as jest.MockedFunction<typeof uploadBytes>
const mockGetDownloadURL = getDownloadURL as jest.MockedFunction<typeof getDownloadURL>
const mockDeleteObject = deleteObject as jest.MockedFunction<typeof deleteObject>

describe('FirebaseKompostService', () => {
  const mockKomposition: Komposition = {
    id: 'test-kompo-123',
    userId: 'test-user-123',
    name: 'Test Komposition',
    revision: '1.0',
    dvlType: 'komposition',
    bpm: 120,
    segments: [],
    sources: [],
    config: {
      width: 1920,
      height: 1080,
      framerate: 30,
      extensionType: 'mp4'
    },
    tags: ['test', 'music'],
    description: 'A test komposition for unit testing'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('saveKomposition', () => {
    test('should create new komposition when id is not provided', async () => {
      const newKomposition = { ...mockKomposition }
      delete newKomposition.id

      const mockDocRef = { id: 'new-kompo-456' }
      mockCollection.mockReturnValue('mock-collection' as any)
      mockAddDoc.mockResolvedValue(mockDocRef as any)

      const result = await firebaseKompostService.saveKomposition(newKomposition)

      expect(mockCollection).toHaveBeenCalledWith(expect.anything(), 'kompositions')
      expect(mockAddDoc).toHaveBeenCalledWith(
        'mock-collection',
        expect.objectContaining({
          ...newKomposition,
          userId: 'test-user-123',
          createdAt: expect.anything(),
          updatedAt: expect.anything(),
          createdBy: 'test-user-123',
          lastModifiedBy: 'test-user-123'
        })
      )

      expect(result).toEqual({
        success: true,
        kompositionId: 'new-kompo-456',
        komposition: expect.objectContaining({
          id: 'new-kompo-456',
          name: 'Test Komposition'
        })
      })
    })

    test('should update existing komposition when id is provided', async () => {
      mockDoc.mockReturnValue('mock-doc-ref' as any)
      mockUpdateDoc.mockResolvedValue(undefined)

      const result = await firebaseKompostService.saveKomposition(mockKomposition)

      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'kompositions', 'test-kompo-123')
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        expect.objectContaining({
          ...mockKomposition,
          updatedAt: expect.anything(),
          lastModifiedBy: 'test-user-123'
        })
      )

      expect(result).toEqual({
        success: true,
        kompositionId: 'test-kompo-123',
        komposition: mockKomposition
      })
    })

    test('should handle save errors gracefully', async () => {
      const newKomposition = { ...mockKomposition }
      delete newKomposition.id

      mockCollection.mockReturnValue('mock-collection' as any)
      mockAddDoc.mockRejectedValue(new Error('Firebase save failed'))

      const result = await firebaseKompostService.saveKomposition(newKomposition)

      expect(result).toEqual({
        success: false,
        error: 'Firebase save failed'
      })
    })

    test('should handle missing user authentication', async () => {
      // Mock no authenticated user
      const originalAuth = require('@/lib/firebase/config').auth
      require('@/lib/firebase/config').auth.currentUser = null

      const result = await firebaseKompostService.saveKomposition(mockKomposition)

      expect(result).toEqual({
        success: false,
        error: 'User not authenticated'
      })

      // Restore mock
      require('@/lib/firebase/config').auth = originalAuth
    })
  })

  describe('loadKomposition', () => {
    test('should load existing komposition successfully', async () => {
      const mockDocSnap = {
        exists: () => true,
        id: 'test-kompo-123',
        data: () => ({
          ...mockKomposition,
          createdAt: { toDate: () => new Date('2024-01-01') },
          updatedAt: { toDate: () => new Date('2024-01-02') }
        })
      }

      mockDoc.mockReturnValue('mock-doc-ref' as any)
      mockGetDoc.mockResolvedValue(mockDocSnap as any)

      const result = await firebaseKompostService.loadKomposition('test-kompo-123')

      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'kompositions', 'test-kompo-123')
      expect(mockGetDoc).toHaveBeenCalledWith('mock-doc-ref')
      expect(result).toEqual({
        ...mockKomposition,
        id: 'test-kompo-123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02')
      })
    })

    test('should throw error when komposition does not exist', async () => {
      const mockDocSnap = {
        exists: () => false
      }

      mockDoc.mockReturnValue('mock-doc-ref' as any)
      mockGetDoc.mockResolvedValue(mockDocSnap as any)

      await expect(firebaseKompostService.loadKomposition('nonexistent-id'))
        .rejects.toThrow('Komposition not found')
    })

    test('should handle load errors gracefully', async () => {
      mockDoc.mockReturnValue('mock-doc-ref' as any)
      mockGetDoc.mockRejectedValue(new Error('Firebase load failed'))

      await expect(firebaseKompostService.loadKomposition('test-id'))
        .rejects.toThrow('Firebase load failed')
    })
  })

  describe('deleteKomposition', () => {
    test('should delete komposition successfully', async () => {
      mockDoc.mockReturnValue('mock-doc-ref' as any)
      mockDeleteDoc.mockResolvedValue(undefined)

      await firebaseKompostService.deleteKomposition('test-kompo-123')

      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'kompositions', 'test-kompo-123')
      expect(mockDeleteDoc).toHaveBeenCalledWith('mock-doc-ref')
    })

    test('should handle delete errors gracefully', async () => {
      mockDoc.mockReturnValue('mock-doc-ref' as any)
      mockDeleteDoc.mockRejectedValue(new Error('Firebase delete failed'))

      await expect(firebaseKompostService.deleteKomposition('test-id'))
        .rejects.toThrow('Firebase delete failed')
    })
  })

  describe('searchKompositions', () => {
    test('should search kompositions by name', async () => {
      const mockQuerySnapshot = {
        docs: [{
          id: 'kompo-1',
          data: () => ({ ...mockKomposition, name: 'Test Music' })
        }, {
          id: 'kompo-2', 
          data: () => ({ ...mockKomposition, name: 'Test Video' })
        }]
      }

      mockCollection.mockReturnValue('mock-collection' as any)
      mockQuery.mockReturnValue('mock-query' as any)
      mockWhere.mockReturnValue('mock-where' as any)
      mockOrderBy.mockReturnValue('mock-orderby' as any)
      mockLimit.mockReturnValue('mock-limit' as any)
      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any)

      const results = await firebaseKompostService.searchKompositions('test')

      expect(mockQuery).toHaveBeenCalled()
      expect(mockWhere).toHaveBeenCalledWith('userId', '==', 'test-user-123')
      expect(results).toHaveLength(2)
      expect(results[0]).toEqual({
        ...mockKomposition,
        id: 'kompo-1',
        name: 'Test Music'
      })
    })

    test('should return empty array when no results found', async () => {
      const mockQuerySnapshot = { docs: [] }

      mockCollection.mockReturnValue('mock-collection' as any)
      mockQuery.mockReturnValue('mock-query' as any)
      mockWhere.mockReturnValue('mock-where' as any)
      mockOrderBy.mockReturnValue('mock-orderby' as any)
      mockLimit.mockReturnValue('mock-limit' as any)
      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any)

      const results = await firebaseKompostService.searchKompositions('nonexistent')

      expect(results).toEqual([])
    })

    test('should handle search errors gracefully', async () => {
      mockCollection.mockReturnValue('mock-collection' as any)
      mockQuery.mockReturnValue('mock-query' as any)
      mockWhere.mockReturnValue('mock-where' as any)
      mockOrderBy.mockReturnValue('mock-orderby' as any)
      mockLimit.mockReturnValue('mock-limit' as any)
      mockGetDocs.mockRejectedValue(new Error('Firebase search failed'))

      await expect(firebaseKompostService.searchKompositions('test'))
        .rejects.toThrow('Firebase search failed')
    })
  })

  describe('getRecentKompositions', () => {
    test('should fetch recent kompositions for current user', async () => {
      const mockQuerySnapshot = {
        docs: [{
          id: 'recent-1',
          data: () => ({ 
            ...mockKomposition, 
            name: 'Recent Kompo 1',
            createdAt: { toDate: () => new Date('2024-01-02') }
          })
        }, {
          id: 'recent-2',
          data: () => ({ 
            ...mockKomposition, 
            name: 'Recent Kompo 2',
            createdAt: { toDate: () => new Date('2024-01-01') }
          })
        }]
      }

      mockCollection.mockReturnValue('mock-collection' as any)
      mockQuery.mockReturnValue('mock-query' as any)
      mockWhere.mockReturnValue('mock-where' as any)
      mockOrderBy.mockReturnValue('mock-orderby' as any)
      mockLimit.mockReturnValue('mock-limit' as any)
      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any)

      const results = await firebaseKompostService.getRecentKompositions()

      expect(mockWhere).toHaveBeenCalledWith('userId', '==', 'test-user-123')
      expect(mockOrderBy).toHaveBeenCalledWith('updatedAt', 'desc')
      expect(mockLimit).toHaveBeenCalledWith(10)
      expect(results).toHaveLength(2)
    })
  })

  describe('uploadSource', () => {
    test('should upload file successfully with progress callback', async () => {
      const mockFile = new File(['test content'], 'test.mp4', { type: 'video/mp4' })
      const mockProgressCallback = jest.fn()
      const mockStorageRef = 'mock-storage-ref'
      const mockUploadResult = { ref: mockStorageRef }
      const mockDownloadURL = 'https://firebase.storage/test.mp4'

      mockRef.mockReturnValue(mockStorageRef as any)
      mockUploadBytes.mockResolvedValue(mockUploadResult as any)
      mockGetDownloadURL.mockResolvedValue(mockDownloadURL)

      const result = await firebaseKompostService.uploadSource(mockFile, mockProgressCallback)

      expect(mockRef).toHaveBeenCalledWith(expect.anything(), expect.stringContaining('test.mp4'))
      expect(mockUploadBytes).toHaveBeenCalledWith(mockStorageRef, mockFile)
      expect(mockGetDownloadURL).toHaveBeenCalledWith(mockStorageRef)
      
      expect(result).toEqual({
        success: true,
        sourceId: expect.any(String),
        url: mockDownloadURL
      })
    })

    test('should handle upload errors gracefully', async () => {
      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' })
      const mockProgressCallback = jest.fn()

      mockRef.mockReturnValue('mock-ref' as any)
      mockUploadBytes.mockRejectedValue(new Error('Upload failed'))

      const result = await firebaseKompostService.uploadSource(mockFile, mockProgressCallback)

      expect(result).toEqual({
        success: false,
        error: 'Upload failed'
      })
    })

    test('should validate file types', async () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' })
      const mockProgressCallback = jest.fn()

      const result = await firebaseKompostService.uploadSource(invalidFile, mockProgressCallback)

      expect(result).toEqual({
        success: false,
        error: expect.stringContaining('Invalid file type')
      })
    })
  })

  describe('subscribeToKomposition', () => {
    test('should set up real-time subscription', () => {
      const mockCallback = jest.fn()
      const mockUnsubscribe = jest.fn()

      mockDoc.mockReturnValue('mock-doc-ref' as any)
      mockOnSnapshot.mockReturnValue(mockUnsubscribe)

      const unsubscribe = firebaseKompostService.subscribeToKomposition('test-id', mockCallback)

      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'kompositions', 'test-id')
      expect(mockOnSnapshot).toHaveBeenCalledWith('mock-doc-ref', expect.any(Function))
      expect(unsubscribe).toBe(mockUnsubscribe)
    })

    test('should handle subscription callback with document changes', () => {
      const mockCallback = jest.fn()
      let snapshotHandler: (snapshot: any) => void

      mockDoc.mockReturnValue('mock-doc-ref' as any)
      mockOnSnapshot.mockImplementation((ref, handler) => {
        snapshotHandler = handler
        return jest.fn()
      })

      firebaseKompostService.subscribeToKomposition('test-id', mockCallback)

      // Simulate document change
      const mockSnapshot = {
        exists: () => true,
        id: 'test-id',
        data: () => mockKomposition
      }

      snapshotHandler!(mockSnapshot)

      expect(mockCallback).toHaveBeenCalledWith({
        ...mockKomposition,
        id: 'test-id'
      })
    })
  })

  describe('createDefaultKomposition', () => {
    test('should create komposition with default values', () => {
      const result = firebaseKompostService.createDefaultKomposition('Test Song')

      expect(result).toEqual({
        name: 'Test Song',
        userId: 'test-user-123',
        revision: '1.0',
        dvlType: 'komposition',
        bpm: 120,
        segments: [],
        sources: [],
        config: {
          width: 1920,
          height: 1080,
          framerate: 30,
          extensionType: 'mp4'
        },
        tags: [],
        isPublic: false,
        sharedWith: []
      })
    })

    test('should use default name when none provided', () => {
      const result = firebaseKompostService.createDefaultKomposition()

      expect(result.name).toBe('Untitled Komposition')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    test('should handle network errors gracefully', async () => {
      mockCollection.mockImplementation(() => {
        throw new Error('Network error')
      })

      const result = await firebaseKompostService.saveKomposition(mockKomposition)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Network error')
    })

    test('should handle invalid komposition data', async () => {
      const invalidKomposition = {
        name: '', // Invalid: empty name
        bpm: -1    // Invalid: negative BPM
      } as any

      const result = await firebaseKompostService.saveKomposition(invalidKomposition)
      
      expect(result.success).toBe(false)
    })

    test('should handle Firebase quota exceeded', async () => {
      mockAddDoc.mockRejectedValue(new Error('Quota exceeded'))

      const result = await firebaseKompostService.saveKomposition(mockKomposition)

      expect(result).toEqual({
        success: false,
        error: 'Quota exceeded'
      })
    })
  })
})