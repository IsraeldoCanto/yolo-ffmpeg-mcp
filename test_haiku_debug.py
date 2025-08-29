#!/usr/bin/env python3
"""
Test script to demonstrate and debug Haiku integration issues
This will help us understand why Haiku used the wrong files
"""

import asyncio
import os
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

# Set debug mode
os.environ["HAIKU_DEBUG"] = "true"

async def test_haiku_debug():
    """Test the Haiku debug interface with a simple montage request"""
    
    try:
        # Import our debug interface
        from haiku_debug_interface import debug_haiku_session, log_haiku_prompt, log_haiku_response, log_ffmpeg_command, log_file_usage, log_processing_result
        
        # Simulate a Haiku debug session
        with debug_haiku_session("Create a montage video using 3 different video clips - take 10 seconds from each video file and combine them with the Subnautic Measures background music") as debugger:
            
            # Available files (what we expect Haiku to use)
            expected_files = [
                "JJVtt947FfI_136.mp4",
                "PXL_20250306_132546255.mp4", 
                "_wZ5Hof5tXY_136.mp4",
                "Subnautic Measures.flac"
            ]
            
            # What Haiku actually used (based on our observation)
            actual_files_used = [
                "test_video.mp4"  # This is wrong - it used a test file instead!
            ]
            
            # Simulate the prompt we would send to Haiku
            haiku_prompt = """
You are an expert video processing AI. Create FFmpeg commands to:

Create a montage video using 3 different video clips - take 10 seconds from each video file and combine them with the Subnautic Measures background music

Available files:
- JJVtt947FfI_136.mp4 (video)
- PXL_20250306_132546255.mp4 (video) 
- _wZ5Hof5tXY_136.mp4 (video)
- Subnautic Measures.flac (audio)
- test_video.mp4 (small test file)
- test_video2.mp4 (small test file)

Instructions:
1. Use the THREE main video files (JJVtt947FfI, PXL, _wZ5Hof5tXY)
2. Extract 10 seconds from each
3. Concatenate them together
4. Replace audio with Subnautic Measures.flac

Respond with specific FFmpeg commands for each step.
"""
            
            # Log the prompt
            log_haiku_prompt(haiku_prompt)
            
            # Simulate Haiku's problematic response (what we observed)
            haiku_response = """
I'll create a montage using the available video files. Here are the FFmpeg commands:

1. Extract 10-second segments:
   ffmpeg -i test_video.mp4 -t 10 -c copy segment1.mp4
   ffmpeg -i test_video.mp4 -ss 5 -t 10 -c copy segment2.mp4  
   ffmpeg -i test_video.mp4 -ss 10 -t 10 -c copy segment3.mp4

2. Concatenate segments:
   ffmpeg -f concat -i segments_list.txt -c copy montage.mp4

3. Add background music:
   ffmpeg -i montage.mp4 -i "Subnautic Measures.flac" -c:v copy -c:a aac final.mp4
"""
            
            # Log the response with low confidence (it's clearly wrong)
            log_haiku_response(haiku_response, confidence=0.3, cost=0.02)
            
            # Log the FFmpeg commands it generated
            log_ffmpeg_command("ffmpeg -i test_video.mp4 -t 10 -c copy segment1.mp4")
            log_ffmpeg_command("ffmpeg -i test_video.mp4 -ss 5 -t 10 -c copy segment2.mp4")
            log_ffmpeg_command("ffmpeg -i test_video.mp4 -ss 10 -t 10 -c copy segment3.mp4")
            log_ffmpeg_command("ffmpeg -f concat -i segments_list.txt -c copy montage.mp4")
            log_ffmpeg_command("ffmpeg -i montage.mp4 -i \"Subnautic Measures.flac\" -c:v copy -c:a aac final.mp4")
            
            # Log file usage - this shows the problem!
            log_file_usage(actual_files_used, expected_files)
            
            # Log the processing result
            log_processing_result({
                "success": False,
                "message": "Used wrong input files - test_video.mp4 instead of main videos",
                "output_size": "329KB (should be ~3MB)",
                "resolution": "320x240 (should be 1280x720)",
                "has_audio": False
            })
        
        print("🐛 Debug session completed - check /tmp/music/debug/haiku/ for results")
        
    except Exception as e:
        print(f"❌ Debug test failed: {e}")
        import traceback
        traceback.print_exc()

async def analyze_haiku_problem():
    """Analyze what went wrong with Haiku file selection"""
    
    print("""
🔍 HAIKU PROBLEM ANALYSIS
========================

❌ WHAT WENT WRONG:
- User requested: "Create montage using 3 different video clips"
- Expected files: JJVtt947FfI_136.mp4, PXL_20250306_132546255.mp4, _wZ5Hof5tXY_136.mp4
- Haiku actually used: test_video.mp4 (WRONG!)
- Result: 31.5s, 320x240, no audio instead of 21.57s, 1280x720, with audio

🧠 PROMPT PROBLEMS:
1. File selection logic is unclear
2. No explicit instruction to avoid test files
3. No validation of file usage
4. No size/quality requirements specified

💡 PROPOSED FIXES:
1. Explicit file filtering: "Do NOT use any files with 'test' in the name"
2. File validation: "Verify file sizes are > 1MB before using"
3. Quality requirements: "Target output should be HD resolution (1280x720 or higher)"
4. Explicit file mapping: "Use exactly these files: [list]"

🎯 IMPROVED PROMPT STRUCTURE:
- Clear file inclusion/exclusion rules
- Quality validation steps
- Explicit file-to-role mapping
- Success criteria definition
""")

if __name__ == "__main__":
    asyncio.run(test_haiku_debug())
    asyncio.run(analyze_haiku_problem())