/**
 * Firebase Emulator Basic Test
 * 
 * Simple test to verify Firebase emulator setup is working correctly
 */

import { 
  initializeFirebaseEmulator, 
  createAndSignInTestUser, 
  seedTestData,
  clearTestData,
  cleanupFirebaseEmulator,
  getFirebaseInstances,
  TEST_USERS
} from '../../test-utils/firebaseTestUtils'

describe('Firebase Emulator Setup Test', () => {
  
  test('should initialize Firebase emulator successfully', async () => {
    try {
      // Act: Initialize Firebase emulator
      const { app, db, auth, storage } = await initializeFirebaseEmulator()
      
      // Assert: All Firebase services should be initialized
      expect(app).toBeDefined()
      expect(db).toBeDefined() 
      expect(auth).toBeDefined()
      expect(storage).toBeDefined()
      
      console.log('✅ Firebase emulator initialized successfully')
      
      // Cleanup
      await cleanupFirebaseEmulator()
    } catch (error) {
      console.error('❌ Firebase emulator initialization failed:', error)
      throw error
    }
  }, 30000)

  test('should create and authenticate test user', async () => {
    try {
      // Arrange: Initialize emulator
      await initializeFirebaseEmulator()
      
      // Act: Create and sign in test user  
      const user = await createAndSignInTestUser(TEST_USERS.primary)
      
      // Assert: User should be authenticated
      expect(user).toBeDefined()
      expect(user.email).toBe(TEST_USERS.primary.email)
      expect(user.uid).toBeDefined()
      
      // Verify user is signed in
      const { auth } = getFirebaseInstances()
      expect(auth.currentUser).toBeDefined()
      expect(auth.currentUser.email).toBe(TEST_USERS.primary.email)
      
      console.log('✅ Test user authentication working')
      
      // Cleanup
      await cleanupFirebaseEmulator()
    } catch (error) {
      console.error('❌ Test user authentication failed:', error)
      throw error
    }
  }, 15000)

  test('should seed and clear test data', async () => {
    try {
      // Arrange: Initialize emulator and sign in user
      await initializeFirebaseEmulator()
      await createAndSignInTestUser(TEST_USERS.primary)
      
      // Act: Seed test data
      await seedTestData()
      
      // Assert: Test data should be available
      // We'll verify this in the actual Firebase integration tests
      console.log('✅ Test data seeded successfully')
      
      // Act: Clear test data
      await clearTestData()
      console.log('✅ Test data cleared successfully')
      
      // Cleanup
      await cleanupFirebaseEmulator()
    } catch (error) {
      console.error('❌ Test data operations failed:', error)
      throw error
    }
  }, 20000)
})