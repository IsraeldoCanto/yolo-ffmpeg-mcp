import { FirebaseKompostService, Komposition, KompositionSaveResult } from '../services/firebaseKompostService'
import { auth, db } from '../lib/firebase/config'

// Mock Firebase modules
jest.mock('../lib/firebase/config', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-123',
      email: 'test@example.com'
    }
  },
  db: {},
  storage: {}
}))

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(() => ({ toDate: () => new Date() })),
  Timestamp: jest.fn()
}))

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn()
}))

import {
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

describe('FirebaseKompostService', () => {
  let service: FirebaseKompostService
  
  beforeEach(() => {
    service = new FirebaseKompostService()
    jest.clearAllMocks()
  })

  describe('createDefaultKomposition', () => {
    it('should create a komposition with default values', () => {
      const komposition = service.createDefaultKomposition('Test Komposition')
      
      expect(komposition).toMatchObject({
        userId: 'test-user-123',
        name: 'Test Komposition',
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
      })
    })

    it('should use default name when none provided', () => {
      const komposition = service.createDefaultKomposition()
      expect(komposition.name).toBe('New Komposition')
    })

    it('should throw error when user not authenticated', () => {
      // Mock unauthenticated user
      const originalCurrentUser = auth.currentUser
      ;(auth as any).currentUser = null
      
      expect(() => {
        service.createDefaultKomposition()
      }).toThrow('User not authenticated')
      
      // Restore
      ;(auth as any).currentUser = originalCurrentUser
    })
  })

  describe('saveKomposition', () => {
    const mockKomposition: Komposition = {
      userId: 'test-user-123',
      name: 'Test Komposition',
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
      }
    }

    it('should create new komposition when no ID provided', async () => {
      const mockDocRef = { id: 'new-komposition-id' }
      ;(addDoc as jest.Mock).mockResolvedValue(mockDocRef)

      const result = await service.saveKomposition(mockKomposition)

      expect(result.success).toBe(true)
      expect(result.kompositionId).toBe('new-komposition-id')
      expect(result.komposition?.id).toBe('new-komposition-id')
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...mockKomposition,
          userId: 'test-user-123',
          createdBy: 'test@example.com',
          isPublic: false,
          sharedWith: [],
          updatedAt: expect.anything(),
          createdAt: expect.anything(),
          lastModifiedBy: 'test@example.com'
        })
      )
    })

    it('should update existing komposition when ID provided', async () => {
      const existingKomposition = { ...mockKomposition, id: 'existing-id' }
      ;(updateDoc as jest.Mock).mockResolvedValue(undefined)

      const result = await service.saveKomposition(existingKomposition)

      expect(result.success).toBe(true)
      expect(result.kompositionId).toBe('existing-id')
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...existingKomposition,
          userId: 'test-user-123',
          lastModifiedBy: 'test@example.com',
          updatedAt: expect.anything()
        })
      )
    })

    it('should handle authentication error', async () => {
      // Mock unauthenticated user
      const originalCurrentUser = auth.currentUser
      ;(auth as any).currentUser = null

      const result = await service.saveKomposition(mockKomposition)

      expect(result.success).toBe(false)
      expect(result.error).toBe('User not authenticated')
      
      // Restore
      ;(auth as any).currentUser = originalCurrentUser
    })

    it('should handle Firebase errors', async () => {
      ;(addDoc as jest.Mock).mockRejectedValue(new Error('Firebase error'))

      const result = await service.saveKomposition(mockKomposition)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Firebase error')
    })
  })

  describe('loadKomposition', () => {
    const mockKompositionData = {
      userId: 'test-user-123',
      name: 'Test Komposition',
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
      createdAt: { toDate: () => new Date('2024-01-01') },
      updatedAt: { toDate: () => new Date('2024-01-02') }
    }

    it('should load komposition successfully', async () => {
      const mockDocSnap = {
        exists: () => true,
        id: 'test-id',
        data: () => mockKompositionData
      }
      ;(getDoc as jest.Mock).mockResolvedValue(mockDocSnap)

      const result = await service.loadKomposition('test-id')

      expect(result).toMatchObject({
        id: 'test-id',
        ...mockKompositionData,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z'
      })
    })

    it('should throw error when komposition not found', async () => {
      const mockDocSnap = {
        exists: () => false
      }
      ;(getDoc as jest.Mock).mockResolvedValue(mockDocSnap)

      await expect(service.loadKomposition('nonexistent-id')).rejects.toThrow('Komposition not found')
    })

    it('should throw error when user not authenticated', async () => {
      const originalCurrentUser = auth.currentUser
      ;(auth as any).currentUser = null

      // Mock getDoc to avoid "not found" error coming first
      const mockDocSnap = {
        exists: () => true,
        id: 'test-id',
        data: () => mockKompositionData
      }
      ;(getDoc as jest.Mock).mockResolvedValue(mockDocSnap)

      await expect(service.loadKomposition('test-id')).rejects.toThrow('User not authenticated')
      
      // Restore
      ;(auth as any).currentUser = originalCurrentUser
    })

    it('should throw error when access denied', async () => {
      const mockDocSnap = {
        exists: () => true,
        id: 'test-id',
        data: () => ({
          ...mockKompositionData,
          userId: 'different-user',
          isPublic: false,
          sharedWith: []
        })
      }
      ;(getDoc as jest.Mock).mockResolvedValue(mockDocSnap)

      await expect(service.loadKomposition('test-id')).rejects.toThrow('Access denied to this komposition')
    })

    it('should allow access to public kompositions', async () => {
      const mockDocSnap = {
        exists: () => true,
        id: 'test-id',
        data: () => ({
          ...mockKompositionData,
          userId: 'different-user',
          isPublic: true
        })
      }
      ;(getDoc as jest.Mock).mockResolvedValue(mockDocSnap)

      const result = await service.loadKomposition('test-id')
      expect(result.id).toBe('test-id')
    })

    it('should allow access to shared kompositions', async () => {
      const mockDocSnap = {
        exists: () => true,
        id: 'test-id',
        data: () => ({
          ...mockKompositionData,
          userId: 'different-user',
          isPublic: false,
          sharedWith: ['test-user-123']
        })
      }
      ;(getDoc as jest.Mock).mockResolvedValue(mockDocSnap)

      const result = await service.loadKomposition('test-id')
      expect(result.id).toBe('test-id')
    })
  })

  describe('deleteKomposition', () => {
    it('should delete komposition successfully', async () => {
      const mockDocSnap = {
        exists: () => true,
        data: () => ({ userId: 'test-user-123' })
      }
      ;(getDoc as jest.Mock).mockResolvedValue(mockDocSnap)
      ;(deleteDoc as jest.Mock).mockResolvedValue(undefined)

      await expect(service.deleteKomposition('test-id')).resolves.not.toThrow()
      expect(deleteDoc).toHaveBeenCalled()
    })

    it('should throw error when user not authenticated', async () => {
      const originalCurrentUser = auth.currentUser
      ;(auth as any).currentUser = null

      await expect(service.deleteKomposition('test-id')).rejects.toThrow('User not authenticated')
      
      // Restore
      ;(auth as any).currentUser = originalCurrentUser
    })

    it('should throw error when komposition not found', async () => {
      const mockDocSnap = {
        exists: () => false
      }
      ;(getDoc as jest.Mock).mockResolvedValue(mockDocSnap)

      await expect(service.deleteKomposition('test-id')).rejects.toThrow('Komposition not found')
    })

    it('should throw error when access denied', async () => {
      const mockDocSnap = {
        exists: () => true,
        data: () => ({ userId: 'different-user' })
      }
      ;(getDoc as jest.Mock).mockResolvedValue(mockDocSnap)

      await expect(service.deleteKomposition('test-id')).rejects.toThrow('Access denied: You can only delete your own kompositions')
    })
  })

  describe('searchKompositions', () => {
    const mockKompositions = [
      {
        id: 'kompo1',
        name: 'First Komposition',
        userId: 'test-user-123',
        createdAt: { toDate: () => new Date('2024-01-01') },
        updatedAt: { toDate: () => new Date('2024-01-01') }
      },
      {
        id: 'kompo2', 
        name: 'Second Komposition',
        userId: 'test-user-123',
        createdAt: { toDate: () => new Date('2024-01-02') },
        updatedAt: { toDate: () => new Date('2024-01-02') }
      }
    ]

    beforeEach(() => {
      // Reset mocks for each test
      jest.clearAllMocks()
    })

    it('should search kompositions by name', async () => {
      const mockQuerySnapshot = {
        docs: mockKompositions.map(kompo => ({
          id: kompo.id,
          data: () => kompo
        }))
      }
      ;(getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot)

      const result = await service.searchKompositions('First')

      expect(result).toHaveLength(2)
      expect(getDocs).toHaveBeenCalled()
    })

    it('should return all kompositions when no search query', async () => {
      const mockQuerySnapshot = {
        docs: mockKompositions.map(kompo => ({
          id: kompo.id,
          data: () => kompo
        }))
      }
      ;(getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot)

      const result = await service.searchKompositions('')

      expect(result).toHaveLength(2)
      expect(getDocs).toHaveBeenCalled()
    })

    it('should return empty array when user not authenticated', async () => {
      const originalCurrentUser = auth.currentUser
      ;(auth as any).currentUser = null

      const result = await service.searchKompositions('test')
      expect(result).toEqual([])
      
      // Restore
      ;(auth as any).currentUser = originalCurrentUser
    })

    it('should handle errors gracefully', async () => {
      ;(getDocs as jest.Mock).mockRejectedValue(new Error('Firebase error'))

      const result = await service.searchKompositions('test')
      expect(result).toEqual([])
    })
  })

  describe('getRecentKompositions', () => {
    it('should get recent kompositions', async () => {
      const mockKompositions = [
        {
          id: 'recent1',
          name: 'Recent Komposition',
          userId: 'test-user-123',
          updatedAt: { toDate: () => new Date('2024-01-02') }
        }
      ]
      
      const mockQuerySnapshot = {
        docs: mockKompositions.map(kompo => ({
          id: kompo.id,
          data: () => kompo
        }))
      }
      ;(getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot)

      const result = await service.getRecentKompositions(5)

      expect(result).toHaveLength(1)
      expect(limit).toHaveBeenCalledWith(5)
    })

    it('should return empty array when user not authenticated', async () => {
      const originalCurrentUser = auth.currentUser
      ;(auth as any).currentUser = null

      const result = await service.getRecentKompositions()
      expect(result).toEqual([])
      
      // Restore
      ;(auth as any).currentUser = originalCurrentUser
    })
  })

  describe('subscribeToKomposition', () => {
    it('should set up real-time subscription', () => {
      const mockCallback = jest.fn()
      const mockUnsubscribe = jest.fn()
      ;(onSnapshot as jest.Mock).mockReturnValue(mockUnsubscribe)

      const unsubscribe = service.subscribeToKomposition('test-id', mockCallback)

      expect(onSnapshot).toHaveBeenCalled()
      expect(unsubscribe).toBe(mockUnsubscribe)
    })

    it('should handle subscription data correctly', () => {
      const mockCallback = jest.fn()
      let subscriptionCallback: any
      
      ;(onSnapshot as jest.Mock).mockImplementation((docRef, callback) => {
        subscriptionCallback = callback
        return jest.fn()
      })

      service.subscribeToKomposition('test-id', mockCallback)

      // Simulate document exists
      const mockDoc = {
        exists: () => true,
        id: 'test-id',
        data: () => ({
          name: 'Test',
          userId: 'test-user-123',
          createdAt: { toDate: () => new Date('2024-01-01') },
          updatedAt: { toDate: () => new Date('2024-01-01') }
        })
      }

      subscriptionCallback(mockDoc)
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-id',
          name: 'Test'
        })
      )

      // Simulate document doesn't exist
      const mockNonExistentDoc = {
        exists: () => false
      }

      subscriptionCallback(mockNonExistentDoc)
      expect(mockCallback).toHaveBeenCalledWith(null)
    })
  })

  describe('subscribeToUserKompositions', () => {
    it('should set up user kompositions subscription', () => {
      const mockCallback = jest.fn()
      const mockUnsubscribe = jest.fn()
      ;(onSnapshot as jest.Mock).mockReturnValue(mockUnsubscribe)

      const unsubscribe = service.subscribeToUserKompositions(mockCallback)

      expect(onSnapshot).toHaveBeenCalled()
      expect(unsubscribe).toBe(mockUnsubscribe)
    })

    it('should return empty function when user not authenticated', () => {
      const originalCurrentUser = auth.currentUser
      ;(auth as any).currentUser = null

      const mockCallback = jest.fn()
      const unsubscribe = service.subscribeToUserKompositions(mockCallback)

      expect(mockCallback).toHaveBeenCalledWith([])
      expect(typeof unsubscribe).toBe('function')
      
      // Restore
      ;(auth as any).currentUser = originalCurrentUser
    })
  })

  describe('Data validation', () => {
    it('should validate komposition structure', () => {
      const validKomposition = service.createDefaultKomposition('Valid')
      
      expect(validKomposition).toHaveProperty('userId')
      expect(validKomposition).toHaveProperty('name')
      expect(validKomposition).toHaveProperty('revision')
      expect(validKomposition).toHaveProperty('dvlType')
      expect(validKomposition).toHaveProperty('bpm')
      expect(validKomposition).toHaveProperty('segments')
      expect(validKomposition).toHaveProperty('sources')
      expect(validKomposition).toHaveProperty('config')
      
      expect(validKomposition.config).toHaveProperty('width')
      expect(validKomposition.config).toHaveProperty('height')
      expect(validKomposition.config).toHaveProperty('framerate')
      expect(validKomposition.config).toHaveProperty('extensionType')
    })

    it('should validate BPM range in default komposition', () => {
      const komposition = service.createDefaultKomposition()
      expect(komposition.bpm).toBeGreaterThanOrEqual(30)
      expect(komposition.bpm).toBeLessThanOrEqual(250)
    })

    it('should validate video config in default komposition', () => {
      const komposition = service.createDefaultKomposition()
      expect(komposition.config.width).toBeGreaterThan(0)
      expect(komposition.config.height).toBeGreaterThan(0)
      expect(komposition.config.framerate).toBeGreaterThan(0)
      expect(['video', 'audio', 'image']).toContain(komposition.dvlType)
    })
  })
})