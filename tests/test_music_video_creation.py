#!/usr/bin/env python3
"""
Test music video creation using Komposteur Java library through MCP integration
"""
import sys
import json
from pathlib import Path

# Add integration path
sys.path.insert(0, str(Path(__file__).parent / 'integration' / 'komposteur'))

from bridge.komposteur_bridge import KomposteurBridge

def main():
    print('🎬 Testing Music Video Creation with Komposteur Java Library')
    print('=' * 70)

    # Initialize bridge
    bridge = KomposteurBridge()
    print('🔌 Initializing Komposteur bridge...')

    if not bridge.initialize():
        print('❌ Bridge initialization failed')
        return False
        
    print('✅ Bridge initialized successfully')
    print(f'📦 JAR path: {bridge.jar_path}')

    # Process the music video komposition
    kompost_file = 'music_video_komposition.json'
    print(f'\n🎵 Processing music video: {kompost_file}')

    result = bridge.process_kompost_json(kompost_file)

    print(f'\n📊 RESULT:')
    print(f'Success: {result.get("success")}')

    if result.get('success'):
        print('✅ Music video processing completed!')
        print(f'📁 Output: {result.get("output_video_path")}')
        print(f'📝 Log: {result.get("processing_log")}')
        print(f'🎨 Effects: {result.get("curated_effects_used")}')
        print(f'🔧 Raw result: {result.get("raw_result")}')
        
        # Check if output exists
        raw_result = result.get('raw_result', '')
        if raw_result and Path(raw_result).exists():
            size = Path(raw_result).stat().st_size
            print(f'✅ Output video created: {size:,} bytes')
        else:
            print(f'⚠️  Output video not found at: {raw_result}')
        
        success = True
    else:
        print('❌ Processing failed')
        print(f'Error: {result.get("error")}')
        if 'stderr' in result:
            print(f'Java stderr: {result["stderr"]}')
        success = False

    bridge.shutdown()
    print('\n🎯 Test completed - Komposteur Java library integration verified!')
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)