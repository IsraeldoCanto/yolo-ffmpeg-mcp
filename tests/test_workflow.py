#!/usr/bin/env python3
"""
Complete music video creation workflow test
"""

import asyncio
import json
import logging
import time
from pathlib import Path
from src.download_service import DownloadService
from src.content_analyzer import VideoContentAnalyzer
from src.komposition_generator import KompositionGenerator
from src.komposition_processor import KompositionProcessor
from src.youtube_upload_service import YouTubeUploadService

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class WorkflowTracker:
    def __init__(self):
        self.start_time = time.time()
        self.steps = {}
        
    def start_step(self, step_name):
        self.steps[step_name] = {'start': time.time()}
        logger.info(f"🟡 Starting step: {step_name}")
        
    def complete_step(self, step_name, status="success", details=None):
        if step_name in self.steps:
            self.steps[step_name]['end'] = time.time()
            self.steps[step_name]['duration'] = self.steps[step_name]['end'] - self.steps[step_name]['start']
            self.steps[step_name]['status'] = status
            self.steps[step_name]['details'] = details
            logger.info(f"✅ Completed step: {step_name} in {self.steps[step_name]['duration']:.2f}s")
        
    def get_report(self):
        total_time = time.time() - self.start_time
        return {
            "total_duration": total_time,
            "steps": self.steps
        }

async def main():
    tracker = WorkflowTracker()
    
    try:
        # Step 1: Download YouTube videos
        tracker.start_step("batch_download")
        urls = [
            "https://www.youtube.com/watch?v=Oa8iS1W3OCM",
            "https://www.youtube.com/watch?v=3xEMCU1fyl8", 
            "https://www.youtube.com/watch?v=PLnPZVqiyjA"
        ]
        
        download_service = DownloadService()
        download_results = []
        
        for url in urls:
            try:
                result = await download_service.download_video_async(url, quality="720p")
                download_results.append(result)
                logger.info(f"Downloaded: {result.get('file_path', 'unknown')}")
            except Exception as e:
                logger.error(f"Download failed for {url}: {e}")
                download_results.append({"error": str(e), "url": url})
        
        tracker.complete_step("batch_download", details=f"Downloaded {len([r for r in download_results if 'file_path' in r])} videos")
        
        # Step 2: Analyze video content
        tracker.start_step("video_analysis")
        analyzer = VideoContentAnalyzer()
        analysis_results = []
        
        for result in download_results:
            if 'file_path' in result:
                try:
                    analysis = analyzer.analyze_video_content(result['file_path'])
                    analysis_results.append(analysis)
                    logger.info(f"Analyzed: {result['file_path']}")
                except Exception as e:
                    logger.error(f"Analysis failed for {result['file_path']}: {e}")
                    analysis_results.append({"error": str(e)})
        
        tracker.complete_step("video_analysis", details=f"Analyzed {len(analysis_results)} videos")
        
        # Step 3: Find Subnautic audio
        tracker.start_step("audio_location")
        subnautic_audio = Path("Subnautic Measures.flac")
        if not subnautic_audio.exists():
            raise FileNotFoundError("Subnautic Measures.flac not found")
        tracker.complete_step("audio_location", details=f"Found audio: {subnautic_audio}")
        
        # Step 4: Generate komposition
        tracker.start_step("komposition_generation")
        generator = KompositionGenerator()
        
        # Create basic komposition structure
        komposition = {
            "id": "subnautic_workflow_test",
            "name": "Subnautic Music Video - Workflow Test",
            "bpm": 120,
            "format": {
                "width": 1080,
                "height": 1920,
                "framerate": 30
            },
            "audio": {
                "file": str(subnautic_audio),
                "volume": 1.0
            },
            "segments": [],
            "effects": ["bit_compression"],
            "transitions": {"duration": 1.0, "type": "fade_to_black"}
        }
        
        # Add 12 segments of 4 beats each (2 seconds per segment at 120 BPM)
        segment_duration = 2.0  # seconds
        for i in range(12):
            start_time = i * segment_duration
            if analysis_results and i < len(analysis_results):
                # Use analysis results if available
                analysis = analysis_results[i % len(analysis_results)]
                if 'segments' in analysis and analysis['segments']:
                    segment = analysis['segments'][0]  # Use first segment
                    komposition["segments"].append({
                        "id": f"segment_{i}",
                        "start_time": start_time,
                        "duration": segment_duration,
                        "video_source": segment.get('source_path', ''),
                        "video_start": segment.get('start_time', 0),
                        "video_duration": segment.get('duration', segment_duration),
                        "effects": ["bit_compression"]
                    })
                else:
                    # Fallback segment
                    komposition["segments"].append({
                        "id": f"segment_{i}",
                        "start_time": start_time,
                        "duration": segment_duration,
                        "effects": ["bit_compression"]
                    })
        
        # Save komposition
        komposition_path = Path("workflow_test_komposition.json")
        with open(komposition_path, 'w') as f:
            json.dump(komposition, f, indent=2)
            
        tracker.complete_step("komposition_generation", details=f"Generated komposition: {komposition_path}")
        
        # Step 5: Process komposition
        tracker.start_step("komposition_processing")
        processor = KompositionProcessor()
        
        result = processor.process_komposition(str(komposition_path))
        tracker.complete_step("komposition_processing", details=f"Processing result: {result}")
        
        # Step 6: YouTube upload (if enabled)
        tracker.start_step("youtube_upload")
        try:
            upload_service = YouTubeUploadService()
            if hasattr(result, 'output_path') and Path(result.output_path).exists():
                upload_result = await upload_service.upload_video(
                    video_path=result.output_path,
                    title="Subnautic Music Video - AI Generated",
                    description="Generated using MCP FFMPEG server workflow",
                    tags=["subnautic", "music", "ai", "shorts"]
                )
                tracker.complete_step("youtube_upload", details=f"Upload result: {upload_result}")
            else:
                tracker.complete_step("youtube_upload", status="skipped", details="No output video found")
        except Exception as e:
            tracker.complete_step("youtube_upload", status="error", details=str(e))
        
    except Exception as e:
        logger.error(f"Workflow failed: {e}")
        tracker.complete_step("workflow", status="error", details=str(e))
    
    # Generate final report
    report = tracker.get_report()
    report_path = Path("COMPLETE_WORKFLOW_RESULTS.json")
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2)
    
    logger.info(f"🎯 Workflow completed in {report['total_duration']:.2f}s")
    logger.info(f"📋 Full report saved to: {report_path}")
    
    return report

if __name__ == "__main__":
    asyncio.run(main())