/**
 * Firebase Test Utilities - Firebase-level mocking for integration tests
 * 
 * This module provides Firebase emulator setup and test data seeding
 * for testing kompostEdit functionality with controlled Firebase data.
 */

import { initializeApp, getApps, deleteApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator, collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore'
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { Komposition } from '../services/firebaseKompostService'

// Test Firebase configuration
const testFirebaseConfig = {
  apiKey: 'test-api-key',
  authDomain: 'test-project.firebaseapp.com',
  projectId: 'test-project',
  storageBucket: 'test-project.appspot.com',
  messagingSenderId: '123456789',
  appId: 'test-app-id'
}

// Test user credentials
export const TEST_USERS = {
  primary: {
    email: 'test@example.com',
    password: 'testpassword123',
    uid: 'test-user-123',
    displayName: 'Test User'
  },
  secondary: {
    email: 'test2@example.com', 
    password: 'testpassword456',
    uid: 'test-user-456',
    displayName: 'Test User 2'
  }
}

// Firebase emulator ports
const EMULATOR_PORTS = {
  auth: 9099,
  firestore: 8080,
  storage: 9199
}

let testApp: any = null
let testDb: any = null
let testAuth: any = null
let testStorage: any = null

/**
 * Initialize Firebase emulator for testing
 */
export async function initializeFirebaseEmulator(): Promise<{
  app: any,
  db: any,
  auth: any,
  storage: any
}> {
  try {
    // Clean up existing apps
    const existingApps = getApps()
    await Promise.all(existingApps.map(app => deleteApp(app)))

    // Initialize test app
    testApp = initializeApp(testFirebaseConfig, 'test-app')
    testDb = getFirestore(testApp)
    testAuth = getAuth(testApp)
    testStorage = getStorage(testApp)

    // Connect to emulators
    try {
      connectFirestoreEmulator(testDb, 'localhost', EMULATOR_PORTS.firestore)
      connectAuthEmulator(testAuth, `http://localhost:${EMULATOR_PORTS.auth}`)
      connectStorageEmulator(testStorage, 'localhost', EMULATOR_PORTS.storage)
    } catch (error: any) {
      // Emulators might already be connected
      if (!error.message.includes('already been called')) {
        throw error
      }
    }

    console.log('🔥 Firebase emulator initialized for testing')
    
    return {
      app: testApp,
      db: testDb,
      auth: testAuth,
      storage: testStorage
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase emulator:', error)
    throw error
  }
}

/**
 * Create test user and sign them in
 */
export async function createAndSignInTestUser(userInfo = TEST_USERS.primary): Promise<any> {
  if (!testAuth) {
    throw new Error('Firebase emulator not initialized')
  }

  try {
    // Try to create user (might already exist)
    try {
      await createUserWithEmailAndPassword(testAuth, userInfo.email, userInfo.password)
      console.log(`👤 Created test user: ${userInfo.email}`)
    } catch (error: any) {
      if (!error.code?.includes('already-in-use')) {
        throw error
      }
      console.log(`👤 Test user already exists: ${userInfo.email}`)
    }

    // Sign in the user
    const userCredential = await signInWithEmailAndPassword(testAuth, userInfo.email, userInfo.password)
    console.log(`🔐 Signed in test user: ${userInfo.email}`)
    
    return userCredential.user
  } catch (error) {
    console.error('❌ Failed to create/sign in test user:', error)
    throw error
  }
}

/**
 * Seed test data into Firebase emulator
 */
export async function seedTestData(): Promise<void> {
  if (!testDb || !testAuth) {
    throw new Error('Firebase emulator not initialized')
  }

  // Ensure we have a signed-in user
  if (!testAuth.currentUser) {
    await createAndSignInTestUser()
  }

  const testKompositions: Komposition[] = [
    {
      id: 'test-kompo-001',
      userId: TEST_USERS.primary.uid,
      name: 'Summer Vibes Mix',
      revision: '1.0',
      dvlType: 'video',
      bpm: 128,
      segments: [
        {
          id: 'seg-001',
          sourceId: 'src-001',
          start: 0,
          duration: 30,
          end: 30
        }
      ],
      sources: [
        {
          id: 'src-001',
          url: 'https://storage.googleapis.com/test-bucket/test-video.mp4',
          checksum: 'abc123def456',
          format: 'mp4',
          extensionType: 'video',
          mediaType: 'video/mp4',
          width: 1920,
          height: 1080,
          startingOffset: 0
        }
      ],
      config: {
        width: 1920,
        height: 1080,
        framerate: 30,
        extensionType: 'mp4'
      },
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T15:45:00Z',
      createdBy: TEST_USERS.primary.email,
      lastModifiedBy: TEST_USERS.primary.email,
      isPublic: false,
      sharedWith: [],
      tags: ['summer', 'upbeat', 'test'],
      description: 'A test komposition for summer vibes'
    },
    {
      id: 'test-kompo-002',
      userId: TEST_USERS.primary.uid,
      name: 'Chill Lo-Fi Session',
      revision: '2.1',
      dvlType: 'audio',
      bpm: 85,
      segments: [],
      sources: [],
      config: {
        width: 1280,
        height: 720,
        framerate: 24,
        extensionType: 'mp4'
      },
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-14T16:20:00Z',
      createdBy: TEST_USERS.primary.email,
      lastModifiedBy: TEST_USERS.primary.email,
      isPublic: true,
      sharedWith: [TEST_USERS.secondary.uid],
      tags: ['lofi', 'chill', 'ambient'],
      description: 'Relaxing lo-fi beats for studying'
    },
    {
      id: 'test-kompo-003',
      userId: TEST_USERS.primary.uid,
      name: 'Electronic Dance Remix',
      revision: '1.5',
      dvlType: 'video',
      bpm: 140,
      segments: [],
      sources: [],
      config: {
        width: 1920,
        height: 1080,
        framerate: 60,
        extensionType: 'mp4'
      },
      beatpattern: {
        fromBeat: 0,
        toBeat: 64,
        masterBPM: 140
      },
      createdAt: '2024-01-08T14:22:00Z',
      updatedAt: '2024-01-12T11:15:00Z',
      createdBy: TEST_USERS.primary.email,
      lastModifiedBy: TEST_USERS.primary.email,
      isPublic: false,
      sharedWith: [],
      tags: ['electronic', 'dance', 'remix', 'high-energy'],
      description: 'High-energy electronic dance remix'
    },
    {
      id: 'test-kompo-004',
      userId: TEST_USERS.primary.uid,
      name: 'Acoustic Guitar Study',
      revision: '1.0',
      dvlType: 'audio',
      bpm: 72,
      segments: [],
      sources: [],
      config: {
        width: 1920,
        height: 1080,
        framerate: 30,
        extensionType: 'mp4'
      },
      createdAt: '2024-01-05T08:45:00Z',
      updatedAt: '2024-01-05T12:30:00Z',
      createdBy: TEST_USERS.primary.email,
      lastModifiedBy: TEST_USERS.primary.email,
      isPublic: false,
      sharedWith: [],
      tags: ['acoustic', 'guitar', 'folk'],
      description: 'Gentle acoustic guitar melodies'
    },
    {
      id: 'test-kompo-005',
      userId: TEST_USERS.primary.uid,
      name: 'Hip-Hop Beat Collection',
      revision: '3.0',
      dvlType: 'video',
      bpm: 95,
      segments: [],
      sources: [],
      config: {
        width: 1920,
        height: 1080,
        framerate: 30,
        extensionType: 'mp4'
      },
      createdAt: '2024-01-01T20:00:00Z',
      updatedAt: '2024-01-13T09:10:00Z',
      createdBy: TEST_USERS.primary.email,
      lastModifiedBy: TEST_USERS.primary.email,
      isPublic: true,
      sharedWith: [TEST_USERS.secondary.uid],
      tags: ['hiphop', 'beats', 'urban', 'collection'],
      description: 'Collection of hip-hop beats and rhythms'
    }
  ]

  try {
    // Clear existing test data
    await clearTestData()

    // Add test kompositions
    for (const komposition of testKompositions) {
      const docRef = doc(testDb, 'kompositions', komposition.id!)
      const { id, ...dataWithoutId } = komposition
      await setDoc(docRef, dataWithoutId)
    }

    console.log(`🌱 Seeded ${testKompositions.length} test kompositions`)

  } catch (error) {
    console.error('❌ Failed to seed test data:', error)
    throw error
  }
}

/**
 * Clear all test data from Firebase emulator
 */
export async function clearTestData(): Promise<void> {
  if (!testDb) {
    throw new Error('Firebase emulator not initialized')
  }

  try {
    // Clear kompositions
    const kompositionsSnapshot = await getDocs(collection(testDb, 'kompositions'))
    const deletePromises = kompositionsSnapshot.docs.map(doc => deleteDoc(doc.ref))
    await Promise.all(deletePromises)

    // Clear sources
    const sourcesSnapshot = await getDocs(collection(testDb, 'sources'))
    const sourceDeletePromises = sourcesSnapshot.docs.map(doc => deleteDoc(doc.ref))
    await Promise.all(sourceDeletePromises)

    console.log('🧹 Cleared all test data from Firebase emulator')
  } catch (error) {
    console.error('❌ Failed to clear test data:', error)
    throw error
  }
}

/**
 * Clean up Firebase emulator
 */
export async function cleanupFirebaseEmulator(): Promise<void> {
  try {
    if (testAuth?.currentUser) {
      await testAuth.signOut()
    }

    // Clear test data
    await clearTestData()

    // Delete apps
    const apps = getApps()
    await Promise.all(apps.map(app => deleteApp(app)))

    testApp = null
    testDb = null
    testAuth = null
    testStorage = null

    console.log('🧹 Firebase emulator cleaned up')
  } catch (error) {
    console.error('❌ Failed to cleanup Firebase emulator:', error)
    throw error
  }
}

/**
 * Get current Firebase instances (for direct testing)
 */
export function getFirebaseInstances() {
  return {
    app: testApp,
    db: testDb,
    auth: testAuth,
    storage: testStorage
  }
}

/**
 * Helper to run tests with Firebase emulator
 */
export async function withFirebaseEmulator<T>(
  testFn: () => Promise<T> | T
): Promise<T> {
  try {
    await initializeFirebaseEmulator()
    await seedTestData()
    
    const result = await testFn()
    
    return result
  } finally {
    await cleanupFirebaseEmulator()
  }
}

/**
 * Jest setup helper for Firebase emulator tests
 */
export function setupFirebaseEmulatorForJest() {
  beforeAll(async () => {
    await initializeFirebaseEmulator()
    await seedTestData()
  })

  afterAll(async () => {
    await cleanupFirebaseEmulator()
  })

  beforeEach(async () => {
    // Ensure clean state for each test
    await clearTestData()
    await seedTestData()
    await createAndSignInTestUser()
  })
}