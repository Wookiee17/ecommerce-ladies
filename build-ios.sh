#!/bin/bash
set -e

echo "=========================================="
echo "  Evara iOS IPA Build Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    # Check macOS
    if [[ "$OSTYPE" != "darwin"* ]]; then
        echo -e "${RED}Error: iOS builds require macOS${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Running on macOS${NC}"
    
    # Check Xcode
    if ! command -v xcodebuild &> /dev/null; then
        echo -e "${RED}Error: Xcode is not installed${NC}"
        echo "Please install Xcode from the Mac App Store"
        exit 1
    fi
    
    XCODE_VERSION=$(xcodebuild -version | head -n 1)
    echo -e "${GREEN}✓ $XCODE_VERSION${NC}"
    
    # Check CocoaPods
    if ! command -v pod &> /dev/null; then
        echo -e "${YELLOW}Warning: CocoaPods is not installed${NC}"
        echo "Installing CocoaPods..."
        sudo gem install cocoapods
    fi
    
    echo -e "${GREEN}✓ CocoaPods installed${NC}"
    echo ""
}

# Sync web assets
sync_assets() {
    echo -e "${YELLOW}Syncing web assets...${NC}"
    
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm install
    fi
    
    npx cap sync ios
    echo -e "${GREEN}✓ Assets synced${NC}"
    echo ""
}

# Install Pods
install_pods() {
    echo -e "${YELLOW}Installing CocoaPods dependencies...${NC}"
    
    cd ios/App
    pod install
    cd ../..
    
    echo -e "${GREEN}✓ Pods installed${NC}"
    echo ""
}

# Build IPA
build_ipa() {
    echo -e "${YELLOW}Building iOS app...${NC}"
    
    cd ios/App
    
    # Build for simulator (for testing)
    echo "Building for iOS Simulator..."
    xcodebuild -workspace App.xcworkspace \
        -scheme App \
        -destination 'platform=iOS Simulator,name=iPhone 15' \
        build
    
    echo ""
    echo -e "${GREEN}==========================================${NC}"
    echo -e "${GREEN}  Build Complete!${NC}"
    echo -e "${GREEN}==========================================${NC}"
    echo ""
    echo "To create an IPA for distribution:"
    echo "  1. Open App.xcworkspace in Xcode"
    echo "  2. Select 'Any iOS Device' as target"
    echo "  3. Product → Archive"
    echo "  4. Distribute App → Ad Hoc / App Store"
    echo ""
    
    cd ../..
}

# Main execution
main() {
    echo ""
    check_prerequisites
    sync_assets
    install_pods
    build_ipa
    
    echo -e "${GREEN}Next Steps:${NC}"
    echo "  - Open ios/App/App.xcworkspace in Xcode"
    echo "  - Connect your iPhone or select a simulator"
    echo "  - Click Run to install on device"
    echo ""
}

# Run main function
main
