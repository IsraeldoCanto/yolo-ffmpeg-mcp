import { NextRequest, NextResponse } from 'next/server'
import { firebaseKompostService } from '@/services/firebaseKompostService'

export async function POST(request: NextRequest) {
  try {
    console.log('📋 _find endpoint hit')
    
    // Get the authorization header
    const authHeader = request.headers.get('authy') || request.headers.get('authorization')
    if (!authHeader) {
      console.log('❌ No auth header')
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const body = await request.json()
    console.log('📋 _find request:', body)

    const requestedType = body.selector?.type
    let docs: any[] = []

    if (requestedType === 'Komposition') {
      try {
        // Try to get real kompositions from Firebase
        const kompositions = await firebaseKompostService.searchKompositions('', 50)
        
        docs = kompositions.map(kompo => ({
          _id: kompo.id,
          _rev: '1-' + Date.now(),
          type: 'Komposition',
          ...kompo
        }))
        
        console.log('📋 Found', docs.length, 'kompositions from Firebase')
      } catch (error) {
        console.log('⚠️ Firebase not available, using mock data:', error)
        // Fallback to mock data if Firebase fails
        docs = [
          {
            _id: 'demo-kompo-1',
            _rev: '1-' + Date.now(),
            type: 'Komposition',
            name: 'Demo Komposition 1',
            userId: 'dev-user',
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
        ]
      }

    } else if (requestedType === 'Audio') {
      // For now, return mock audio sources since we don't have a sources collection yet
      // In a real implementation, you'd query the sources collection
      docs = [
        {
          _id: 'audio_1',
          _rev: '1-' + Date.now(),
          type: 'Audio',
          name: 'Sample Audio Track',
          url: 'https://example.com/audio1.mp3',
          format: 'mp3',
          duration: 180
        }
      ]
      
    } else {
      // If no specific type requested, return both
      try {
        const kompositions = await firebaseKompostService.searchKompositions('', 50)
        docs = kompositions.map(kompo => ({
          _id: kompo.id,
          _rev: '1-' + Date.now(),
          type: 'Komposition',
          ...kompo
        }))
      } catch (error) {
        console.log('⚠️ Firebase not available for general search:', error)
        docs = []
      }
    }

    const response = {
      docs: docs,
      bookmark: 'nil',
      warning: `Firebase backend - CouchDB compatibility mode - ${requestedType || 'all'} documents`
    }

    console.log('📋 Returning:', docs.length, requestedType || 'all', 'documents')
    return NextResponse.json(response)

  } catch (error: any) {
    console.error('❌ Error in _find:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Handle GET requests the same as POST for compatibility
  return POST(request)
}