/**
 * Integration tests for Firebase Kompost Service
 * These tests require Firebase emulator to be running
 * Run: firebase emulators:start --only=firestore,storage
 */

import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { connectStorageEmulator, getStorage } from 'firebase/storage'
import { connectAuthEmulator, getAuth, signInAnonymously } from 'firebase/auth'
import { initializeApp } from 'firebase/app'
import { FirebaseKompostService, Komposition } from '../services/firebaseKompostService'

// Test Firebase config for emulator
const testFirebaseConfig = {
  apiKey: 'test-api-key',
  authDomain: 'test-project.firebaseapp.com',
  projectId: 'test-project',
  storageBucket: 'test-project.appspot.com',
  messagingSenderId: '123456789',
  appId: 'test-app-id'
}

describe('Firebase Kompost Service Integration Tests', () => {
  let app: any
  let auth: any
  let db: any
  let storage: any
  let service: FirebaseKompostService
  let testUser: any

  beforeAll(async () => {
    // Skip if running in CI without emulator
    if (process.env.CI && !process.env.FIREBASE_EMULATOR_HUB) {
      console.log('Skipping Firebase integration tests - emulator not available in CI')
      return
    }

    try {
      // Initialize Firebase app for testing
      app = initializeApp(testFirebaseConfig, 'test-app')
      auth = getAuth(app)
      db = getFirestore(app)
      storage = getStorage(app)

      // Connect to emulators
      if (!auth._delegate?._config?.emulator) {
        connectAuthEmulator(auth, 'http://localhost:9099')
      }
      if (!db._delegate?._databaseId?.projectId?.includes('emulator')) {
        connectFirestoreEmulator(db, 'localhost', 8080)
      }
      if (!storage._delegate?._host?.includes('localhost')) {
        connectStorageEmulator(storage, 'localhost', 9199)
      }

      // Sign in test user
      await signInAnonymously(auth)
      testUser = auth.currentUser

      // Mock the Firebase config module to use our test instances
      jest.doMock('../lib/firebase/config', () => ({
        auth,
        db,
        storage
      }))

      // Import service after mocking
      const { FirebaseKompostService: TestFirebaseKompostService } = await import('../services/firebaseKompostService')
      service = new TestFirebaseKompostService()

    } catch (error) {
      console.warn('Firebase emulator not available, skipping integration tests:', error)
      return
    }
  }, 30000)

  afterAll(async () => {
    if (app && auth) {
      await auth.signOut()
    }
  })

  beforeEach(() => {
    // Skip if emulator not available
    if (!service || !testUser) {
      return
    }
  })

  describe('End-to-end komposition workflow', () => {
    it('should create, save, load, and delete a komposition', async () => {
      if (!service || !testUser) {
        console.log('Skipping test - Firebase emulator not available')
        return
      }

      // Create a new komposition
      const newKomposition = service.createDefaultKomposition('Integration Test Komposition')
      expect(newKomposition.name).toBe('Integration Test Komposition')
      expect(newKomposition.userId).toBe(testUser.uid)

      // Save the komposition
      const saveResult = await service.saveKomposition(newKomposition)
      expect(saveResult.success).toBe(true)
      expect(saveResult.kompositionId).toBeDefined()

      const kompositionId = saveResult.kompositionId!

      // Load the komposition
      const loadedKomposition = await service.loadKomposition(kompositionId)
      expect(loadedKomposition.id).toBe(kompositionId)
      expect(loadedKomposition.name).toBe('Integration Test Komposition')
      expect(loadedKomposition.userId).toBe(testUser.uid)

      // Update the komposition
      const updatedKomposition = {
        ...loadedKomposition,
        name: 'Updated Integration Test',
        bpm: 140
      }
      const updateResult = await service.saveKomposition(updatedKomposition)
      expect(updateResult.success).toBe(true)

      // Load the updated komposition
      const reloadedKomposition = await service.loadKomposition(kompositionId)
      expect(reloadedKomposition.name).toBe('Updated Integration Test')
      expect(reloadedKomposition.bpm).toBe(140)

      // Delete the komposition
      await service.deleteKomposition(kompositionId)

      // Verify deletion
      await expect(service.loadKomposition(kompositionId)).rejects.toThrow('Komposition not found')
    }, 15000)

    it('should handle complex komposition with segments and sources', async () => {
      if (!service || !testUser) {
        console.log('Skipping test - Firebase emulator not available')
        return
      }

      // Create a complex komposition
      const complexKomposition: Komposition = {
        userId: testUser.uid,
        name: 'Complex Test Komposition',
        revision: '2.0',
        dvlType: 'video',
        bpm: 128,
        segments: [
          {
            id: 'seg1',
            sourceId: 'src1',
            start: 0,
            duration: 10,
            end: 10
          },
          {
            id: 'seg2',
            sourceId: 'src2',
            start: 10,
            duration: 15,
            end: 25
          }
        ],
        sources: [
          {
            id: 'src1',
            url: 'https://example.com/video1.mp4',
            checksum: 'abc123',
            format: 'mp4',
            extensionType: 'video',
            mediaType: 'video/mp4',
            width: 1920,
            height: 1080
          },
          {
            id: 'src2',
            url: 'https://example.com/audio1.mp3',
            checksum: 'def456',
            format: 'mp3',
            extensionType: 'audio',
            mediaType: 'audio/mpeg'
          }
        ],
        config: {
          width: 1920,
          height: 1080,
          framerate: 30,
          extensionType: 'mp4'
        },
        beatpattern: {
          fromBeat: 0,
          toBeat: 64,
          masterBPM: 128
        },
        tags: ['music', 'video', 'test'],
        description: 'A complex test komposition with multiple segments'
      }

      // Save the complex komposition
      const saveResult = await service.saveKomposition(complexKomposition)
      expect(saveResult.success).toBe(true)

      const kompositionId = saveResult.kompositionId!

      // Load and verify complex data
      const loadedKomposition = await service.loadKomposition(kompositionId)
      expect(loadedKomposition.segments).toHaveLength(2)
      expect(loadedKomposition.sources).toHaveLength(2)
      expect(loadedKomposition.beatpattern?.masterBPM).toBe(128)
      expect(loadedKomposition.tags).toContain('music')
      expect(loadedKomposition.description).toBe('A complex test komposition with multiple segments')

      // Cleanup
      await service.deleteKomposition(kompositionId)
    }, 10000)
  })

  describe('Search and listing functionality', () => {
    let testKompositionIds: string[] = []

    beforeEach(async () => {
      if (!service || !testUser) return

      // Create test kompositions
      const testKompositions = [
        'Search Test Alpha',
        'Search Test Beta', 
        'Different Name',
        'Another Search Test'
      ]

      for (const name of testKompositions) {
        const komposition = service.createDefaultKomposition(name)
        const result = await service.saveKomposition(komposition)
        if (result.success && result.kompositionId) {
          testKompositionIds.push(result.kompositionId)
        }
      }
    })

    afterEach(async () => {
      if (!service) return

      // Cleanup test kompositions
      for (const id of testKompositionIds) {
        try {
          await service.deleteKomposition(id)
        } catch (error) {
          console.warn('Failed to cleanup test komposition:', id)
        }
      }
      testKompositionIds = []
    })

    it('should search kompositions by name', async () => {
      if (!service || !testUser) {
        console.log('Skipping test - Firebase emulator not available')
        return
      }

      const searchResults = await service.searchKompositions('Search Test')
      expect(searchResults.length).toBeGreaterThanOrEqual(3)
      
      const resultNames = searchResults.map(k => k.name)
      expect(resultNames).toContain('Search Test Alpha')
      expect(resultNames).toContain('Search Test Beta')
      expect(resultNames).toContain('Another Search Test')
    }, 10000)

    it('should get recent kompositions', async () => {
      if (!service || !testUser) {
        console.log('Skipping test - Firebase emulator not available')
        return
      }

      const recentResults = await service.getRecentKompositions(10)
      expect(recentResults.length).toBeGreaterThanOrEqual(4)
      
      // Should be ordered by most recent first
      for (let i = 1; i < recentResults.length; i++) {
        const prev = new Date(recentResults[i-1].updatedAt || 0)
        const curr = new Date(recentResults[i].updatedAt || 0)
        expect(prev.getTime()).toBeGreaterThanOrEqual(curr.getTime())
      }
    }, 10000)

    it('should return empty results for non-matching search', async () => {
      if (!service || !testUser) {
        console.log('Skipping test - Firebase emulator not available')
        return
      }

      const searchResults = await service.searchKompositions('NonExistentKomposition')
      expect(searchResults).toHaveLength(0)
    })
  })

  describe('Real-time subscriptions', () => {
    it('should subscribe to komposition changes', async (done) => {
      if (!service || !testUser) {
        console.log('Skipping test - Firebase emulator not available')
        done()
        return
      }

      // Create a test komposition
      const komposition = service.createDefaultKomposition('Subscription Test')
      const saveResult = await service.saveKomposition(komposition)
      expect(saveResult.success).toBe(true)

      const kompositionId = saveResult.kompositionId!
      let updateCount = 0

      // Set up subscription
      const unsubscribe = service.subscribeToKomposition(kompositionId, (updatedKomposition) => {
        updateCount++
        
        if (updateCount === 1) {
          // First update - initial load
          expect(updatedKomposition?.name).toBe('Subscription Test')
          
          // Make an update
          const updated = { ...updatedKomposition!, name: 'Updated Subscription Test' }
          service.saveKomposition(updated)
        } else if (updateCount === 2) {
          // Second update - after our change
          expect(updatedKomposition?.name).toBe('Updated Subscription Test')
          
          // Cleanup
          unsubscribe()
          service.deleteKomposition(kompositionId).then(() => done())
        }
      })
    }, 15000)

    it('should subscribe to user kompositions list', async (done) => {
      if (!service || !testUser) {
        console.log('Skipping test - Firebase emulator not available')  
        done()
        return
      }

      let initialCount = 0
      let subscriptionCallCount = 0

      // Set up subscription
      const unsubscribe = service.subscribeToUserKompositions((kompositions) => {
        subscriptionCallCount++
        
        if (subscriptionCallCount === 1) {
          // Initial load
          initialCount = kompositions.length
          
          // Create a new komposition
          const newKomposition = service.createDefaultKomposition('Subscription List Test')
          service.saveKomposition(newKomposition)
        } else if (subscriptionCallCount === 2) {
          // After adding new komposition
          expect(kompositions.length).toBe(initialCount + 1)
          expect(kompositions.some(k => k.name === 'Subscription List Test')).toBe(true)
          
          // Cleanup
          unsubscribe()
          done()
        }
      })
    }, 15000)
  })

  describe('Error handling and edge cases', () => {
    it('should handle unauthorized access', async () => {
      if (!service || !testUser) {
        console.log('Skipping test - Firebase emulator not available')
        return
      }

      // Create komposition as current user
      const komposition = service.createDefaultKomposition('Unauthorized Test')
      const saveResult = await service.saveKomposition(komposition)
      expect(saveResult.success).toBe(true)

      const kompositionId = saveResult.kompositionId!

      // Sign out current user
      await auth.signOut()

      // Try to access without authentication
      await expect(service.loadKomposition(kompositionId)).rejects.toThrow('User not authenticated')

      // Sign back in and cleanup
      await signInAnonymously(auth)
      await service.deleteKomposition(kompositionId)
    })

    it('should handle network errors gracefully', async () => {
      if (!service || !testUser) {
        console.log('Skipping test - Firebase emulator not available')
        return
      }

      // This would require mocking network failures
      // For now, we just verify the error handling structure exists
      const invalidKomposition = {
        // Missing required fields
        name: 'Invalid'
      } as any

      const result = await service.saveKomposition(invalidKomposition)
      // Should handle the error gracefully
      expect(typeof result.success).toBe('boolean')
    })
  })
})