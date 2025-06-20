port module FirebasePorts exposing 
    ( -- Outgoing ports (ELM → JavaScript)
      saveKomposition
    , loadKomposition
    , deleteKomposition
    , searchKompositions
    , loadRecentKompositions
    , uploadSource
    , deleteSource
    , saveUserPreferences
    , loadUserProfile
    , subscribeToKomposition
    , unsubscribeFromKomposition
    , subscribeToKompositionsList
    
    -- Incoming ports (JavaScript → ELM)
    , kompositionSaved
    , kompositionLoaded
    , kompositionDeleted
    , kompositionsSearched
    , kompositionsListUpdated
    , kompositionUpdated
    , sourceUploaded
    , sourceDeleted
    , uploadProgress
    , userProfileLoaded
    , userPreferencesSaved
    , collaboratorJoined
    , firebaseError
    )

import Models.BaseModel exposing (Komposition, Source)
import Json.Encode as Encode
import Json.Decode as Decode


-- ==============================================
-- OUTGOING PORTS (ELM → JavaScript/Firebase)
-- ==============================================

-- Komposition operations
port saveKomposition : Komposition -> Cmd msg
port loadKomposition : String -> Cmd msg  -- kompositionId
port deleteKomposition : String -> Cmd msg  -- kompositionId
port searchKompositions : String -> Cmd msg  -- search query
port loadRecentKompositions : () -> Cmd msg

-- Source operations
port uploadSource : SourceUploadRequest -> Cmd msg
port deleteSource : String -> Cmd msg  -- sourceId

-- User operations
port saveUserPreferences : UserPreferences -> Cmd msg
port loadUserProfile : () -> Cmd msg

-- Real-time subscriptions
port subscribeToKomposition : String -> Cmd msg  -- kompositionId
port unsubscribeFromKomposition : String -> Cmd msg  -- kompositionId
port subscribeToKompositionsList : () -> Cmd msg


-- ==============================================
-- INCOMING PORTS (JavaScript/Firebase → ELM)
-- ==============================================

-- Komposition responses
port kompositionSaved : (KompositionSaveResult -> msg) -> Sub msg
port kompositionLoaded : (Komposition -> msg) -> Sub msg
port kompositionDeleted : (String -> msg) -> Sub msg  -- kompositionId
port kompositionsSearched : (List Komposition -> msg) -> Sub msg
port kompositionsListUpdated : (List Komposition -> msg) -> Sub msg

-- Real-time updates
port kompositionUpdated : (Komposition -> msg) -> Sub msg

-- Source responses
port sourceUploaded : (SourceUploadResult -> msg) -> Sub msg
port sourceDeleted : (String -> msg) -> Sub msg  -- sourceId
port uploadProgress : (UploadProgress -> msg) -> Sub msg

-- User responses
port userProfileLoaded : (UserProfile -> msg) -> Sub msg
port userPreferencesSaved : (Bool -> msg) -> Sub msg

-- Collaboration
port collaboratorJoined : (CollaboratorInfo -> msg) -> Sub msg

-- Error handling
port firebaseError : (FirebaseError -> msg) -> Sub msg


-- ==============================================
-- TYPE DEFINITIONS
-- ==============================================

type alias SourceUploadRequest =
    { file : Encode.Value  -- File object from JavaScript
    , filename : String
    }

type alias KompositionSaveResult =
    { success : Bool
    , kompositionId : Maybe String
    , komposition : Maybe Komposition
    , error : Maybe String
    }

type alias SourceUploadResult =
    { success : Bool
    , sourceId : Maybe String
    , url : Maybe String
    , error : Maybe String
    }

type alias UploadProgress =
    { filename : String
    , progress : Float  -- 0.0 to 1.0
    }

type alias UserPreferences =
    { defaultBpm : Float
    , defaultVideoConfig : VideoConfig
    }

type alias VideoConfig =
    { width : Int
    , height : Int
    , framerate : Int
    , extensionType : String
    }

type alias UserProfile =
    { userId : String
    , email : String
    , displayName : String
    , photoURL : Maybe String
    , preferences : UserPreferences
    }

type alias CollaboratorInfo =
    { userId : String
    , email : String
    , joinedAt : String
    }

type alias FirebaseError =
    { operation : String
    , message : String
    , code : Maybe String
    }


-- ==============================================
-- HELPER FUNCTIONS
-- ==============================================

-- Convert Firebase result to ELM Maybe
resultToMaybe : { success : Bool, value : Maybe a, error : Maybe String } -> Maybe a
resultToMaybe result =
    if result.success then
        result.value
    else
        Nothing

-- Create default user preferences
defaultUserPreferences : UserPreferences
defaultUserPreferences =
    { defaultBpm = 120.0
    , defaultVideoConfig = 
        { width = 1920
        , height = 1080
        , framerate = 30
        , extensionType = "mp4"
        }
    }

-- Check if a Firebase operation was successful
isSuccess : { success : Bool, error : Maybe String } -> Bool
isSuccess result =
    result.success && result.error == Nothing

-- Extract error message from Firebase result
getErrorMessage : { success : Bool, error : Maybe String } -> String
getErrorMessage result =
    case result.error of
        Just message -> message
        Nothing -> if result.success then "Success" else "Unknown error"


-- ==============================================
-- PORT SUBSCRIPTION HELPERS
-- ==============================================

-- Combine all Firebase subscriptions into one
subscriptions : (KompositionSaveResult -> msg) 
             -> (Komposition -> msg)
             -> (String -> msg)
             -> (List Komposition -> msg)
             -> (List Komposition -> msg)
             -> (Komposition -> msg)
             -> (SourceUploadResult -> msg)
             -> (String -> msg)
             -> (UploadProgress -> msg)
             -> (UserProfile -> msg)
             -> (Bool -> msg)
             -> (CollaboratorInfo -> msg)
             -> (FirebaseError -> msg)
             -> Sub msg
subscriptions kompoSavedMsg kompoLoadedMsg kompoDeletedMsg komposSearchedMsg 
              komposListUpdatedMsg kompoUpdatedMsg sourceUploadedMsg sourceDeletedMsg 
              uploadProgressMsg userProfileMsg userPrefsSavedMsg collaboratorMsg errorMsg =
    Sub.batch
        [ kompositionSaved kompoSavedMsg
        , kompositionLoaded kompoLoadedMsg
        , kompositionDeleted kompoDeletedMsg
        , kompositionsSearched komposSearchedMsg
        , kompositionsListUpdated komposListUpdatedMsg
        , kompositionUpdated kompoUpdatedMsg
        , sourceUploaded sourceUploadedMsg
        , sourceDeleted sourceDeletedMsg
        , uploadProgress uploadProgressMsg
        , userProfileLoaded userProfileMsg
        , userPreferencesSaved userPrefsSavedMsg
        , collaboratorJoined collaboratorMsg
        , firebaseError errorMsg
        ]

-- Simplified subscriptions for basic usage
basicSubscriptions : (Komposition -> msg) 
                  -> (List Komposition -> msg)
                  -> (FirebaseError -> msg)
                  -> Sub msg
basicSubscriptions kompoLoadedMsg komposSearchedMsg errorMsg =
    Sub.batch
        [ kompositionLoaded kompoLoadedMsg
        , kompositionsSearched komposSearchedMsg
        , firebaseError errorMsg
        ]