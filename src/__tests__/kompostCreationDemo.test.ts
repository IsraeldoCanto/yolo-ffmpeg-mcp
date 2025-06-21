/**
 * Demo test showing kompost creation functionality
 * This demonstrates the complete workflow of creating and working with kompositions
 */

import { FirebaseKompostService, Komposition } from '../services/firebaseKompostService'

// Mock Firebase for demo
jest.mock('../lib/firebase/config', () => ({
  auth: {
    currentUser: {
      uid: 'demo-user-456',
      email: 'demo@kompost.example'
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

describe('Kompost Creation Demo - Complete Workflow', () => {
  let service: FirebaseKompostService
  
  beforeEach(() => {
    service = new FirebaseKompostService()
  })

  it('should demonstrate creating a simple music video komposition', () => {
    // Step 1: Create a new komposition for a music video
    const musicVideoKomposition = service.createDefaultKomposition('My First Music Video')
    
    console.log('📹 Created music video komposition:', {
      name: musicVideoKomposition.name,
      userId: musicVideoKomposition.userId,
      bpm: musicVideoKomposition.bpm,
      dvlType: musicVideoKomposition.dvlType
    })

    // Step 2: Configure for music video (120 BPM, HD video)
    musicVideoKomposition.bpm = 120
    musicVideoKomposition.config = {
      width: 1920,
      height: 1080,
      framerate: 30,
      extensionType: 'mp4'
    }

    // Step 3: Add some video sources
    musicVideoKomposition.sources = [
      {
        id: 'video_main',
        url: 'https://example.com/main-video.mp4',
        checksum: 'video_main_hash',
        format: 'mp4',
        extensionType: 'video',
        mediaType: 'video/mp4',
        width: 1920,
        height: 1080
      },
      {
        id: 'audio_track',
        url: 'https://example.com/song.mp3',
        checksum: 'audio_track_hash', 
        format: 'mp3',
        extensionType: 'audio',
        mediaType: 'audio/mpeg'
      }
    ]

    console.log('🎬 Added sources:', musicVideoKomposition.sources.length)

    // Step 4: Create video segments synced to beats
    musicVideoKomposition.segments = [
      {
        id: 'intro',
        sourceId: 'video_main',
        start: 0,
        duration: 8,  // 16 beats at 120 BPM = 8 seconds
        end: 8
      },
      {
        id: 'verse1',
        sourceId: 'video_main',
        start: 8,
        duration: 16, // 32 beats = 16 seconds
        end: 24
      },
      {
        id: 'chorus1',
        sourceId: 'video_main',
        start: 24,
        duration: 8,  // 16 beats = 8 seconds
        end: 32
      }
    ]

    console.log('🎵 Created segments synced to 120 BPM:', musicVideoKomposition.segments.length)

    // Step 5: Add beat pattern for precise timing
    musicVideoKomposition.beatpattern = {
      fromBeat: 0,
      toBeat: 64,  // 32 seconds worth of beats
      masterBPM: 120
    }

    // Step 6: Add metadata
    musicVideoKomposition.tags = ['music', 'video', 'demo', '120bpm']
    musicVideoKomposition.description = 'Demo music video showing beat-synchronized editing'

    console.log('✅ Final komposition ready:', {
      name: musicVideoKomposition.name,
      totalDuration: musicVideoKomposition.segments.reduce((sum, seg) => sum + seg.duration, 0),
      beatsCount: musicVideoKomposition.beatpattern?.toBeat,
      sourcesCount: musicVideoKomposition.sources.length,
      segmentsCount: musicVideoKomposition.segments.length
    })

    // Verify the komposition is valid
    expect(musicVideoKomposition.name).toBe('My First Music Video')
    expect(musicVideoKomposition.bpm).toBe(120)
    expect(musicVideoKomposition.sources).toHaveLength(2)
    expect(musicVideoKomposition.segments).toHaveLength(3)
    expect(musicVideoKomposition.beatpattern?.masterBPM).toBe(120)
  })

  it('should demonstrate creating a podcast komposition', () => {
    // Create audio-focused komposition
    const podcastKomposition = service.createDefaultKomposition('Tech Talk Podcast Episode 1')
    
    // Configure for audio production
    podcastKomposition.dvlType = 'audio'
    podcastKomposition.bpm = 0 // No beat sync needed for speech
    podcastKomposition.config = {
      width: 1920,  // Still need video config for potential video export
      height: 1080,
      framerate: 30,
      extensionType: 'mp3'
    }

    // Add audio sources
    podcastKomposition.sources = [
      {
        id: 'host_audio',
        url: 'https://example.com/host-recording.wav',
        checksum: 'host_audio_hash',
        format: 'wav',
        extensionType: 'audio',
        mediaType: 'audio/wav'
      },
      {
        id: 'guest_audio',
        url: 'https://example.com/guest-recording.wav',
        checksum: 'guest_audio_hash',
        format: 'wav',
        extensionType: 'audio',
        mediaType: 'audio/wav'
      },
      {
        id: 'intro_music',
        url: 'https://example.com/intro.mp3',
        checksum: 'intro_music_hash',
        format: 'mp3',
        extensionType: 'audio',
        mediaType: 'audio/mpeg'
      }
    ]

    // Create segments for podcast structure
    podcastKomposition.segments = [
      {
        id: 'intro',
        sourceId: 'intro_music',
        start: 0,
        duration: 30,
        end: 30
      },
      {
        id: 'main_discussion',
        sourceId: 'host_audio',
        start: 30,
        duration: 1800, // 30 minutes
        end: 1830
      },
      {
        id: 'outro',
        sourceId: 'intro_music',
        start: 1830,
        duration: 15,
        end: 1845
      }
    ]

    // Add podcast metadata
    podcastKomposition.tags = ['podcast', 'tech', 'interview', 'audio']
    podcastKomposition.description = 'Weekly tech podcast with industry guest'

    console.log('🎙️ Created podcast komposition:', {
      type: podcastKomposition.dvlType,
      duration: Math.floor(podcastKomposition.segments.reduce((sum, seg) => sum + seg.duration, 0) / 60) + ' minutes',
      sources: podcastKomposition.sources.length
    })

    expect(podcastKomposition.dvlType).toBe('audio')
    expect(podcastKomposition.sources).toHaveLength(3)
    expect(podcastKomposition.segments).toHaveLength(3)
  })

  it('should demonstrate creating a social media komposition', () => {
    // Create short-form video komposition
    const socialMediaKomposition = service.createDefaultKomposition('Instagram Reel - Product Demo')
    
    // Configure for vertical video (Instagram/TikTok format)
    socialMediaKomposition.config = {
      width: 1080,   // 9:16 aspect ratio
      height: 1920,
      framerate: 30,
      extensionType: 'mp4'
    }
    
    socialMediaKomposition.bpm = 128 // Upbeat tempo

    // Add vertical video sources
    socialMediaKomposition.sources = [
      {
        id: 'product_demo',
        url: 'https://example.com/product-demo-vertical.mp4',
        checksum: 'product_demo_hash',
        format: 'mp4',
        extensionType: 'video',
        mediaType: 'video/mp4',
        width: 1080,
        height: 1920
      },
      {
        id: 'background_music',
        url: 'https://example.com/upbeat-track.mp3',
        checksum: 'bg_music_hash',
        format: 'mp3',
        extensionType: 'audio',
        mediaType: 'audio/mpeg'
      }
    ]

    // Create quick cuts for social media
    socialMediaKomposition.segments = [
      {
        id: 'hook',
        sourceId: 'product_demo',
        start: 0,
        duration: 2,  // Quick hook
        end: 2
      },
      {
        id: 'demo1',
        sourceId: 'product_demo',
        start: 2,
        duration: 4,
        end: 6
      },
      {
        id: 'demo2',
        sourceId: 'product_demo',
        start: 6,
        duration: 4,
        end: 10
      },
      {
        id: 'cta',
        sourceId: 'product_demo',
        start: 10,
        duration: 5,  // Call to action
        end: 15
      }
    ]

    // Social media specific metadata
    socialMediaKomposition.tags = ['social', 'instagram', 'reel', 'product', 'vertical', '15sec']
    socialMediaKomposition.description = '15-second product demo for Instagram Reel'

    console.log('📱 Created social media komposition:', {
      format: `${socialMediaKomposition.config.width}x${socialMediaKomposition.config.height}`,
      duration: socialMediaKomposition.segments.reduce((sum, seg) => sum + seg.duration, 0) + 's',
      cuts: socialMediaKomposition.segments.length
    })

    expect(socialMediaKomposition.config.height).toBeGreaterThan(socialMediaKomposition.config.width) // Vertical
    expect(socialMediaKomposition.segments.reduce((sum, seg) => sum + seg.duration, 0)).toBeLessThanOrEqual(15) // Short form
  })

  it('should validate komposition data matches Firestore rules', () => {
    const komposition = service.createDefaultKomposition('Validation Test')
    
    // Check all required fields for Firestore rules validation
    const requiredFields = ['userId', 'name', 'revision', 'dvlType', 'bpm', 'segments', 'sources', 'config']
    
    for (const field of requiredFields) {
      expect(komposition).toHaveProperty(field)
    }

    // Validate data types match Firestore rules
    expect(typeof komposition.userId).toBe('string')
    expect(typeof komposition.name).toBe('string')
    expect(komposition.name.length).toBeGreaterThan(0)
    expect(komposition.name.length).toBeLessThanOrEqual(100)
    expect(typeof komposition.revision).toBe('string')
    expect(typeof komposition.dvlType).toBe('string')
    expect(['video', 'audio', 'image']).toContain(komposition.dvlType)
    expect(typeof komposition.bpm).toBe('number')
    expect(komposition.bpm).toBeGreaterThanOrEqual(0)
    expect(komposition.bpm).toBeLessThanOrEqual(250)
    expect(Array.isArray(komposition.segments)).toBe(true)
    expect(Array.isArray(komposition.sources)).toBe(true)
    expect(typeof komposition.config).toBe('object')

    // Validate video config
    expect(typeof komposition.config.width).toBe('number')
    expect(komposition.config.width).toBeGreaterThan(0)
    expect(typeof komposition.config.height).toBe('number')
    expect(komposition.config.height).toBeGreaterThan(0)
    expect(typeof komposition.config.framerate).toBe('number')
    expect(komposition.config.framerate).toBeGreaterThan(0)
    expect(typeof komposition.config.extensionType).toBe('string')

    console.log('✅ Komposition passes all Firestore rule validations')
  })
})