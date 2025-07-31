#!/usr/bin/env python3
"""
Test uber-kompost integration - for when JAR is built
"""
import sys
from pathlib import Path

# Add integration path
sys.path.insert(0, str(Path(__file__).parent / 'integration' / 'komposteur'))

def test_uber_kompost():
    """Test uber-kompost integration"""
    print("🎬 Testing Uber-Kompost Integration")
    print("=" * 50)
    
    from bridge.uber_kompost_bridge import UberKompostBridge
    
    bridge = UberKompostBridge()
    
    print("🔌 Initializing uber-kompost bridge...")
    if not bridge.initialize():
        print("❌ Bridge initialization failed")
        print("💡 Build uber-kompost JAR with: mvn clean package -pl uber-kompost -DskipTests")
        return False
    
    print("✅ Bridge initialized successfully")
    print(f"📦 JAR path: {bridge.jar_path}")
    
    # Test version
    print(f"\n📋 Version: {bridge.get_version()}")
    
    # Test health check
    print(f"\n🏥 Health check...")
    health = bridge.health_check()
    print(f"Health: {health}")
    
    # Test kompost processing if we have a test file
    test_file = Path("music_video_komposition.json")
    if test_file.exists():
        print(f"\n🎵 Processing kompost file...")
        result = bridge.process_kompost_json(str(test_file))
        print(f"Result: {result}")
        
        if result.get('success'):
            print("✅ Uber-kompost processing successful!")
        else:
            print(f"❌ Processing failed: {result.get('error')}")
    else:
        print(f"⚠️  No test kompost file found")
    
    bridge.shutdown()
    print(f"\n🎯 Uber-kompost test completed!")
    return True

if __name__ == "__main__":
    test_uber_kompost()