#!/usr/bin/env python3
"""
Test MCP integration with Komposteur tools directly
"""
import asyncio
import sys
from pathlib import Path

# Add integration path
sys.path.insert(0, str(Path(__file__).parent / 'integration' / 'komposteur'))

from tools.mcp_tools import register_komposteur_tools

class MockMCPServer:
    """Mock MCP server for testing"""
    def __init__(self):
        self.tools = {}
        
    def tool(self):
        def decorator(func):
            self.tools[func.__name__] = func
            return func
        return decorator

async def test_mcp_komposteur_integration():
    """Test the MCP-Komposteur integration"""
    print('🎬 Testing MCP-Komposteur Integration')
    print('=' * 50)
    
    # Create mock server and register tools
    server = MockMCPServer()
    tools = register_komposteur_tools(server)
    
    print(f'✅ Registered {len(tools)} Komposteur tools:')
    for tool in tools:
        print(f'   • {tool}')
    
    # Test the status tool
    print(f'\n🔍 Testing komposteur_get_status...')
    if 'komposteur_get_status' in server.tools:
        status_result = await server.tools['komposteur_get_status']()
        print(f'📊 Status result: {status_result}')
    
    # Test kompost processing with a simple example  
    print(f'\n🎵 Testing komposteur_process_kompost...')
    if 'komposteur_process_kompost' in server.tools:
        # Create a simple test file in /tmp
        test_kompost = Path('/tmp/kompost_test/music_video_komposition.json')
        
        if test_kompost.exists():
            print(f'📁 Using test file: {test_kompost}')
            process_result = await server.tools['komposteur_process_kompost'](str(test_kompost))
            print(f'🎬 Processing result:')
            print(f'   Success: {process_result.get("success")}')
            if process_result.get('success'):
                print(f'   ✅ Video processing completed!')
                print(f'   📁 Output: {process_result.get("output_video_path")}')
                print(f'   📝 Log: {process_result.get("processing_log")}')
            else:
                print(f'   ❌ Processing failed: {process_result.get("error")}')
        else:
            print(f'⚠️  Test file not found: {test_kompost}')
    
    print(f'\n🎯 MCP-Komposteur integration test completed!')

if __name__ == "__main__":
    asyncio.run(test_mcp_komposteur_integration())