/**
 * Test the CouchDB compatibility API endpoints
 */

import { NextRequest } from 'next/server'
import { POST as findPOST } from '../app/api/heap/_find/route'
import { GET, PUT, DELETE } from '../app/api/heap/[id]/route'

// Mock Firebase service
jest.mock('../services/firebaseKompostService', () => ({
  firebaseKompostService: {
    searchKompositions: jest.fn(),
    loadKomposition: jest.fn(),
    saveKomposition: jest.fn(),
    deleteKomposition: jest.fn()
  }
}))

describe('CouchDB Compatibility API', () => {
  const mockSearchKompositions = require('../services/firebaseKompostService').firebaseKompostService.searchKompositions
  const mockLoadKomposition = require('../services/firebaseKompostService').firebaseKompostService.loadKomposition
  const mockSaveKomposition = require('../services/firebaseKompostService').firebaseKompostService.saveKomposition
  const mockDeleteKomposition = require('../services/firebaseKompostService').firebaseKompostService.deleteKomposition

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('/_find endpoint', () => {
    it('should handle komposition search requests', async () => {
      const mockKompositions = [
        {
          id: 'kompo1',
          name: 'Test Komposition',
          userId: 'user123',
          dvlType: 'video',
          bpm: 120
        }
      ]
      
      mockSearchKompositions.mockResolvedValue(mockKompositions)

      const request = new NextRequest('http://localhost:3000/api/heap/_find', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authy': 'mock-token'
        },
        body: JSON.stringify({
          selector: { type: 'Komposition' },
          fields: ['_id', '_rev']
        })
      })

      const response = await findPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.docs).toHaveLength(1)
      expect(data.docs[0]._id).toBe('kompo1')
      expect(data.docs[0].type).toBe('Komposition')
      expect(data.docs[0].name).toBe('Test Komposition')
    })

    it('should handle audio search requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/heap/_find', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authy': 'mock-token'
        },
        body: JSON.stringify({
          selector: { type: 'Audio' },
          fields: ['_id', '_rev']
        })
      })

      const response = await findPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.docs).toHaveLength(1)
      expect(data.docs[0].type).toBe('Audio')
      expect(data.docs[0].name).toBe('Sample Audio Track')
    })

    it('should require authorization', async () => {
      const request = new NextRequest('http://localhost:3000/api/heap/_find', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // No auth header
        },
        body: JSON.stringify({
          selector: { type: 'Komposition' }
        })
      })

      const response = await findPOST(request)
      expect(response.status).toBe(401)
    })
  })

  describe('/[id] endpoints', () => {
    it('should handle GET requests for kompositions', async () => {
      const mockKomposition = {
        id: 'kompo1',
        name: 'Test Komposition',
        userId: 'user123',
        dvlType: 'video',
        bpm: 120,
        segments: [],
        sources: []
      }

      mockLoadKomposition.mockResolvedValue(mockKomposition)

      const request = new NextRequest('http://localhost:3000/api/heap/kompo1')
      const response = await GET(request, { params: { id: 'kompo1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data._id).toBe('kompo1')
      expect(data.name).toBe('Test Komposition')
      expect(data._rev).toBeTruthy()
    })

    it('should handle PUT requests for saving kompositions', async () => {
      const mockResult = {
        success: true,
        kompositionId: 'kompo1',
        komposition: {
          id: 'kompo1',
          name: 'Updated Komposition',
          userId: 'user123'
        }
      }

      mockSaveKomposition.mockResolvedValue(mockResult)

      const requestBody = {
        _id: 'kompo1',
        name: 'Updated Komposition',
        type: 'Video',
        bpm: 128,
        segments: [],
        sources: []
      }

      const request = new NextRequest('http://localhost:3000/api/heap/kompo1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const response = await PUT(request, { params: { id: 'kompo1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.ok).toBe(true)
      expect(data.id).toBe('kompo1')
      expect(mockSaveKomposition).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'kompo1',
          name: 'Updated Komposition',
          dvlType: 'video',
          bpm: 128
        })
      )
    })

    it('should handle DELETE requests', async () => {
      mockDeleteKomposition.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/heap/kompo1')
      const response = await DELETE(request, { params: { id: 'kompo1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.ok).toBe(true)
      expect(data.id).toBe('kompo1')
      expect(mockDeleteKomposition).toHaveBeenCalledWith('kompo1')
    })

    it('should handle 404 errors', async () => {
      mockLoadKomposition.mockRejectedValue(new Error('Komposition not found'))

      const request = new NextRequest('http://localhost:3000/api/heap/nonexistent')
      const response = await GET(request, { params: { id: 'nonexistent' } })

      expect(response.status).toBe(404)
    })
  })

  describe('Data transformation', () => {
    it('should transform ELM data to Firebase format correctly', async () => {
      const mockResult = {
        success: true,
        kompositionId: 'test-id',
        komposition: { id: 'test-id', name: 'Test' }
      }
      mockSaveKomposition.mockResolvedValue(mockResult)

      const elmData = {
        _id: 'test-id',
        name: 'Test Komposition',
        type: 'Video',
        bpm: 120,
        beatpattern: {
          frombeat: 0,
          tobeat: 64,
          masterbpm: 120
        },
        segments: [
          {
            id: 'seg1',
            sourceid: 'src1',
            start: 0,
            duration: 10,
            end: 10
          }
        ],
        sources: []
      }

      const request = new NextRequest('http://localhost:3000/api/heap/test-id', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(elmData)
      })

      await PUT(request, { params: { id: 'test-id' } })

      expect(mockSaveKomposition).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-id',
          name: 'Test Komposition',
          dvlType: 'video',
          bpm: 120,
          beatpattern: {
            fromBeat: 0,
            toBeat: 64,
            masterBPM: 120
          },
          segments: [
            {
              id: 'seg1',
              sourceid: 'src1',
              start: 0,
              duration: 10,
              end: 10
            }
          ]
        })
      )
    })
  })
})