#!/bin/bash

# Health check script for Git Visualizer
# Verifies the development environment is ready

set -e

echo "🏥 Running Git Visualizer health check..."

# Check if server is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Development server is running on http://localhost:3000"
else
    echo "❌ Development server is not responding on http://localhost:3000"
    echo "💡 Run 'pnpm dev' to start the development server"
    exit 1
fi

# Check if the app loads without errors
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Application loads successfully (HTTP $HTTP_STATUS)"
else
    echo "❌ Application returned HTTP $HTTP_STATUS"
    exit 1
fi

echo "🎉 All health checks passed!"