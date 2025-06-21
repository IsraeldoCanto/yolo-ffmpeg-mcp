import { FirebaseKompostService, Komposition } from '../services/firebaseKompostService'

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

describe('Firebase Kompost Service - Core Unit Tests', () => {
  let service: FirebaseKompostService
  
  beforeEach(() => {
    service = new FirebaseKompostService()
    jest.clearAllMocks()
  })

  describe('createDefaultKomposition', () => {
    it('should create a komposition with all required fields', () => {
      const komposition = service.createDefaultKomposition('Test Komposition')
      
      // Check all required fields exist
      expect(komposition.userId).toBe('test-user-123')
      expect(komposition.name).toBe('Test Komposition')
      expect(komposition.revision).toBe('1.0')
      expect(komposition.dvlType).toBe('video')
      expect(komposition.bpm).toBe(120)
      expect(Array.isArray(komposition.segments)).toBe(true)
      expect(Array.isArray(komposition.sources)).toBe(true)
      expect(typeof komposition.config).toBe('object')
      expect(komposition.isPublic).toBe(false)
      expect(Array.isArray(komposition.sharedWith)).toBe(true)
      expect(Array.isArray(komposition.tags)).toBe(true)
    })

    it('should create valid video configuration', () => {
      const komposition = service.createDefaultKomposition()
      
      expect(komposition.config.width).toBe(1920)
      expect(komposition.config.height).toBe(1080)
      expect(komposition.config.framerate).toBe(30)
      expect(komposition.config.extensionType).toBe('mp4')
    })

    it('should use default name when none provided', () => {
      const komposition = service.createDefaultKomposition()
      expect(komposition.name).toBe('New Komposition')
    })

    it('should create valid BPM value', () => {
      const komposition = service.createDefaultKomposition()
      expect(komposition.bpm).toBeGreaterThanOrEqual(30)
      expect(komposition.bpm).toBeLessThanOrEqual(250)
    })

    it('should create empty arrays for collections', () => {
      const komposition = service.createDefaultKomposition()
      expect(komposition.segments).toEqual([])
      expect(komposition.sources).toEqual([])
      expect(komposition.sharedWith).toEqual([])
      expect(komposition.tags).toEqual([])
    })
  })

  describe('Data structure validation', () => {
    it('should create komposition compatible with Firestore rules', () => {
      const komposition = service.createDefaultKomposition('Valid Komposition')
      
      // Check that all required fields for Firestore rules are present
      const requiredFields = ['userId', 'name', 'revision', 'dvlType', 'bpm', 'segments', 'sources', 'config']
      
      for (const field of requiredFields) {
        expect(komposition).toHaveProperty(field)
      }
    })

    it('should create valid video config structure', () => {
      const komposition = service.createDefaultKomposition()
      const requiredConfigFields = ['width', 'height', 'framerate', 'extensionType']
      
      for (const field of requiredConfigFields) {
        expect(komposition.config).toHaveProperty(field)
      }
    })

    it('should have valid string fields', () => {
      const komposition = service.createDefaultKomposition('Test Name')
      
      expect(typeof komposition.userId).toBe('string')
      expect(typeof komposition.name).toBe('string')
      expect(typeof komposition.revision).toBe('string')
      expect(typeof komposition.dvlType).toBe('string')
      expect(komposition.name.length).toBeGreaterThan(0)
      expect(komposition.name.length).toBeLessThanOrEqual(100)
    })

    it('should have valid numeric fields', () => {
      const komposition = service.createDefaultKomposition()
      
      expect(typeof komposition.bpm).toBe('number')
      expect(typeof komposition.config.width).toBe('number')
      expect(typeof komposition.config.height).toBe('number')
      expect(typeof komposition.config.framerate).toBe('number')
      
      expect(komposition.config.width).toBeGreaterThan(0)
      expect(komposition.config.height).toBeGreaterThan(0)
      expect(komposition.config.framerate).toBeGreaterThan(0)
    })

    it('should have valid dvlType value', () => {
      const komposition = service.createDefaultKomposition()
      const validTypes = ['video', 'audio', 'image']
      expect(validTypes).toContain(komposition.dvlType)
    })
  })

  describe('Authentication handling', () => {
    it('should throw error when user not authenticated', () => {
      // Mock unauthenticated user
      const { auth } = require('../lib/firebase/config')
      const originalCurrentUser = auth.currentUser
      auth.currentUser = null
      
      expect(() => {
        service.createDefaultKomposition()
      }).toThrow('User not authenticated')
      
      // Restore
      auth.currentUser = originalCurrentUser
    })

    it('should use current user ID when authenticated', () => {
      const komposition = service.createDefaultKomposition()
      expect(komposition.userId).toBe('test-user-123')
    })
  })

  describe('Complex komposition creation', () => {
    it('should handle komposition with custom segments', () => {
      const komposition = service.createDefaultKomposition('Complex Test')
      
      // Add some segments
      komposition.segments = [
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
          duration: 5,
          end: 15
        }
      ]
      
      expect(komposition.segments).toHaveLength(2)
      expect(komposition.segments[0].id).toBe('seg1')
      expect(komposition.segments[1].duration).toBe(5)
    })

    it('should handle komposition with custom sources', () => {
      const komposition = service.createDefaultKomposition('Source Test')
      
      // Add some sources
      komposition.sources = [
        {
          id: 'src1',
          url: 'https://example.com/video.mp4',
          checksum: 'abc123',
          format: 'mp4',
          extensionType: 'video',
          mediaType: 'video/mp4',
          width: 1920,
          height: 1080
        }
      ]
      
      expect(komposition.sources).toHaveLength(1)
      expect(komposition.sources[0].mediaType).toBe('video/mp4')
    })

    it('should handle custom video configuration', () => {
      const komposition = service.createDefaultKomposition('Custom Config')
      
      // Modify config
      komposition.config = {
        width: 3840,
        height: 2160,
        framerate: 60,
        extensionType: 'mov'
      }
      
      expect(komposition.config.width).toBe(3840)
      expect(komposition.config.height).toBe(2160)
      expect(komposition.config.framerate).toBe(60)
      expect(komposition.config.extensionType).toBe('mov')
    })

    it('should handle beat pattern configuration', () => {
      const komposition = service.createDefaultKomposition('Beat Test')
      
      // Add beat pattern
      komposition.beatpattern = {
        fromBeat: 0,
        toBeat: 32,
        masterBPM: 128
      }
      
      expect(komposition.beatpattern.masterBPM).toBe(128)
      expect(komposition.beatpattern.toBeat).toBe(32)
    })

    it('should handle metadata fields', () => {
      const komposition = service.createDefaultKomposition('Metadata Test')
      
      // Add metadata
      komposition.tags = ['music', 'video', 'test']
      komposition.description = 'A test komposition with metadata'
      
      expect(komposition.tags).toContain('music')
      expect(komposition.description).toBe('A test komposition with metadata')
    })
  })

  describe('Service initialization', () => {
    it('should create service instance successfully', () => {
      expect(service).toBeInstanceOf(FirebaseKompostService)
    })

    it('should have all required methods', () => {
      const requiredMethods = [
        'createDefaultKomposition',
        'saveKomposition', 
        'loadKomposition',
        'deleteKomposition',
        'searchKompositions',
        'getRecentKompositions',
        'subscribeToKomposition',
        'subscribeToUserKompositions',
        'uploadSource',
        'deleteSource'
      ]
      
      for (const method of requiredMethods) {
        expect(typeof service[method]).toBe('function')
      }
    })
  })
})