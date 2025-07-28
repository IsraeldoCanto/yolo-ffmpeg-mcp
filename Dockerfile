# FFMPEG MCP Server - Ubuntu-based for faster CI builds with precompiled packages
FROM python:3.13-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DEBIAN_FRONTEND=noninteractive

# Install system dependencies (precompiled packages are much faster)
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Core utilities
    bash \
    curl \
    netcat-traditional \
    # FFmpeg and multimedia (precompiled)
    ffmpeg \
    # Minimal build tools only for pure Python packages
    gcc \
    python3-dev \
    # Cleanup to reduce image size
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Install UV for fast Python package management
RUN pip install --no-cache-dir uv

# Create working directory
WORKDIR /app

# Copy dependency files first for better layer caching
COPY pyproject.toml ./

# Install core Python dependencies (using precompiled wheels when available)
RUN uv pip install --system --no-cache \
    fastmcp>=2.7.1 \
    mcp>=1.9.3 \
    pydantic>=2.11.5 \
    # Testing dependencies
    pytest>=8.4.0 \
    pytest-asyncio>=1.0.0 \
    # Minimal dependencies
    jsonschema>=4.0.0 \
    psutil>=5.9.0 \
    # Audio effect dependencies
    PyYAML>=6.0 \
    # Video effects dependencies (precompiled wheels available for Ubuntu)
    opencv-python-headless>=4.8.0 \
    pillow>=10.0.0 \
    numpy>=1.24.0

# Create non-root user (Ubuntu syntax)
RUN groupadd -g 1000 mcp && useradd -u 1000 -g mcp -s /bin/bash -m mcp

# Copy application code
COPY src/ ./src/
COPY tests/ ./tests/
COPY README.md ./

# Create directories for file processing
RUN mkdir -p /tmp/music/source /tmp/music/temp /tmp/music/screenshots /tmp/music/metadata /tmp/music/finished \
    && chown -R mcp:mcp /app /tmp/music

# Create health check script
RUN echo '#!/bin/bash\npython -c "import src.server; print(\"✅ MCP server OK\")" || exit 1' > /app/healthcheck.sh \
    && chmod +x /app/healthcheck.sh \
    && chown mcp:mcp /app/healthcheck.sh

# Switch to non-root user
USER mcp

# Expose MCP server port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD /app/healthcheck.sh

# Default command
CMD ["python", "-m", "src.server"]

# Labels
LABEL maintainer="Stig Lau" \
      version="1.0.0" \
      description="FFMPEG MCP Server - Alpine Build"