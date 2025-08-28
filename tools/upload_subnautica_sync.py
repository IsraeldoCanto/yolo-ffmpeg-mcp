#!/usr/bin/env python3
"""
Synchronous upload script for Subnautica Deep Ocean Music Video
"""
import sys
import logging
import asyncio
from pathlib import Path

# Add src to path
sys.path.insert(0, 'src')

from youtube_upload_service import YouTubeUploadService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def upload_video_async():
    """Upload Subnautica music video to YouTube (async version)"""
    
    logger.info("🌊 Uploading Subnautica Deep Ocean Music Video to YouTube")
    logger.info("=" * 60)
    
    # Video details
    video_file = Path("subnautica_deep_ocean_music_video.mp4")
    
    if not video_file.exists():
        logger.error(f"❌ Video file not found: {video_file}")
        return False
    
    # Video metadata
    title = "🌊 Subnautica Deep Ocean Music Video | 3 YouTube Shorts Remix | Subnautic Measures"
    description = """🌊 Deep ocean themed music video created from 3 YouTube Shorts synchronized to Subnautic Measures

🎵 AUDIO: Subnautic Measures (Original Composition)
🎬 VIDEO: 3 Curated YouTube Shorts with Deep Ocean Theme  
⚡ EFFECTS: Cinematic enhancement with vignette and sharpening
📱 FORMAT: YouTube Shorts (1080x1920, 24 seconds)

🔧 TECHNICAL DETAILS:
• Keyframe-aligned video extraction for perfect frame preservation
• 12 segments × 2 seconds each = 24 seconds total
• Enhanced with professional video effects
• High-quality audio at 192kbps AAC
• Optimized for mobile viewing

🏷️ TAGS: #Subnautica #DeepOcean #MusicVideo #YouTubeShorts #Remix #OceanVibes #Cinematic #TechDemo

⚙️ Created with YOLO FFMPEG MCP - Advanced video processing pipeline
🎨 Frame loss prevention technology ensures perfect quality  
🚀 Powered by Claude Code automation

This video demonstrates advanced video processing techniques including:
- Keyframe-aligned segment extraction
- Professional color grading and effects
- Audio synchronization and fade management  
- YouTube Shorts format optimization

Perfect for ocean lovers, music enthusiasts, and tech demos! 🌊🎵"""

    tags = [
        "Subnautica", "Deep Ocean", "Music Video", "YouTube Shorts",
        "Remix", "Ocean Vibes", "Cinematic", "Tech Demo", 
        "FFMPEG", "Video Processing", "Automation", "Claude Code",
        "Ocean Music", "Ambient", "Underwater", "Gaming Music"
    ]
    
    try:
        # Initialize YouTube upload service
        upload_service = YouTubeUploadService()
        
        # Authenticate (synchronous)
        if not upload_service.authenticate():
            logger.error("❌ YouTube authentication failed")
            return False
        
        # Upload video (async)
        logger.info(f"📤 Uploading {video_file.name} ({video_file.stat().st_size / 1024 / 1024:.1f}MB)")
        
        result = await upload_service.upload_video(
            video_path=str(video_file),
            title=title,
            description=description,
            tags=tags,
            category_id="10",  # Music category
            privacy_status="public",
            is_shorts=True
        )
        
        if result.get('id'):
            video_id = result['id']
            logger.info("✅ Upload completed successfully!")
            logger.info(f"🎬 Video ID: {video_id}")
            logger.info(f"🔗 Video URL: https://www.youtube.com/watch?v={video_id}")
            logger.info(f"📱 YouTube Shorts URL: https://www.youtube.com/shorts/{video_id}")
            
            # Save upload info
            upload_info = {
                "video_id": video_id,
                "title": title,
                "file": str(video_file),
                "upload_date": "2025-08-09",
                "url": f"https://www.youtube.com/watch?v={video_id}",
                "shorts_url": f"https://www.youtube.com/shorts/{video_id}",
                "result": result
            }
            
            import json
            with open("subnautica_upload_info.json", "w") as f:
                json.dump(upload_info, f, indent=2)
            
            logger.info("📋 Upload information saved to: subnautica_upload_info.json")
            return True
        else:
            logger.error(f"❌ Upload failed: {result}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Upload error: {e}")
        return False

def main():
    """Main synchronous wrapper"""
    return asyncio.run(upload_video_async())

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)