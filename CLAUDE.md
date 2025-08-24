# FFMPEG MCP Server - Claude Code Integration Guide

**🚨 CRITICAL: Read Registry Guidelines Below Before Using This Server**

## ⚠️ CRITICAL: NO ARCHITECTURAL CHANGES WITHOUT PERMISSION ⚠️

**MANDATORY CONSULTATION RULE:**
- **NEVER** change base images, package managers, core dependencies without explicit ask
- **NEVER** switch tech stacks (Alpine→Debian, pip→UV, Python versions) 
- **ALWAYS** present options first: "Fix Alpine deps vs switch to Debian - which?"
- **WAIT** for explicit permission before implementing architectural changes

**VIOLATION = IMMEDIATE STOP**

## ⚠️ **ARCHITECTURAL ANTI-PATTERNS - LESSONS LEARNED** ⚠️

### **❌ DON'T: Git Submodules for Source Dependencies**
**MISTAKE**: Including komposteur-repo, VideoRenderer/, vdvil/ as git submodules or embedded source.

**WHY THIS WAS BAD:**
- **Tight Coupling**: YOLO should consume these via APIs/JARs, not embed source code
- **Repository Bloat**: Each project has its own lifecycle, history, development process
- **Separation of Concerns**: Mixing multiple project sources violates single responsibility
- **Git Submodule Hell**: Notoriously complex to manage, update, and collaborate on
- **Ownership Confusion**: Unclear which project owns what code, leads to accidental commits
- **Maintenance Nightmare**: Updates, branch tracking, team collaboration becomes exponentially harder

**✅ CORRECT APPROACH:**
- **API-First Integration**: Consume through well-defined Maven dependencies and GitHub Packages
- **Dependency Management**: Use semantic versioning and proper release cycles
- **Separate Repositories**: Each project maintains its own repo with independent development
- **Integration Testing**: Pull dependencies through package managers, not source embedding
- **Clear Boundaries**: YOLO = MCP server, Komposteur = core engine, VideoRenderer = video processing

**LESSON**: Development convenience does NOT justify architectural coupling. Use proper dependency management instead of source embedding.

**VIOLATION = IMMEDIATE STOP**

## 🔍 **BUILD DETECTIVE WORKFLOW INTEGRATION** ✅ **PRODUCTION READY**

### **BD-First Development Strategy** 
**CRITICAL**: Always use Build Detective BEFORE expensive LLM operations for:

- **Version Analysis**: `python3 scripts/bd_artifact_manager.py` - Local ~/.m2 + GitHub Packages comparison
- **Build Validation**: `python3 scripts/bd_upgrade_test.py [subproject] [version]` - Complete upgrade test cycles  
- **CI/Build Analysis**: `python3 scripts/bd_manual.py [repo] [pr_number]` - GitHub Actions failure analysis
- **Pre-commit Testing**: Local Maven builds, test execution, artifact validation

### **BD Confidence Framework**
1. **HIGH BD Confidence** (>8/10): Accept BD recommendations directly, proceed with implementation
2. **MEDIUM BD Confidence** (5-7/10): BD analysis + LLM verification for complex decisions
3. **LOW BD Confidence** (<5/10): LLM investigation, then improve BD patterns and re-validate

### **Token-Saving Protocol**
- **Build/Test Operations**: Always use BD local execution vs. LLM token consumption
- **Version Comparisons**: BD semantic versioning logic vs. manual analysis  
- **Error Pattern Recognition**: BD regex patterns + caching vs. repeated LLM analysis
- **Maven/Gradle Parsing**: BD XML/config parsing vs. LLM interpretation

### **BD Continuous Improvement Loop**
1. **BD Analysis**: Run appropriate BD tool for the task
2. **LLM Verification**: If BD confidence <8/10, LLM validates and identifies improvements
3. **BD Enhancement**: Update BD patterns/logic based on LLM insights  
4. **Validation**: Re-run BD to verify improvement effectiveness
5. **Documentation**: Update BD capabilities and confidence thresholds

### **BD Tool Selection Guide**
- **Artifact Status**: `bd_artifact_manager.py` - Dependency versions, local vs. remote
- **Build Testing**: `bd_upgrade_test.py` - Pre/post upgrade validation with comparison
- **CI Failures**: `bd_manual.py` - GitHub Actions log analysis and error patterns
- **General Analysis**: Delegate to BD subagent for complex multi-tool coordination

**BD VALIDATION**: This framework has been tested and verified with comprehensive test suite (8/8 tests passing) and real-world VideoRenderer upgrade analysis. BD correctly identified build environment issues (missing JAVA_HOME) that would have required expensive debugging tokens.

### **Maven Multi-Module Build Expertise** ✅ **ENHANCED**
BD now includes comprehensive Maven build log parsing for complex multi-module projects:

- **Reactor Summary Analysis**: Parses build order, module status, and timing per module
- **Per-Module Test Results**: Aggregates test results across modules with failure tracking
- **Build Phase Recognition**: Compile → Test → Package → Install lifecycle awareness
- **Dependency Resolution**: Identifies missing artifacts, version conflicts, repository issues
- **Cross-Module Dependencies**: Tracks build dependencies and failure cascades
- **Profile-Aware Parsing**: Handles Maven profiles and property resolution

**Key Maven Patterns BD Recognizes:**
```bash
[INFO] Reactor Summary for project-name:
[INFO] module-a ................................. SUCCESS [ 1.234 s]
[INFO] module-b ................................. FAILURE [ 0.567 s] 
[INFO] module-c ................................. SKIPPED
[INFO] BUILD FAILURE
[INFO] Total time: 8.256 s
```

**BD Documentation**: Complete Maven parsing guide available at `docs/bd_maven_parsing_guide.md` with regex patterns, error classification, and multi-module build lifecycle understanding.

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

## ⚠️ **VIDEO FORMAT OUTPUT STRATEGY** ⚠️

### **User-Viewable Final Output Requirements** ✅ **CRITICAL**

**RULE**: When creating final output for user verification/consumption, ALWAYS use YUV420P format for maximum compatibility.

**Implementation:**
- **Intermediate Processing**: YUV444P format is acceptable (higher quality, not user-facing)
- **Draft/Internal Videos**: YUV444P format is acceptable for development/testing
- **Final User Output**: MUST be YUV420P format - use `youtube_recommended_encode` operation
- **Verification Step**: Test final videos open in VLC/QuickTime before claiming success

**Encoding Command for Final Output:**
```bash
# Apply YouTube recommended encoding for user-viewable output
mcp.call_tool('process_file', {
    'input_file_id': draft_video_id,
    'operation': 'youtube_recommended_encode',
    'output_extension': 'mp4'
})
```

**Quality vs Compatibility:**
- YUV444P: Higher quality, limited player support (development use)
- YUV420P: Universal compatibility, slight quality loss (user delivery)

## ⚠️ **LOCAL CI BUILD SYSTEM** ⚠️

### **CI Build Strategy** ✅ **IMPLEMENTATION REQUIRED**

**Local CI Command:**
```bash
# Run complete CI validation before push
uv run python test_basic_ci.py && echo "✅ CI PASSED - Ready to push"
```

**CI Components:**
1. **Basic Validation**: `test_basic_ci.py` - Code structure and documentation
2. **Build Detective Analysis**: Automated quality assessment post-commit
3. **Integration Testing**: Video format strategy validation

**Pre-Push Workflow:**
```bash
# 1. Run local CI tests
uv run python test_basic_ci.py

# 2. If tests pass, commit and push
git add . && git commit -m "Feature implementation"
git push origin feature-branch

# 3. BD automatically analyzes pushed changes
# (BD report available within minutes of push)
```

**Future Git Hook Integration:**
- **NOT ENABLED YET** - User must observe CI build performance first
- **When ready**: Add `test_basic_ci.py` to pre-push hook
- **Estimated time**: ~5-10 seconds for basic validation

**BD Integration:**
- BD automatically analyzes all pushed branches
- BD reports available via Build Detective subagent
- Use BD confidence scores to validate positive changes

## LLM Issue Reporting and Improvement Tracking

### Komposteur and Video Renderer Improvement Guidelines
- If LLM identifies needed changes/fixes in sub-process/library Komposteur, video-renderer etc, write a comprehensive report for Claude agents responsible for these, detailing:
  - Specific issues discovered
  - Current state of the component
  - Desired future state and recommended improvements
  - Potential impact on overall system performance
- this project is a learning process. Each run is to validate our assumptions, find flaws and improvements. MCP server is for exploratory, Komposteur is for make it production ready with lessons learned