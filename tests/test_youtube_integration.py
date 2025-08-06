"""
Integration Tests for YouTube Direct Upload Functionality

Tests YouTube API authentication, video upload, and validation features
with real YouTube API endpoints (using private visibility for testing).
"""

import asyncio
import os
import pytest
import tempfile
from pathlib import Path
from unittest.mock import patch, MagicMock

# Skip all tests if Google API libraries not available
try:
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    GOOGLE_APIS_AVAILABLE = True
except ImportError:
    GOOGLE_APIS_AVAILABLE = False

from src.youtube_upload_service import YouTubeUploadService, upload_to_youtube, validate_youtube_shorts


class TestYouTubeUploadService:
    """Test YouTube upload service functionality"""
    
    @pytest.fixture
    def mock_credentials_file(self):
        """Create temporary credentials file for testing"""
        credentials_data = {
            "installed": {
                "client_id": "test_client_id",
                "project_id": "test_project", 
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "client_secret": "test_client_secret",
                "redirect_uris": ["urn:ietf:wg:oauth:2.0:oob", "http://localhost"]
            }
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            import json
            json.dump(credentials_data, f)
            return f.name
    
    @pytest.fixture
    def test_video_file(self):
        """Create a small test MP4 file"""
        # Create a minimal MP4 file for testing
        test_file = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False)
        # Write minimal MP4 header (this won't be a valid video but sufficient for path testing)
        test_file.write(b'\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isom')
        test_file.close()
        return test_file.name
    
    @pytest.mark.skipif(not GOOGLE_APIS_AVAILABLE, reason="Google API libraries not available")
    def test_service_initialization(self, mock_credentials_file):
        """Test service can be initialized with credentials"""
        service = YouTubeUploadService(credentials_file=mock_credentials_file)
        assert service.credentials_file == mock_credentials_file
        assert service.token_file == 'token.json'  # Default value
    
    @pytest.mark.skipif(not GOOGLE_APIS_AVAILABLE, reason="Google API libraries not available")
    @patch('src.youtube_upload_service.InstalledAppFlow')
    @patch('src.youtube_upload_service.build')
    async def test_authentication_flow(self, mock_build, mock_flow, mock_credentials_file):
        """Test OAuth2 authentication flow"""
        # Mock the OAuth flow
        mock_creds = MagicMock()
        mock_creds.valid = True
        mock_creds.to_json.return_value = '{"token": "test_token"}'
        
        mock_flow_instance = MagicMock()
        mock_flow_instance.run_local_server.return_value = mock_creds
        mock_flow.from_client_secrets_file.return_value = mock_flow_instance
        
        mock_build.return_value = MagicMock()
        
        service = YouTubeUploadService(credentials_file=mock_credentials_file)
        result = await service.authenticate()
        
        assert result is True
        assert service.service is not None
        mock_flow.from_client_secrets_file.assert_called_once()
    
    @pytest.mark.skipif(not GOOGLE_APIS_AVAILABLE, reason="Google API libraries not available")
    async def test_validate_shorts_video_file_not_found(self):
        """Test validation with non-existent file"""
        service = YouTubeUploadService()
        result = await service.validate_shorts_video("/nonexistent/file.mp4")
        
        assert result["valid"] is False
        assert "File not found" in result["error"]
    
    @pytest.mark.skipif(not GOOGLE_APIS_AVAILABLE, reason="Google API libraries not available")
    async def test_validate_shorts_video_basic_checks(self, test_video_file):
        """Test basic validation without detailed analysis"""
        service = YouTubeUploadService()
        result = await service.validate_shorts_video(test_video_file)
        
        assert "valid" in result
        assert "file_size_mb" in result
        assert "checks" in result
        assert "recommendations" in result
        
        # Should have basic file checks
        checks = result["checks"]
        assert checks["file_exists"] is True
        assert "file_size_ok" in checks
        assert "format" in checks
    
    @pytest.mark.skipif(not GOOGLE_APIS_AVAILABLE, reason="Google API libraries not available")
    @patch('src.youtube_upload_service.YouTubeUploadService.authenticate')
    @patch('googleapiclient.discovery.build')
    async def test_upload_video_authentication_failure(self, mock_build, mock_auth):
        """Test upload with authentication failure"""
        mock_auth.return_value = False
        
        service = YouTubeUploadService()
        result = await service.upload_video(
            video_path="/dev/null",
            title="Test Video",
            description="Test Description"
        )
        
        assert result["success"] is False
        assert "Authentication failed" in result["error"]
    
    @pytest.mark.skipif(not GOOGLE_APIS_AVAILABLE, reason="Google API libraries not available")  
    async def test_upload_video_file_not_found(self):
        """Test upload with non-existent file"""
        service = YouTubeUploadService()
        service.service = MagicMock()  # Mock authenticated service
        
        result = await service.upload_video(
            video_path="/nonexistent/file.mp4",
            title="Test Video",
            description="Test Description"
        )
        
        assert result["success"] is False
        assert "Video file not found" in result["error"]


class TestYouTubeWrapperFunctions:
    """Test async wrapper functions for MCP integration"""
    
    @pytest.mark.skipif(not GOOGLE_APIS_AVAILABLE, reason="Google API libraries not available")
    @patch('src.youtube_upload_service.YouTubeUploadService')
    async def test_upload_to_youtube_wrapper(self, mock_service_class):
        """Test upload_to_youtube wrapper function"""
        # Mock the service instance
        mock_service = MagicMock()
        mock_service.upload_video.return_value = {
            "success": True,
            "video_id": "test123",
            "video_url": "https://www.youtube.com/watch?v=test123"
        }
        mock_service_class.return_value = mock_service
        
        result = await upload_to_youtube(
            video_path="/test/video.mp4",
            title="Test Upload",
            description="Test Description",
            tags=["test", "video"],
            privacy_status="private"
        )
        
        assert result["success"] is True
        assert result["video_id"] == "test123"
        mock_service.upload_video.assert_called_once()
    
    @pytest.mark.skipif(not GOOGLE_APIS_AVAILABLE, reason="Google API libraries not available")
    @patch('src.youtube_upload_service.YouTubeUploadService')
    async def test_validate_youtube_shorts_wrapper(self, mock_service_class):
        """Test validate_youtube_shorts wrapper function"""
        # Mock the service instance
        mock_service = MagicMock()
        mock_service.validate_shorts_video.return_value = {
            "valid": True,
            "file_size_mb": 5.2,
            "checks": {"format": "mp4"}
        }
        mock_service_class.return_value = mock_service
        
        result = await validate_youtube_shorts("/test/video.mp4")
        
        assert result["valid"] is True
        assert result["file_size_mb"] == 5.2
        mock_service.validate_shorts_video.assert_called_once_with("/test/video.mp4")


class TestYouTubeErrorHandling:
    """Test error handling and edge cases"""
    
    @pytest.mark.skipif(not GOOGLE_APIS_AVAILABLE, reason="Google API libraries not available")
    async def test_upload_exception_handling(self):
        """Test that exceptions are properly caught and returned"""
        result = await upload_to_youtube(
            video_path="/nonexistent/path.mp4",
            title="Test Video"
        )
        
        assert result["success"] is False
        assert "error" in result
    
    @pytest.mark.skipif(not GOOGLE_APIS_AVAILABLE, reason="Google API libraries not available")
    async def test_validation_exception_handling(self):
        """Test that validation exceptions are properly caught"""
        result = await validate_youtube_shorts("/nonexistent/path.mp4")
        
        assert result["valid"] is False
        assert "error" in result


@pytest.mark.skipif(not GOOGLE_APIS_AVAILABLE, reason="Google API libraries not available")
@pytest.mark.integration
class TestYouTubeIntegrationReal:
    """
    Real integration tests with YouTube API
    
    These tests require actual YouTube API credentials and will make real API calls.
    They are marked as integration tests and skipped by default.
    
    To run these tests:
    1. Set up YouTube API credentials in Google Cloud Console
    2. Download client_secrets.json
    3. Set YOUTUBE_CREDENTIALS_FILE environment variable
    4. Run: pytest -m integration tests/test_youtube_integration.py
    """
    
    @pytest.mark.skipif(
        not os.getenv('YOUTUBE_CREDENTIALS_FILE'), 
        reason="YouTube credentials not configured (set YOUTUBE_CREDENTIALS_FILE)"
    )
    async def test_real_authentication(self):
        """Test real OAuth2 authentication with YouTube API"""
        credentials_file = os.getenv('YOUTUBE_CREDENTIALS_FILE')
        service = YouTubeUploadService(credentials_file=credentials_file)
        
        # This will open browser for first-time authentication
        result = await service.authenticate()
        assert result is True
        assert service.service is not None
    
    @pytest.mark.skipif(
        not os.getenv('YOUTUBE_CREDENTIALS_FILE'),
        reason="YouTube credentials not configured"
    )
    async def test_real_quota_check(self):
        """Test getting quota information from YouTube API"""
        credentials_file = os.getenv('YOUTUBE_CREDENTIALS_FILE')
        service = YouTubeUploadService(credentials_file=credentials_file)
        
        await service.authenticate()
        quota_info = await service.get_upload_quota()
        
        assert "daily_upload_limit" in quota_info
        assert quota_info["daily_upload_limit"] == 50


if __name__ == "__main__":
    # Run basic tests
    pytest.main([__file__, "-v", "-x"])