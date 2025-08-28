# YouTube Direct Upload Integration Guide

## Overview

This document provides comprehensive guidance for integrating YouTube direct upload functionality into the MCP FFMPEG Server, enabling users to upload processed videos directly to YouTube with optimized settings for both regular videos and YouTube Shorts.

## YouTube Data API v3 Integration Requirements

### Authentication and Authorization

#### OAuth2 Setup Requirements
1. **Google Cloud Console Configuration**
   - Create project in Google Cloud Console
   - Enable YouTube Data API v3
   - Create OAuth 2.0 credentials (Desktop Application type)
   - Download `client_secrets.json` file

2. **Required OAuth2 Scopes**
   - `https://www.googleapis.com/auth/youtube.upload` - Primary scope for video uploads
   - `https://www.googleapis.com/auth/youtube` - Full access (alternative)
   - `https://www.googleapis.com/auth/youtubepartner` - Partner access (if applicable)

3. **Authentication Flow**
   - Initial OAuth2 web flow via local server (port 0 for auto-assignment)
   - Token persistence in `token.json` for subsequent requests
   - Automatic token refresh when expired
   - Fallback to re-authentication if refresh fails

### API Endpoints and Parameters

#### videos.insert Method
- **Endpoint**: `POST https://www.googleapis.com/youtube/v3/videos`
- **Quota Cost**: 1600 units per upload
- **Daily Quota**: 10,000 units by default (allows ~6 uploads per day)
- **Maximum File Size**: 256GB
- **Supported MIME Types**: `video/*`, `application/octet-stream`

#### Required Parameters
- `part`: Comma-separated list of resource parts to set/return
  - **Mandatory**: `snippet`, `status`
  - **Optional**: `recordingDetails`, `contentDetails`

#### Request Body Structure
```json
{
  "snippet": {
    "title": "Video Title (required)",
    "description": "Video description with keywords and hashtags",
    "tags": ["keyword1", "keyword2", "keyword3"],
    "categoryId": "22",  // People & Blogs (default)
    "defaultLanguage": "en",
    "defaultAudioLanguage": "en"
  },
  "status": {
    "privacyStatus": "private",  // private, public, unlisted
    "selfDeclaredMadeForKids": false,
    "embeddable": true,
    "publicStatsViewable": true
  },
  "recordingDetails": {
    "recordingDate": "2025-01-01T00:00:00Z"
  }
}
```

### YouTube Shorts Specifications (2025)

#### Technical Requirements
- **Aspect Ratio**: 9:16 (vertical) - strongly preferred
- **Resolution**: 1080×1920 pixels (optimal)
- **Duration**: 15 seconds to 3 minutes (180 seconds)
- **File Size**: Under 60MB (ideally under 10MB for faster processing)
- **Format**: MP4 with H.264/AAC encoding
- **Frame Rate**: 24, 25, or 30 fps

#### Encoding Specifications
- **Video Codec**: H.264 (libx264)
- **Audio Codec**: AAC
- **Color Space**: bt709 (standard)
- **Pixel Format**: yuv420p
- **Bitrate**: Variable (CRF 18-23 recommended)

#### Shorts-Specific Metadata
```json
{
  "snippet": {
    "title": "YouTube Short Title #Shorts",
    "description": "Description with #Shorts #YouTubeShorts hashtags\n\n🎬 Created with MCP FFMPEG Server\n📱 Optimized for seamless looping",
    "tags": ["shorts", "youtube shorts", "vertical video"],
    "categoryId": "22"
  }
}
```

### Upload Implementation Strategy

#### Resumable Upload Protocol
1. **Chunked Upload**: Use 1MB chunks for reliable upload
2. **Progress Tracking**: Monitor upload progress with `next_chunk()`
3. **Error Handling**: Implement exponential backoff for HTTP 5xx errors
4. **Retry Logic**: Maximum 3 retries with exponential backoff (2^retry seconds)

#### Error Handling Best Practices
```python
# Retriable HTTP status codes
RETRIABLE_STATUS_CODES = [500, 502, 503, 504]

# Exponential backoff implementation
for retry in range(MAX_RETRIES):
    try:
        status, response = upload_request.next_chunk()
        if response:
            break
    except HttpError as e:
        if e.resp.status in RETRIABLE_STATUS_CODES:
            wait_time = (2 ** retry) + random.uniform(0, 1)
            await asyncio.sleep(wait_time)
        else:
            raise
```

### Rate Limits and Quota Management

#### Daily Quotas
- **Default Quota**: 10,000 units per day
- **Upload Cost**: 1600 units per video
- **Practical Limit**: ~6 uploads per day with default quota
- **Request Quota Increase**: Available through Google Cloud Console

#### Quota Optimization Strategies
1. **Batch Operations**: Combine metadata updates where possible
2. **Efficient Retries**: Avoid unnecessary API calls
3. **Local Validation**: Validate videos before upload to avoid wasted quota
4. **Monitoring**: Track quota usage and implement alerts

### Security Considerations

#### Credential Management
- **Never commit**: `client_secrets.json` or `token.json` to version control
- **Environment Variables**: Use `YOUTUBE_CREDENTIALS_FILE` and `YOUTUBE_TOKEN_FILE`
- **File Permissions**: Restrict access to credential files (600 permissions)
- **Secure Storage**: Consider encrypted storage for production deployments

#### Token Lifecycle
- **Token Expiry**: Access tokens expire in 1 hour
- **Refresh Tokens**: Long-lived (up to 6 months of inactivity)
- **Automatic Refresh**: Implement automatic token refresh
- **Revocation**: Handle token revocation gracefully

### Integration Architecture

#### MCP Tool Integration
1. **upload_youtube_video()** - General video upload
2. **upload_youtube_short()** - Shorts-optimized upload
3. **validate_youtube_video()** - Pre-upload validation
4. **get_youtube_quota()** - Quota status checking

#### Service Layer Structure
```
YouTubeUploadService
├── authenticate() - OAuth2 flow management
├── upload_video() - Core upload functionality
├── validate_shorts_video() - Shorts-specific validation
├── format_description() - Metadata optimization
└── get_upload_quota() - Quota monitoring
```

#### File Processing Pipeline
```
Source Video → Format Validation → Shorts Optimization → Upload → URL Response
```

### Testing Strategy

#### Unit Tests
- OAuth2 authentication flow testing
- Metadata validation testing
- Error handling scenario testing
- Quota calculation testing

#### Integration Tests
- Real YouTube API authentication
- Actual video upload (private visibility)
- Error response handling
- Upload progress tracking

#### End-to-End Tests
- Natural language processing: "Upload this video as a YouTube Short"
- Complete workflow: Process video → Optimize for Shorts → Upload
- Quality validation: Verify uploaded video meets specifications

### Production Deployment Considerations

#### Environment Configuration
```bash
# Required environment variables
YOUTUBE_CREDENTIALS_FILE=/path/to/client_secrets.json
YOUTUBE_TOKEN_FILE=/secure/path/to/token.json

# Optional configuration
YOUTUBE_DEFAULT_PRIVACY=private
YOUTUBE_DEFAULT_CATEGORY=22
YOUTUBE_MAX_RETRIES=3
```

#### Monitoring and Logging
- Upload success/failure rates
- Quota usage tracking
- Error frequency monitoring
- Performance metrics (upload time, file size)

#### Future Enhancements
1. **Java Port**: Migrate Python implementation to Java/Komposteur
2. **Batch Uploads**: Support multiple video uploads
3. **Playlist Management**: Create and manage playlists
4. **Analytics Integration**: YouTube Analytics API integration
5. **Thumbnail Upload**: Custom thumbnail support

## Implementation Timeline

1. **Phase 1**: Python service implementation with OAuth2
2. **Phase 2**: MCP tool integration and testing
3. **Phase 3**: Shorts optimization and validation
4. **Phase 4**: End-to-end testing and documentation
5. **Phase 5**: Java port planning and architecture

This integration provides a complete solution for YouTube video uploads with specific optimization for YouTube Shorts, ensuring optimal quality and platform compatibility while maintaining security and reliability standards.