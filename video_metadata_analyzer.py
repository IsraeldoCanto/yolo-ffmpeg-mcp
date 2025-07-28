#!/usr/bin/env python3
"""
Video Metadata Analysis Library
Analyzes FFmpeg metadata to identify differences and similarities between videos.
"""
import json
import subprocess
from pathlib import Path
from typing import Dict, List, Tuple, Any
from dataclasses import dataclass

@dataclass
class VideoMetrics:
    """Video comparison metrics"""
    # Basic properties
    duration: float
    width: int
    height: int
    frame_count: int
    file_size: int
    
    # Video stream properties
    video_bitrate: int
    video_profile: str
    pixel_format: str
    color_range: str
    
    # Audio properties
    audio_bitrate: int
    audio_sample_rate: int
    audio_channels: int
    
    # Calculated metrics
    bitrate_ratio: float = 0.0
    size_ratio: float = 0.0
    quality_indicator: str = ""

class VideoMetadataAnalyzer:
    """Analyze video metadata for automatic comparison testing"""
    
    def __init__(self):
        self.similarity_thresholds = {
            "duration_tolerance": 1.0,  # seconds
            "resolution_match": True,   # exact match required
            "frame_count_tolerance": 30,  # frames
            "bitrate_ratio_significant": 1.5,  # 50% increase considered significant
            "size_ratio_significant": 1.3   # 30% increase considered significant
        }
    
    def extract_metadata(self, video_path: str) -> Dict[str, Any]:
        """Extract metadata using ffprobe"""
        cmd = [
            "ffprobe", "-v", "quiet", "-print_format", "json",
            "-show_format", "-show_streams", str(video_path)
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            return json.loads(result.stdout)
        except Exception as e:
            raise ValueError(f"Failed to extract metadata from {video_path}: {e}")
    
    def parse_video_metrics(self, metadata: Dict[str, Any]) -> VideoMetrics:
        """Parse metadata into structured metrics"""
        # Find video and audio streams
        video_stream = next((s for s in metadata["streams"] if s["codec_type"] == "video"), {})
        audio_stream = next((s for s in metadata["streams"] if s["codec_type"] == "audio"), {})
        format_info = metadata.get("format", {})
        
        return VideoMetrics(
            # Basic properties
            duration=float(format_info.get("duration", 0)),
            width=int(video_stream.get("width", 0)),
            height=int(video_stream.get("height", 0)),
            frame_count=int(video_stream.get("nb_frames", 0)),
            file_size=int(format_info.get("size", 0)),
            
            # Video stream properties
            video_bitrate=int(video_stream.get("bit_rate", 0)),
            video_profile=video_stream.get("profile", ""),
            pixel_format=video_stream.get("pix_fmt", ""),
            color_range=video_stream.get("color_range", ""),
            
            # Audio properties
            audio_bitrate=int(audio_stream.get("bit_rate", 0)),
            audio_sample_rate=int(audio_stream.get("sample_rate", 0)),
            audio_channels=int(audio_stream.get("channels", 0))
        )
    
    def calculate_comparison_metrics(self, original: VideoMetrics, processed: VideoMetrics) -> Dict[str, Any]:
        """Calculate comparison metrics between two videos"""
        
        # Calculate ratios
        bitrate_ratio = processed.video_bitrate / original.video_bitrate if original.video_bitrate > 0 else 0
        size_ratio = processed.file_size / original.file_size if original.file_size > 0 else 0
        
        # Update metrics objects
        processed.bitrate_ratio = bitrate_ratio
        processed.size_ratio = size_ratio
        
        # Duration difference
        duration_diff = abs(processed.duration - original.duration)
        
        # Frame count difference
        frame_diff = abs(processed.frame_count - original.frame_count)
        
        # Resolution match
        resolution_match = (processed.width == original.width and 
                          processed.height == original.height)
        
        # Quality indicators
        quality_indicators = []
        if bitrate_ratio > self.similarity_thresholds["bitrate_ratio_significant"]:
            quality_indicators.append("higher_bitrate")
        if size_ratio > self.similarity_thresholds["size_ratio_significant"]:
            quality_indicators.append("larger_file")
        if processed.pixel_format != original.pixel_format:
            quality_indicators.append("different_pixel_format")
        if processed.video_profile != original.video_profile:
            quality_indicators.append("different_profile")
        
        processed.quality_indicator = ",".join(quality_indicators)
        
        return {
            "similarity_score": self._calculate_similarity_score(original, processed),
            "differences": {
                "duration_diff": duration_diff,
                "frame_diff": frame_diff,
                "bitrate_ratio": bitrate_ratio,
                "size_ratio": size_ratio,
                "resolution_match": resolution_match,
                "pixel_format_change": original.pixel_format != processed.pixel_format,
                "profile_change": original.video_profile != processed.video_profile,
                "color_range_change": original.color_range != processed.color_range
            },
            "test_indicators": {
                "same_source": duration_diff < self.similarity_thresholds["duration_tolerance"] and resolution_match,
                "processing_applied": bitrate_ratio > 1.1 or size_ratio > 1.1 or len(quality_indicators) > 0,
                "significant_change": bitrate_ratio > self.similarity_thresholds["bitrate_ratio_significant"],
                "visual_change_likely": processed.pixel_format != original.pixel_format or 
                                     processed.video_profile != original.video_profile
            }
        }
    
    def _calculate_similarity_score(self, original: VideoMetrics, processed: VideoMetrics) -> float:
        """Calculate overall similarity score (0-100)"""
        score = 100.0
        
        # Duration penalty
        duration_diff = abs(processed.duration - original.duration)
        if duration_diff > self.similarity_thresholds["duration_tolerance"]:
            score -= min(20, duration_diff * 2)
        
        # Resolution penalty
        if processed.width != original.width or processed.height != original.height:
            score -= 30
        
        # Frame count penalty
        frame_diff = abs(processed.frame_count - original.frame_count)
        if frame_diff > self.similarity_thresholds["frame_count_tolerance"]:
            score -= min(15, frame_diff / 10)
        
        # Bitrate change bonus/penalty
        bitrate_ratio = processed.video_bitrate / original.video_bitrate if original.video_bitrate > 0 else 1
        if bitrate_ratio > 1.5:
            score += 5  # Bonus for higher quality
        elif bitrate_ratio < 0.7:
            score -= 10  # Penalty for significant quality loss
        
        return max(0, min(100, score))
    
    def generate_test_recommendations(self, comparison: Dict[str, Any]) -> List[str]:
        """Generate recommendations for automatic testing"""
        recommendations = []
        
        indicators = comparison["test_indicators"]
        differences = comparison["differences"]
        
        if indicators["same_source"]:
            recommendations.append("✅ Videos appear to be from same source - good for A/B testing")
        
        if indicators["processing_applied"]:
            recommendations.append("✅ Processing effects detected - suitable for filter testing")
        
        if indicators["significant_change"]:
            recommendations.append("🎯 Significant quality change detected - excellent for comparison testing")
        
        if indicators["visual_change_likely"]:
            recommendations.append("👁️ Visual changes likely - good for human-visible effect validation")
        
        if differences["bitrate_ratio"] > 2.0:
            recommendations.append("⚠️ Very high bitrate increase - may indicate complex processing")
        
        if differences["size_ratio"] > 3.0:
            recommendations.append("⚠️ Very large file size increase - check for processing efficiency")
        
        if not indicators["processing_applied"]:
            recommendations.append("❌ No significant processing detected - may need stronger effects")
        
        return recommendations

def analyze_video_comparison(original_path: str, processed_path: str) -> Dict[str, Any]:
    """Main analysis function"""
    analyzer = VideoMetadataAnalyzer()
    
    # Extract metadata
    original_metadata = analyzer.extract_metadata(original_path)
    processed_metadata = analyzer.extract_metadata(processed_path)
    
    # Parse metrics
    original_metrics = analyzer.parse_video_metrics(original_metadata)
    processed_metrics = analyzer.parse_video_metrics(processed_metadata)
    
    # Calculate comparison
    comparison = analyzer.calculate_comparison_metrics(original_metrics, processed_metrics)
    
    # Generate recommendations
    recommendations = analyzer.generate_test_recommendations(comparison)
    
    return {
        "original_metrics": original_metrics,
        "processed_metrics": processed_metrics,
        "comparison": comparison,
        "recommendations": recommendations,
        "raw_metadata": {
            "original": original_metadata,
            "processed": processed_metadata
        }
    }

if __name__ == "__main__":
    # Test with our comparison videos
    original_path = "/tmp/music/temp/original_video_1753724576.mp4"
    processed_path = "/tmp/music/temp/dramatic_filtered_1753724576.mp4"
    
    try:
        analysis = analyze_video_comparison(original_path, processed_path)
        
        print("🎬 VIDEO METADATA ANALYSIS REPORT")
        print("=" * 60)
        
        orig = analysis["original_metrics"]
        proc = analysis["processed_metrics"]
        comp = analysis["comparison"]
        
        print(f"\n📹 ORIGINAL VIDEO:")
        print(f"   Duration: {orig.duration:.1f}s, Resolution: {orig.width}x{orig.height}")
        print(f"   File Size: {orig.file_size / 1024 / 1024:.1f}MB, Bitrate: {orig.video_bitrate:,} bps")
        print(f"   Profile: {orig.video_profile}, Pixel Format: {orig.pixel_format}")
        print(f"   Color Range: {orig.color_range}, Frames: {orig.frame_count}")
        
        print(f"\n🎨 PROCESSED VIDEO:")
        print(f"   Duration: {proc.duration:.1f}s, Resolution: {proc.width}x{proc.height}")
        print(f"   File Size: {proc.file_size / 1024 / 1024:.1f}MB, Bitrate: {proc.video_bitrate:,} bps")
        print(f"   Profile: {proc.video_profile}, Pixel Format: {proc.pixel_format}")
        print(f"   Color Range: {proc.color_range}, Frames: {proc.frame_count}")
        
        print(f"\n📊 COMPARISON METRICS:")
        diff = comp["differences"]
        print(f"   Similarity Score: {comp['similarity_score']:.1f}/100")
        print(f"   Duration Difference: {diff['duration_diff']:.3f}s")
        print(f"   Bitrate Ratio: {diff['bitrate_ratio']:.2f}x")
        print(f"   Size Ratio: {diff['size_ratio']:.2f}x")
        print(f"   Resolution Match: {diff['resolution_match']}")
        print(f"   Pixel Format Change: {diff['pixel_format_change']}")
        print(f"   Profile Change: {diff['profile_change']}")
        print(f"   Color Range Change: {diff['color_range_change']}")
        
        print(f"\n🎯 TEST INDICATORS:")
        indicators = comp["test_indicators"]
        for key, value in indicators.items():
            status = "✅" if value else "❌"
            print(f"   {status} {key.replace('_', ' ').title()}: {value}")
        
        print(f"\n💡 RECOMMENDATIONS:")
        for rec in analysis["recommendations"]:
            print(f"   {rec}")
        
        print(f"\n🔍 KEY FINDINGS FOR TEST LIBRARY:")
        print(f"   • Bitrate ratio ({diff['bitrate_ratio']:.2f}x) - reliable indicator")
        print(f"   • File size ratio ({diff['size_ratio']:.2f}x) - easily measurable")
        print(f"   • Pixel format change - indicates processing type")
        print(f"   • Profile change - indicates encoding differences")
        print(f"   • Color range change - indicates color processing")
        
    except Exception as e:
        print(f"❌ Analysis failed: {e}")