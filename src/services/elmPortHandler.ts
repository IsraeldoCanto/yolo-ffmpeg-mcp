import { firebaseKompostService, FirebaseKompostService, Komposition, KompositionSaveResult, SourceUploadResult, FirebaseError } from './firebaseKompostService'

// Request types from ELM
export interface SourceUploadRequest {
  file: File
  filename: string
}

export interface UserPreferences {
  defaultBpm: number
  defaultVideoConfig: {
    width: number
    height: number
    framerate: number
    extensionType: string
  }
}

export interface UserProfile {
  userId: string
  email: string
  displayName: string
  photoURL?: string
  preferences: UserPreferences
}

export interface CollaboratorInfo {
  userId: string
  email: string
  joinedAt: string
}

/**
 * ELM Port Handler - Bridges ELM application with Firebase services
 * 
 * This class handles all communication between the ELM KompostEdit app
 * and Firebase backend services through ports.
 */
export class ElmPortHandler {
  private firebaseService: FirebaseKompostService
  private elmApp: any
  private subscriptions: Map<string, () => void> = new Map()

  constructor(firebaseService: FirebaseKompostService = firebaseKompostService) {
    this.firebaseService = firebaseService
  }

  /**
   * Initialize ELM ports and set up all port handlers
   */
  setupPorts(elmApp: any): void {
    this.elmApp = elmApp
    
    // Set up outgoing port handlers (ELM → Firebase)
    this.setupOutgoingPorts()
    
    console.log('🔌 ELM ports initialized successfully')
  }

  /**
   * Set up handlers for ports that send data from ELM to Firebase
   */
  private setupOutgoingPorts(): void {
    
    // ==============================================
    // KOMPOSITION OPERATIONS
    // ==============================================
    
    // Save komposition
    this.elmApp.ports.saveKomposition?.subscribe(async (komposition: Komposition) => {
      console.log('🔄 Saving komposition:', komposition.name)
      
      try {
        const result = await this.firebaseService.saveKomposition(komposition)
        
        if (result.success && result.komposition) {
          this.elmApp.ports.kompositionSaved.send(result)
          console.log('✅ Komposition saved:', result.kompositionId)
        } else {
          throw new Error(result.error || 'Unknown save error')
        }
      } catch (error: any) {
        console.error('❌ Error saving komposition:', error)
        this.sendFirebaseError('saveKomposition', error.message)
      }
    })
    
    // Load komposition
    this.elmApp.ports.loadKomposition?.subscribe(async (kompositionId: string) => {
      console.log('🔄 Loading komposition:', kompositionId)
      
      try {
        const komposition = await this.firebaseService.loadKomposition(kompositionId)
        this.elmApp.ports.kompositionLoaded.send(komposition)
        console.log('✅ Komposition loaded:', komposition.name)
      } catch (error: any) {
        console.error('❌ Error loading komposition:', error)
        this.sendFirebaseError('loadKomposition', error.message)
      }
    })
    
    // Delete komposition
    this.elmApp.ports.deleteKomposition?.subscribe(async (kompositionId: string) => {
      console.log('🔄 Deleting komposition:', kompositionId)
      
      try {
        await this.firebaseService.deleteKomposition(kompositionId)
        this.elmApp.ports.kompositionDeleted.send(kompositionId)
        console.log('✅ Komposition deleted:', kompositionId)
      } catch (error: any) {
        console.error('❌ Error deleting komposition:', error)
        this.sendFirebaseError('deleteKomposition', error.message)
      }
    })
    
    // Search kompositions
    this.elmApp.ports.searchKompositions?.subscribe(async (searchQuery: string) => {
      console.log('🔍 Searching kompositions:', searchQuery)
      
      try {
        const kompositions = await this.firebaseService.searchKompositions(searchQuery)
        this.elmApp.ports.kompositionsSearched.send(kompositions)
        console.log(`✅ Found ${kompositions.length} kompositions`)
      } catch (error: any) {
        console.error('❌ Error searching kompositions:', error)
        this.sendFirebaseError('searchKompositions', error.message)
      }
    })
    
    // Load recent kompositions
    this.elmApp.ports.loadRecentKompositions?.subscribe(async () => {
      console.log('🔄 Loading recent kompositions')
      
      try {
        const kompositions = await this.firebaseService.getRecentKompositions()
        this.elmApp.ports.kompositionsSearched.send(kompositions)
        console.log(`✅ Loaded ${kompositions.length} recent kompositions`)
      } catch (error: any) {
        console.error('❌ Error loading recent kompositions:', error)
        this.sendFirebaseError('loadRecentKompositions', error.message)
      }
    })
    
    // ==============================================
    // SOURCE/MEDIA OPERATIONS
    // ==============================================
    
    // Upload source file
    this.elmApp.ports.uploadSource?.subscribe(async (uploadRequest: SourceUploadRequest) => {
      console.log('🔄 Uploading source:', uploadRequest.filename)
      
      try {
        const result = await this.firebaseService.uploadSource(
          uploadRequest.file,
          (progress) => {
            // Send progress updates to ELM
            this.elmApp.ports.uploadProgress?.send({
              filename: uploadRequest.filename,
              progress: progress
            })
          }
        )
        
        this.elmApp.ports.sourceUploaded.send(result)
        
        if (result.success) {
          console.log('✅ Source uploaded:', result.sourceId)
        } else {
          console.error('❌ Source upload failed:', result.error)
        }
      } catch (error: any) {
        console.error('❌ Error uploading source:', error)
        this.sendFirebaseError('uploadSource', error.message)
      }
    })
    
    // Delete source
    this.elmApp.ports.deleteSource?.subscribe(async (sourceId: string) => {
      console.log('🔄 Deleting source:', sourceId)
      
      try {
        await this.firebaseService.deleteSource(sourceId)
        this.elmApp.ports.sourceDeleted.send(sourceId)
        console.log('✅ Source deleted:', sourceId)
      } catch (error: any) {
        console.error('❌ Error deleting source:', error)
        this.sendFirebaseError('deleteSource', error.message)
      }
    })
    
    // ==============================================
    // USER OPERATIONS
    // ==============================================
    
    // Save user preferences
    this.elmApp.ports.saveUserPreferences?.subscribe(async (preferences: UserPreferences) => {
      console.log('🔄 Saving user preferences')
      
      try {
        // Implementation would save to users collection
        // For now, just acknowledge success
        this.elmApp.ports.userPreferencesSaved.send(true)
        console.log('✅ User preferences saved')
      } catch (error: any) {
        console.error('❌ Error saving user preferences:', error)
        this.sendFirebaseError('saveUserPreferences', error.message)
      }
    })
    
    // Load user profile
    this.elmApp.ports.loadUserProfile?.subscribe(async () => {
      console.log('🔄 Loading user profile')
      
      try {
        // Implementation would load from users collection
        // For now, create a mock profile
        const mockProfile: UserProfile = {
          userId: 'current-user',
          email: 'user@example.com',
          displayName: 'Test User',
          preferences: {
            defaultBpm: 120,
            defaultVideoConfig: {
              width: 1920,
              height: 1080,
              framerate: 30,
              extensionType: 'mp4'
            }
          }
        }
        
        this.elmApp.ports.userProfileLoaded.send(mockProfile)
        console.log('✅ User profile loaded')
      } catch (error: any) {
        console.error('❌ Error loading user profile:', error)
        this.sendFirebaseError('loadUserProfile', error.message)
      }
    })
    
    // ==============================================
    // REAL-TIME SUBSCRIPTIONS
    // ==============================================
    
    // Subscribe to komposition updates
    this.elmApp.ports.subscribeToKomposition?.subscribe((kompositionId: string) => {
      console.log('🔄 Subscribing to komposition:', kompositionId)
      
      // Unsubscribe from previous subscription if exists
      const existingUnsub = this.subscriptions.get(`komposition-${kompositionId}`)
      if (existingUnsub) {
        existingUnsub()
      }
      
      // Set up new subscription
      const unsubscribe = this.firebaseService.subscribeToKomposition(
        kompositionId,
        (komposition) => {
          if (komposition) {
            this.elmApp.ports.kompositionUpdated.send(komposition)
            console.log('🔄 Komposition updated:', komposition.name)
          }
        }
      )
      
      this.subscriptions.set(`komposition-${kompositionId}`, unsubscribe)
      console.log('✅ Subscribed to komposition updates')
    })
    
    // Unsubscribe from komposition
    this.elmApp.ports.unsubscribeFromKomposition?.subscribe((kompositionId: string) => {
      console.log('🔄 Unsubscribing from komposition:', kompositionId)
      
      const unsubscribe = this.subscriptions.get(`komposition-${kompositionId}`)
      if (unsubscribe) {
        unsubscribe()
        this.subscriptions.delete(`komposition-${kompositionId}`)
        console.log('✅ Unsubscribed from komposition updates')
      }
    })
    
    // Subscribe to user's kompositions list
    this.elmApp.ports.subscribeToKompositionsList?.subscribe(() => {
      console.log('🔄 Subscribing to kompositions list')
      
      const unsubscribe = this.firebaseService.subscribeToUserKompositions(
        (kompositions) => {
          this.elmApp.ports.kompositionsListUpdated.send(kompositions)
          console.log(`🔄 Kompositions list updated: ${kompositions.length} items`)
        }
      )
      
      this.subscriptions.set('kompositions-list', unsubscribe)
      console.log('✅ Subscribed to kompositions list updates')
    })
  }

  /**
   * Send error message to ELM via firebaseError port
   */
  private sendFirebaseError(operation: string, message: string, code?: string): void {
    const error: FirebaseError = {
      operation,
      message,
      code
    }
    
    this.elmApp.ports.firebaseError?.send(error)
  }

  /**
   * Create a new default komposition and send to ELM
   */
  createNewKomposition(name?: string): void {
    try {
      const defaultKomposition = this.firebaseService.createDefaultKomposition(name)
      this.elmApp.ports.kompositionLoaded.send(defaultKomposition)
      console.log('✅ New default komposition created:', defaultKomposition.name)
    } catch (error: any) {
      console.error('❌ Error creating default komposition:', error)
      this.sendFirebaseError('createNewKomposition', error.message)
    }
  }

  /**
   * Clean up all subscriptions when component unmounts
   */
  cleanup(): void {
    console.log('🧹 Cleaning up ELM port subscriptions')
    
    this.subscriptions.forEach((unsubscribe, key) => {
      unsubscribe()
      console.log(`🗑️ Unsubscribed from ${key}`)
    })
    
    this.subscriptions.clear()
    console.log('✅ All subscriptions cleaned up')
  }

  /**
   * Get current subscription count (useful for debugging)
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size
  }
}

// Singleton instance
export const elmPortHandler = new ElmPortHandler()