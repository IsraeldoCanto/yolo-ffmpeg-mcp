# GPT-5 + Aider Integration Guide: MCP FFMPEG Project

**🚀 Welcome, GPT-5/Aider! This guide helps you understand and contribute to our MCP-based video processing learning project.**

## 🎯 Project Mission

**Learning-First Video Processing**: This project validates assumptions, finds flaws, and identifies improvements through systematic comparison of video processing approaches. The MCP server is for **exploratory work**, while Komposteur will be **production-ready** with lessons learned.

### Current Focus: Quality Validation Through Comparison
- **MCP Interface**: Rapid prototyping and timing calculation testing
- **Direct FFmpeg**: Baseline quality assurance and frame-perfect processing  
- **Komposteur Integration**: Production-ready pipeline with multi-step processing

---

## 🏗️ Architecture Overview

### Core Components

#### 1. **MCP FFMPEG Server** (`src/server.py`)
```python
# Main MCP server with video processing tools
# Tools available: process_file, get_available_operations, analyze_video_content, etc.
# Environment: Python 3.11+ with Java 23 for Komposteur integration
```

#### 2. **Komposteur Bridge** (`src/komposteur_bridge_processor.py`)
```python  
# Bridges MCP interface to Java-based Komposteur core
# Handles JAR download, process isolation, and quality validation
# Production JAR: ~/.m2/repository/no/lau/kompost/mcp/uber-kompost-1.0.0-shaded.jar
```

#### 3. **File Management** (`src/file_manager.py`)
```python
# Handles video/audio file registration and analysis
# Provides metadata extraction and quality assessment
```

### Key Directories
```bash
/Users/stiglau/utvikling/privat/lm-ai/mcp/yolo-ffmpeg-mcp/
├── src/                    # MCP server core
├── segments_keyframe/      # Keyframe-aligned video segments
├── segments_mcp_uniform/   # MCP uniform timing segments  
├── documents/             # Analysis reports and findings
├── tests/                 # Testing framework
└── scripts/               # Utility scripts
```

---

## 🔧 Development Environment Setup

### Prerequisites
```bash
# 1. Python Environment
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 2. Java Environment (CRITICAL: Java 21+ required)
export JAVA_HOME="/usr/local/opt/openjdk/libexec/openjdk.jdk/Contents/Home"
export PATH="/usr/local/opt/openjdk/bin:$PATH"
java -version  # Should show Java 21+

# 3. FFmpeg with full codec support
brew install ffmpeg  # macOS
# Ensure libx264, aac, libfdk-aac available
```

### Quick Start Commands
```bash
# Start MCP Server
./run_mcp_with_java23.sh

# Test MCP connectivity  
python3 test_hanging_issues.py

# Run complete quality comparison
python3 create_subnautica_music_video.py  # Keyframe-aligned approach
python3 create_mcp_uniform_video.py       # MCP uniform approach
```

---

## 🧪 Current Learning Experiments

### Experiment 1: Timing Calculation Validation ✅
**Question**: Does MCP calculate timing differently than manual keyframe analysis?

**Findings**: 
- **9 critical timing differences** identified (up to 38+ seconds variation)
- **MCP uniform approach**: Mathematical division (15s intervals)
- **Manual keyframe**: Video structure aware (5.29s, 10.62s, etc.)

**Files**: `mcp_vs_direct_analysis_report.json`, `test_mcp_direct_interaction.py`

### Experiment 2: Frame Loss Prevention ✅  
**Question**: Can we achieve 100% frame preservation across processing approaches?

**Solution**: Keyframe-aligned extraction with `ffmpeg -force_key_frames 0`
- **Success Rate**: 100% (576 frames = 12 × 48 frames preserved)
- **Documentation**: `documents/frame_loss_detection_and_prevention.md`

**Files**: `create_subnautica_music_video.py`, `segments_keyframe/`

### Experiment 3: Quality Comparison (In Progress) 🔄
**Question**: How does MCP uniform timing affect video quality vs keyframe-aligned?

**Status**: Both videos created, visual quality analysis needed
- **Keyframe Video**: `subnautica_deep_ocean_music_video.mp4` (9.2MB, 24s)
- **MCP Uniform Video**: `subnautica_mcp_uniform_video.mp4` (9.3MB, 24s)

**Files**: `quality_comparison_results.json`, `FINAL_MCP_COMPARISON_REPORT.json`

---

## 🛠️ Available MCP Tools

### Video Processing Tools
```python
# Core video operations
await call_tool('process_file', {
    'file_id': 'video_id',
    'operation': {
        'type': 'to_mp4',
        'parameters': {'bitrate': '2M', 'scale': '1080:1920'}
    }
})

# Analysis and intelligence
await call_tool('analyze_video_content', {'file_id': 'video_id'})
await call_tool('get_available_operations', {})
await call_tool('get_format_presets', {})
```

### YouTube Integration
```python
# Download videos for processing
await call_tool('download_youtube_video', {
    'url': 'https://youtube.com/shorts/Oa8iS1W3OCM',
    'quality': 'best'
})

# Batch download
await call_tool('batch_download_urls', {
    'urls': ['https://youtube.com/shorts/...']
})
```

### AI-Powered Creation
```python
# Generate compositions from descriptions
await call_tool('generate_komposition_from_description', {
    'description': 'Subnautica-themed music video with deep ocean effects'
})
```

---

## 📊 Quality Assessment Framework

### Frame Loss Detection
```python
# Verify segment frame counts
def verify_segment_quality(segment_file):
    cmd = ['ffprobe', '-v', 'quiet', '-select_streams', 'v:0', 
           '-count_packets', '-show_entries', 'stream=nb_read_packets',
           '-of', 'csv=p=0', segment_file]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return int(result.stdout.strip())

# Expected: 48 frames per 2-second segment at 24fps
expected_frames = 48
actual_frames = verify_segment_quality("segments_keyframe/seg01_keyframe.mp4")
assert actual_frames == expected_frames, f"Frame loss detected: {actual_frames} != {expected_frames}"
```

### Timing Analysis
```python
# Compare timing approaches
manual_keyframe_timing = [0.000, 5.291667, 10.625000, 15.958333]  # Keyframe-aligned
mcp_uniform_timing = [0.0, 15.0, 30.0, 45.0]                     # Uniform division

for i, (manual, mcp) in enumerate(zip(manual_keyframe_timing, mcp_uniform_timing)):
    difference = abs(manual - mcp)
    if difference > 5.0:
        print(f"⚠️ Critical timing difference in seg{i+1}: {difference:.1f}s")
```

---

## 🎯 Common Tasks for GPT-5/Aider

### 1. **Video Quality Analysis**
```bash
# Compare two video approaches
python3 analyze_video_quality.py \
  --keyframe-video subnautica_deep_ocean_music_video.mp4 \
  --mcp-video subnautica_mcp_uniform_video.mp4
```

### 2. **Timing Validation**
```bash  
# Verify beat synchronization at 120 BPM
python3 validate_beat_sync.py --bpm 120 --duration 24
```

### 3. **MCP Server Development**
```bash
# Test new MCP tools
python3 test_mcp_server.py --tool process_file --validate-output

# Add new video operation
# Edit: src/server.py -> add_video_operation()
```

### 4. **Komposteur Integration**
```bash
# Test Java bridge functionality  
python3 test_komposteur_bridge.py --jar-path ~/.m2/repository/...

# Update Komposteur version
# Edit: src/komposteur_bridge_processor.py -> JAR_VERSION
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Java Version Compatibility
```bash
# Problem: uber-kompost-1.1.0.jar requires Java 21+, system has Java 19
# Solution: Use Java 23 from Homebrew
export JAVA_HOME="/usr/local/opt/openjdk/libexec/openjdk.jdk/Contents/Home"
java -version  # Verify Java 23
```

### Issue 2: MCP Server Hanging
```bash
# Problem: OpenCV operations cause 479-second hangs
# Solution: Use subprocess isolation
def safe_opencv_operation():
    with TimeoutManager(30):  # 30-second timeout
        return subprocess.run([...], timeout=25)
```

### Issue 3: Frame Loss During Concatenation  
```bash  
# Problem: H.264 decoder errors from profile mismatches
# Solution: Force keyframes at segment boundaries
ffmpeg -i input.mp4 -ss 5.291667 -t 2.0 -force_key_frames 0 output.mp4
```

### Issue 4: YouTube API Rate Limits
```bash
# Problem: Too many YouTube downloads
# Solution: Batch operations and cache results
await call_tool('batch_download_urls', {'urls': urls, 'cache': True})
```

---

## 📈 Performance Benchmarks

### Processing Speed Comparison
```yaml
Keyframe-Aligned Approach:
  - Segment Creation: ~2s per segment
  - Frame Preservation: 100%  
  - Quality Score: Perfect
  - Production Ready: Yes

MCP Uniform Approach:
  - Segment Creation: ~1.5s per segment
  - Frame Preservation: Variable
  - Quality Score: TBD (visual inspection needed)
  - Production Ready: No (exploratory only)

Direct FFmpeg:
  - Full Video Creation: ~45s
  - Frame Loss: 0 frames
  - Memory Usage: ~200MB peak
  - Error Rate: 0%
```

---

## 🎓 Learning Outcomes & Recommendations

### For MCP Development
1. **Add keyframe detection capability** to timing calculations
2. **Implement quality validation gates** before processing
3. **Create multi-step processing pipeline** for production use
4. **Enhance error handling** for complex video operations

### For Komposteur Integration  
1. **Use keyframe-aligned extraction** as baseline quality standard
2. **Implement frame loss detection** as standard validation
3. **Create MCP convenience layer** on top of proven approach
4. **Add comprehensive quality gates** and monitoring

### For Production Deployment
1. **Prioritize quality over speed** for production workflows
2. **Use MCP for rapid prototyping** and validation
3. **Deploy Komposteur** for reliable, scalable processing
4. **Monitor frame preservation** and quality metrics

---

## 🔗 Integration Points

### With Aider
```bash
# Add Aider to development workflow
aider --model gpt-5 src/server.py src/komposteur_bridge_processor.py

# Focus areas for Aider assistance:
# 1. MCP tool development and testing
# 2. Quality validation framework enhancement  
# 3. Performance optimization analysis
# 4. Error handling improvement
```

### With GPT-5
```bash
# Use GPT-5 for complex analysis
# 1. Video quality assessment algorithms
# 2. Timing calculation optimization
# 3. Multi-step processing pipeline design
# 4. Production deployment strategies
```

---

## 📋 Current Status & Next Steps

### ✅ Completed
- [x] MCP server with Java 23 compatibility
- [x] Keyframe-aligned video processing (100% frame preservation)
- [x] Timing calculation comparison (9 critical differences identified)
- [x] Quality comparison framework
- [x] YouTube integration and upload capability

### 🔄 In Progress  
- [ ] Visual quality analysis of MCP uniform vs keyframe-aligned videos
- [ ] Multi-step processing benefits documentation
- [ ] Production readiness assessment

### 🎯 Next Priorities
1. **Complete quality comparison** - Visual inspection and metrics
2. **Document multi-step benefits** - What Komposteur provides over MCP
3. **Create production deployment guide** - From MCP exploration to Komposteur production
4. **Enhance testing framework** - Automated quality validation

---

## 🤝 Contributing Guidelines

### Code Style
- **Python**: Follow PEP 8, use type hints
- **Documentation**: Inline comments for complex logic only
- **Testing**: Include quality validation in all video operations
- **Error Handling**: Prefer subprocess isolation over direct calls

### Git Workflow
- **Feature branches**: Use descriptive names (`feature/timing-validation`)
- **Commit messages**: Clear, concise, no "Generated with Claude" noise
- **Pull requests**: Include quality validation results

### Quality Standards
- **Frame Preservation**: Must be 100% for production code
- **Performance**: Document processing times and resource usage
- **Error Recovery**: Handle Java environment and FFmpeg issues gracefully
- **Validation**: Include quality checks in all processing pipelines

---

**🚀 Ready to contribute!** Use this guide to understand our learning-focused approach to video processing quality validation and improvement.