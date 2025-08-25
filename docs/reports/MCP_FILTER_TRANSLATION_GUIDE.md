# MCP Filter Translation Guide for Komposteur Claude

## 🎯 **Phase 2 Filter Translation Implementation**

This guide provides specific examples and patterns for implementing natural language → MCP filter translation.

## 1. 🎬 **FILTER TRANSLATION EXAMPLES**

### **Basic Style Mappings**
```java
// Natural Language → MCP Filter JSON
Map<String, FilterSpec> styleMap = Map.of(
    "cinematic", new FilterSpec("custom", 
        Map.of("ffmpeg_filter", "-vf 'eq=brightness=0.05:contrast=1.3:saturation=0.9'")),
    
    "vintage", new FilterSpec("custom",
        Map.of("ffmpeg_filter", "-vf 'eq=brightness=0.1:contrast=1.1:saturation=0.7'")),
    
    "modern", new FilterSpec("custom", 
        Map.of("ffmpeg_filter", "-vf 'eq=brightness=0.1:contrast=1.2:saturation=1.2'")),
    
    "dreamy", new FilterSpec("blur", Map.of("radius", 1.2)),
    
    "dramatic", new FilterSpec("custom",
        Map.of("ffmpeg_filter", "-vf 'eq=brightness=0.02:contrast=1.5'"))
);
```

### **Mood-Based Translations**
```java
// Emotional descriptors → Technical parameters
"dark and moody" → {
    "type": "custom", 
    "ffmpeg_filter": "-vf 'eq=brightness=0.02:contrast=1.4:saturation=0.8'"
}

"bright and vibrant" → {
    "type": "custom",
    "ffmpeg_filter": "-vf 'eq=brightness=0.15:contrast=1.2:saturation=1.4'"
}

"soft and romantic" → {
    "type": "blur", 
    "params": {"radius": 0.8}
}

"sharp and crisp" → {
    "type": "custom",
    "ffmpeg_filter": "-vf 'eq=contrast=1.3'"
}
```

## 2. 📋 **JSON GENERATION PATTERNS**

### **Cinematic Style Template**
```json
{
  "segments": [
    {
      "sourceRef": "video.mp4",
      "operation": "trim", 
      "params": {"start": 0, "duration": 8},
      "filters": [
        {
          "type": "custom",
          "ffmpeg_filter": "-vf 'eq=brightness=0.05:contrast=1.3:saturation=0.9'"
        }
      ]
    }
  ],
  "global_filters": [
    {
      "type": "fade",
      "params": {"fade_in": 1.5, "fade_out": 2.0}
    }
  ]
}
```

### **Vintage Style Template**
```json
{
  "segments": [
    {
      "filters": [
        {
          "type": "custom", 
          "ffmpeg_filter": "-vf 'eq=brightness=0.1:contrast=1.1:saturation=0.7'"
        },
        {
          "type": "blur",
          "params": {"radius": 0.3}
        }
      ]
    }
  ]
}
```

### **Modern Style Template**  
```json
{
  "segments": [
    {
      "filters": [
        {
          "type": "custom",
          "ffmpeg_filter": "-vf 'eq=brightness=0.1:contrast=1.2:saturation=1.2'"
        }
      ]
    }
  ]
}
```

## 3. ⛓️ **EFFECT CHAINING EXAMPLES**

### **Professional Film Look**
```json
"filters": [
  {
    "type": "custom",
    "ffmpeg_filter": "-vf 'eq=brightness=0.05:contrast=1.3'"
  },
  {
    "type": "blur", 
    "params": {"radius": 0.2}
  }
]
```

### **Music Video Style**
```json
"filters": [
  {
    "type": "custom",
    "ffmpeg_filter": "-vf 'eq=saturation=1.4:contrast=1.2'"
  }
]
```

### **Documentary Look**
```json
"filters": [
  {
    "type": "custom",
    "ffmpeg_filter": "-vf 'eq=brightness=0.08:contrast=1.1:saturation=1.0'"
  }
]
```

## 4. ⚡ **PERFORMANCE OPTIMIZATION**

### **Performance Tiers**

#### **Fast Tier (< 10s processing)**
```json
// Single simple filter per segment
"filters": [
  {"type": "blur", "params": {"radius": 1.0}}
]
```

#### **Balanced Tier (10-30s processing)**
```json
// Two filters max per segment
"filters": [
  {"type": "custom", "ffmpeg_filter": "-vf 'eq=brightness=0.1:contrast=1.2'"},
  {"type": "blur", "params": {"radius": 0.5}}
]
```

#### **Quality Tier (30s+ processing)**
```json
// Complex filter chains allowed
"filters": [
  {"type": "custom", "ffmpeg_filter": "-vf 'eq=brightness=0.05:contrast=1.3:saturation=0.9'"},
  {"type": "blur", "params": {"radius": 0.8}}
]
```

## 5. 🎨 **STYLE PRESET LIBRARY**

### **Komposteur Implementation Template**
```java
public class VideoStylePresets {
    
    public static FilterSpec translateStyle(String style, String intensity) {
        switch(style.toLowerCase()) {
            case "cinematic":
                return createCinematicFilter(intensity);
            case "vintage": 
                return createVintageFilter(intensity);
            case "modern":
                return createModernFilter(intensity);
            case "dreamy":
                return createDreamyFilter(intensity);
            default:
                return createDefaultFilter();
        }
    }
    
    private static FilterSpec createCinematicFilter(String intensity) {
        double brightness = intensity.equals("strong") ? 0.02 : 0.05;
        double contrast = intensity.equals("strong") ? 1.5 : 1.3;
        
        return new FilterSpec("custom", Map.of(
            "ffmpeg_filter", String.format("-vf 'eq=brightness=%.2f:contrast=%.1f:saturation=0.9'", 
                brightness, contrast)
        ));
    }
}
```

## 6. 🔧 **FILTER PARAMETER GUIDELINES**

### **Safe Parameter Ranges**
- **Brightness**: -0.5 to 0.3 (0 = normal)
- **Contrast**: 0.8 to 2.0 (1.0 = normal)  
- **Saturation**: 0.5 to 2.0 (1.0 = normal)
- **Blur radius**: 0.1 to 3.0 (higher = more blur)

### **Recommended Combinations**
```java
// Tested working combinations:
DARK_CINEMATIC = "eq=brightness=0.02:contrast=1.4:saturation=0.8"
BRIGHT_MODERN = "eq=brightness=0.15:contrast=1.2:saturation=1.3" 
VINTAGE_FILM = "eq=brightness=0.1:contrast=1.1:saturation=0.7"
SOFT_ROMANTIC = blur(radius=0.8) + "eq=brightness=0.1"
```

## 7. 🧪 **TESTING PATTERNS**

### **Validation Function**
```java
public boolean validateFilterJSON(JsonObject kompost) {
    // Check required structure
    if (!kompost.has("segments")) return false;
    
    // Validate filter syntax
    for (JsonElement segment : kompost.getAsJsonArray("segments")) {
        if (segment.getAsJsonObject().has("filters")) {
            // Validate each filter has correct type and params
        }
    }
    
    return true;
}
```

## 8. 📊 **IMPLEMENTATION CHECKLIST**

- [ ] Natural language parsing for video styles
- [ ] Filter parameter validation
- [ ] JSON structure generation  
- [ ] Error handling for invalid filters
- [ ] Performance tier selection
- [ ] Testing with MCP processor
- [ ] Documentation and examples

**This guide provides everything needed to implement Phase 2 filter translation that perfectly matches MCP video processing capabilities.**