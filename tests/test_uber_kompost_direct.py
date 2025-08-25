#!/usr/bin/env python3
"""
Direct uber-kompost processing test
"""

import asyncio
import json
import logging
from pathlib import Path
from src.komposteur_bridge_processor import KomposteurBridgeProcessor

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def main():
    komposition_path = "subnautic_music_video_komposition.json"
    
    if not Path(komposition_path).exists():
        logger.error(f"Komposition file not found: {komposition_path}")
        return
    
    logger.info(f"🔄 Processing komposition with uber-kompost: {komposition_path}")
    
    try:
        # Load komposition data
        with open(komposition_path, 'r') as f:
            komposition_data = json.load(f)
        
        # Process with KomposteurBridgeProcessor
        processor = KomposteurBridgeProcessor()
        
        logger.info("🚀 Starting komposition processing...")
        result = await processor.process_komposition(komposition_data)
        
        logger.info(f"✅ Processing completed: {result}")
        
        # Save result
        result_path = Path("uber_kompost_result.json")
        with open(result_path, 'w') as f:
            json.dump(result, f, indent=2, default=str)
        
        logger.info(f"📋 Result saved: {result_path}")
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Processing failed: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    result = asyncio.run(main())