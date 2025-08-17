# FFMPEG MCP Server - Minimal Alpine production image
FROM python:3.13-alpine

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install minimal system dependencies for FFMPEG + Java + Python
RUN apk add --no-cache \
    bash \
    curl \
    ffmpeg \
    openjdk11-jre \
    # Audio processing (for VDVIL)
    libsndfile-dev \
    # Minimal Python build support
    python3-dev \
    gcc \
    musl-dev

# Install minimal Python dependencies
RUN pip install --no-cache-dir --root-user-action=ignore \
    psutil>=5.9.0 \
    "fastmcp>=2.7.1" \
    "mcp>=1.9.3" \
    "pydantic>=2.11.5" \
    "pytest>=8.4.0" \
    "pytest-asyncio>=1.0.0" \
    "jsonschema>=4.0.0" \
    "PyYAML>=6.0"

# Create working directory
WORKDIR /app

# Create non-root user 
RUN addgroup -g 1000 mcp && adduser -u 1000 -G mcp -s /bin/bash -D mcp

# Create directories for file processing with proper permissions
RUN mkdir -p /tmp/music/{source,temp,screenshots,metadata,finished} \
    && chown -R mcp:mcp /app /tmp/music

# Copy application code
COPY src/ ./src/
COPY tests/ ./tests/
COPY README.md ./

# Set Python path for module imports  
ENV PYTHONPATH=/app

# Create health check script
RUN echo '#!/bin/bash\npython -c "import src.server; print(\"✅ MCP server OK\")" || exit 1' > /app/healthcheck.sh \
    && chmod +x /app/healthcheck.sh \
    && chown -R mcp:mcp /app

# Test that critical tools work
RUN ffmpeg -version > /dev/null 2>&1 && \
    java -version > /dev/null 2>&1 && \
    python -c "import psutil; print('Python OK')" && \
    echo "✅ Minimal production image validation passed"

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
      version="1.0.0-minimal" \
      description="FFMPEG MCP Server - Minimal Alpine Build (FFMPEG + Java + Python only)"