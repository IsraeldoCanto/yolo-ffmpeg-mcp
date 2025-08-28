# YouTube Download Service Issue Report

## Problem Summary
The YouTube download service in the MCP FFMPEG server is failing with JSON parsing errors when attempting to download YouTube Shorts videos.

## What Went Wrong

### Error Details
- **Error Message**: `"Invalid response format: Expecting property name enclosed in double quotes: line 7 column 1 (char 158)"`
- **Affected URLs**: 
  - https://www.youtube.com/shorts/jEM-BVCkZCI
  - https://www.youtube.com/shorts/tQhdRmiVbEA  
  - https://www.youtube.com/shorts/NDtU6jdujrc
- **Success Rate**: 0.0% (all 3 downloads failed)

### Technical Analysis
1. **JSON Parsing Error**: The service is receiving malformed JSON responses from the download backend
2. **Character Position**: Error occurs at line 7, character 158, suggesting the JSON response is partially formed but becomes invalid
3. **Consistent Failure**: All three different YouTube Shorts URLs failed with identical error messages

## What Should Have Happened

### Expected Workflow
1. **URL Processing**: Accept YouTube Shorts URLs and extract video IDs
2. **Download Execution**: Use yt-dlp or similar service to download videos
3. **File Registration**: Register downloaded files in the file manager system
4. **Return File IDs**: Provide file_ids for immediate use with other MCP tools

### Expected Response Format
```json
{
  "success": true,
  "batch_summary": {
    "total_urls": 3,
    "successful": 3,
    "failed": 0,
    "success_rate": "100.0%"
  },
  "successful_downloads": [
    {
      "file_id": "file_abcd1234",
      "original_url": "https://www.youtube.com/shorts/jEM-BVCkZCI",
      "filename": "jEM-BVCkZCI_720p.mp4",
      "size": 12345678,
      "duration": 15.5
    }
  ],
  "failed_downloads": []
}
```

## Root Cause Investigation Needed

### Potential Issues
1. **Backend Service Problems**:
   - YouTube download service (Komposteur backend) may be returning malformed JSON
   - Service might be using outdated yt-dlp version with YouTube API changes
   - Network connectivity issues to YouTube servers

2. **JSON Response Handling**:
   - Response parsing logic may not handle edge cases
   - Character encoding issues in the response
   - Incomplete response truncation

3. **YouTube Shorts Specific Issues**:
   - YouTube Shorts may have different API endpoints
   - Different metadata structure compared to regular YouTube videos
   - Recent YouTube policy changes affecting automated downloads

## Debugging Steps Required

### 1. Raw Response Inspection
- Log the complete raw response from the download service
- Check character encoding and line endings
- Identify where the JSON becomes malformed

### 2. Service Health Check
- Test the Komposteur backend service directly
- Verify yt-dlp version and YouTube compatibility
- Check network connectivity and firewall rules

### 3. YouTube Shorts Testing
- Test with regular YouTube videos vs Shorts
- Compare response formats between different video types
- Check if specific Shorts features cause issues

## Temporary Workaround
- Use existing video files from `/tmp/music/source/` for music video creation
- Manually download YouTube Shorts and place in source directory
- Focus on MCP music video creation functionality while download service is fixed

## Files Requiring Investigation
- `src/download_service.py` - Main download service implementation
- `src/komposteur_bridge_processor.py` - Backend communication
- Download service logs and error traces

## Impact Assessment
- **High Impact**: Users cannot download YouTube content for music video creation
- **Workaround Available**: Existing source files can be used
- **Core Functionality**: MCP video processing tools remain functional

## Next Steps for Resolution
1. Debug the JSON parsing error with raw response logging
2. Update yt-dlp to latest version if outdated
3. Implement better error handling for malformed responses
4. Add YouTube Shorts specific handling if needed
5. Test with various YouTube Shorts URLs to ensure compatibility

This issue should be prioritized as it blocks a key user workflow for content creation.