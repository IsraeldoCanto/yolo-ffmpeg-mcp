# Video Processing Bug Report for Komposteur Claude

## 🎉 **INTEGRATION SUCCESS - ARCHITECTURE COMPLETE**

The Komposteur-MCP integration is **100% WORKING** at the architecture level:

- ✅ **Discovery Protocol**: Komposteur finds our processor at `/src/komposition_processor.py`
- ✅ **Communication**: JSON data flows correctly between Java and Python
- ✅ **Processing**: Our MCP processor receives and processes komposition data
- ✅ **Output Creation**: Files are created at expected locations

**The integration pipeline is operational!** 🚀

## 🐛 **REMAINING ISSUES: Video Processing Implementation**

There are two remaining issues in the video processing layer:

### **Issue 1: Parameter Passing Bug**
Our MCP video operations have parameter passing bugs that prevent real MP4 creation.

### **Error Details**

**Symptom**: 
```
Operation 'trim' failed on file 'file_4321e139'. 
Reason: Unexpected error in core processing: sequence item 0: expected str instance, FileManager found.
```

**Root Cause**: Parameter passing issue in FFmpeg wrapper layer

### **Issue 2: Missing Filter Command Support**
The komposition processor needs to support FFmpeg filter commands that should be applied on top of normal video & audio processing.

**Current Gap**: Komposition JSON may contain filter specifications, but our processor doesn't handle them.

**Required Enhancement**: 
- Parse filter commands from komposition JSON
- Apply filters as post-processing step after basic video operations (trim, concatenate, etc.)
- Layer filters on top of standard video & audio processing pipeline

**Filter Integration Order**:
```
1. Basic Video Operations (trim, resize, concatenate)
2. Audio Processing (replace_audio, normalize)  
3. ➕ **MISSING: Filter Application** (color grading, effects, transitions)
4. Final Output
```

### **Current Behavior**
1. ✅ Komposteur calls our processor successfully
2. ✅ Processor parses komposition JSON correctly  
3. ✅ Segments are identified and processed
4. ❌ **Issue 1**: FFmpeg operations fail due to parameter type mismatch
5. ❌ **Issue 2**: Filter commands are ignored (if present in komposition)
6. ✅ Error handling works, files still created (but as error messages, not videos)

### **Test Case That Reproduces Bug**

```bash
# This command demonstrates the working integration + video bug:
PYTHONPATH=/Users/stiglau/utvikling/privat/lm-ai/mcp/yolo-ffmpeg-mcp uv run python -c "
from integration.komposteur.bridge.komposteur_bridge import get_bridge
result = bridge.process_kompost_json('/tmp/music/metadata/generated_kompositions/generated_Test_Music_Video_20250730_102213.json')
print(result)
"

# Returns: success=true but creates text file instead of MP4 due to video processing bug
```

### **Komposition Data Being Processed**
```json
{
  "metadata": {
    "title": "Test Music Video",
    "bpm": 120,
    "totalBeats": 64
  },
  "segments": [
    {
      "sourceRef": "video_b.mp4",
      "startBeat": 0,
      "endBeat": 21,
      "operation": "trim",
      "params": {
        "start": 0,
        "duration": 10.5
      }
    }
  ]
}
```

## 🔧 **SPECIFIC ISSUE LOCATIONS**

### **Issue 1: Parameter Bug**
**File**: `/src/komposition_processor_mcp.py` (the original MCP processor)
**Method**: `extract_and_stretch_video()` around line 155
**Issue**: Parameter passing to `process_file_internal()` 

The error suggests FFmpeg wrapper is receiving a `FileManager` object instead of string parameters.

### **Issue 2: Missing Filter Support**
**File**: `/src/komposition_processor_mcp.py`
**Method**: `process_komposition()` and `extract_and_stretch_video()`
**Missing**: Filter command parsing and application

**Required JSON Structure Support**:
```json
{
  "segments": [
    {
      "sourceRef": "video.mp4",
      "operation": "trim",
      "params": {...},
      "filters": [
        {"type": "color_grading", "params": {"brightness": 1.2}},
        {"type": "blur", "params": {"radius": 2}},
        {"type": "custom", "ffmpeg_filter": "-vf 'eq=brightness=0.1:contrast=1.2'"}
      ]
    }
  ],
  "global_filters": [
    {"type": "fade", "params": {"in": 1.0, "out": 2.0}}
  ]
}
```

### **Code Path Where Bug Occurs**
1. `komposition_processor.py` (bridge) calls → 
2. `komposition_processor_mcp.py` (real processor) calls →
3. `process_file_internal()` calls →
4. FFmpeg wrapper operations → **❌ PARAMETER TYPE ERROR**

## 🎯 **REQUEST FOR KOMPOSTEUR CLAUDE**

**Can you fix both video processing issues?**

The integration architecture is complete and working perfectly. We need:

### **Priority 1: Fix Parameter Bug** 
FFmpeg operations should generate real MP4 files instead of failing with parameter type errors.

### **Priority 2: Add Filter Support**
Komposition processor should support filter commands that layer on top of basic video/audio processing.

**Filter Processing Pipeline**:
```
Input Video → Basic Operations (trim/resize) → Audio Processing → **Filter Layer** → Final Output
```

### **Files to Examine:**
- `/src/komposition_processor_mcp.py` - Main komposition processor (line ~155)
- `/src/video_operations.py` - Contains `process_file_internal()`
- `/src/ffmpeg_wrapper.py` - FFmpeg command execution

### **Expected Fixes:**

**For Issue 1** - Fix parameter passing so that when we run:
```bash
PYTHONPATH=/path uv run python /src/komposition_processor.py '{"metadata":{"title":"test"},"segments":[...]}'
```

It returns:
```json
{
  "success": true,
  "output_path": "/path/to/real_video.mp4"
}
```

And `open /path/to/real_video.mp4` plays an actual video file.

**For Issue 2** - Add filter support so kompositions with filters like:
```json
{
  "segments": [
    {
      "sourceRef": "video.mp4",
      "filters": [{"type": "blur", "params": {"radius": 3}}]
    }
  ]
}
```

Are processed with the blur filter applied after basic video operations, creating a final video with the visual effects applied.

## 📊 **INTEGRATION STATUS SUMMARY**

| Component | Status | Notes |
|-----------|--------|-------|
| Discovery Protocol | ✅ WORKING | Komposteur finds our processor |
| Communication | ✅ WORKING | JSON data flows correctly |
| Data Processing | ✅ WORKING | Komposition parsing works |
| Video Operations | ❌ BUG | Parameter type mismatch |
| Filter Support | ❌ MISSING | No filter command processing |
| File Creation | ✅ WORKING | Files created at expected paths |
| **Overall Integration** | **🟡 FUNCTIONAL** | **Architecture complete, implementation issues only** |

**Once both video processing issues are fixed, we'll have a complete natural language → music video with filters pipeline! 🎬✨**