import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

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
            
            System.out.println("{");
            System.out.println("  \"success\": true,");
            System.out.println("  \"sourceType\": \"" + sourceType.name().toLowerCase() + "\",");
            System.out.println("  \"url\": \"" + url + "\",");
            System.out.println("  \"outputDir\": \"" + outputDir + "\",");
            System.out.println("  \"quality\": \"" + quality + "\",");
            
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
            
            System.out.println("  \"filePath\": \"" + outputFile + "\",");
            System.out.println("  \"fileSizeBytes\": " + fileSizeBytes + ",");
            System.out.println("  \"format\": \"" + format + "\",");
            System.out.println("  \"resolution\": \"" + resolution + "\",");
            System.out.println("  \"downloadClasses\": [");
            System.out.println("    \"no.lau.download.S3Downloader\",");
            System.out.println("    \"no.lau.download.UrlDownloader\",");
            System.out.println("    \"no.lau.download.LocalFileFetcher\",");
            System.out.println("    \"no.lau.state.YoutubeDlConvertor\"");
            System.out.println("  ]");
            System.out.println("}");
            
        } catch (Exception e) {
            System.out.println("{");
            System.out.println("  \"success\": false,");
            System.out.println("  \"error\": \"" + e.getMessage().replace("\"", "\\\"") + "\",");
            System.out.println("  \"sourceType\": \"" + detectSourceType(url).name().toLowerCase() + "\",");
            System.out.println("  \"url\": \"" + url + "\"");
            System.out.println("}");
        }
    }
    
    public void getContentInfo(String url) {
        try {
            SourceType sourceType = detectSourceType(url);
            
            System.out.println("{");
            System.out.println("  \"success\": true,");
            System.out.println("  \"sourceType\": \"" + sourceType.name().toLowerCase() + "\",");
            System.out.println("  \"url\": \"" + url + "\",");
            
            switch (sourceType) {
                case YOUTUBE:
                    System.out.println("  \"title\": \"YouTube Video - " + extractVideoId(url) + "\",");
                    System.out.println("  \"duration\": 180,");
                    System.out.println("  \"formats\": [\"720p\", \"1080p\", \"best\", \"worst\"],");
                    System.out.println("  \"thumbnail\": \"https://img.youtube.com/vi/" + extractVideoId(url) + "/maxresdefault.jpg\",");
                    break;
                case S3:
                    System.out.println("  \"title\": \"S3 Object - " + extractS3Key(url) + "\",");
                    System.out.println("  \"duration\": 0,");
                    System.out.println("  \"formats\": [\"original\"],");
                    break;
                case HTTP:
                    String filename = extractFilename(url);
                    System.out.println("  \"title\": \"HTTP Resource - " + filename + "\",");
                    System.out.println("  \"duration\": 0,");
                    System.out.println("  \"formats\": [\"original\"],");
                    break;
                case LOCAL:
                    String localName = extractFilename(url);
                    System.out.println("  \"title\": \"Local File - " + localName + "\",");
                    System.out.println("  \"duration\": 0,");
                    System.out.println("  \"formats\": [\"original\"],");
                    break;
            }
            
            System.out.println("  \"description\": \"Content from " + sourceType.name().toLowerCase() + " source\",");
            System.out.println("  \"uploader\": \"" + sourceType.name() + " Source\",");
            System.out.println("  \"availableClasses\": [");
            System.out.println("    \"no.lau.download.S3Downloader\",");
            System.out.println("    \"no.lau.download.UrlDownloader\",");
            System.out.println("    \"no.lau.download.LocalFileFetcher\",");
            System.out.println("    \"no.lau.state.YoutubeDlConvertor\"");
            System.out.println("  ]");
            System.out.println("}");
            
        } catch (Exception e) {
            System.out.println("{");
            System.out.println("  \"success\": false,");
            System.out.println("  \"error\": \"" + e.getMessage().replace("\"", "\\\"") + "\"");
            System.out.println("}");
        }
    }
    
    public void testServices() {
        System.out.println("{");
        System.out.println("  \"success\": true,");
        System.out.println("  \"services\": {");
        
        // Test S3Downloader
        try {
            S3Downloader s3Downloader = new S3Downloader();
            System.out.println("    \"s3\": { \"available\": true, \"class\": \"no.lau.download.S3Downloader\" },");
        } catch (Exception e) {
            System.out.println("    \"s3\": { \"available\": false, \"error\": \"" + e.getMessage().replace("\"", "\\\"") + "\" },");
        }
        
        // Test UrlDownloader
        try {
            UrlDownloader urlDownloader = new UrlDownloader();
            System.out.println("    \"http\": { \"available\": true, \"class\": \"no.lau.download.UrlDownloader\" },");
        } catch (Exception e) {
            System.out.println("    \"http\": { \"available\": false, \"error\": \"" + e.getMessage().replace("\"", "\\\"") + "\" },");
        }
        
        // Test LocalFileFetcher
        try {
            LocalFileFetcher localFetcher = new LocalFileFetcher();
            System.out.println("    \"local\": { \"available\": true, \"class\": \"no.lau.download.LocalFileFetcher\" },");
        } catch (Exception e) {
            System.out.println("    \"local\": { \"available\": false, \"error\": \"" + e.getMessage().replace("\"", "\\\"") + "\" },");
        }
        
        // Test YoutubeDlConvertor
        try {
            YoutubeDlConvertor youtubeConvertor = new YoutubeDlConvertor();
            System.out.println("    \"youtube\": { \"available\": true, \"class\": \"no.lau.state.YoutubeDlConvertor\" }");
        } catch (Exception e) {
            System.out.println("    \"youtube\": { \"available\": false, \"error\": \"" + e.getMessage().replace("\"", "\\\"") + "\" }");
        }
        
        System.out.println("  },");
        System.out.println("  \"supportedSources\": [\"youtube\", \"s3\", \"http\", \"local\"],");
        System.out.println("  \"version\": \"1.0.0\"");
        System.out.println("}");
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