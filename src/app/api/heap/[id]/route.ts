import { NextRequest, NextResponse } from 'next/server'
import { firebaseKompostService } from '@/services/firebaseKompostService'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params
    const id = decodeURIComponent(resolvedParams.id).replace('.json', '')
    console.log('📄 GET komposition:', id)

    const komposition = await firebaseKompostService.loadKomposition(id)
    
    // Transform to CouchDB-style response
    const response = {
      _id: komposition.id,
      _rev: '1-' + Date.now(),
      ...komposition
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('❌ Error loading komposition:', error)
    if (error.message.includes('not found') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params
    const id = decodeURIComponent(resolvedParams.id).replace('.json', '')
    const body = await request.json()
    
    console.log('💾 PUT komposition:', id, body)

    // Transform from CouchDB-style data to our Firebase format
    const kompositionData = {
      id: body._id === id ? id : undefined, // Use existing ID if it matches
      userId: body.userId, // Will be set by Firebase service
      name: body.name || 'Untitled',
      revision: body.revision || '1.0',
      dvlType: body.type?.toLowerCase() || 'video',
      bpm: body.bpm || 120,
      segments: body.segments || [],
      sources: body.sources || [],
      config: body.config || {
        width: 1920,
        height: 1080,
        framerate: 30,
        extensionType: 'mp4'
      },
      beatpattern: body.beatpattern ? {
        fromBeat: body.beatpattern.frombeat || 0,
        toBeat: body.beatpattern.tobeat || 0,
        masterBPM: body.beatpattern.masterbpm || body.bpm || 120
      } : undefined,
      tags: body.tags || [],
      description: body.description
    }

    const result = await firebaseKompostService.saveKomposition(kompositionData)
    
    if (result.success && result.komposition) {
      // Return CouchDB-style response
      const response = {
        ok: true,
        id: result.kompositionId,
        rev: '1-' + Date.now(),
        ...result.komposition
      }
      return NextResponse.json(response)
    } else {
      throw new Error(result.error || 'Save failed')
    }

  } catch (error: any) {
    console.error('❌ Error saving komposition:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params
    const id = decodeURIComponent(resolvedParams.id).replace('.json', '')
    console.log('🗑️ DELETE komposition:', id)

    await firebaseKompostService.deleteKomposition(id)
    
    return NextResponse.json({
      ok: true,
      id: id,
      rev: '1-deleted'
    })

  } catch (error: any) {
    console.error('❌ Error deleting komposition:', error)
    if (error.message.includes('not found')) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}