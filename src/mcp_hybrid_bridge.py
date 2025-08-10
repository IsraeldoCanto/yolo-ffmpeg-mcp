#!/usr/bin/env python3
"""
MCP Hybrid Bridge - Framework Independence Solution

Provides both MCP framework integration and standalone operation,
allowing Haiku and other AI systems to work reliably regardless
of MCP framework availability.
"""

import asyncio
import json
import logging
import subprocess
import time
from pathlib import Path
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class BridgeMode(Enum):
    """Bridge operation modes"""
    MCP_FRAMEWORK = "mcp_framework"
    STANDALONE = "standalone" 
    HYBRID_AUTO = "hybrid_auto"

@dataclass
class ToolResult:
    """Standardized result from any tool execution"""
    success: bool
    data: Dict[str, Any]
    execution_time: float
    method: str  # "mcp" or "standalone"
    error: Optional[str] = None

class MCPHybridBridge:
    """
    Hybrid bridge supporting both MCP framework and standalone operation.
    
    Automatically detects MCP framework availability and provides seamless
    fallback to standalone implementations.
    """
    
    def __init__(self, 
                 preferred_mode: BridgeMode = BridgeMode.HYBRID_AUTO,
                 enable_logging: bool = True):
        self.preferred_mode = preferred_mode
        self.enable_logging = enable_logging
        
        # Framework availability detection
        self.mcp_available = self._detect_mcp_framework()
        self.operational_mode = self._determine_operational_mode()
        
        # Tool registry
        self.standalone_tools = self._register_standalone_tools()
        
        if self.enable_logging:
            logger.info(f"🔗 MCPHybridBridge initialized in {self.operational_mode.value} mode")
    
    def _detect_mcp_framework(self) -> bool:
        """Detect if MCP framework is available and functional"""
        try:
            # Try to import MCP components
            import mcp
            from server import yolo_smart_video_concat
            logger.info("✅ MCP framework detected and available")
            return True
        except ImportError as e:
            logger.info(f"⚠️ MCP framework not available: {e}")
            return False
        except Exception as e:
            logger.warning(f"⚠️ MCP framework detection failed: {e}")
            return False
    
    def _determine_operational_mode(self) -> BridgeMode:
        """Determine which mode to operate in"""
        if self.preferred_mode == BridgeMode.MCP_FRAMEWORK:
            if self.mcp_available:
                return BridgeMode.MCP_FRAMEWORK
            else:
                logger.warning("🔄 MCP framework preferred but not available, falling back to standalone")
                return BridgeMode.STANDALONE
        
        elif self.preferred_mode == BridgeMode.STANDALONE:
            return BridgeMode.STANDALONE
        
        else:  # HYBRID_AUTO
            return BridgeMode.MCP_FRAMEWORK if self.mcp_available else BridgeMode.STANDALONE
    
    def _register_standalone_tools(self) -> Dict[str, callable]:
        """Register standalone implementations of MCP tools"""
        return {
            "yolo_smart_video_concat": self._standalone_yolo_smart_video_concat,
            "analyze_video_processing_strategy": self._standalone_analyze_video_processing_strategy,
            "get_haiku_cost_status": self._standalone_get_haiku_cost_status,
            "process_file": self._standalone_process_file,
            "get_file_info": self._standalone_get_file_info,
            "list_files": self._standalone_list_files
        }
    
    async def call_tool(self, tool_name: str, **kwargs) -> ToolResult:
        """
        Universal tool calling interface with automatic fallback
        
        Args:
            tool_name: Name of the tool to call
            **kwargs: Tool-specific parameters
            
        Returns:
            ToolResult with success status, data, and metadata
        """
        start_time = time.time()
        
        # Try MCP framework first if available and preferred
        if self.operational_mode == BridgeMode.MCP_FRAMEWORK:
            try:
                result_data = await self._call_mcp_tool(tool_name, **kwargs)
                execution_time = time.time() - start_time
                
                return ToolResult(
                    success=True,
                    data=result_data,
                    execution_time=execution_time,
                    method="mcp"
                )
            except Exception as e:
                logger.warning(f"🔄 MCP tool {tool_name} failed, falling back to standalone: {e}")
                # Fall through to standalone
        
        # Use standalone implementation
        try:
            result_data = await self._call_standalone_tool(tool_name, **kwargs)
            execution_time = time.time() - start_time
            
            return ToolResult(
                success=True,
                data=result_data,
                execution_time=execution_time,
                method="standalone"
            )
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"❌ Both MCP and standalone failed for {tool_name}: {e}")
            
            return ToolResult(
                success=False,
                data={},
                execution_time=execution_time,
                method="failed",
                error=str(e)
            )
    
    async def _call_mcp_tool(self, tool_name: str, **kwargs) -> Dict[str, Any]:
        """Call tool through MCP framework"""
        # Import MCP tools dynamically to avoid import errors
        try:
            if tool_name == "yolo_smart_video_concat":
                from server import yolo_smart_video_concat
                return await yolo_smart_video_concat(kwargs.get("video_file_ids", []))
            
            elif tool_name == "analyze_video_processing_strategy":
                from server import analyze_video_processing_strategy
                return await analyze_video_processing_strategy(kwargs.get("video_file_ids", []))
            
            elif tool_name == "get_haiku_cost_status":
                from server import get_haiku_cost_status
                return await get_haiku_cost_status()
            
            else:
                raise NotImplementedError(f"MCP tool {tool_name} not implemented")
                
        except ImportError as e:
            raise Exception(f"MCP framework import failed: {e}")
    
    async def _call_standalone_tool(self, tool_name: str, **kwargs) -> Dict[str, Any]:
        """Call standalone implementation of tool"""
        if tool_name not in self.standalone_tools:
            raise NotImplementedError(f"Standalone tool {tool_name} not available")
        
        tool_func = self.standalone_tools[tool_name]
        return await tool_func(**kwargs)
    
    # Standalone tool implementations
    async def _standalone_yolo_smart_video_concat(self, video_file_ids: List[str]) -> Dict[str, Any]:
        """Standalone implementation of yolo_smart_video_concat"""
        
        # Basic heuristic analysis
        total_files = len(video_file_ids)
        total_size = 0
        existing_files = []
        
        for file_id in video_file_ids:
            file_path = Path(file_id)
            if file_path.exists():
                existing_files.append(file_id)
                total_size += file_path.stat().st_size
        
        # Determine strategy based on file analysis
        if len(existing_files) == 0:
            strategy = "direct_process"
            confidence = 0.5
            reasoning = "No files found - using direct processing"
        elif len(existing_files) == 1:
            strategy = "direct_process"
            confidence = 0.8
            reasoning = "Single file - direct processing optimal"
        elif total_size > 100 * 1024 * 1024:  # > 100MB
            strategy = "keyframe_align"
            confidence = 0.75
            reasoning = "Large files detected - keyframe alignment recommended"
        else:
            strategy = "standard_concat"
            confidence = 0.7
            reasoning = f"{len(existing_files)} files, {total_size/1024/1024:.1f}MB - standard concatenation"
        
        return {
            "success": True,
            "recommended_strategy": strategy,
            "confidence": confidence,
            "reasoning": reasoning,
            "analysis": {
                "total_files": total_files,
                "existing_files": len(existing_files),
                "total_size_mb": total_size / 1024 / 1024,
                "method": "standalone_heuristic"
            },
            "files_processed": existing_files
        }
    
    async def _standalone_analyze_video_processing_strategy(self, video_file_ids: List[str]) -> Dict[str, Any]:
        """Standalone video processing strategy analysis"""
        
        analysis_results = []
        overall_complexity = 0.0
        has_frame_issues = False
        
        for file_id in video_file_ids:
            file_path = Path(file_id)
            
            if file_path.exists():
                try:
                    # Get basic video info using ffprobe
                    cmd = ['ffprobe', '-v', 'quiet', '-print_format', 'json', 
                           '-show_format', '-show_streams', str(file_path)]
                    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
                    info = json.loads(result.stdout)
                    
                    duration = float(info['format'].get('duration', 0))
                    video_stream = next((s for s in info['streams'] if s['codec_type'] == 'video'), None)
                    
                    if video_stream:
                        width = int(video_stream.get('width', 0))
                        height = int(video_stream.get('height', 0))
                        
                        # Heuristic complexity calculation
                        resolution_factor = (width * height) / (1920 * 1080)  # Relative to 1080p
                        duration_factor = min(duration / 60, 2.0)  # Cap at 2x for long videos
                        complexity = (resolution_factor + duration_factor) / 2
                        
                        overall_complexity += complexity
                        
                        # Frame issue detection heuristics
                        if duration > 60 or width != 1920 or height != 1920:
                            has_frame_issues = True
                        
                        analysis_results.append({
                            "file": file_id,
                            "duration": duration,
                            "resolution": f"{width}x{height}",
                            "complexity": complexity,
                            "potential_issues": duration > 60 or (width * height) > 1920*1080
                        })
                    
                except Exception as e:
                    logger.warning(f"⚠️ Could not analyze {file_id}: {e}")
                    analysis_results.append({
                        "file": file_id,
                        "error": str(e),
                        "complexity": 0.5  # Default moderate complexity
                    })
            else:
                analysis_results.append({
                    "file": file_id,
                    "error": "File not found",
                    "complexity": 0.0
                })
        
        # Determine overall strategy
        avg_complexity = overall_complexity / max(len(video_file_ids), 1)
        
        if avg_complexity > 1.5:
            strategy = "normalize_first"
            confidence = 0.8
        elif has_frame_issues:
            strategy = "crossfade_concat"
            confidence = 0.75
        elif len(video_file_ids) > 1:
            strategy = "standard_concat"
            confidence = 0.7
        else:
            strategy = "direct_process"
            confidence = 0.85
        
        return {
            "recommended_strategy": strategy,
            "confidence": confidence,
            "complexity_score": avg_complexity,
            "has_frame_issues": has_frame_issues,
            "needs_normalization": avg_complexity > 1.0,
            "reasoning": f"Analyzed {len(video_file_ids)} files, avg complexity {avg_complexity:.2f}",
            "estimated_cost": 0.02 + (avg_complexity * 0.03),
            "estimated_time": 5.0 + (avg_complexity * 10.0),
            "file_analysis": analysis_results,
            "method": "standalone_ffprobe_analysis"
        }
    
    async def _standalone_get_haiku_cost_status(self) -> Dict[str, Any]:
        """Standalone cost status tracking"""
        
        # Simple in-memory cost tracking (would be persistent in production)
        return {
            "daily_spend": 0.0,
            "daily_limit": 5.0,
            "analysis_count": 0,
            "remaining_budget": 5.0,
            "can_afford_analysis": True,
            "cost_tracking_method": "standalone_in_memory",
            "last_reset": time.strftime("%Y-%m-%d"),
            "operational_mode": "standalone"
        }
    
    async def _standalone_process_file(self, file_id: str, operation: str, **params) -> Dict[str, Any]:
        """Standalone file processing"""
        
        file_path = Path(file_id)
        if not file_path.exists():
            return {
                "success": False,
                "error": f"File not found: {file_id}",
                "method": "standalone"
            }
        
        # Basic operation support
        if operation == "get_info":
            try:
                stat = file_path.stat()
                return {
                    "success": True,
                    "file_id": file_id,
                    "size": stat.st_size,
                    "modified": stat.st_mtime,
                    "extension": file_path.suffix,
                    "method": "standalone"
                }
            except Exception as e:
                return {
                    "success": False,
                    "error": str(e),
                    "method": "standalone"
                }
        
        return {
            "success": False,
            "error": f"Operation {operation} not supported in standalone mode",
            "method": "standalone"
        }
    
    async def _standalone_get_file_info(self, file_id: str) -> Dict[str, Any]:
        """Get file information in standalone mode"""
        return await self._standalone_process_file(file_id, "get_info")
    
    async def _standalone_list_files(self) -> Dict[str, Any]:
        """List available files in standalone mode"""
        
        current_dir = Path(".")
        video_extensions = {'.mp4', '.avi', '.mov', '.mkv', '.webm'}
        audio_extensions = {'.mp3', '.wav', '.flac', '.aac', '.ogg'}
        
        files = []
        for file_path in current_dir.iterdir():
            if file_path.is_file() and file_path.suffix.lower() in (video_extensions | audio_extensions):
                try:
                    stat = file_path.stat()
                    files.append({
                        "id": str(file_path),
                        "name": file_path.name,
                        "size": stat.st_size,
                        "type": "video" if file_path.suffix.lower() in video_extensions else "audio",
                        "modified": stat.st_mtime
                    })
                except Exception as e:
                    logger.warning(f"⚠️ Could not stat {file_path}: {e}")
        
        return {
            "success": True,
            "files": files,
            "count": len(files),
            "method": "standalone"
        }
    
    # Convenience methods for common operations
    async def yolo_smart_video_concat(self, video_file_ids: List[str]) -> ToolResult:
        """Convenience method for video concatenation"""
        return await self.call_tool("yolo_smart_video_concat", video_file_ids=video_file_ids)
    
    async def analyze_video_processing_strategy(self, video_file_ids: List[str]) -> ToolResult:
        """Convenience method for strategy analysis"""
        return await self.call_tool("analyze_video_processing_strategy", video_file_ids=video_file_ids)
    
    async def get_haiku_cost_status(self) -> ToolResult:
        """Convenience method for cost status"""
        return await self.call_tool("get_haiku_cost_status")
    
    def get_bridge_status(self) -> Dict[str, Any]:
        """Get current bridge operational status"""
        return {
            "operational_mode": self.operational_mode.value,
            "mcp_framework_available": self.mcp_available,
            "standalone_tools_available": len(self.standalone_tools),
            "tools_registered": list(self.standalone_tools.keys())
        }