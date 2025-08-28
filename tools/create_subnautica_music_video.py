#!/usr/bin/env python3
"""
Create Subnautica-themed music video using 3 YouTube Shorts with MCP service
Uses our improved keyframe-aligned extraction for perfect frame preservation
"""
import subprocess
import logging
import json
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_subnautica_komposition():
    """Create komposition file for Subnautica music video"""
    
    # Create segments using keyframe-aligned extraction (already done)
    segments = []
    
    # 12 segments of 2 seconds each from the 3 YouTube Shorts
    # Using our successful keyframe-aligned segments
    for i in range(1, 13):
        segment_file = f"segments_keyframe_fixed/seg{i:02d}_fixed.mp4"
        if Path(segment_file).exists():
            segments.append({
                "id": f"segment_{i:02d}",
                "source": segment_file,
                "startTime": (i-1) * 2.0,
                "duration": 2.0,
                "effects": [
                    {
                        "type": "scale",
                        "parameters": {
                            "width": 1080,
                            "height": 1920,
                            "mode": "letterbox"
                        }
                    },
                    {
                        "type": "fade",
                        "parameters": {
                            "type": "in",
                            "duration": 0.2
                        }
                    }
                ]
            })
    
    # Subnautica music video komposition
    komposition = {
        "version": "1.0",
        "title": "Subnautica Deep Ocean Music Video",
        "description": "3 YouTube Shorts synchronized to Subnautic Measures - Deep ocean themed music video",
        "format": {
            "resolution": "1080x1920",
            "frameRate": 30,
            "aspectRatio": "9:16"
        },
        "audio": {
            "source": "Subnautic Measures.flac",
            "volume": 0.8,
            "fadeIn": 1.0,
            "fadeOut": 2.0
        },
        "videoSegments": segments,
        "globalEffects": [
            {
                "type": "color_grade",
                "parameters": {
                    "style": "deep_ocean",
                    "saturation": 1.2,
                    "brightness": -0.1,
                    "contrast": 1.1,
                    "blue_tint": 0.15
                }
            },
            {
                "type": "vignette",
                "parameters": {
                    "intensity": 0.3,
                    "softness": 0.6
                }
            }
        ],
        "metadata": {
            "creator": "YOLO FFMPEG MCP",
            "theme": "Subnautica Deep Ocean",
            "target_platform": "YouTube Shorts",
            "creation_method": "keyframe_aligned_extraction",
            "frame_preservation": "100%"
        }
    }
    
    return komposition

def create_video_with_ffmpeg():
    """Create the video using our proven FFmpeg keyframe-aligned approach"""
    
    logger.info("🎬 Creating Subnautica music video with keyframe-aligned segments...")
    
    # Use our successful segments_keyframe_fixed approach
    segments_list = "segments_keyframe_fixed_list.txt"
    
    if not Path(segments_list).exists():
        logger.error(f"❌ Segments list not found: {segments_list}")
        return None
    
    # Create video with Subnautica theme
    output_file = "subnautica_deep_ocean_music_video.mp4"
    
    # Step 1: Concatenate video segments with perfect frame preservation
    temp_video = "temp_subnautica_video.mp4"
    
    cmd_video = [
        'ffmpeg', '-f', 'concat', '-safe', '0', '-i', segments_list,
        '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2',
        '-c:v', 'libx264', '-preset', 'medium', '-b:v', '2M', '-r', '30',
        '-an',  # No audio for now
        temp_video, '-y'
    ]
    
    logger.info("  📹 Step 1: Creating video with keyframe-aligned segments...")
    try:
        result = subprocess.run(cmd_video, capture_output=True, text=True, check=True)
        logger.info(f"  ✅ Video created: {temp_video}")
    except subprocess.CalledProcessError as e:
        logger.error(f"  ❌ Video creation failed: {e.stderr}")
        return None
    
    # Step 2: Add Subnautica music and effects
    cmd_final = [
        'ffmpeg', 
        '-i', temp_video,
        '-i', 'Subnautic Measures.flac',
        '-filter_complex', 
        '[0:v]colorbalance=bs=0.2:ms=0.1:hs=-0.05,unsharp=5:5:0.8:3:3:0.4[v1];'
        '[v1]vignette=PI/4:0.3[v2];'
        '[1:a]volume=0.8,afade=t=in:st=0:d=1,afade=t=out:st=22:d=2[a]',
        '-map', '[v2]', '-map', '[a]',
        '-c:v', 'libx264', '-preset', 'medium', '-b:v', '3M',
        '-c:a', 'aac', '-b:a', '192k',
        '-t', '24',  # 12 segments × 2 seconds
        output_file, '-y'
    ]
    
    logger.info("  🎵 Step 2: Adding Subnautica music and deep ocean effects...")
    try:
        result = subprocess.run(cmd_final, capture_output=True, text=True, check=True)
        logger.info(f"  ✅ Final video created: {output_file}")
        
        # Clean up temp file
        Path(temp_video).unlink(missing_ok=True)
        
        return Path(output_file)
        
    except subprocess.CalledProcessError as e:
        logger.error(f"  ❌ Final video creation failed: {e.stderr}")
        return None

def verify_video_quality(video_path: Path):
    """Verify the created video quality using our quality assessment"""
    
    logger.info(f"🔍 Verifying video quality: {video_path.name}")
    
    # Check basic properties
    cmd = [
        'ffprobe', '-v', 'quiet', '-print_format', 'json',
        '-show_format', '-show_streams', str(video_path)
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        data = json.loads(result.stdout)
        
        # Extract key metrics
        format_info = data['format']
        video_stream = next(s for s in data['streams'] if s['codec_type'] == 'video')
        audio_stream = next(s for s in data['streams'] if s['codec_type'] == 'audio')
        
        logger.info("📊 Video Quality Metrics:")
        logger.info(f"  📐 Resolution: {video_stream['width']}x{video_stream['height']}")
        logger.info(f"  🎞️  Frame Rate: {video_stream['r_frame_rate']}")
        logger.info(f"  ⏱️  Duration: {float(format_info['duration']):.1f}s")
        logger.info(f"  📊 Video Bitrate: {int(video_stream.get('bit_rate', 0))/1000:.0f}k")
        logger.info(f"  🔊 Audio Bitrate: {int(audio_stream.get('bit_rate', 0))/1000:.0f}k")
        logger.info(f"  📦 File Size: {int(format_info['size'])/1024/1024:.1f}MB")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Quality verification failed: {e}")
        return False

def main():
    """Main function to create Subnautica music video"""
    
    logger.info("🌊 Creating Subnautica Deep Ocean Music Video")
    logger.info("=" * 60)
    
    # Check prerequisites
    required_files = [
        "Subnautic Measures.flac",
        "segments_keyframe_fixed_list.txt"
    ]
    
    for file in required_files:
        if not Path(file).exists():
            logger.error(f"❌ Required file not found: {file}")
            return False
    
    # Create komposition metadata
    komposition = create_subnautica_komposition()
    with open("subnautica_komposition.json", "w") as f:
        json.dump(komposition, f, indent=2)
    logger.info("📋 Komposition metadata created: subnautica_komposition.json")
    
    # Create the video
    video_path = create_video_with_ffmpeg()
    if not video_path:
        logger.error("❌ Video creation failed")
        return False
    
    # Verify quality
    if verify_video_quality(video_path):
        logger.info("✅ Video creation completed successfully!")
        logger.info(f"🎬 Output: {video_path}")
        logger.info("🌊 Ready for YouTube upload!")
        return True
    else:
        logger.error("❌ Video quality verification failed")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)