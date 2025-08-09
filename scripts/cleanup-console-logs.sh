#!/bin/bash

# Cleanup Console Logs Script
# This script helps find and replace console.log statements with proper logging

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting console.log cleanup process...${NC}"

# Find all console.log statements in the src directory
echo -e "\n${YELLOW}Finding all console.log statements:${NC}"
grep -r "console\." src/ --include="*.ts" --include="*.tsx" | wc -l
echo "Total console statements found"

# Create a backup directory
BACKUP_DIR="console-log-backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo -e "\n${YELLOW}Files with the most console statements:${NC}"
grep -r "console\." src/ --include="*.ts" --include="*.tsx" | cut -d: -f1 | sort | uniq -c | sort -nr | head -10

echo -e "\n${YELLOW}Creating backup of files before modification...${NC}"

# Function to replace console.log patterns
replace_console_patterns() {
    local file="$1"
    local backup_file="$BACKUP_DIR/$(basename "$file")"
    
    # Create backup
    cp "$file" "$backup_file"
    
    # Add logger import if not present
    if ! grep -q "import.*logger.*from.*@/lib/logger" "$file"; then
        # Find the last import and add logger import after it
        sed -i '' '/^import.*from/a\
import { logger } from "@/lib/logger";
' "$file" 2>/dev/null || true
    fi
    
    # Replace common console.log patterns
    sed -i '' 's/console\.log(/logger.debug(/g' "$file"
    sed -i '' 's/console\.info(/logger.info(/g' "$file"
    sed -i '' 's/console\.warn(/logger.warn(/g' "$file"
    sed -i '' 's/console\.error(/logger.error(/g' "$file"
    sed -i '' 's/console\.debug(/logger.debug(/g' "$file"
    
    echo "Processed: $file"
}

# Get list of files with console statements
FILES_WITH_CONSOLE=$(grep -r "console\." src/ --include="*.ts" --include="*.tsx" -l)

echo -e "\n${YELLOW}Processing files with console statements...${NC}"

# Process each file
for file in $FILES_WITH_CONSOLE; do
    replace_console_patterns "$file"
done

echo -e "\n${GREEN}Console log cleanup completed!${NC}"
echo -e "Backups created in: ${BACKUP_DIR}"
echo -e "\n${YELLOW}Note: You may need to manually adjust the logger calls to use proper context parameters${NC}"
echo -e "Example: logger.debug('message', { operation: 'operation_name', ...context })${NC}"

echo -e "\n${YELLOW}Remaining console statements:${NC}"
grep -r "console\." src/ --include="*.ts" --include="*.tsx" | wc -l