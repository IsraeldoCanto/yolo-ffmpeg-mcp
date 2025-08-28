#!/usr/bin/env python3
"""
Test Komposteur status and capabilities in detail
"""
import subprocess
from pathlib import Path

def test_komposteur_status():
    """Test what Komposteur status returns"""
    print("🔍 Testing Komposteur Status and Capabilities")
    print("=" * 60)
    
    jar_path = Path.home() / ".m2/repository/no/lau/kompost/komposteur-core/0.8-SNAPSHOT/komposteur-core-0.8-SNAPSHOT-jar-with-dependencies.jar"
    
    java_wrapper = '''
import no.lau.komposteur.core.KomposteurEntryPoint;
import java.util.Map;

public class StatusWrapper {
    public static void main(String[] args) {
        try {
            System.out.println("DEBUG: Creating KomposteurEntryPoint...");
            KomposteurEntryPoint komposteur = new KomposteurEntryPoint();
            
            System.out.println("DEBUG: Initializing...");
            komposteur.initialize();
            
            System.out.println("DEBUG: Getting status...");
            Map<String, Object> status = komposteur.getStatus();
            
            System.out.println("STATUS:" + status);
            
            // Try to get more info about the implementation
            System.out.println("DEBUG: Komposteur class: " + komposteur.getClass().getName());
            System.out.println("DEBUG: Available methods:");
            for (java.lang.reflect.Method method : komposteur.getClass().getDeclaredMethods()) {
                System.out.println("  - " + method.getName() + "(" + 
                    java.util.Arrays.toString(method.getParameterTypes()) + ")");
            }
            
            komposteur.shutdown();
            System.out.println("DEBUG: Test completed");
        } catch (Exception e) {
            System.err.println("ERROR:" + e.getMessage());
            e.printStackTrace();
        }
    }
}
'''
    
    # Write and compile wrapper
    wrapper_file = Path("/tmp/StatusWrapper.java")
    with open(wrapper_file, 'w') as f:
        f.write(java_wrapper)
    
    print(f"🔧 Compiling status wrapper...")
    compile_cmd = ["javac", "-cp", str(jar_path), str(wrapper_file)]
    compile_result = subprocess.run(compile_cmd, capture_output=True, text=True)
    
    if compile_result.returncode != 0:
        print(f"❌ Compilation failed: {compile_result.stderr}")
        return
    
    print(f"✅ Compilation successful")
    
    # Run wrapper
    print(f"\n🚀 Running status check...")
    run_cmd = ["java", "-cp", f"{jar_path}:/tmp", "StatusWrapper"]
    run_result = subprocess.run(run_cmd, capture_output=True, text=True)
    
    print(f"\n📊 STATUS RESULTS:")
    print(f"Return code: {run_result.returncode}")
    print(f"\nSTDOUT:")
    print(run_result.stdout)
    print(f"\nSTDERR:")
    print(run_result.stderr)

if __name__ == "__main__":
    test_komposteur_status()