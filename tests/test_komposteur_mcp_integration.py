#!/usr/bin/env python3
"""
Test the new Komposteur MCP integration where it calls back to Python
"""
import subprocess
from pathlib import Path

def test_komposteur_mcp_integration():
    """Test what Komposteur is trying to do with MCP"""
    print("🔍 Testing Komposteur MCP Integration")
    print("=" * 60)
    
    jar_path = Path.home() / ".m2/repository/no/lau/kompost/komposteur-core/0.8-SNAPSHOT/komposteur-core-0.8-SNAPSHOT-jar-with-dependencies.jar"
    
    java_wrapper = '''
import no.lau.komposteur.core.KomposteurEntryPoint;

public class McpTestWrapper {
    public static void main(String[] args) {
        try {
            System.out.println("DEBUG: Testing MCP integration...");
            
            KomposteurEntryPoint komposteur = new KomposteurEntryPoint();
            komposteur.initialize();
            
            // Test MCP processor finding
            try {
                String mcpProcessor = komposteur.findMcpPythonProcessor();
                System.out.println("MCP_PROCESSOR:" + mcpProcessor);
            } catch (Exception e) {
                System.out.println("MCP_PROCESSOR_ERROR:" + e.getMessage());
            }
            
            // Test status for more details
            System.out.println("STATUS:" + komposteur.getStatus());
            
            komposteur.shutdown();
        } catch (Exception e) {
            System.err.println("ERROR:" + e.getMessage());
            e.printStackTrace();
        }
    }
}
'''
    
    # Write and compile wrapper
    wrapper_file = Path("/tmp/McpTestWrapper.java")
    with open(wrapper_file, 'w') as f:
        f.write(java_wrapper)
    
    print("🔧 Compiling MCP test wrapper...")
    compile_cmd = ["javac", "-cp", str(jar_path), str(wrapper_file)]
    compile_result = subprocess.run(compile_cmd, capture_output=True, text=True)
    
    if compile_result.returncode != 0:
        print(f"❌ Compilation failed: {compile_result.stderr}")
        return
    
    print("✅ Compilation successful")
    
    # Run wrapper
    print("\n🚀 Testing Komposteur MCP integration...")
    run_cmd = ["java", "-cp", f"{jar_path}:/tmp", "McpTestWrapper"]
    run_result = subprocess.run(run_cmd, capture_output=True, text=True)
    
    print(f"\n📊 RESULTS:")
    print(f"Return code: {run_result.returncode}")
    print(f"\nSTDOUT:")
    print(run_result.stdout)
    print(f"\nSTDERR:")
    print(run_result.stderr)
    
    # Parse results
    for line in run_result.stdout.split('\n'):
        if line.startswith('MCP_PROCESSOR:'):
            processor_path = line[14:]
            print(f"\n🔍 MCP Processor Found: {processor_path}")
            if Path(processor_path).exists():
                print(f"✅ Processor exists")
            else:
                print(f"❌ Processor not found")
        elif line.startswith('MCP_PROCESSOR_ERROR:'):
            error = line[20:]
            print(f"\n❌ MCP Processor Error: {error}")

if __name__ == "__main__":
    test_komposteur_mcp_integration()