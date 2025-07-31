# MCP Server Test Instruction for Claude Code

## Natural Language Test
Please create a music video using the following description:

**"Create a 16 second music video using JJVtt947FfI_136.mp4 for the first 8 seconds and PXL_20250306_132546255.mp4 for the last 8 seconds, with Subnautic Measures.flac as background music at 120 BPM"**

## Expected MCP Tool Workflow
1. `mcp__ffmpeg-mcp__list_files()` - Check available media
2. `mcp__ffmpeg-mcp__create_video_from_description()` - Generate video
3. `mcp__ffmpeg-mcp__get_file_info()` - Verify output
4. Run `./test_music_video_creation.sh` to validate result

## Success Criteria
- Video file created in `/tmp/music/temp/`
- Duration approximately 16 seconds
- Contains both video segments
- Background music integrated
- Passes verification script

## Alternative Test Scenarios
- "Make a short music video with smooth transitions"
- "Create beat-synchronized video at 135 BPM"
- "Build video montage with available files and music"
