# MCP FFMPEG Server Lockup Investigation Report

**Investigation Date:** 2025-08-06 22:39
**Investigation Trigger:** Complete lockup during music video creation and upload operation
**Severity:** Critical - Complete system freeze requiring manual intervention

## Executive Summary

The MCP FFMPEG server experienced a complete lockup during a `create_video_from_description` operation followed by YouTube upload. Analysis reveals multiple potential bottlenecks and insufficient timeout protection for complex multi-stage operations.

## System State Analysis

### Long-Running Processes Detected
```
PID 82024: spawn_main process - Started 26Jun25, 38+ hours CPU time
PID 81886: spawn_main process - Started 26Jun25, 33+ hours CPU time  
PID 82020: uvicorn server - Started 26Jun25, 13+ hours CPU time
PID 81883: uvicorn server - Started 26Jun25, 13+ hours CPU time
```

**Critical Finding:** Multiple long-running Python multiprocessing spawn processes indicate potential resource leaks and zombie process accumulation.

### Recent Operation Context
- **Last Composition:** `deep_soul_128beat_composition.json` (64-second, 128-beat music video)
- **Generated Files:** 12 recent video files, largest being 4.8MB
- **Suspected Operation:** Complex komposition processing with YouTube Shorts optimization and upload

## Timeout Analysis

### Current Timeout Configuration
```python
# src/config.py:20
PROCESS_TIMEOUT = 300  # 5 minutes

# Various component timeouts:
- ffmpeg_wrapper.execute_command(): 300s default
- speech_detector: 300s 
- download_service: 600s (10 minutes)
- YouTube optimization: 600s (longer for quality encoding)
```

### Identified Timeout Gaps

1. **No Overall Operation Timeout**: `create_video_from_description` has no master timeout covering the entire multi-stage workflow
2. **Komposition Processing**: No explicit timeout for complex komposition builds involving multiple segments
3. **YouTube Upload**: No timeout protection for OAuth flow + upload process
4. **Multiprocessing**: No cleanup mechanism for hung spawn processes

## Bottleneck Analysis

### Primary Bottlenecks (by Processing Stage)

#### 1. Complex Komposition Processing
**Estimated Time:** 2-15 minutes per composition
- **4 segments** × **looping operations** × **effects processing**  
- **Resolution conversion** (to 1080x1920 for YouTube Shorts)
- **Audio mixing** with background music extraction and normalization

#### 2. YouTube Shorts Optimization  
**Estimated Time:** 3-8 minutes
```python
# src/server.py:5704 - Extended timeout for quality encoding
result = await ffmpeg_wrapper.execute_command(command, timeout=600)
```
- **GOP structure optimization** for seamless looping
- **H.264 encoding** with CRF 18 (high quality)
- **Audio processing** at 48kHz with AAC encoding

#### 3. OAuth2 + Upload Process
**Estimated Time:** 1-5 minutes (network dependent)
- **Token refresh/authentication**
- **File upload** (can be large, network dependent)  
- **YouTube processing** confirmation

### Processing Time Estimation Model

Based on analysis of current operations and timeouts:

```python
def estimate_processing_time(operation_type, video_duration, resolution, complexity):
    base_times = {
        'simple_trim': video_duration * 0.1,
        'effects_chain': video_duration * 2.0,
        'komposition_build': video_duration * 3.0,
        'youtube_optimize': video_duration * 4.0,
        'full_workflow': video_duration * 8.0  # Combined operations
    }
    
    # Resolution multipliers
    resolution_factor = {
        '720p': 1.0,
        '1080p': 1.5, 
        '1920x1080': 1.5,
        '1080x1920': 2.0  # Portrait requires more processing
    }
    
    # Complexity multipliers
    complexity_factor = {
        'simple': 1.0,
        'moderate': 2.0,
        'complex': 4.0,
        'multi_segment': 6.0
    }
```

## Root Cause Assessment

### Most Likely Lockup Scenario
1. **`create_video_from_description`** initiated complex komposition
2. **Komposition processing** succeeded but took longer than expected
3. **YouTube optimization** triggered with 600s timeout
4. **OAuth2 flow** initiated but **network issues** or **token refresh problems**
5. **Process hung** waiting for OAuth completion with **no master timeout**
6. **Multiprocessing children** accumulated without cleanup
7. **System resources** exhausted, causing complete lockup

### Contributing Factors
- **No atomic operation timeout** covering entire workflow
- **OAuth network dependency** without robust error handling
- **Process cleanup gaps** for multiprocessing operations
- **Resource leak** in long-running spawn processes

## Recommendations

### 1. Implement Master Operation Timeouts
```python
# Add to create_video_from_description
async def create_video_from_description(description, title="Generated Video", **kwargs):
    # Calculate estimated time based on operation complexity
    estimated_time = calculate_operation_timeout(description, kwargs)
    master_timeout = estimated_time * 1.5  # 50% buffer
    
    try:
        return await asyncio.wait_for(
            _internal_create_video_from_description(description, title, **kwargs),
            timeout=master_timeout
        )
    except asyncio.TimeoutError:
        await cleanup_partial_operations()
        raise TimeoutError(f"Operation exceeded {master_timeout}s timeout")
```

### 2. Add Processing Time Estimation API
```python
@mcp.tool()
async def estimate_processing_time(
    operation: str,
    video_duration: float = None,
    resolution: str = "1920x1080",
    complexity: str = "moderate"
) -> Dict[str, Any]:
    """Estimate processing time before starting operation"""
```

### 3. Process Management Improvements
```python
# Add process cleanup and monitoring
async def cleanup_hung_processes():
    """Clean up zombie multiprocessing spawn processes"""
    
async def monitor_operation_health():
    """Monitor for hung operations and resource leaks"""
```

### 4. OAuth Flow Hardening
- **Timeout protection** for OAuth flows (60s max)
- **Token caching** to avoid repeated auth
- **Network failure recovery** with exponential backoff
- **Upload cancellation** mechanism

### 5. Resource Monitoring
```python
# Add resource usage monitoring
@mcp.tool() 
async def get_operation_status():
    """Real-time operation progress and resource usage"""
```

## Impact Assessment

**Without Fix:**
- Continued lockups requiring manual process termination
- Unpredictable operation completion times
- Resource exhaustion in production environments
- Poor user experience with no progress indication

**With Implementation:**
- Predictable operation timeouts with proper cleanup
- Progress indication and time estimation  
- Automated recovery from hung operations
- Better resource management and monitoring

## Implementation Priority

1. **Critical (Immediate):** Master operation timeouts for `create_video_from_description`
2. **High:** OAuth flow hardening and network timeout protection  
3. **Medium:** Processing time estimation API
4. **Low:** Advanced resource monitoring and cleanup automation

## Testing Strategy

1. **Reproduce lockup** with complex komposition + YouTube upload
2. **Test timeout scenarios** with artificial delays
3. **Verify cleanup** of partial operations and processes
4. **Load testing** with multiple concurrent operations
5. **Network failure simulation** for OAuth flows

---

**Next Actions:** Implement master operation timeouts before resuming video creation workflows.