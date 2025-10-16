#!/bin/bash

# Safe Push Script - Avoids merge conflicts and prompts
# Usage: ./safe-push.sh "Your commit message"

set -e  # Exit on any error

# Check if commit message provided
if [ -z "$1" ]; then
    echo "Usage: ./safe-push.sh 'Your commit message'"
    exit 1
fi

COMMIT_MSG="$1"

echo "🔄 Safe Push Starting..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository"
    exit 1
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Fetch latest changes
echo "📥 Fetching latest changes..."
git fetch origin

# Check if there are any changes to commit
if git diff --quiet && git diff --cached --quiet; then
    echo "ℹ️  No changes to commit"
else
    # Add all changes
    echo "📝 Adding changes..."
    git add .
    
    # Commit with provided message
    echo "💾 Committing: $COMMIT_MSG"
    git commit -m "$COMMIT_MSG"
fi

# Check if we need to pull before push
echo "🔍 Checking for remote changes..."
if git rev-list HEAD..origin/$CURRENT_BRANCH --count > /dev/null 2>&1; then
    REMOTE_AHEAD=$(git rev-list HEAD..origin/$CURRENT_BRANCH --count)
    if [ "$REMOTE_AHEAD" -gt 0 ]; then
        echo "⚠️  Remote is ahead by $REMOTE_AHEAD commits"
        echo "🔄 Pulling changes..."
        git pull origin $CURRENT_BRANCH --no-edit
    fi
fi

# Push changes
echo "🚀 Pushing to origin/$CURRENT_BRANCH..."
git push origin $CURRENT_BRANCH

echo "✅ Safe push completed successfully!"
echo "🌐 Website should update automatically via GitHub Actions"
