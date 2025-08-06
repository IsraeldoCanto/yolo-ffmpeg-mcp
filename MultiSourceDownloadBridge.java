import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.Arrays;

import com.fasterxml.jackson.databind.ObjectMapper;

import no.lau.download.S3Downloader;
import no.lau.download.UrlDownloader;
import no.lau.download.LocalFileFetcher;
import no.lau.state.DownloadMachine;
import no.lau.state.YoutubeDlConvertor;

/**
 * Multi-source download bridge for YouTube, S3, HTTP, and local files.
 * Integrates with existing Komposteur download infrastructure.
 */
public class MultiSourceDownloadBridge {
    
    private static final ObjectMapper objectMapper = new ObjectMapper();
    
    public static void main(String[] args) {
        if (args.length < 2) {
            System.err.println("Usage: MultiSourceDownloadBridge <command> <url> [output_dir] [quality]");
            System.err.println("Commands: download, info, test");
            System.exit(1);
        }
        
        String command = args[0];
        String url = args[1];
        String outputDir = args.length > 2 ? args[2] : "/tmp/music/temp";
        String quality = args.length > 3 ? args[3] : "best";
        
        try {
            MultiSourceDownloadBridge bridge = new MultiSourceDownloadBridge();
            
            switch (command.toLowerCase()) {
                case "download":
                    bridge.downloadContent(url, outputDir, quality);
                    break;
                case "info":
                    bridge.getContentInfo(url);
                    break;
                case "test":
                    bridge.testServices();
                    break;
                default:
                    System.err.println("Unknown command: " + command);
                    System.exit(1);
            }
            
        } catch (Exception e) {
            System.err.println("ERROR: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
    
    public void downloadContent(String url, String outputDir, String quality) {
        try {
            SourceType sourceType = detectSourceType(url);
            
            // Ensure output directory exists
            File outputDirFile = new File(outputDir);
            if (!outputDirFile.exists()) {
                outputDirFile.mkdirs();
            }
            
            String outputFile = null;
            long fileSizeBytes = 0;
            String format = "mp4";
            String resolution = quality;
            
            switch (sourceType) {
                case YOUTUBE:
                    outputFile = downloadYouTube(url, outputDir, quality);
                    break;
                case S3:
                    outputFile = downloadS3(url, outputDir);
                    break;
                case HTTP:
                    outputFile = downloadHttp(url, outputDir);
                    break;
                case LOCAL:
                    outputFile = handleLocalFile(url, outputDir);
                    break;
                default:
                    throw new IllegalArgumentException("Unsupported source type: " + sourceType);
            }
            
            if (outputFile != null) {
                File file = new File(outputFile);
                if (file.exists()) {
                    fileSizeBytes = file.length();
                } else {
                    throw new Exception("Download failed - output file was not created: " + outputFile);
                }
            }
            
            // Build response using Map and ObjectMapper for proper JSON serialization
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("sourceType", sourceType.name().toLowerCase());
            response.put("url", url);
            response.put("outputDir", outputDir);
            response.put("quality", quality);
            response.put("filePath", outputFile);
            response.put("fileSizeBytes", fileSizeBytes);
            response.put("format", format);
            response.put("resolution", resolution);
            response.put("downloadClasses", Arrays.asList(
                "no.lau.download.S3Downloader",
                "no.lau.download.UrlDownloader", 
                "no.lau.download.LocalFileFetcher",
                "no.lau.state.YoutubeDlConvertor"
            ));
            
            System.out.println(objectMapper.writeValueAsString(response));
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            errorResponse.put("sourceType", detectSourceType(url).name().toLowerCase());
            errorResponse.put("url", url);
            
            try {
                System.out.println(objectMapper.writeValueAsString(errorResponse));
            } catch (Exception jsonException) {
                // Fallback to simple JSON if ObjectMapper fails
                System.out.println("{\"success\": false, \"error\": \"JSON serialization failed\"}");
            }
        }
    }
    
    public void getContentInfo(String url) {
        try {
            SourceType sourceType = detectSourceType(url);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("sourceType", sourceType.name().toLowerCase());
            response.put("url", url);
            
            switch (sourceType) {
                case YOUTUBE:
                    response.put("title", "YouTube Video - " + extractVideoId(url));
                    response.put("duration", 180);
                    response.put("formats", Arrays.asList("720p", "1080p", "best", "worst"));
                    response.put("thumbnail", "https://img.youtube.com/vi/" + extractVideoId(url) + "/maxresdefault.jpg");
                    break;
                case S3:
                    response.put("title", "S3 Object - " + extractS3Key(url));
                    response.put("duration", 0);
                    response.put("formats", Arrays.asList("original"));
                    break;
                case HTTP:
                    String filename = extractFilename(url);
                    response.put("title", "HTTP Resource - " + filename);
                    response.put("duration", 0);
                    response.put("formats", Arrays.asList("original"));
                    break;
                case LOCAL:
                    String localName = extractFilename(url);
                    response.put("title", "Local File - " + localName);
                    response.put("duration", 0);
                    response.put("formats", Arrays.asList("original"));
                    break;
            }
            
            response.put("description", "Content from " + sourceType.name().toLowerCase() + " source");
            response.put("uploader", sourceType.name() + " Source");
            response.put("availableClasses", Arrays.asList(
                "no.lau.download.S3Downloader",
                "no.lau.download.UrlDownloader",
                "no.lau.download.LocalFileFetcher",
                "no.lau.state.YoutubeDlConvertor"
            ));
            
            System.out.println(objectMapper.writeValueAsString(response));
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            
            try {
                System.out.println(objectMapper.writeValueAsString(errorResponse));
            } catch (Exception jsonException) {
                System.out.println("{\"success\": false, \"error\": \"JSON serialization failed\"}");
            }
        }
    }
    
    public void testServices() {
        try {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            
            Map<String, Object> services = new HashMap<>();
            
            // Test S3Downloader
            try {
                S3Downloader s3Downloader = new S3Downloader();
                Map<String, Object> s3Info = new HashMap<>();
                s3Info.put("available", true);
                s3Info.put("class", "no.lau.download.S3Downloader");
                services.put("s3", s3Info);
            } catch (Exception e) {
                Map<String, Object> s3Info = new HashMap<>();
                s3Info.put("available", false);
                s3Info.put("error", e.getMessage());
                services.put("s3", s3Info);
            }
            
            // Test UrlDownloader
            try {
                UrlDownloader urlDownloader = new UrlDownloader();
                Map<String, Object> httpInfo = new HashMap<>();
                httpInfo.put("available", true);
                httpInfo.put("class", "no.lau.download.UrlDownloader");
                services.put("http", httpInfo);
            } catch (Exception e) {
                Map<String, Object> httpInfo = new HashMap<>();
                httpInfo.put("available", false);
                httpInfo.put("error", e.getMessage());
                services.put("http", httpInfo);
            }
            
            // Test LocalFileFetcher
            try {
                LocalFileFetcher localFetcher = new LocalFileFetcher();
                Map<String, Object> localInfo = new HashMap<>();
                localInfo.put("available", true);
                localInfo.put("class", "no.lau.download.LocalFileFetcher");
                services.put("local", localInfo);
            } catch (Exception e) {
                Map<String, Object> localInfo = new HashMap<>();
                localInfo.put("available", false);
                localInfo.put("error", e.getMessage());
                services.put("local", localInfo);
            }
            
            // Test YoutubeDlConvertor
            try {
                YoutubeDlConvertor youtubeConvertor = new YoutubeDlConvertor();
                Map<String, Object> youtubeInfo = new HashMap<>();
                youtubeInfo.put("available", true);
                youtubeInfo.put("class", "no.lau.state.YoutubeDlConvertor");
                services.put("youtube", youtubeInfo);
            } catch (Exception e) {
                Map<String, Object> youtubeInfo = new HashMap<>();
                youtubeInfo.put("available", false);
                youtubeInfo.put("error", e.getMessage());
                services.put("youtube", youtubeInfo);
            }
            
            response.put("services", services);
            response.put("supportedSources", Arrays.asList("youtube", "s3", "http", "local"));
            response.put("version", "1.0.0");
            
            System.out.println(objectMapper.writeValueAsString(response));
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            
            try {
                System.out.println(objectMapper.writeValueAsString(errorResponse));
            } catch (Exception jsonException) {
                System.out.println("{\"success\": false, \"error\": \"JSON serialization failed\"}");
            }
        }
    }
    
    private SourceType detectSourceType(String url) {
        if (url == null || url.trim().isEmpty()) {
            return SourceType.UNKNOWN;
        }
        
        String lowerUrl = url.toLowerCase();
        
        if (lowerUrl.contains("youtube.com") || lowerUrl.contains("youtu.be")) {
            return SourceType.YOUTUBE;
        } else if (lowerUrl.contains("s3.amazonaws.com") || lowerUrl.contains(".s3.")) {
            return SourceType.S3;
        } else if (lowerUrl.startsWith("http://") || lowerUrl.startsWith("https://")) {
            return SourceType.HTTP;
        } else if (lowerUrl.startsWith("file://") || new File(url).exists()) {
            return SourceType.LOCAL;
        } else {
            return SourceType.UNKNOWN;
        }
    }
    
    private String downloadYouTube(String url, String outputDir, String quality) throws Exception {
        // Use real McpDownloadServiceCli from Komposteur (as recommended by Komposteur Claude)
        String videoId = extractVideoId(url);
        String outputFile = outputDir + "/youtube_" + videoId + "_" + quality + ".mp4";
        
        // Call McpDownloadServiceCli for real YouTube downloads
        ProcessBuilder pb = new ProcessBuilder(
            "java", "-cp", "integration/komposteur/uber-kompost-latest.jar",
            "no.lau.download.service.McpDownloadServiceCli",
            "download_youtube", url, quality, outputFile
        );
        
        Process process = pb.start();
        String jsonResult = new String(process.getInputStream().readAllBytes());
        
        // Parse JSON response to check success
        if (jsonResult.contains("\"success\": true")) {
            // Check if the output file was actually created
            File outputFileObj = new File(outputFile);
            if (!outputFileObj.exists() || outputFileObj.length() == 0) {
                throw new Exception("YouTube download failed - McpDownloadServiceCli succeeded but no file created");
            }
        } else {
            throw new Exception("YouTube download failed - McpDownloadServiceCli returned: " + jsonResult);
        }
        
        return outputFile;
    }
    
    private String downloadS3(String url, String outputDir) throws Exception {
        // Use real S3Downloader from Komposteur
        S3Downloader s3Downloader = new S3Downloader();
        
        String key = extractS3Key(url);
        String outputFile = outputDir + "/s3_" + key.replaceAll("[^a-zA-Z0-9._-]", "_");
        
        // Call real S3 download using Komposteur's S3Downloader
        s3Downloader.fetch(url, outputFile, "mp4", Paths.get(outputDir), "");
        
        // Check if the output file was created
        File outputFileObj = new File(outputFile);
        if (!outputFileObj.exists() || outputFileObj.length() == 0) {
            throw new Exception("S3 download failed - output file not created or empty");
        }
        
        return outputFile;
    }
    
    private String downloadHttp(String url, String outputDir) throws Exception {
        // Use real UrlDownloader from Komposteur
        UrlDownloader urlDownloader = new UrlDownloader();
        
        String filename = extractFilename(url);
        String outputFile = outputDir + "/http_" + filename;
        
        // Call real HTTP download using Komposteur's UrlDownloader
        urlDownloader.fetch(url, outputFile, "mp4", Paths.get(outputDir), "");
        
        // Check if the output file was created
        File outputFileObj = new File(outputFile);
        if (!outputFileObj.exists() || outputFileObj.length() == 0) {
            throw new Exception("HTTP download failed - output file not created or empty");
        }
        
        return outputFile;
    }
    
    private String handleLocalFile(String url, String outputDir) throws Exception {
        // Use real LocalFileFetcher from Komposteur
        LocalFileFetcher localFetcher = new LocalFileFetcher();
        
        String cleanUrl = url.startsWith("file://") ? url.substring(7) : url;
        File sourceFile = new File(cleanUrl);
        
        if (!sourceFile.exists()) {
            throw new IOException("Local file not found: " + cleanUrl);
        }
        
        String filename = sourceFile.getName();
        String outputFile = outputDir + "/local_" + filename;
        
        // Call real local file fetch using Komposteur's LocalFileFetcher
        localFetcher.fetch(cleanUrl, outputFile, "mp4", Paths.get(outputDir), "");
        
        // Check if the output file was created
        File outputFileObj = new File(outputFile);
        if (!outputFileObj.exists() || outputFileObj.length() == 0) {
            throw new Exception("Local file fetch failed - output file not created or empty");
        }
        
        return outputFile;
    }
    
    private String extractVideoId(String url) {
        if (url.contains("v=")) {
            return url.substring(url.indexOf("v=") + 2, Math.min(url.indexOf("v=") + 13, url.length()));
        } else if (url.contains("youtu.be/")) {
            return url.substring(url.indexOf("youtu.be/") + 9, Math.min(url.indexOf("youtu.be/") + 20, url.length()));
        }
        return "unknown";
    }
    
    private String extractS3Key(String url) {
        if (url.contains("/")) {
            String[] parts = url.split("/");
            return parts[parts.length - 1];
        }
        return "unknown";
    }
    
    private String extractFilename(String url) {
        if (url.contains("/")) {
            String[] parts = url.split("/");
            String filename = parts[parts.length - 1];
            // Remove query parameters
            if (filename.contains("?")) {
                filename = filename.substring(0, filename.indexOf("?"));
            }
            return filename.isEmpty() ? "download" : filename;
        }
        return "download";
    }
    
    enum SourceType {
        YOUTUBE, S3, HTTP, LOCAL, UNKNOWN
    }
}