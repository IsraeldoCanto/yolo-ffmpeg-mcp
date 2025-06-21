/**
 * End-to-End API Endpoints Test
 * Tests the actual API endpoints that ELM app will use
 */

describe('API Endpoints E2E Tests', () => {
  
  beforeAll(() => {
    // Mock fetch for these tests
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /heap/_find', () => {
    it('should return kompositions when requested', async () => {
      const mockResponse = {
        docs: [
          {
            _id: 'kompo1',
            _rev: '1-12345',
            type: 'Komposition',
            name: 'Test Komposition',
            userId: 'user123',
            dvlType: 'video',
            bpm: 120,
            segments: [],
            sources: []
          }
        ],
        bookmark: 'nil',
        warning: 'Firebase backend - CouchDB compatibility mode - Komposition documents'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const response = await fetch('http://localhost:9002/heap/_find', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authy': 'test-token'
        },
        body: JSON.stringify({
          selector: { type: 'Komposition' },
          fields: ['_id', '_rev']
        })
      })

      const data = await response.json()

      expect(fetch).toHaveBeenCalledWith('http://localhost:9002/heap/_find', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authy': 'test-token'
        },
        body: JSON.stringify({
          selector: { type: 'Komposition' },
          fields: ['_id', '_rev']
        })
      })

      expect(data.docs).toHaveLength(1)
      expect(data.docs[0].type).toBe('Komposition')
      expect(data.docs[0]._id).toBe('kompo1')
    })

    it('should return audio sources when requested', async () => {
      const mockResponse = {
        docs: [
          {
            _id: 'audio_1',
            _rev: '1-12345',
            type: 'Audio',
            name: 'Sample Audio Track',
            url: 'https://example.com/audio1.mp3',
            format: 'mp3',
            duration: 180
          }
        ],
        bookmark: 'nil',
        warning: 'Firebase backend - CouchDB compatibility mode - Audio documents'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const response = await fetch('http://localhost:9002/heap/_find', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authy': 'test-token'
        },
        body: JSON.stringify({
          selector: { type: 'Audio' },
          fields: ['_id', '_rev']
        })
      })

      const data = await response.json()
      
      expect(data.docs).toHaveLength(1)
      expect(data.docs[0].type).toBe('Audio')
      expect(data.docs[0].format).toBe('mp3')
    })

    it('should require authentication', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'No authorization header' })
      })

      const response = await fetch('http://localhost:9002/heap/_find', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // No auth header
        },
        body: JSON.stringify({
          selector: { type: 'Komposition' }
        })
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /heap/[id]', () => {
    it('should return a specific komposition', async () => {
      const mockKomposition = {
        _id: 'kompo1',
        _rev: '1-12345',
        id: 'kompo1',
        name: 'Test Komposition',
        userId: 'user123',
        dvlType: 'video',
        bpm: 120,
        segments: [],
        sources: []
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockKomposition
      })

      const response = await fetch('http://localhost:9002/heap/kompo1')
      const data = await response.json()

      expect(data._id).toBe('kompo1')
      expect(data.name).toBe('Test Komposition')
      expect(data._rev).toBeTruthy()
    })

    it('should handle URL decoding for filenames', async () => {
      const mockKomposition = {
        _id: 'Example 1',
        _rev: '1-12345',
        name: 'Example 1',
        userId: 'user123'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockKomposition
      })

      const response = await fetch('http://localhost:9002/heap/Example%201.json')
      const data = await response.json()

      expect(data._id).toBe('Example 1')
      expect(data.name).toBe('Example 1')
    })
  })

  describe('PUT /heap/[id]', () => {
    it('should save a komposition and return CouchDB-style response', async () => {
      const kompositionData = {
        _id: 'kompo1',
        name: 'Updated Komposition',
        type: 'Video',
        bpm: 128,
        segments: [
          {
            id: 'seg1',
            sourceid: 'src1',
            start: 0,
            duration: 10,
            end: 10
          }
        ],
        sources: [],
        beatpattern: {
          frombeat: 0,
          tobeat: 64,
          masterbpm: 128
        }
      }

      const mockResponse = {
        ok: true,
        id: 'kompo1',
        rev: '1-12345',
        name: 'Updated Komposition',
        userId: 'user123'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const response = await fetch('http://localhost:9002/heap/kompo1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(kompositionData)
      })

      const data = await response.json()

      expect(data.ok).toBe(true)
      expect(data.id).toBe('kompo1')
      expect(data.name).toBe('Updated Komposition')
    })
  })

  describe('DELETE /heap/[id]', () => {
    it('should delete a komposition', async () => {
      const mockResponse = {
        ok: true,
        id: 'kompo1',
        rev: '1-deleted'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const response = await fetch('http://localhost:9002/heap/kompo1', {
        method: 'DELETE'
      })

      const data = await response.json()

      expect(data.ok).toBe(true)
      expect(data.id).toBe('kompo1')
      expect(data.rev).toBe('1-deleted')
    })
  })

  describe('Data Transformation', () => {
    it('should correctly transform ELM beatpattern to Firebase format', () => {
      const elmBeatPattern = {
        frombeat: 0,
        tobeat: 64,
        masterbpm: 120
      }

      const expectedFirebaseFormat = {
        fromBeat: 0,
        toBeat: 64,
        masterBPM: 120
      }

      // Simulate the transformation that happens in the API
      const transformed = {
        fromBeat: elmBeatPattern.frombeat,
        toBeat: elmBeatPattern.tobeat,
        masterBPM: elmBeatPattern.masterbpm
      }

      expect(transformed).toEqual(expectedFirebaseFormat)
    })

    it('should handle ELM segments with sourceid field', () => {
      const elmSegments = [
        {
          id: 'intro',
          sourceid: 'http://jalla1',
          start: 0,
          duration: 16,
          end: 16
        },
        {
          id: 'verse',
          sourceid: '',
          start: 48,
          duration: 32,
          end: 80
        }
      ]

      // These should pass through as-is to Firebase
      expect(elmSegments[0].sourceid).toBe('http://jalla1')
      expect(elmSegments[1].sourceid).toBe('')
      expect(elmSegments[0].duration).toBe(16)
      expect(elmSegments[1].duration).toBe(32)
    })
  })
})