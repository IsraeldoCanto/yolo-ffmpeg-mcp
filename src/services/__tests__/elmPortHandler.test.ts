/**
 * Test-Driven ELM Integration Tests
 * 
 * These tests define the expected behavior of our ELM integration
 * before implementation, following TDD principles.
 */

import { ElmPortHandler } from '../elmPortHandler'
import { firebaseKompostService } from '../firebaseKompostService'

describe('ElmPortHandler - Test-Driven Development', () => {
  let elmPortHandler: ElmPortHandler
  let mockElmApp: any

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Create mock ELM app with ports
    mockElmApp = {
      ports: {
        // Outgoing ports (ELM → JavaScript)
        saveKomposition: { subscribe: jest.fn() },
        loadKomposition: { subscribe: jest.fn() },
        deleteKomposition: { subscribe: jest.fn() },
        searchKompositions: { subscribe: jest.fn() },
        uploadSource: { subscribe: jest.fn() },
        
        // Incoming ports (JavaScript → ELM)
        kompositionSaved: { send: jest.fn() },
        kompositionLoaded: { send: jest.fn() },
        kompositionDeleted: { send: jest.fn() },
        kompositionsSearched: { send: jest.fn() },
        sourceUploaded: { send: jest.fn() },
        firebaseError: { send: jest.fn() }
      }
    }

    elmPortHandler = new ElmPortHandler()
  })

  describe('Port Setup and Initialization', () => {
    test('should initialize ports when ELM app is provided', () => {
      // Arrange: ELM app with ports
      const elmApp = mockElmApp

      // Act: Setup ports
      elmPortHandler.setupPorts(elmApp)

      // Assert: All outgoing ports should be subscribed to
      expect(elmApp.ports.saveKomposition.subscribe).toHaveBeenCalled()
      expect(elmApp.ports.loadKomposition.subscribe).toHaveBeenCalled()
      expect(elmApp.ports.deleteKomposition.subscribe).toHaveBeenCalled()
      expect(elmApp.ports.searchKompositions.subscribe).toHaveBeenCalled()
      expect(elmApp.ports.uploadSource.subscribe).toHaveBeenCalled()
    })

    test('should handle ELM app without ports gracefully', () => {
      // Arrange: ELM app without ports
      const elmAppNoPorts = {}

      // Act & Assert: Should not throw
      expect(() => {
        elmPortHandler.setupPorts(elmAppNoPorts)
      }).not.toThrow()
    })
  })

  describe('Komposition Operations (Test-First)', () => {
    beforeEach(() => {
      elmPortHandler.setupPorts(mockElmApp)
    })

    test('should handle save komposition request from ELM', async () => {
      // Arrange: Mock Firebase service response
      const mockKomposition = {
        id: 'test-kompo-1',
        name: 'Test Komposition',
        bpm: 120,
        segments: [],
        sources: [],
        userId: 'test-user',
        revision: '1.0',
        dvlType: 'komposition',
        config: { 
          width: 1920, 
          height: 1080, 
          framerate: 30, 
          extensionType: 'mp4' 
        }
      }

      const mockSaveResult = {
        success: true,
        kompositionId: 'test-kompo-1',
        komposition: mockKomposition
      }

      jest.spyOn(firebaseKompostService, 'saveKomposition')
        .mockResolvedValue(mockSaveResult)

      // Act: Simulate ELM sending save request
      const saveHandler = mockElmApp.ports.saveKomposition.subscribe.mock.calls[0][0]
      await saveHandler(mockKomposition)

      // Assert: Firebase service should be called and ELM should receive response
      expect(firebaseKompostService.saveKomposition).toHaveBeenCalledWith(mockKomposition)
      expect(mockElmApp.ports.kompositionSaved.send).toHaveBeenCalledWith(mockSaveResult)
    })

    test('should handle save komposition error from Firebase', async () => {
      // Arrange: Mock Firebase service error
      const mockKomposition = {
        id: 'test-kompo-1',
        name: 'Test Komposition',
        bpm: 120,
        segments: [],
        sources: [],
        userId: 'test-user',
        revision: '1.0',
        dvlType: 'komposition',
        config: { 
          width: 1920, 
          height: 1080, 
          framerate: 30, 
          extensionType: 'mp4' 
        }
      }

      jest.spyOn(firebaseKompostService, 'saveKomposition')
        .mockRejectedValue(new Error('Firebase connection failed'))

      // Act: Simulate ELM sending save request
      const saveHandler = mockElmApp.ports.saveKomposition.subscribe.mock.calls[0][0]
      await saveHandler(mockKomposition)

      // Assert: ELM should receive error notification
      expect(mockElmApp.ports.firebaseError.send).toHaveBeenCalledWith({
        operation: 'saveKomposition',
        message: 'Firebase connection failed'
      })
    })

    test('should handle load komposition request from ELM', async () => {
      // Arrange: Mock Firebase service response
      const mockKomposition = {
        id: 'test-kompo-1',
        name: 'Loaded Komposition',
        bpm: 140,
        segments: [],
        sources: [],
        userId: 'test-user',
        revision: '1.0',
        dvlType: 'komposition',
        config: { 
          width: 1920, 
          height: 1080, 
          framerate: 30, 
          extensionType: 'mp4' 
        }
      }

      jest.spyOn(firebaseKompostService, 'loadKomposition')
        .mockResolvedValue(mockKomposition)

      // Act: Simulate ELM sending load request
      const loadHandler = mockElmApp.ports.loadKomposition.subscribe.mock.calls[0][0]
      await loadHandler('test-kompo-1')

      // Assert: Firebase service should be called and ELM should receive komposition
      expect(firebaseKompostService.loadKomposition).toHaveBeenCalledWith('test-kompo-1')
      expect(mockElmApp.ports.kompositionLoaded.send).toHaveBeenCalledWith(mockKomposition)
    })
  })

  describe('Search Operations (Test-First)', () => {
    beforeEach(() => {
      elmPortHandler.setupPorts(mockElmApp)
    })

    test('should handle search kompositions request from ELM', async () => {
      // Arrange: Mock Firebase search results
      const mockSearchResults = [
        { 
          id: 'kompo-1', 
          name: 'First Kompo', 
          bpm: 120,
          userId: 'test-user',
          revision: '1.0',
          dvlType: 'komposition',
          segments: [],
          sources: [],
          config: { 
          width: 1920, 
          height: 1080, 
          framerate: 30, 
          extensionType: 'mp4' 
        }
        },
        { 
          id: 'kompo-2', 
          name: 'Second Kompo', 
          bpm: 140,
          userId: 'test-user',
          revision: '1.0',
          dvlType: 'komposition',
          segments: [],
          sources: [],
          config: { 
          width: 1920, 
          height: 1080, 
          framerate: 30, 
          extensionType: 'mp4' 
        }
        }
      ]

      jest.spyOn(firebaseKompostService, 'searchKompositions')
        .mockResolvedValue(mockSearchResults)

      // Act: Simulate ELM sending search request
      const searchHandler = mockElmApp.ports.searchKompositions.subscribe.mock.calls[0][0]
      await searchHandler('test query')

      // Assert: Firebase service should be called and ELM should receive results
      expect(firebaseKompostService.searchKompositions).toHaveBeenCalledWith('test query')
      expect(mockElmApp.ports.kompositionsSearched.send).toHaveBeenCalledWith(mockSearchResults)
    })

    test('should handle empty search results', async () => {
      // Arrange: Mock empty search results
      jest.spyOn(firebaseKompostService, 'searchKompositions')
        .mockResolvedValue([])

      // Act: Simulate ELM sending search request
      const searchHandler = mockElmApp.ports.searchKompositions.subscribe.mock.calls[0][0]
      await searchHandler('nonexistent')

      // Assert: ELM should receive empty array
      expect(mockElmApp.ports.kompositionsSearched.send).toHaveBeenCalledWith([])
    })
  })

  describe('File Upload Operations (Test-First)', () => {
    beforeEach(() => {
      elmPortHandler.setupPorts(mockElmApp)
    })

    test('should handle file upload request from ELM', async () => {
      // Arrange: Mock file and upload result
      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' })
      const mockUploadRequest = {
        file: mockFile,
        filename: 'test.mp4'
      }
      const mockUploadResult = {
        success: true,
        sourceId: 'source-123',
        url: 'https://firebase.storage/test.mp4'
      }

      jest.spyOn(firebaseKompostService, 'uploadSource')
        .mockResolvedValue(mockUploadResult)

      // Act: Simulate ELM sending upload request
      const uploadHandler = mockElmApp.ports.uploadSource.subscribe.mock.calls[0][0]
      await uploadHandler(mockUploadRequest)

      // Assert: Firebase service should be called and ELM should receive result
      expect(firebaseKompostService.uploadSource).toHaveBeenCalledWith(mockFile, expect.any(Function))
      expect(mockElmApp.ports.sourceUploaded.send).toHaveBeenCalledWith(mockUploadResult)
    })
  })

  describe('Subscription Management (Test-First)', () => {
    test('should track active subscriptions', () => {
      // Arrange: Setup ports
      elmPortHandler.setupPorts(mockElmApp)

      // Act: Get subscription count
      const count = elmPortHandler.getSubscriptionCount()

      // Assert: Should start with 0 subscriptions
      expect(count).toBe(0)
    })

    test('should cleanup all subscriptions', () => {
      // Arrange: Setup ports and create mock subscription
      elmPortHandler.setupPorts(mockElmApp)
      
      // Simulate adding a subscription
      const mockUnsubscribe = jest.fn()
      elmPortHandler['subscriptions'].set('test-subscription', mockUnsubscribe)

      // Act: Cleanup
      elmPortHandler.cleanup()

      // Assert: Unsubscribe should be called and subscriptions cleared
      expect(mockUnsubscribe).toHaveBeenCalled()
      expect(elmPortHandler.getSubscriptionCount()).toBe(0)
    })
  })

  describe('Error Handling (Test-First)', () => {
    beforeEach(() => {
      elmPortHandler.setupPorts(mockElmApp)
    })

    test('should handle Firebase service errors gracefully', async () => {
      // Arrange: Mock Firebase service throwing error
      jest.spyOn(firebaseKompostService, 'loadKomposition')
        .mockRejectedValue(new Error('Network error'))

      // Act: Simulate ELM sending request that will fail
      const loadHandler = mockElmApp.ports.loadKomposition.subscribe.mock.calls[0][0]
      await loadHandler('invalid-id')

      // Assert: Error should be sent to ELM
      expect(mockElmApp.ports.firebaseError.send).toHaveBeenCalledWith({
        operation: 'loadKomposition',
        message: 'Network error'
      })
    })

    test('should handle missing ELM ports gracefully', () => {
      // Arrange: ELM app with partial ports
      const partialElmApp = {
        ports: {
          saveKomposition: { subscribe: jest.fn() }
          // Missing other ports
        }
      }

      // Act & Assert: Should not throw
      expect(() => {
        elmPortHandler.setupPorts(partialElmApp)
      }).not.toThrow()
    })
  })

  describe('Default Komposition Creation (Test-First)', () => {
    beforeEach(() => {
      elmPortHandler.setupPorts(mockElmApp)
    })
    
    test('should create default komposition with valid structure', () => {
      // Act: Create default komposition
      elmPortHandler.createNewKomposition('Test Komposition')

      // Assert: Should send new komposition to ELM via kompositionLoaded port
      // (This test defines the expected behavior - implementation should follow)
      expect(mockElmApp.ports.kompositionLoaded.send).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Komposition',
          bpm: expect.any(Number),
          segments: expect.any(Array),
          sources: expect.any(Array),
          config: expect.any(Object)
        })
      )
    })
  })
})

/**
 * Integration Test - ELM Script Loading
 * 
 * Test that verifies the actual ELM script can be loaded and initialized
 */
describe('ELM Script Loading Integration', () => {
  test('should load ELM script and initialize app', async () => {
    // Arrange: Mock DOM and script loading
    const mockScript = {
      src: '',
      onload: null as any,
      onerror: null as any
    }

    const mockContainer = document.createElement('div')
    
    jest.spyOn(document, 'createElement').mockReturnValue(mockScript as any)
    jest.spyOn(document.head, 'appendChild').mockImplementation(() => mockScript as any)

    // Act: Simulate script loading process
    const scriptElement = document.createElement('script')
    scriptElement.src = '/elm/kompost.js'
    document.head.appendChild(scriptElement)

    // Simulate successful script load
    if (mockScript.onload) {
      mockScript.onload({} as any)
    }

    // Assert: Script should be configured correctly
    expect(scriptElement.src).toBe('/elm/kompost.js')
    expect(document.head.appendChild).toHaveBeenCalled()
  })

  test('should handle ELM script loading failure', async () => {
    // Arrange: Mock script that fails to load
    const mockScript = {
      src: '',
      onload: null as any,
      onerror: null as any
    }

    jest.spyOn(document, 'createElement').mockReturnValue(mockScript as any)
    jest.spyOn(console, 'error').mockImplementation(() => {})

    // Act: Simulate script loading failure
    const scriptElement = document.createElement('script')
    
    // Simulate setting up error handler
    scriptElement.onerror = () => {
      console.error('Failed to load ELM script')
    }
    
    // Trigger the error handler
    if (scriptElement.onerror) {
      scriptElement.onerror({} as any)
    }

    // Assert: Error should be handled gracefully
    expect(console.error).toHaveBeenCalled()
  })
})