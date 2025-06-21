/**
 * Mock Kompost Service - Provides controlled test data for kompostEdit
 * 
 * This service simulates Firebase operations with predictable data for testing
 * and development purposes. It provides the same interface as FirebaseKompostService
 * but operates on in-memory data that can be controlled and verified.
 */

import { 
  Komposition, 
  KompositionSaveResult, 
  SourceUploadResult, 
  FirebaseError,
  Segment,
  Source,
  VideoConfig,
  BeatPattern
} from './firebaseKompostService'

export interface MockKompostServiceOptions {
  enableLogging?: boolean
  simulateLatency?: boolean
  errorRate?: number // 0-1, chance of random errors
  initialData?: Komposition[]
}

export class MockKompostService {
  private kompositions: Map<string, Komposition> = new Map()
  private sources: Map<string, Source> = new Map()
  private subscriptions: Map<string, Set<(data: any) => void>> = new Map()
  private nextId: number = 1
  private options: MockKompostServiceOptions
  private currentUserId: string = 'test-user-123'

  constructor(options: MockKompostServiceOptions = {}) {
    this.options = {
      enableLogging: true,
      simulateLatency: false,
      errorRate: 0,
      ...options
    }
    
    this.initializeTestData()
  }

  // ==============================================
  // MOCK DATA INITIALIZATION
  // ==============================================

  private initializeTestData(): void {
    const testKompositions = this.options.initialData || this.createDefaultTestData()
    
    testKompositions.forEach(kompo => {
      this.kompositions.set(kompo.id!, kompo)
    })

    this.log('🎭 Mock service initialized with test data', { 
      kompositions: this.kompositions.size,
      sources: this.sources.size 
    })
  }

  private createDefaultTestData(): Komposition[] {
    return [
      {
        id: 'kompo-001',
        userId: this.currentUserId,
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
            url: 'https://example.com/test-video.mp4',
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
        createdBy: 'test@example.com',
        lastModifiedBy: 'test@example.com',
        isPublic: false,
        sharedWith: [],
        tags: ['summer', 'upbeat', 'test'],
        description: 'A test komposition for summer vibes'
      },
      {
        id: 'kompo-002',
        userId: this.currentUserId,
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
        createdBy: 'test@example.com',
        lastModifiedBy: 'test@example.com',
        isPublic: true,
        sharedWith: ['user-456'],
        tags: ['lofi', 'chill', 'ambient'],
        description: 'Relaxing lo-fi beats for studying'
      },
      {
        id: 'kompo-003',
        userId: this.currentUserId,
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
        createdBy: 'test@example.com',
        lastModifiedBy: 'test@example.com',
        isPublic: false,
        sharedWith: [],
        tags: ['electronic', 'dance', 'remix', 'high-energy'],
        description: 'High-energy electronic dance remix'
      },
      {
        id: 'kompo-004',
        userId: this.currentUserId,
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
        createdBy: 'test@example.com',
        lastModifiedBy: 'test@example.com',
        isPublic: false,
        sharedWith: [],
        tags: ['acoustic', 'guitar', 'folk'],
        description: 'Gentle acoustic guitar melodies'
      },
      {
        id: 'kompo-005',
        userId: this.currentUserId,
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
        createdBy: 'test@example.com',
        lastModifiedBy: 'test@example.com',
        isPublic: true,
        sharedWith: ['user-789', 'user-101'],
        tags: ['hiphop', 'beats', 'urban', 'collection'],
        description: 'Collection of hip-hop beats and rhythms'
      }
    ]
  }

  // ==============================================
  // USER AND TESTING CONTROLS
  // ==============================================

  setCurrentUser(userId: string): void {
    this.currentUserId = userId
    this.log('👤 Current user changed', { userId })
  }

  getCurrentUser(): string {
    return this.currentUserId
  }

  resetToDefaults(): void {
    this.kompositions.clear()
    this.sources.clear()
    this.nextId = 1
    this.initializeTestData()
    this.log('🔄 Mock service reset to defaults')
  }

  clearAllData(): void {
    this.kompositions.clear()
    this.sources.clear()
    this.nextId = 1
    this.log('🗑️ All mock data cleared')
  }

  getDataSnapshot(): { kompositions: Komposition[], sources: Source[] } {
    return {
      kompositions: Array.from(this.kompositions.values()),
      sources: Array.from(this.sources.values())
    }
  }

  // ==============================================
  // KOMPOSITION CRUD OPERATIONS
  // ==============================================

  async saveKomposition(komposition: Komposition): Promise<KompositionSaveResult> {
    await this.simulateDelay()
    
    if (this.shouldSimulateError()) {
      return {
        success: false,
        error: 'Mock error: Simulated save failure'
      }
    }

    try {
      const now = new Date().toISOString()
      
      if (komposition.id) {
        // Update existing komposition
        const existing = this.kompositions.get(komposition.id)
        if (!existing) {
          return {
            success: false,
            error: 'Komposition not found'
          }
        }
        
        if (existing.userId !== this.currentUserId) {
          return {
            success: false,
            error: 'Access denied: You can only modify your own kompositions'
          }
        }

        const updated = {
          ...komposition,
          userId: this.currentUserId,
          updatedAt: now,
          lastModifiedBy: 'test@example.com'
        }
        
        this.kompositions.set(komposition.id, updated)
        this.notifySubscribers('komposition', komposition.id, updated)
        
        this.log('📝 Komposition updated', { id: komposition.id, name: komposition.name })
        
        return {
          success: true,
          kompositionId: komposition.id,
          komposition: updated
        }
      } else {
        // Create new komposition
        const id = `kompo-${String(this.nextId++).padStart(3, '0')}`
        const newKomposition = {
          ...komposition,
          id,
          userId: this.currentUserId,
          createdAt: now,
          updatedAt: now,
          createdBy: 'test@example.com',
          lastModifiedBy: 'test@example.com',
          isPublic: false,
          sharedWith: []
        }
        
        this.kompositions.set(id, newKomposition)
        this.notifySubscribers('kompositions', 'list', Array.from(this.kompositions.values()))
        
        this.log('✨ New komposition created', { id, name: komposition.name })
        
        return {
          success: true,
          kompositionId: id,
          komposition: newKomposition
        }
      }
    } catch (error: any) {
      this.log('❌ Error saving komposition', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async loadKomposition(kompositionId: string): Promise<Komposition> {
    await this.simulateDelay()
    
    if (this.shouldSimulateError()) {
      throw new Error('Mock error: Simulated load failure')
    }

    const komposition = this.kompositions.get(kompositionId)
    
    if (!komposition) {
      throw new Error('Komposition not found')
    }
    
    // Check access permissions
    if (komposition.userId !== this.currentUserId && 
        !komposition.isPublic && 
        !(komposition.sharedWith?.includes(this.currentUserId))) {
      throw new Error('Access denied to this komposition')
    }
    
    this.log('📖 Komposition loaded', { id: kompositionId, name: komposition.name })
    return komposition
  }

  async deleteKomposition(kompositionId: string): Promise<void> {
    await this.simulateDelay()
    
    if (this.shouldSimulateError()) {
      throw new Error('Mock error: Simulated delete failure')
    }

    const komposition = this.kompositions.get(kompositionId)
    
    if (!komposition) {
      throw new Error('Komposition not found')
    }
    
    if (komposition.userId !== this.currentUserId) {
      throw new Error('Access denied: You can only delete your own kompositions')
    }
    
    this.kompositions.delete(kompositionId)
    this.notifySubscribers('kompositions', 'list', Array.from(this.kompositions.values()))
    
    this.log('🗑️ Komposition deleted', { id: kompositionId, name: komposition.name })
  }

  async searchKompositions(searchQuery: string = '', limitCount: number = 20): Promise<Komposition[]> {
    await this.simulateDelay()
    
    if (this.shouldSimulateError()) {
      return []
    }

    let results = Array.from(this.kompositions.values())
      .filter(k => k.userId === this.currentUserId)
    
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      results = results.filter(k => 
        k.name.toLowerCase().includes(query) ||
        k.description?.toLowerCase().includes(query) ||
        k.tags?.some(tag => tag.toLowerCase().includes(query))
      )
      // Sort by name for search results
      results.sort((a, b) => a.name.localeCompare(b.name))
    } else {
      // Sort by updated date for general listing
      results.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || '').getTime()
        const dateB = new Date(b.updatedAt || b.createdAt || '').getTime()
        return dateB - dateA
      })
    }
    
    const limited = results.slice(0, limitCount)
    
    this.log('🔍 Search completed', { 
      query: searchQuery, 
      total: results.length, 
      returned: limited.length 
    })
    
    return limited
  }

  async getRecentKompositions(limitCount: number = 10): Promise<Komposition[]> {
    await this.simulateDelay()
    
    if (this.shouldSimulateError()) {
      return []
    }

    const userKompositions = Array.from(this.kompositions.values())
      .filter(k => k.userId === this.currentUserId)
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || '').getTime()
        const dateB = new Date(b.updatedAt || b.createdAt || '').getTime()
        return dateB - dateA
      })
      .slice(0, limitCount)
    
    this.log('📋 Recent kompositions fetched', { count: userKompositions.length })
    return userKompositions
  }

  // ==============================================
  // SOURCE/MEDIA OPERATIONS
  // ==============================================

  async uploadSource(file: File, onProgress?: (progress: number) => void): Promise<SourceUploadResult> {
    await this.simulateDelay()
    
    if (this.shouldSimulateError()) {
      return {
        success: false,
        error: 'Mock error: Simulated upload failure'
      }
    }

    // Simulate upload progress
    if (onProgress) {
      for (let i = 0; i <= 100; i += 20) {
        onProgress(i)
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    const sourceId = `src-${String(this.nextId++).padStart(3, '0')}`
    const mockUrl = `https://mock-storage.example.com/${this.currentUserId}/${file.name}`
    
    const source: Source = {
      id: sourceId,
      url: mockUrl,
      checksum: `mock_${file.size}_${file.name}_${Date.now()}`,
      format: file.name.split('.').pop()?.toLowerCase() || '',
      extensionType: this.getExtensionType(file.type),
      mediaType: file.type,
      width: file.type.startsWith('video/') ? 1920 : undefined,
      height: file.type.startsWith('video/') ? 1080 : undefined,
      startingOffset: 0
    }
    
    this.sources.set(sourceId, source)
    
    this.log('📤 Source uploaded', { 
      sourceId, 
      filename: file.name, 
      size: file.size,
      type: file.type 
    })
    
    return {
      success: true,
      sourceId,
      url: mockUrl
    }
  }

  // ==============================================
  // REAL-TIME SUBSCRIPTIONS
  // ==============================================

  subscribeToKomposition(
    kompositionId: string,
    callback: (komposition: Komposition | null) => void
  ): () => void {
    const key = `komposition:${kompositionId}`
    
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set())
    }
    
    this.subscriptions.get(key)!.add(callback)
    
    // Send initial data
    const komposition = this.kompositions.get(kompositionId)
    callback(komposition || null)
    
    this.log('🔗 Subscription created', { type: 'komposition', id: kompositionId })
    
    return () => {
      this.subscriptions.get(key)?.delete(callback)
      if (this.subscriptions.get(key)?.size === 0) {
        this.subscriptions.delete(key)
      }
      this.log('🔌 Subscription removed', { type: 'komposition', id: kompositionId })
    }
  }

  subscribeToUserKompositions(
    callback: (kompositions: Komposition[]) => void
  ): () => void {
    const key = 'kompositions:list'
    
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set())
    }
    
    this.subscriptions.get(key)!.add(callback)
    
    // Send initial data
    const userKompositions = Array.from(this.kompositions.values())
      .filter(k => k.userId === this.currentUserId)
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || '').getTime()
        const dateB = new Date(b.updatedAt || b.createdAt || '').getTime()
        return dateB - dateA
      })
    
    callback(userKompositions)
    
    this.log('🔗 Subscription created', { type: 'kompositions', user: this.currentUserId })
    
    return () => {
      this.subscriptions.get(key)?.delete(callback)
      if (this.subscriptions.get(key)?.size === 0) {
        this.subscriptions.delete(key)
      }
      this.log('🔌 Subscription removed', { type: 'kompositions', user: this.currentUserId })
    }
  }

  // ==============================================
  // UTILITY METHODS
  // ==============================================

  createDefaultKomposition(name: string = 'New Komposition'): Komposition {
    return {
      userId: this.currentUserId,
      name,
      revision: '1.0',
      dvlType: 'video',
      bpm: 120,
      segments: [],
      sources: [],
      config: {
        width: 1920,
        height: 1080,
        framerate: 30,
        extensionType: 'mp4'
      },
      isPublic: false,
      sharedWith: [],
      tags: []
    }
  }

  // ==============================================
  // INTERNAL HELPER METHODS
  // ==============================================

  private getExtensionType(mimeType: string): string {
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.startsWith('image/')) return 'image'
    return 'unknown'
  }

  private async simulateDelay(): Promise<void> {
    if (this.options.simulateLatency) {
      const delay = Math.random() * 500 + 100 // 100-600ms
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  private shouldSimulateError(): boolean {
    return Math.random() < (this.options.errorRate || 0)
  }

  private notifySubscribers(type: string, id: string, data: any): void {
    const key = `${type}:${id}`
    const callbacks = this.subscriptions.get(key)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Error in subscription callback:', error)
        }
      })
    }
  }

  private log(message: string, data?: any): void {
    if (this.options.enableLogging) {
      if (data) {
        console.log(`[MockKompostService] ${message}`, data)
      } else {
        console.log(`[MockKompostService] ${message}`)
      }
    }
  }
}

// Singleton instance for testing
export const mockKompostService = new MockKompostService()

// Export factory function for creating custom instances
export function createMockKompostService(options?: MockKompostServiceOptions): MockKompostService {
  return new MockKompostService(options)
}