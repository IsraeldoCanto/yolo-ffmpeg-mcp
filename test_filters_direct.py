#!/usr/bin/env python3
"""
Direct Filter Testing - Simplified Version
Tests video filters directly using MCP tools without complex setup.
"""

import asyncio
import json
import time
from pathlib import Path

async def test_basic_filters():
    """Test basic filter functionality with MCP tools"""
    
    print("🧪 Direct Filter Testing")
    print("=" * 50)
    
    try:
        # Import MCP tools
        import sys
        sys.path.insert(0, "src")
        
        # Test 1: Get available effects
        print("\n📋 Test 1: Getting available effects...")
        
        # Use MCP tools through the server
        from server import mcp
        result = await mcp.call_tool("get_available_video_effects", {})
        
        if isinstance(result, list) and len(result) > 0:
            result_data = json.loads(result[0].text)
            
            if result_data.get("success"):
                effects = result_data.get("effects", {})
                print(f"✅ Found {len(effects)} available effects")
                
                # Show effect categories
                categories = result_data.get("categories", [])
                print(f"📂 Categories: {', '.join(categories)}")
                
                # Test 2: List some fast effects
                print("\n🚀 Fast effects available:")
                for name, config in effects.items():
                    if config.get("performance_tier") == "fast":
                        print(f"  - {name}: {config.get('description', 'No description')}")
                        
                # Test 3: Get list of source files
                print("\n📁 Test 2: Getting source files...")
                files_result = await mcp.call_tool("list_files", {})
            
            if files_result:
                files_count = len(files_result.get("files", []))
                print(f"✅ Found {files_count} source files")
                
                # Show available video files
                video_files = [f for f in files_result.get("files", []) 
                             if f.get("extension", "").lower() in [".mp4", ".avi", ".mov"]]
                print(f"🎬 Video files: {len(video_files)}")
                
                if video_files:
                    # Test 3: Apply a simple effect
                    print("\n🎨 Test 3: Applying vintage_color effect...")
                    
                    file_id = video_files[0]["file_id"]
                    print(f"📹 Using source file: {file_id}")
                    
                    import mcp__ffmpeg_mcp__apply_video_effect
                    effect_result = mcp__ffmpeg_mcp__apply_video_effect.mcp__ffmpeg_mcp__apply_video_effect(
                        file_id=file_id,
                        effect_name="vintage_color",
                        parameters={"intensity": 0.8, "warmth": 0.2}
                    )
                    
                    if effect_result.get("success"):
                        output_file = effect_result.get("output_file_id")
                        processing_time = effect_result.get("processing_time", 0)
                        print(f"✅ Effect applied successfully in {processing_time:.2f}s")
                        print(f"📄 Output file: {output_file}")
                        
                        # Test 4: Get info about the generated file
                        print("\n📊 Test 4: Checking output file info...")
                        import mcp__ffmpeg_mcp__get_file_info
                        info_result = mcp__ffmpeg_mcp__get_file_info.mcp__ffmpeg_mcp__get_file_info(file_id=output_file)
                        
                        if info_result.get("success"):
                            file_info = info_result.get("info", {})
                            duration = file_info.get("format", {}).get("duration", "unknown")
                            size = file_info.get("size", "unknown")
                            print(f"✅ Output duration: {duration}s, size: {size} bytes")
                        else:
                            print(f"⚠️ Could not get file info: {info_result.get('error')}")
                            
                    else:
                        print(f"❌ Effect failed: {effect_result.get('error')}")
                        
                else:
                    print("⚠️ No video files available for testing")
                    
            else:
                print("❌ Failed to get file list")
                
        else:
            print(f"❌ Failed to get effects: {result}")
            
    except Exception as e:
        print(f"💥 Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        
    print("\n" + "=" * 50)
    print("🎬 Direct filter testing completed")

if __name__ == "__main__":
    asyncio.run(test_basic_filters())