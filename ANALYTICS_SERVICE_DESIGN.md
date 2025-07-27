# Analytics Service Design Document

**Purpose**: Design specification for the planned analytics service to track FFMPEG operations and enable usage pattern analysis.

**Status**: FUTURE IMPLEMENTATION - Service removed from current CI build due to missing implementation

**Date**: July 27, 2025

## 🎯 **Original Intent & Vision**

### **Primary Objectives**
1. **Operation Tracking**: Capture all FFMPEG operations performed via the MCP server
2. **Usage Pattern Analysis**: Identify most frequently used commands and workflows
3. **Performance Monitoring**: Track processing times and success rates 
4. **Template Generation**: Auto-generate workflow templates from popular operation sequences
5. **Firebase Integration**: Send analytics data to Firebase for web dashboard visualization

### **Business Value**
- **Workflow Optimization**: Understand which operations are most valuable to users
- **Performance Insights**: Identify slow operations that need optimization
- **Template Creation**: Reduce token usage by providing pre-built workflows for common tasks
- **Product Development**: Data-driven feature prioritization based on actual usage

## 📊 **Planned Data Schema**

### **Core Event Structure**
```typescript
interface FFMPEGOperationEvent {
  // Event identification
  id: string;                    // Unique event ID
  timestamp: FirebaseTimestamp;  // When operation occurred
  
  // User context
  userId: string;               // Hashed user identifier (privacy-preserving)
  platform: "mcp" | "komposteur" | "webapp";  // Source platform
  
  // Operation details
  operation: {
    type: string;               // "trim", "resize", "to_mp3", etc.
    inputFormat: string;        // "mp4", "wav", etc.
    outputFormat: string;       // Target format
    parameters: string;         // JSON stringified parameters
    fileSize: number;          // Input file size in bytes
  };
  
  // Performance metrics
  metrics: {
    success: boolean;          // Operation completed successfully
    processingTime: number;    // Duration in milliseconds
    errorMessage?: string;     // Error details if failed
    memoryUsage?: number;      // Peak memory during operation
  };
  
  // Workflow context
  context: {
    workflowType?: string;     // "music_video", "podcast", "social_media"
    sequencePosition?: number; // Position in multi-step workflow
    batchSize?: number;        // Number of operations in batch
    sessionId?: string;        // Group related operations
  };
}
```

### **Aggregated Analytics**
```typescript
interface OperationSequencePattern {
  pattern: string;              // "trim->resize->to_mp3"
  operations: string[];         // ["trim", "resize", "to_mp3"] 
  frequency: number;            // How often this sequence occurs
  avgDuration: number;          // Average total processing time
  successRate: number;          // Percentage of successful completions
  userCount: number;            // Number of unique users using pattern
  templateCandidate: boolean;   // Eligible for auto-template generation
}

interface UsageStatistics {
  totalOperations: number;
  uniqueUsers: number;
  avgProcessingTime: number;
  topOperations: Array<{operation: string, count: number}>;
  topWorkflows: OperationSequencePattern[];
  errorAnalysis: Array<{error: string, frequency: number}>;
}
```

## 🏗️ **Technical Implementation Plan**

### **1. Analytics Service Module** (`src/analytics_service.py`)
```python
class AnalyticsService:
    """Handles FFMPEG operation tracking and Firebase reporting"""
    
    async def track_ffmpeg_operation(
        self,
        user_id: str,
        operation_type: str,
        parameters: Dict[str, Any],
        processing_time: int,
        success: bool,
        input_format: str,
        output_format: str,
        file_size: int,
        error_message: Optional[str] = None,
        workflow_context: Optional[Dict[str, Any]] = None
    ) -> None:
        """Track individual FFMPEG operation execution"""
        
    async def identify_operation_sequence(
        self,
        user_id: str,
        operations: List[str],
        timeframe_minutes: int = 10
    ) -> Optional[str]:
        """Identify and track operation sequences/workflows"""
        
    async def generate_usage_report(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> UsageStatistics:
        """Generate comprehensive usage analytics"""
        
    async def get_template_candidates(
        self,
        min_frequency: int = 5,
        min_success_rate: float = 0.8
    ) -> List[OperationSequencePattern]:
        """Identify workflows suitable for template generation"""
```

### **2. Integration Points**

#### **Core MCP Operations** (`src/video_operations.py`)
```python
async def execute_ffmpeg_operation(...):
    start_time = time.time()
    
    try:
        # Execute FFMPEG command
        result = await ffmpeg.execute_command(...)
        
        # Track successful operation
        await analytics_service.track_ffmpeg_operation(
            user_id=get_current_user_id(),
            operation_type=operation,
            parameters=parameters,
            processing_time=int((time.time() - start_time) * 1000),
            success=True,
            input_format=input_format,
            output_format=output_format,
            file_size=file_size
        )
        
    except Exception as e:
        # Track failed operation
        await analytics_service.track_ffmpeg_operation(
            user_id=get_current_user_id(),
            operation_type=operation,
            parameters=parameters, 
            processing_time=int((time.time() - start_time) * 1000),
            success=False,
            error_message=str(e)
        )
```

#### **Batch Processing Tracking** 
```python
async def batch_process(operations: List[Dict]) -> List[ProcessResult]:
    session_id = generate_session_id()
    
    for i, operation in enumerate(operations):
        # Track with sequence context
        await analytics_service.track_ffmpeg_operation(
            ...,
            workflow_context={
                "sessionId": session_id,
                "sequencePosition": i,
                "batchSize": len(operations),
                "workflowType": "batch_processing"
            }
        )
```

### **3. Firebase Integration**

#### **Cloud Function Endpoint**
```javascript
// Firebase Cloud Function
exports.logOperation = functions.https.onRequest(async (req, res) => {
  const operationData = req.body;
  
  // Validate schema
  if (!validateOperationEvent(operationData)) {
    return res.status(400).send('Invalid event schema');
  }
  
  // Store in Firestore
  await admin.firestore()
    .collection('ffmpeg_operations')
    .add({
      ...operationData,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
  res.status(200).send('Event logged successfully');
});
```

#### **Analytics Dashboard Queries**
```javascript
// Most popular operations
const popularOps = await db.collection('ffmpeg_operations')
  .where('metrics.success', '==', true)
  .orderBy('timestamp', 'desc')
  .limit(1000)
  .get();

// Workflow pattern detection
const sequences = await db.collection('operation_sequences')
  .where('frequency', '>=', 5)
  .orderBy('frequency', 'desc')
  .get();
```

## 🚀 **Implementation Phases**

### **Phase 1: Basic Tracking** (Week 1)
- [ ] Create `AnalyticsService` class with core tracking
- [ ] Integrate with `video_operations.py` for automatic tracking
- [ ] Add environment configuration (`ANALYTICS_ENABLED`, `FIREBASE_ENDPOINT`)
- [ ] Implement privacy-preserving user ID hashing
- [ ] Basic HTTP client for Firebase communication

### **Phase 2: Workflow Detection** (Week 2)
- [ ] Implement sequence detection algorithms
- [ ] Add session tracking for batch operations
- [ ] Create workflow type classification
- [ ] Add comprehensive error tracking and categorization

### **Phase 3: Firebase Integration** (Week 3)
- [ ] Deploy Firebase Cloud Function for data ingestion
- [ ] Set up Firestore collections with proper indexes
- [ ] Implement batch data upload for reliability
- [ ] Add data retention and privacy controls

### **Phase 4: Analytics & Templates** (Week 4)
- [ ] Build analytics dashboard in Firebase webapp
- [ ] Implement template candidate identification
- [ ] Create automated template generation from patterns
- [ ] Add usage reporting and insights

## 🔒 **Privacy & Security Considerations**

### **Data Privacy**
- **User ID Hashing**: All user identifiers hashed using SHA-256 + salt
- **Parameter Sanitization**: Remove potentially sensitive file names/paths
- **Retention Policy**: Analytics data automatically deleted after 1 year
- **Opt-out Support**: `ANALYTICS_ENABLED=false` completely disables tracking

### **Security Measures**
- **Rate Limiting**: Prevent analytics endpoint abuse
- **Schema Validation**: Strict validation of incoming analytics events
- **Error Handling**: Graceful degradation when analytics service fails
- **Non-blocking**: Analytics never interfere with core video processing

## 📈 **Expected Outcomes**

### **Usage Insights**
- Identify that 80% of users perform "trim->resize->to_mp3" for social media
- Discover that "leica_look" effect is most popular visual enhancement
- Find that batch processing is used primarily for podcast production workflows

### **Performance Optimization**
- Identify slow operations that need FFMPEG parameter tuning
- Discover memory-intensive operations that need resource management
- Find error patterns that indicate need for better input validation

### **Product Development**
- Auto-generate "Create Social Media Clip" template from popular sequence
- Prioritize features based on actual usage data
- Improve error messages based on common failure patterns

## 🚫 **Current Status: Removed from CI**

The analytics service was **removed from the current CI build** because:

1. **Missing Implementation**: The `analytics_service.py` file was never created
2. **Broken Imports**: `src/ffmpeg_wrapper.py` and `src/video_operations.py` import non-existent service
3. **CI Failures**: Tests fail due to `ImportError: attempted relative import with no known parent package`

### **Immediate Action Taken**
- Analytics imports removed from core modules to fix CI build
- Service marked as **FUTURE IMPLEMENTATION**
- Design document created to preserve intentions and specifications

### **Re-implementation Path**
When ready to implement analytics:
1. Use this design document as the specification
2. Create `src/analytics_service.py` following the planned interface
3. Re-add integration points in `video_operations.py` and `ffmpeg_wrapper.py`
4. Set up Firebase Cloud Function endpoint
5. Add comprehensive test coverage

## 💡 **Alternative Approaches**

### **Local Analytics** (Simpler Implementation)
- Store analytics data in local SQLite database
- Provide local web dashboard for insights
- Export data as JSON for external analysis
- Avoid Firebase dependency and privacy concerns

### **Metrics-Only Approach** (Minimal Implementation)
- Track only basic metrics (operation counts, timing, errors)
- Log to structured files for analysis
- Use existing log analysis tools instead of custom dashboard
- Focus on performance monitoring rather than usage patterns

---

**Note**: This document preserves the original vision for the analytics service while acknowledging its current unimplemented status. The design can be revisited when resources are available for full implementation.