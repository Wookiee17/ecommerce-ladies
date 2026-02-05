#!/bin/bash
set -e

echo "=========================================="
echo "  Evara Android APK Build Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    # Check Java
    if ! command -v java &> /dev/null; then
        echo -e "${RED}Error: Java is not installed${NC}"
        echo "Please install JDK 21 from: https://adoptium.net/temurin/releases/?version=21"
        exit 1
    fi
    
    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
    echo -e "${GREEN}✓ Java version: $JAVA_VERSION${NC}"
    
    # Check ANDROID_HOME
    if [ -z "$ANDROID_HOME" ]; then
        echo -e "${YELLOW}Warning: ANDROID_HOME is not set${NC}"
        echo "Please set ANDROID_HOME to your Android SDK path"
        echo "Example: export ANDROID_HOME=$HOME/Android/Sdk"
    else
        echo -e "${GREEN}✓ ANDROID_HOME: $ANDROID_HOME${NC}"
    fi
    
    echo ""
}

# Sync web assets
sync_assets() {
    echo -e "${YELLOW}Syncing web assets...${NC}"
    
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm install
    fi
    
    npx cap sync android
    echo -e "${GREEN}✓ Assets synced${NC}"
    echo ""
}

# Build APK
build_apk() {
    echo -e "${YELLOW}Building Android APK...${NC}"
    
    cd android
    
    # Make gradlew executable
    chmod +x gradlew
    
    # Build debug APK
    ./gradlew assembleDebug --no-daemon
    
    echo ""
    echo -e "${GREEN}==========================================${NC}"
    echo -e "${GREEN}  Build Complete!${NC}"
    echo -e "${GREEN}==========================================${NC}"
    echo ""
    echo "APK Location:"
    echo "  android/app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    
    # Show APK size if file exists
    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
    if [ -f "$APK_PATH" ]; then
        APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
        echo "APK Size: $APK_SIZE"
    fi
    
    cd ..
}

# Main execution
main() {
    echo ""
    check_prerequisites
    sync_assets
    build_apk
    
    echo -e "${GREEN}Installation Instructions:${NC}"
    echo "  1. Transfer the APK to your Android device"
    echo "  2. Enable 'Install from Unknown Sources' in Settings"
    echo "  3. Tap the APK file to install"
    echo ""
}

# Run main function
main
