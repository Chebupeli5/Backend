#!/bin/bash

echo "Getting ngrok URL..."

# Wait a bit for ngrok to start
sleep 5

# Get ngrok URL from logs
NGROK_URL=$(docker-compose logs ngrok | grep "started tunnel" | grep -o "https://[a-zA-Z0-9-]*\.ngrok-free\.dev" | head -1)
if [ -z "$NGROK_URL" ]; then
    NGROK_URL=$(docker-compose logs ngrok | grep "started tunnel" | grep -o "https://[a-zA-Z0-9-]*\.ngrok\.io" | head -1)
fi

if [ ! -z "$NGROK_URL" ]; then
    echo "Ngrok URL found: $NGROK_URL"
    echo "Swagger UI: $NGROK_URL/docs"
    echo "Adminer: $NGROK_URL/adminer/"
    echo "API Health: $NGROK_URL/health"
    
    # Copy to clipboard (if xclip is available)
    if command -v xclip &> /dev/null; then
        echo "$NGROK_URL" | xclip -selection clipboard
        echo "URL copied to clipboard!"
    elif command -v pbcopy &> /dev/null; then
        echo "$NGROK_URL" | pbcopy
        echo "URL copied to clipboard!"
    fi
else
    echo "Ngrok URL not found. Make sure ngrok container is running."
    echo "Try: docker-compose logs ngrok"
fi
