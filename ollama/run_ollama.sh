#!/bin/sh

# Start server in background
ollama serve &

# Wait for server to be ready
until ollama list >/dev/null 2>&1; do
  sleep 2
done

# Check and pull model
if ! ollama list | grep -q 'llava:7b-v1.6'; then
  ollama pull llava:7b-v1.6
else
  echo "llava model already exists"
fi

# Keep container running
wait