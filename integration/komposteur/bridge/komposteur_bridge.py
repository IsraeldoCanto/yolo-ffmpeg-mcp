"""
Komposteur Bridge - Python-Java integration layer
Provides access to Komposteur's production-proven video processing algorithms
"""
import os
import subprocess
import time
from pathlib import Path
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class KomposteurBridge:
    """Bridge to Komposteur Java library using Py4J gateway"""
    
    def __init__(self):
        self.gateway = None
        self.komposteur = None
        self._java_process = None
        
    def initialize(self) -> bool:
        """Initialize the Java gateway and Komposteur core"""
        try:
            # Import py4j (will be added to requirements when ready)
            from py4j.java_gateway import JavaGateway, GatewayParameters
            
            # Start Java gateway with Komposteur JAR
            jar_path = os.path.expanduser(
                "~/.m2/repository/no/lau/kompost/komposteur-core/0.8-SNAPSHOT/"
                "komposteur-core-0.8-SNAPSHOT-jar-with-dependencies.jar"
            )
            
            if not Path(jar_path).exists():
                logger.error(f"Komposteur JAR not found at {jar_path}")
                return False
                
            # Start Java process with Komposteur in classpath
            java_cmd = [
                "java", "-cp", jar_path,
                "py4j.GatewayServer",
                "--die-on-exit"
            ]
            
            self._java_process = subprocess.Popen(
                java_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # Give Java process time to start
            time.sleep(2)
            
            # Connect Python gateway
            self.gateway = JavaGateway(gateway_parameters=GatewayParameters(auto_convert=True))
            
            # Test connection
            self.komposteur = self.gateway.entry_point
            version = self.komposteur.getVersion()
            logger.info(f"Connected to Komposteur v{version}")
            
            return True
            
        except ImportError:
            logger.warning("py4j not available - Komposteur integration disabled")
            return False
        except Exception as e:
            logger.error(f"Failed to initialize Komposteur bridge: {e}")
            return False
    
    def shutdown(self):
        """Clean shutdown of Java gateway"""
        if self.gateway:
            try:
                self.gateway.shutdown()
            except:
                pass
            self.gateway = None
            
        if self._java_process:
            try:
                self._java_process.terminate()
                self._java_process.wait(timeout=5)
            except:
                try:
                    self._java_process.kill()
                except:
                    pass
            self._java_process = None
    
    def is_available(self) -> bool:
        """Check if Komposteur bridge is initialized and available"""
        return self.komposteur is not None
    
    def beat_sync(self, video_path: str, audio_path: str, bpm: float) -> Dict[str, Any]:
        """Beat-synchronize video using Komposteur's 120 BPM = 8s per 16 beats formula"""
        if not self.is_available():
            raise RuntimeError("Komposteur bridge not initialized")
            
        try:
            result = self.komposteur.beatSync(video_path, audio_path, bpm)
            return {
                "success": True,
                "output_path": result.getOutputPath(),
                "duration": result.getDuration(),
                "beat_count": result.getBeatCount(),
                "processing_time": result.getProcessingTime()
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def extract_segment(self, video_path: str, start_time: float, end_time: float) -> Dict[str, Any]:
        """Extract video segment with microsecond precision"""
        if not self.is_available():
            raise RuntimeError("Komposteur bridge not initialized")
            
        try:
            result = self.komposteur.extractSegment(video_path, start_time, end_time)
            return {
                "success": True,
                "output_path": result.getOutputPath(),
                "actual_start": result.getActualStart(),
                "actual_end": result.getActualEnd(),
                "frame_count": result.getFrameCount()
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def validate_media(self, file_path: str) -> Dict[str, Any]:
        """Comprehensive media file validation using Komposteur pipeline"""
        if not self.is_available():
            raise RuntimeError("Komposteur bridge not initialized")
            
        try:
            result = self.komposteur.validateMedia(file_path)
            return {
                "success": True,
                "valid": result.isValid(),
                "format": result.getFormat(),
                "duration": result.getDuration(),
                "resolution": {
                    "width": result.getWidth(),
                    "height": result.getHeight()
                },
                "quality_score": result.getQualityScore(),
                "issues": list(result.getIssues())
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_version(self) -> str:
        """Get Komposteur version and status"""
        if not self.is_available():
            return "Komposteur bridge not available"
        try:
            return self.komposteur.getVersion()
        except Exception as e:
            return f"Error getting version: {e}"

# Global bridge instance
_bridge_instance: Optional[KomposteurBridge] = None

def get_bridge() -> KomposteurBridge:
    """Get or create the global Komposteur bridge instance"""
    global _bridge_instance
    if _bridge_instance is None:
        _bridge_instance = KomposteurBridge()
        _bridge_instance.initialize()
    return _bridge_instance

def shutdown_bridge():
    """Shutdown the global bridge instance"""
    global _bridge_instance
    if _bridge_instance:
        _bridge_instance.shutdown()
        _bridge_instance = None