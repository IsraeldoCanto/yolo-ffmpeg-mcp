# YouTube API Integration Setup Guide

## Overview
This guide explains how to set up YouTube API integration for uploading YouTube Shorts directly from the MCP FFMPEG Server.

## 🎯 What You Get
- **Seamless YouTube Shorts Upload**: Upload optimized 9:16 videos directly to YouTube
- **Automatic Looping**: Videos created with seamless loop functionality for perfect YouTube Shorts
- **OAuth2 Authentication**: Secure authentication with YouTube API
- **Validation Tools**: Check video compliance before upload
- **Batch Operations**: Upload multiple videos with consistent settings

## 📋 Prerequisites

### 1. Google Cloud Project Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the **YouTube Data API v3**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"

### 2. OAuth2 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Desktop application" as application type
4. Name it "MCP FFMPEG YouTube Upload"
5. Download the credentials JSON file
6. Save as `youtube_credentials.json` in your project directory

### 3. Python Dependencies
Install required Google API libraries:
```bash
pip install google-api-python-client google-auth-oauthlib
```

Or with the project's virtual environment:
```bash
.venv/bin/pip install google-api-python-client google-auth-oauthlib
```

## 🔧 Configuration

### Environment Variables
Set the credentials file path:
```bash
export YOUTUBE_CREDENTIALS_FILE="/path/to/youtube_credentials.json"
export YOUTUBE_TOKEN_FILE="/path/to/token.json"  # Optional, defaults to token.json
```

### First-Time Authentication
1. Run any YouTube upload command
2. Your browser will open for OAuth2 authentication
3. Sign in to your YouTube account
4. Grant permissions to upload videos
5. Authentication token will be saved for future use

## 🎬 Usage Examples

### 1. Validate YouTube Shorts Compliance
```python
# Check if video meets YouTube Shorts requirements
result = await validate_youtube_short("file_12345678")
print(f"Shorts ready: {result['shorts_ready']}")
```

### 2. Upload YouTube Short
```python
# Upload with basic settings
result = await upload_youtube_short(
    file_id="file_bb6f3002",
    title="My Music Video Short",
    description="Created with MCP FFMPEG Server - seamless looping music video",
    tags="music,shorts,loop,ai",
    privacy_status="private"
)

if result["success"]:
    print(f"✅ Uploaded! Video ID: {result['video_id']}")
    print(f"🔗 YouTube URL: {result['video_url']}")
    print(f"📱 Shorts URL: {result['shorts_url']}")
```

### 3. Complete Workflow: Create and Upload
```python
# 1. Create seamless looping YouTube Short
short_file_id = await create_youtube_shorts_video(...)

# 2. Validate compliance
validation = await validate_youtube_short(short_file_id)
if validation["shorts_ready"]:
    # 3. Upload to YouTube
    upload_result = await upload_youtube_short(
        file_id=short_file_id,
        title="AI-Generated Music Video",
        description="Seamless looping music video created with AI scene detection",
        tags="ai,music,shorts,loop,automated",
        privacy_status="public"
    )
```

## 📊 YouTube Shorts Specifications

### Technical Requirements
- **Aspect Ratio**: 9:16 (vertical)
- **Resolution**: 1080x1920 (recommended)
- **Duration**: Maximum 3 minutes (180 seconds)
- **Format**: MP4 with H.264 video codec
- **Audio**: AAC codec recommended
- **File Size**: Under 500MB (practical limit)

### MCP Server Optimizations
Our implementation automatically ensures:
- **GOP Structure**: Optimized for seamless looping
- **Audio Crossfade**: Smooth audio transitions for perfect loops
- **Color Space**: bt709 for YouTube compatibility
- **Frame Rate**: 30fps for mobile optimization

## 🚀 Advanced Features

### 1. Batch Upload
```python
# Upload multiple videos with consistent settings
video_ids = ["file_1", "file_2", "file_3"]
for i, video_id in enumerate(video_ids):
    result = await upload_youtube_short(
        file_id=video_id,
        title=f"Music Series Part {i+1}",
        description="Part of AI-generated music video series",
        tags="series,music,ai,shorts",
        privacy_status="unlisted"
    )
```

### 2. Error Handling
```python
result = await upload_youtube_short(...)
if not result["success"]:
    error = result["error"]
    if "quota" in error.lower():
        print("⚠️ YouTube API quota exceeded (50 uploads/day limit)")
    elif "authentication" in error.lower():
        print("🔑 Re-authentication required")
        # Re-run authentication flow
    else:
        print(f"❌ Upload failed: {error}")
```

## 📝 API Limits and Quotas

### YouTube API Quotas
- **Daily Upload Limit**: 50 videos per day per channel (YouTube's hard limit)
- **API Quota**: 10,000 units per day (uploads cost ~1600 units each)
- **File Size**: Maximum 256GB per video (practical limit much lower)

### Best Practices
- **Start with Private**: Upload as private first, then change to public
- **Batch Processing**: Group uploads to avoid hitting rate limits
- **Monitor Quotas**: Track daily upload count to stay within limits
- **Error Recovery**: Implement retry logic for network issues

## 🔒 Security Considerations

### Credential Management
- **Never commit** `youtube_credentials.json` to version control
- Store credentials outside the project directory in production
- Use environment variables for credential paths
- Rotate credentials periodically

### OAuth2 Token Security
- `token.json` contains sensitive access tokens
- Tokens expire but are automatically refreshed
- Store tokens securely in production environments
- Monitor for unauthorized access attempts

## 🐛 Troubleshooting

### Common Issues

#### 1. Authentication Errors
```bash
Error: Authentication failed
```
**Solution**: 
- Check credentials file path
- Ensure YouTube Data API v3 is enabled
- Re-run OAuth2 flow: delete `token.json` and try again

#### 2. Upload Failures
```bash
Error: HTTP error: 403 Forbidden
```
**Solution**:
- Check API quotas in Google Cloud Console
- Verify YouTube channel is eligible for uploads
- Ensure video meets YouTube community guidelines

#### 3. Video Not Appearing as Short
```bash  
Video uploaded but not showing in Shorts feed
```
**Solution**:
- Verify 9:16 aspect ratio (use `validate_youtube_short()`)
- Ensure duration is under 3 minutes
- Add #Shorts hashtag in description

### Debug Mode
Enable detailed logging:
```python
import logging
logging.basicConfig(level=logging.INFO)
```

## 📚 Additional Resources

- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- [OAuth2 Authentication Guide](https://developers.google.com/youtube/v3/guides/authentication)
- [YouTube Shorts Creator Guidelines](https://support.google.com/youtube/answer/10059070)
- [Google Cloud Console](https://console.cloud.google.com/)

## 🎉 Success Metrics

After setup, you should be able to:
- ✅ Upload seamless looping YouTube Shorts
- ✅ Validate videos before upload 
- ✅ Handle authentication automatically
- ✅ Track upload success/failure rates
- ✅ Process multiple videos efficiently

The integration transforms your MCP FFMPEG Server into a complete YouTube Shorts content creation and publishing pipeline!