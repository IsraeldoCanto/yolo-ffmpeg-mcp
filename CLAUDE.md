# FFMPEG MCP Server - Claude Code Integration Guide

**🚨 CRITICAL: Read Registry Guidelines Below Before Using This Server**

## 🛠️ **Development vs Production JAR Strategy** ✅ **NEW**

### **Local Development Approach** ✅ **UPDATED for 1.0.0**
For faster development iteration and verification:
- **Primary**: Use latest 1.0.0 MCP artifacts from `~/.m2/repository/no/lau/kompost/mcp/`
- **Latest**: `uber-kompost-1.0.0-shaded.jar` (91MB, includes all dependencies)
- **Advantage**: Instant access to latest builds with **FIXED YouTube download compilation issues**
- **Testing**: Direct command-line verification with new MCP namespace JARs

### **Production CI Approach**
For CI environments and official releases:
- **Primary**: GitHub Packages JARs with proper authentication
- **Advantage**: Reproducible builds and version control
- **Usage**: `uber-kompost-0.10.1.jar` with enhanced validation
- **Testing**: Full CI pipeline with GitHub authentication

### **Implementation Pattern**
The download service automatically prefers local development JARs:
```python
# Check local development JAR first (faster iteration)
local_jar = Path.home() / ".m2/repository/no/lau/kompost/komposteur-core/0.9-SNAPSHOT/komposteur-core-0.9-SNAPSHOT-jar-with-dependencies.jar"

if local_jar.exists():
    logger.info(f"🔧 Using local development JAR: {local_jar}")
    return local_jar
else:
    # Fallback to production JAR
    logger.info(f"📦 Using production JAR: {production_jar}")
    return production_jar
```

### **Development Workflow Benefits**
- **Fast Iteration**: No GitHub packages network delays
- **Local Testing**: Direct access to latest Komposteur builds  
- **Flexible Versions**: Can test multiple SNAPSHOT versions quickly
- **Offline Development**: Works without network access

### **Production Deployment Assurance**
- **CI/CD**: Production systems use verified GitHub packages
- **Version Control**: Reproducible builds with specific versions
- **Security**: GitHub authentication prevents dependency hijacking
- **Compliance**: Audit trail for production dependencies

This dual approach optimizes for development speed while maintaining production reliability.

## 🤖 **HIERARCHICAL MULTI-AGENT SYSTEM** ✅ **NEW ARCHITECTURE**

### **YOLO as Master Orchestrator**
YOLO-FFMPEG-MCP now operates as the **master video processing orchestrator** with specialized subagents:

- **Komposteur Subagent**: Beat-synchronization, S3 infrastructure, Java 24 ecosystem
- **VideoRenderer Subagent**: FFmpeg optimization, crossfade processing, performance tuning
- **VDVIL Subagent**: DJ-mixing infrastructure, audio composition, binding layer operations
- **Build Detective Subagent**: CI/build failure analysis, GitHub Actions debugging, dependency resolution

### **Intelligent Task Delegation**
```bash
# Automatic intelligent routing based on task analysis
/komposteur "Create beat-synchronized music video for 135 BPM track"
/videorenderer "Optimize crossfade processing for 4K videos" 
/vdvil "Create professional DJ mix with crossfading for music video"
/build-detective "Investigate CI failures in GitHub Actions"
```

### **Multi-Subagent Coordination**  
- **Parallel Processing**: All subagents work simultaneously on complex workflows
- **Seamless Handoffs**: Audio flows VDVIL → Komposteur → VideoRenderer → YOLO
- **Quality Coordination**: Consistent standards across all processing stages
- **Resource Optimization**: Intelligent resource sharing and conflict avoidance

### **Master Agent Benefits**
- **Workflow Orchestration**: YOLO handles high-level video workflows and user interaction
- **Specialized Expertise**: Deep domain knowledge from dedicated subagents
- **Quality Assurance**: Master oversight ensures consistent results
- **Scalable Architecture**: Easy addition of new specialist subagents

### **Usage Patterns**
```bash
# Complex music video creation
User: "Create beat-synchronized music video with professional audio and smooth crossfades"
→ YOLO analyzes: DJ mixing (VDVIL) + Beat-sync (Komposteur) + Crossfades (VideoRenderer)
→ Coordinates all subagents for optimal result
→ Assembles final video with quality validation

# Performance optimization  
User: "Speed up video processing pipeline"
→ YOLO delegates: S3 caching (Komposteur) + FFmpeg optimization (VideoRenderer)
→ Monitors combined improvements
→ Reports unified performance gains
```

This hierarchical system transforms YOLO into a comprehensive video processing ecosystem while maintaining the simplicity and intelligence users expect.

### **Subagent Delegation Strategy**
**CRITICAL**: Automatically delegate tasks to specialized subagents:

- **CI/Build Analysis**: Use Build Detective tools for:
  - `./bd <repo> <pr_number>` - Quick CI analysis with status overview
  - `uv run python scripts/bd_manual.py <repo> <pr_number>` - Detailed failure analysis
  - GitHub Actions failures, UV/Python dependency issues  
  - Docker build problems, test execution failures
  - MCP server startup issues, FFmpeg processing timeouts

## LLM Issue Reporting and Improvement Tracking

### Komposteur and Video Renderer Improvement Guidelines
- If LLM identifies needed changes/fixes in sub-process/library Komposteur, video-renderer etc, write a comprehensive report for Claude agents responsible for these, detailing:
  - Specific issues discovered
  - Current state of the component
  - Desired future state and recommended improvements
  - Potential impact on overall system performance
- this project is a learning process. Each run is to validate our assumptions, find flaws and improvements. MCP server is for exploratory, Komposteur is for make it production ready with lessons learned