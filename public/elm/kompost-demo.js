// Demo Elm Application for kompo.st Integration
// This is a minimal Elm app simulator until the real Elm app is compiled

(function(scope) {
    'use strict';

    // Mock Elm object for demonstration
    var Elm = {
        Main: {
            init: function(options) {
                console.log('🎬 Initializing Demo Elm Komposition Editor');
                console.log('Flags:', options.flags);
                
                // Check if running in authenticated Firebase shell
                if (options.flags?.authMode === 'firebase_shell' && options.flags?.userProfile) {
                    console.log('🔐 Running in Firebase authenticated shell');
                    console.log('👤 User:', options.flags.userProfile);
                } else {
                    console.log('⚠️ No Firebase user context provided');
                }
                
                var node = options.node;
                var flags = options.flags || {};
                
                // Create the demo UI
                var elmContainer = document.createElement('div');
                elmContainer.style.cssText = `
                    padding: 2rem;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 8px;
                    min-height: 500px;
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                `;
                
                elmContainer.innerHTML = `
                    <div style="text-align: center; margin-bottom: 2rem;">
                        <h1 style="margin: 0 0 0.5rem 0; font-size: 2rem; font-weight: bold;">🎬 Elm Komposition Editor</h1>
                        <p style="margin: 0; opacity: 0.9;">Video Composition Platform - Demo Mode</p>
                    </div>
                    
                    <div style="background: rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 6px; margin-bottom: 1.5rem;">
                        <h3 style="margin: 0 0 1rem 0; font-size: 1.2rem;">Integration Status</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.9rem;">
                            <div>✅ React-Elm Communication</div>
                            <div>✅ Firebase Data Layer</div>
                            <div>✅ CouchDB-Compatible API</div>
                            <div>✅ Komposteur Backend</div>
                        </div>
                    </div>
                    
                    <div style="background: rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 6px; margin-bottom: 1.5rem;">
                        <h3 style="margin: 0 0 1rem 0; font-size: 1.2rem;">Firebase Authentication Shell</h3>
                        <div style="font-size: 0.85rem; line-height: 1.6;">
                            <div><strong>Auth Mode:</strong> ${flags.authMode || 'Not configured'}</div>
                            <div><strong>User:</strong> ${flags.userProfile?.displayName || 'Anonymous'} (${flags.userProfile?.email || 'No email'})</div>
                            <div><strong>Skip Elm Auth:</strong> ${flags.skipAuth ? 'Yes' : 'No'}</div>
                            <div><strong>API Token:</strong> ${flags.apiToken || 'Not provided'}</div>
                        </div>
                    </div>
                    
                    <div style="background: rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 6px; margin-bottom: 1.5rem;">
                        <h3 style="margin: 0 0 1rem 0; font-size: 1.2rem;">Backend Configuration</h3>
                        <div style="font-size: 0.85rem; line-height: 1.6;">
                            <div><strong>Kompo URL:</strong> ${flags.kompoUrl || 'Not configured'}</div>
                            <div><strong>Meta URL:</strong> ${flags.metaUrl || 'Not configured'}</div>
                            <div><strong>Komposteur:</strong> ${flags.integrationDestination || 'Not configured'}</div>
                        </div>
                    </div>
                    
                    <div style="background: rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 6px; margin-bottom: 1.5rem;">
                        <h3 style="margin: 0 0 1rem 0; font-size: 1.2rem;">Demo Actions</h3>
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            <button id="demo-save" style="background: #4CAF50; border: none; color: white; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Save Komposition</button>
                            <button id="demo-load" style="background: #2196F3; border: none; color: white; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Load Komposition</button>
                            <button id="demo-build" style="background: #FF9800; border: none; color: white; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Build Video</button>
                        </div>
                    </div>
                    
                    <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 4px; font-size: 0.8rem; line-height: 1.5;">
                        <strong>🔧 Authentication Shell Integration:</strong><br>
                        • Elm app runs inside Firebase authenticated React shell<br>
                        • No need for Elm's own Google Auth - Firebase handles all authentication<br>
                        • User context passed via flags/ports for backend queries<br>
                        • Real Elm editor will replace this demo when compiled<br><br>
                        <strong>📋 Future: User Context for Backend</strong><br>
                        • Pass user ID for komposition ownership queries<br>
                        • Track rendering tasks per user<br>
                        • CouchDB-compatible API with user context
                    </div>
                `;
                
                node.appendChild(elmContainer);
                
                // Mock ports for React communication
                var app = {
                    ports: {
                        saveKomposition: {
                            subscribe: function(callback) {
                                console.log('📤 Subscribed to saveKomposition port');
                                // Demo save action
                                document.getElementById('demo-save').onclick = function() {
                                    var demoKomposition = {
                                        id: 'demo_' + Date.now(),
                                        name: 'Demo Komposition',
                                        revision: '1.0',
                                        dvlType: 'music_video',
                                        bpm: 120,
                                        segments: [
                                            {
                                                id: 'seg1',
                                                sourceRef: 'demo_video.mp4',
                                                startTimeBeats: 0,
                                                endTimeBeats: 16
                                            }
                                        ],
                                        sources: [
                                            {
                                                id: 'demo_video.mp4',
                                                name: 'Demo Video',
                                                url: 'https://example.com/demo.mp4',
                                                type: 'video'
                                            }
                                        ],
                                        config: {
                                            width: 1920,
                                            height: 1080,
                                            fps: 25,
                                            format: 'mp4'
                                        }
                                    };
                                    console.log('💾 Demo: Saving komposition', demoKomposition);
                                    callback(demoKomposition);
                                };
                            }
                        },
                        loadKomposition: {
                            send: function(data) {
                                console.log('📥 Demo: Received komposition data', data);
                                // Demo load action
                                document.getElementById('demo-load').onclick = function() {
                                    console.log('📂 Demo: Loading komposition');
                                };
                            }
                        },
                        kompositionUpdated: {
                            subscribe: function(callback) {
                                console.log('📋 Subscribed to kompositionUpdated port');
                            }
                        },
                        firebaseTokenUpdated: {
                            send: function(token) {
                                console.log('🔐 Demo: Received Firebase token', token);
                            }
                        }
                    }
                };
                
                // Demo build video action
                setTimeout(function() {
                    if (document.getElementById('demo-build')) {
                        document.getElementById('demo-build').onclick = function() {
                            alert('🎬 Demo: Build Video\\n\\nThis would send the komposition to Komposteur backend for processing with:\\n- YouTube download integration\\n- FFMPEG video processing\\n- S3 storage for outputs\\n\\nIn the real Elm editor, this triggers the full video production pipeline.');
                        };
                    }
                }, 100);
                
                console.log('✅ Demo Elm app initialized with ports');
                return app;
            }
        }
    };
    
    // Make Elm available globally
    scope['Elm'] = Elm;
    
})(this);