# VIDEO PROCESSING FORMAT STRATEGY

## INTERNAL vs FINAL OUTPUT FORMATS ✅ LESSON LEARNED

### CORRECT APPROACH:

**Internal Processing**: Use YUV444P (higher quality, 4:4:4 chroma subsampling)
- Preserve maximum quality for intermediate video operations
- Allows better effects, transitions, and composition quality  
- No compatibility concerns during processing pipeline

**Final Export Only**: Convert to YUV420P (maximum compatibility)
- Apply compatibility encoding ONLY at final export step
- Use: `-c:v libx264 -profile:v baseline -pix_fmt yuv420p -movflags +faststart`
- Ensures playback on macOS QuickTime, Windows Media Player, browsers

### WRONG APPROACH AVOIDED:
- ❌ Converting intermediate processing to YUV420P
- ❌ Applying compatibility at each processing step
- ❌ Quality degradation throughout pipeline
- ❌ Token waste on circular fixing

### IMPLEMENTATION:
- Keep internal komposition processing at YUV444P quality
- Add final compatibility export as separate operation when user needs playable output
- Document this in MCP operations as "draft" (YUV444P) vs "export" (YUV420P)

### KEY INSIGHT:
User was correct - don't fight the higher quality intermediate format. Use it for internal processing, only convert for final delivery when needed.