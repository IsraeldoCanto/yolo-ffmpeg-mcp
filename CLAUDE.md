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

## LLM Issue Reporting and Improvement Tracking

### Komposteur and Video Renderer Improvement Guidelines
- If LLM identifies needed changes/fixes in sub-process/library Komposteur, video-renderer etc, write a comprehensive report for Claude agents responsible for these, detailing:
  - Specific issues discovered
  - Current state of the component
  - Desired future state and recommended improvements
  - Potential impact on overall system performance
- this project is a learning process. Each run is to validate our assumptions, find flaws and improvements. MCP server is for exploratory, Komposteur is for make it production ready with lessons learned