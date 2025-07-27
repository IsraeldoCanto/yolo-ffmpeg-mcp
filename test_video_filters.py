#!/usr/bin/env python3
"""
Video Filter Testing Framework
Comprehensive testing system for MCP video effects and filters.

This script tests all available video effects systematically:
- Individual effect testing with parameter variations
- Effect chain testing (stacking multiple effects)
- Performance benchmarking and quality assessment
- Cross-category effect combinations
- Visual validation through generated test videos
"""

import asyncio
import json
import time
from pathlib import Path
from typing import Dict, List, Any, Tuple
import subprocess

# Test configuration
TEST_RESULTS_DIR = Path("/tmp/music/filter_tests")
TEST_SOURCE_FILE = "tests/files/PXL_20250306_132546255.mp4"  # Use existing test video
BENCHMARK_DURATION = 5  # seconds of test video to process

class VideoFilterTester:
    def __init__(self):
        self.results = {
            "test_session": {
                "start_time": time.time(),
                "test_count": 0,
                "success_count": 0,
                "failed_tests": [],
                "performance_data": []
            },
            "effects_tested": {},
            "effect_chains_tested": [],
            "quality_metrics": {}
        }
        
        # Ensure test results directory exists
        TEST_RESULTS_DIR.mkdir(parents=True, exist_ok=True)
        
        print(f"🧪 Video Filter Testing Framework")
        print(f"📁 Results directory: {TEST_RESULTS_DIR}")
        print(f"🎬 Source video: {TEST_SOURCE_FILE}")
        
    async def get_available_effects(self) -> Dict[str, Any]:
        """Get all available video effects from MCP server"""
        try:
            # Import MCP tools
            import sys
            sys.path.insert(0, "src")
            from server import mcp
            
            result = await mcp.call_tool("get_available_video_effects", {})
            if isinstance(result, list) and len(result) > 0:
                return json.loads(result[0].text)
            return {}
        except Exception as e:
            print(f"❌ Failed to get available effects: {e}")
            return {}
            
    async def test_single_effect(self, effect_name: str, effect_config: Dict[str, Any], 
                                custom_params: Dict[str, Any] = None) -> Dict[str, Any]:
        """Test a single video effect with optional custom parameters"""
        print(f"\n🔬 Testing effect: {effect_name}")
        
        test_result = {
            "effect_name": effect_name,
            "success": False,
            "processing_time": 0,
            "output_file": None,
            "error": None,
            "parameters_used": custom_params or {},
            "quality_check": None
        }
        
        try:
            # Import MCP tools
            import sys
            sys.path.insert(0, "src")
            from server import mcp
            
            # Get first available video file
            files_result = await mcp.call_tool("list_files", {})
            files_data = json.loads(files_result[0].text)
            video_files = [f for f in files_data["files"] if f["extension"] in [".mp4", ".avi", ".mov"]]
            
            if not video_files:
                test_result["error"] = "No video files available for testing"
                return test_result
                
            source_file_id = video_files[0]["file_id"]
            
            # Apply the effect
            start_time = time.time()
            
            effect_params = custom_params if custom_params else {}
            result = await mcp.call_tool("apply_video_effect", {
                "file_id": source_file_id,
                "effect_name": effect_name,
                "parameters": effect_params
            })
            
            processing_time = time.time() - start_time
            
            if isinstance(result, list) and len(result) > 0:
                result_data = json.loads(result[0].text)
                if result_data.get("success"):
                    test_result["success"] = True
                    test_result["processing_time"] = processing_time
                    test_result["output_file"] = result_data.get("output_file_id")
                    
                    # Basic quality check
                    test_result["quality_check"] = await self.basic_quality_check(
                        result_data.get("output_file_id")
                    )
                    
                    print(f"  ✅ Success in {processing_time:.2f}s")
                else:
                    test_result["error"] = result_data.get("error", "Unknown error")
                    print(f"  ❌ Failed: {test_result['error']}")
            else:
                test_result["error"] = "Invalid response format"
                print(f"  ❌ Invalid response")
                
        except Exception as e:
            test_result["error"] = str(e)
            print(f"  ❌ Exception: {e}")
            
        self.results["test_session"]["test_count"] += 1
        if test_result["success"]:
            self.results["test_session"]["success_count"] += 1
        else:
            self.results["test_session"]["failed_tests"].append({
                "effect": effect_name,
                "error": test_result["error"],
                "params": custom_params
            })
            
        return test_result
        
    async def basic_quality_check(self, file_id: str) -> Dict[str, Any]:
        """Perform basic quality checks on generated video"""
        try:
            import sys
            sys.path.insert(0, "src")
            from server import mcp
            
            # Get file info
            info_result = await mcp.call_tool("get_file_info", {"file_id": file_id})
            if isinstance(info_result, list) and len(info_result) > 0:
                info_data = json.loads(info_result[0].text)
                
                if info_data.get("success"):
                    file_info = info_data["info"]
                    
                    return {
                        "has_video": "video" in file_info.get("streams", {}),
                        "has_audio": "audio" in file_info.get("streams", {}),
                        "duration": float(file_info.get("format", {}).get("duration", 0)),
                        "file_size": file_info.get("size", 0),
                        "resolution": file_info.get("streams", {}).get("video", {}).get("resolution"),
                        "codec": file_info.get("streams", {}).get("video", {}).get("codec_name")
                    }
                    
        except Exception as e:
            print(f"  ⚠️ Quality check failed: {e}")
            
        return {"error": "Quality check failed"}
        
    async def test_effect_chain(self, effects_chain: List[Dict[str, Any]], 
                               chain_name: str = None) -> Dict[str, Any]:
        """Test a chain of multiple effects"""
        chain_name = chain_name or f"chain_{len(effects_chain)}_effects"
        print(f"\n🔗 Testing effect chain: {chain_name}")
        
        test_result = {
            "chain_name": chain_name,
            "effects_chain": effects_chain,
            "success": False,
            "processing_time": 0,
            "output_file": None,
            "error": None
        }
        
        try:
            import sys
            sys.path.insert(0, "src")
            from server import mcp
            
            # Get first available video file
            files_result = await mcp.call_tool("list_files", {})
            files_data = json.loads(files_result[0].text)
            video_files = [f for f in files_data["files"] if f["extension"] in [".mp4", ".avi", ".mov"]]
            
            if not video_files:
                test_result["error"] = "No video files available for testing"
                return test_result
                
            source_file_id = video_files[0]["file_id"]
            
            # Apply the effect chain
            start_time = time.time()
            
            result = await mcp.call_tool("apply_video_effect_chain", {
                "file_id": source_file_id,
                "effects_chain": effects_chain
            })
            
            processing_time = time.time() - start_time
            
            if isinstance(result, list) and len(result) > 0:
                result_data = json.loads(result[0].text)
                if result_data.get("success"):
                    test_result["success"] = True
                    test_result["processing_time"] = processing_time
                    test_result["output_file"] = result_data.get("final_output_file_id")
                    
                    print(f"  ✅ Chain success in {processing_time:.2f}s")
                else:
                    test_result["error"] = result_data.get("error", "Unknown error")
                    print(f"  ❌ Chain failed: {test_result['error']}")
            else:
                test_result["error"] = "Invalid response format"
                print(f"  ❌ Invalid response")
                
        except Exception as e:
            test_result["error"] = str(e)
            print(f"  ❌ Exception: {e}")
            
        return test_result
        
    async def test_category_effects(self, category: str, effects: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Test all effects in a specific category"""
        print(f"\n📂 Testing {category} effects category")
        
        category_effects = {name: config for name, config in effects.items() 
                           if config.get("category") == category}
        
        results = []
        for effect_name, effect_config in category_effects.items():
            result = await self.test_single_effect(effect_name, effect_config)
            results.append(result)
            
        return results
        
    async def test_performance_variations(self, effect_name: str, effect_config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Test an effect with different parameter combinations for performance analysis"""
        print(f"\n⚡ Performance testing: {effect_name}")
        
        results = []
        parameters = effect_config.get("parameters", [])
        
        # Test with default parameters
        default_result = await self.test_single_effect(effect_name, effect_config)
        results.append({"variant": "default", "result": default_result})
        
        # Test with minimum values
        min_params = {}
        for param in parameters:
            if param.get("min_value") is not None:
                min_params[param["name"]] = param["min_value"]
                
        if min_params:
            min_result = await self.test_single_effect(effect_name, effect_config, min_params)
            results.append({"variant": "minimum", "result": min_result})
        
        # Test with maximum values
        max_params = {}
        for param in parameters:
            if param.get("max_value") is not None:
                max_params[param["name"]] = param["max_value"]
                
        if max_params:
            max_result = await self.test_single_effect(effect_name, effect_config, max_params)
            results.append({"variant": "maximum", "result": max_result})
            
        return results
        
    async def run_comprehensive_tests(self):
        """Run the complete test suite"""
        print("🚀 Starting comprehensive video filter testing")
        
        # Get available effects
        effects_data = await self.get_available_effects()
        if not effects_data.get("success"):
            print("❌ Failed to get effects data")
            return
            
        effects = effects_data.get("effects", {})
        categories = effects_data.get("categories", [])
        
        print(f"📊 Found {len(effects)} effects in {len(categories)} categories")
        
        # Test 1: Individual effect testing
        print("\n" + "="*60)
        print("PHASE 1: INDIVIDUAL EFFECT TESTING")
        print("="*60)
        
        for effect_name, effect_config in effects.items():
            result = await self.test_single_effect(effect_name, effect_config)
            self.results["effects_tested"][effect_name] = result
            
        # Test 2: Category-based testing
        print("\n" + "="*60)
        print("PHASE 2: CATEGORY-BASED TESTING")
        print("="*60)
        
        for category in categories:
            category_results = await self.test_category_effects(category, effects)
            self.results[f"category_{category}"] = category_results
            
        # Test 3: Effect chain testing
        print("\n" + "="*60)
        print("PHASE 3: EFFECT CHAIN TESTING")
        print("="*60)
        
        # Test some interesting effect combinations
        test_chains = [
            {
                "name": "cinematic_grading",
                "chain": [
                    {"effect": "vintage_color", "parameters": {"intensity": 0.8}},
                    {"effect": "vignette", "parameters": {"angle": 1.57}}
                ]
            },
            {
                "name": "social_media_ready",
                "chain": [
                    {"effect": "social_media_pack", "parameters": {"saturation": 1.3}},
                    {"effect": "gaussian_blur", "parameters": {"sigma": 1.0}}
                ]
            },
            {
                "name": "horror_atmosphere",
                "chain": [
                    {"effect": "horror_desaturated", "parameters": {"saturation": 0.3}},
                    {"effect": "vignette", "parameters": {"mode": "forward"}}
                ]
            },
            {
                "name": "glitch_art",
                "chain": [
                    {"effect": "chromatic_aberration", "parameters": {"intensity": 1.5}},
                    {"effect": "glitch_aesthetic", "parameters": {"noise_strength": 20.0}}
                ]
            }
        ]
        
        for chain_config in test_chains:
            result = await self.test_effect_chain(
                chain_config["chain"], 
                chain_config["name"]
            )
            self.results["effect_chains_tested"].append(result)
            
        # Test 4: Performance benchmarking
        print("\n" + "="*60)
        print("PHASE 4: PERFORMANCE BENCHMARKING")
        print("="*60)
        
        # Test high-impact effects with performance variations
        performance_effects = ["face_blur", "chromatic_aberration", "vhs_look"]
        for effect_name in performance_effects:
            if effect_name in effects:
                perf_results = await self.test_performance_variations(
                    effect_name, effects[effect_name]
                )
                self.results[f"performance_{effect_name}"] = perf_results
                
    def save_results(self):
        """Save test results to JSON file"""
        self.results["test_session"]["end_time"] = time.time()
        self.results["test_session"]["total_duration"] = (
            self.results["test_session"]["end_time"] - 
            self.results["test_session"]["start_time"]
        )
        
        results_file = TEST_RESULTS_DIR / f"filter_test_results_{int(time.time())}.json"
        
        with open(results_file, 'w') as f:
            json.dump(self.results, f, indent=2)
            
        print(f"\n📄 Results saved to: {results_file}")
        
    def print_summary(self):
        """Print test execution summary"""
        session = self.results["test_session"]
        
        print("\n" + "="*60)
        print("TEST EXECUTION SUMMARY")
        print("="*60)
        print(f"⏱️  Total duration: {session['total_duration']:.2f} seconds")
        print(f"🧪 Tests executed: {session['test_count']}")
        print(f"✅ Successful tests: {session['success_count']}")
        print(f"❌ Failed tests: {len(session['failed_tests'])}")
        
        if session['failed_tests']:
            print("\n🔍 Failed tests:")
            for failed in session['failed_tests']:
                print(f"  - {failed['effect']}: {failed['error']}")
                
        success_rate = (session['success_count'] / session['test_count']) * 100 if session['test_count'] > 0 else 0
        print(f"\n📊 Success rate: {success_rate:.1f}%")
        
        print("\n🎬 Generated test videos available in:")
        print(f"   {TEST_RESULTS_DIR}")
        
async def main():
    """Main test execution function"""
    tester = VideoFilterTester()
    
    try:
        await tester.run_comprehensive_tests()
    except KeyboardInterrupt:
        print("\n🛑 Testing interrupted by user")
    except Exception as e:
        print(f"\n💥 Testing failed with exception: {e}")
    finally:
        tester.save_results()
        tester.print_summary()

if __name__ == "__main__":
    asyncio.run(main())