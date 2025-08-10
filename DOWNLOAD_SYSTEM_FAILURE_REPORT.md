# YouTube Download System Failure Analysis

**Issue Date:** 2025-08-07  
**Severity:** HIGH - Blocks video acquisition workflow  
**Component:** Multi-Source Download Bridge (Java)  

## Problem Summary

The MCP FFMPEG server's YouTube download functionality is failing with a Java classpath error, preventing acquisition of source videos for music video creation workflows.

## Error Details

### **Primary Error:**
```
Error: Could not find or load main class MultiSourceDownloadBridge
Caused by: java.lang.ClassNotFoundException: MultiSourceDownloadBridge
```

### **Affected Operations:**
- `batch_download_urls()` - Batch video downloading
- `download_youtube_video()` - Single YouTube video downloads  
- `get_download_info()` - Video metadata preview

### **Failed URLs (Test Case):**
- https://www.youtube.com/shorts/PLnPZVqiyjA
- https://www.youtube.com/shorts/3xEMCU1fyl8
- https://www.youtube.com/shorts/Oa8iS1W3OCM

## Technical Analysis

### **Root Cause: Missing Java Class**
The `MultiSourceDownloadBridge` class is not found in the Java classpath, indicating:
1. **JAR file missing** - Required dependency not available
2. **Classpath misconfiguration** - JAR present but not in classpath
3. **Build issue** - Class not compiled into the JAR
4. **Version mismatch** - Using wrong JAR version

### **Code Path Analysis**
Based on MCP server code in `src/download_service.py`:

```python
# Around line 330-340
java_cmd = [
    'java', '-cp', jar_path,  # <- JAR path resolution
    'MultiSourceDownloadBridge',  # <- Missing class
    'download',
    request.url,
    # ... other parameters
]
```

### **JAR Resolution Logic**
The download service attempts to locate JARs in this order:
1. **Local development JAR:** `~/.m2/repository/no/lau/kompost/`
2. **Production JAR:** GitHub packages or local builds
3. **Fallback:** Pre-built JAR in project directory

## Current System State

### **Available JARs Investigation Needed:**
- [ ] Check `~/.m2/repository/no/lau/kompost/` for latest builds
- [ ] Verify GitHub packages authentication and availability
- [ ] Examine existing JAR contents for `MultiSourceDownloadBridge` class
- [ ] Check Java version compatibility

### **Alternative Working Components:**
- ✅ **Local video processing** - FFMPEG operations work correctly
- ✅ **File management** - Registry and file operations functional
- ✅ **Content analysis** - Video analysis tools operational
- ❌ **Download functionality** - Completely broken

## Impact Assessment

### **Immediate Impact:**
- **YouTube video acquisition blocked** - Cannot download source material
- **Multi-source workflows broken** - Depends on download capability
- **Music video creation limited** - Must use pre-existing local files

### **Workflow Workarounds:**
1. **Manual download** - Use external tools (yt-dlp, youtube-dl)
2. **Local file workflow** - Process existing `.testdata/` files
3. **Pre-staging** - Download videos separately before MCP processing

## Available Resources (Current Project)

### **✅ Audio Sources (.testdata/):**
- `Subnautic Measures.flac` (28MB) - Target background music
- `16BL - Deep In My Soul (Original Mix).mp3` (19MB)
- `Torn on TDF.flac` (44MB)
- `ZeroSoul.flac` (24MB)

### **✅ Video Sources (.testdata/):**
- `JJVtt947FfI_136.mp4` (17MB) - Pre-downloaded video content
- `_wZ5Hof5tXY_136.mp4` (10MB) - Pre-downloaded video content
- `Boat having a sad day.jpeg` - Image source (can convert to video)

### **❌ Missing Target Videos:**
- https://www.youtube.com/shorts/PLnPZVqiyjA - Needs manual download
- https://www.youtube.com/shorts/3xEMCU1fyl8 - Needs manual download  
- https://www.youtube.com/shorts/Oa8iS1W3OCM - Needs manual download

## Recommendations for Komposteur Claude

### **Priority 1: Immediate Fix**
1. **Verify JAR availability**
   ```bash
   find ~/.m2/repository -name "*kompost*" -name "*.jar" | head -10
   ls -la ~/.m2/repository/no/lau/kompost/*/
   ```

2. **Check JAR contents**
   ```bash
   jar -tf <kompost-jar-file> | grep MultiSourceDownloadBridge
   java -cp <kompost-jar-file> MultiSourceDownloadBridge --help
   ```

3. **Verify Java classpath in download_service.py**
   - Line ~335: Check `jar_path` resolution logic
   - Ensure `MultiSourceDownloadBridge` is the correct main class name

### **Priority 2: Alternative Solutions**
1. **Integrate yt-dlp directly**
   ```python
   # Instead of Java bridge, use yt-dlp subprocess
   import subprocess
   result = subprocess.run(['yt-dlp', url, '-o', output_path])
   ```

2. **Update JAR dependencies**
   - Build/update komposteur JARs with correct main classes
   - Ensure all download bridge classes are included

### **Priority 3: Error Handling Enhancement**
1. **Better error diagnostics**
   - Check if JAR file exists before executing
   - Validate Java version compatibility
   - Provide fallback download methods

2. **Graceful degradation**
   - Allow manual file staging when download fails
   - Clear error messages guiding users to workarounds

## Diagnostic Commands for Investigation

### **For Komposteur Claude to Run:**
```bash
# Check JAR availability
find ~/.m2/repository -name "*kompost*" -type f | head -10

# Check specific download bridge locations  
find . -name "*jar" -exec jar -tf {} \; | grep -i download

# Test Java execution directly
java -cp ~/.m2/repository/path/to/jar MultiSourceDownloadBridge --version

# Check yt-dlp availability as fallback
which yt-dlp || which youtube-dl
```

## Expected Resolution

### **Success Criteria:**
- [ ] `get_download_info(youtube_url)` returns video metadata
- [ ] `download_youtube_video(url)` successfully downloads video
- [ ] `batch_download_urls([urls])` processes multiple videos
- [ ] All three target YouTube Shorts download successfully

### **Testing URLs:**
Use the original problematic URLs as test cases:
- https://www.youtube.com/shorts/PLnPZVqiyjA
- https://www.youtube.com/shorts/3xEMCU1fyl8
- https://www.youtube.com/shorts/Oa8iS1W3OCM

---

**Next Steps:** Pass this report to Komposteur Claude for Java download bridge diagnosis and repair.