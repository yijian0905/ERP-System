#!/bin/bash

# Test script for AI services
# Tests both Python AI Service (L2+) and Ollama (L3)

echo "=========================================="
echo "Testing ERP AI Services"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test Python AI Service
echo "1. Testing Python AI Service (L2+)..."
if curl -f -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Python AI Service is running${NC}"
    echo "   Health check: $(curl -s http://localhost:8000/health | jq -r '.' 2>/dev/null || echo 'OK')"
else
    echo -e "${RED}❌ Python AI Service is not responding${NC}"
    echo "   Make sure the service is running on http://localhost:8000"
    echo "   Start with: docker-compose --profile ai up -d ai-service"
    echo "   Or locally: uvicorn app.main:app --reload --port 8000"
fi
echo ""

# Test Ollama
echo "2. Testing Ollama (L3)..."
if curl -f -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Ollama is running${NC}"
    echo "   Available models:"
    curl -s http://localhost:11434/api/tags 2>/dev/null | jq -r '.models[]?.name // "No models found"' || echo "   (Unable to parse model list)"
    
    # Test a simple generation
    echo ""
    echo "   Testing model generation..."
    if curl -s -X POST http://localhost:11434/api/generate -d '{"model":"llama2","prompt":"Hello","stream":false}' > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Model generation test passed${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Model generation test failed (may need to pull a model)${NC}"
        echo "   Run: docker exec -it erp-ollama ollama pull llama2"
    fi
else
    echo -e "${RED}❌ Ollama is not responding${NC}"
    echo "   Make sure Ollama is running on http://localhost:11434"
    echo "   Start with: docker-compose --profile ai up -d ollama"
fi
echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="

PYTHON_OK=$(curl -f -s http://localhost:8000/health > /dev/null 2>&1 && echo "yes" || echo "no")
OLLAMA_OK=$(curl -f -s http://localhost:11434/api/tags > /dev/null 2>&1 && echo "yes" || echo "no")

if [ "$PYTHON_OK" = "yes" ] && [ "$OLLAMA_OK" = "yes" ]; then
    echo -e "${GREEN}✅ All AI services are operational${NC}"
    exit 0
elif [ "$PYTHON_OK" = "yes" ]; then
    echo -e "${YELLOW}⚠️  Python AI Service is running, but Ollama is not${NC}"
    exit 1
elif [ "$OLLAMA_OK" = "yes" ]; then
    echo -e "${YELLOW}⚠️  Ollama is running, but Python AI Service is not${NC}"
    exit 1
else
    echo -e "${RED}❌ No AI services are running${NC}"
    exit 1
fi


