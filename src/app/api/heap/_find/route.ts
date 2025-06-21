import { NextRequest, NextResponse } from 'next/server'
import { firebaseKompostService } from '@/services/firebaseKompostService'
import { getAuth } from 'firebase-admin/auth'

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authy') || request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    // For now, we'll skip Firebase Admin verification and just search
    // In production, you'd verify the JWT token here
    
    const body = await request.json()
    console.log('📋 _find request:', body)

    const requestedType = body.selector?.type
    let docs: any[] = []

    if (requestedType === 'Komposition') {
      // Get all kompositions for the user
      const kompositions = await firebaseKompostService.searchKompositions('', 50)
      
      docs = kompositions.map(kompo => ({
        _id: kompo.id,
        _rev: '1-' + Date.now(), // Fake revision for CouchDB compatibility
        type: 'Komposition',
        ...kompo
      }))

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
      const kompositions = await firebaseKompostService.searchKompositions('', 50)
      docs = kompositions.map(kompo => ({
        _id: kompo.id,
        _rev: '1-' + Date.now(),
        type: 'Komposition',
        ...kompo
      }))
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