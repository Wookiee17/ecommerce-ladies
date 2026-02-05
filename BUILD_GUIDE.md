# Evara Mobile App Build Guide

This guide will help you build the Android (APK) and iOS (IPA) apps for the Evara e-commerce platform.

## Prerequisites

### For Android (APK)
- **Java Development Kit (JDK) 21** - [Download](https://adoptium.net/temurin/releases/?version=21)
- **Android Studio** with SDK - [Download](https://developer.android.com/studio)
- **Gradle 8.11+** (optional, wrapper included)

### For iOS (IPA)
- **macOS** (required for iOS builds)
- **Xcode 15+** - [Download from Mac App Store](https://apps.apple.com/us/app/xcode/id497799835)
- **CocoaPods** - `sudo gem install cocoapods`

---

## Quick Start with Docker (Recommended)

### Build Android APK with Docker

```bash
# Navigate to the project directory
cd /path/to/evara

# Build using Docker
docker run --rm -v "$PWD":/app -w /app \
  -e ANDROID_HOME=/opt/android-sdk \
  openjdk:21-slim \
  bash -c "
    apt-get update && apt-get install -y wget unzip &&
    mkdir -p /opt/android-sdk/cmdline-tools &&
    cd /opt/android-sdk/cmdline-tools &&
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip &&
    unzip -q commandlinetools-linux-11076708_latest.zip &&
    mv cmdline-tools latest &&
    yes | latest/bin/sdkmanager --licenses &&
    latest/bin/sdkmanager 'platforms;android-34' 'build-tools;34.0.0' &&
    cd /app/android &&
    ./gradlew assembleDebug
  "
```

The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Manual Build Instructions

### 1. Android APK Build

#### Step 1: Install Prerequisites
```bash
# Install JDK 21
# Download from: https://adoptium.net/temurin/releases/?version=21

# Set JAVA_HOME
export JAVA_HOME=/path/to/jdk-21
export PATH=$JAVA_HOME/bin:$PATH

# Install Android Studio and SDK
# Download from: https://developer.android.com/studio

# Set ANDROID_HOME
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
```

#### Step 2: Accept SDK Licenses
```bash
yes | sdkmanager --licenses
```

#### Step 3: Install Required SDK Components
```bash
sdkmanager "platforms;android-34" "build-tools;34.0.0"
```

#### Step 4: Build the APK
```bash
cd evara/android

# For Debug APK
./gradlew assembleDebug

# For Release APK (requires signing)
./gradlew assembleRelease
```

#### Output Location
- Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release APK: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

---

### 2. iOS IPA Build

#### Step 1: Install Prerequisites (macOS only)
```bash
# Install Xcode from Mac App Store
# Install CocoaPods
sudo gem install cocoapods
```

#### Step 2: Navigate to iOS Project
```bash
cd evara/ios/App
```

#### Step 3: Install Pods
```bash
pod install
```

#### Step 4: Build with Xcode

**Option A: Using Xcode GUI**
1. Open `App.xcworkspace` in Xcode
2. Select your target device/simulator
3. Product → Build (Cmd+B)
4. Product → Archive (for IPA)

**Option B: Using Command Line**
```bash
# Build for simulator
xcodebuild -workspace App.xcworkspace -scheme App -destination 'platform=iOS Simulator,name=iPhone 15' build

# Build for device (requires Apple Developer account)
xcodebuild -workspace App.xcworkspace -scheme App -destination 'generic/platform=iOS' archive -archivePath build/App.xcarchive

# Export IPA
xcodebuild -exportArchive -archivePath build/App.xcarchive -exportOptionsPlist exportOptions.plist -exportPath build/IPA
```

---

## Project Structure

```
evara/
├── android/              # Android native project
│   ├── app/
│   │   ├── src/main/assets/public/  # Web assets
│   │   └── build.gradle
│   └── gradlew
├── ios/                  # iOS native project
│   └── App/
│       ├── App/
│       │   └── public/   # Web assets
│       └── App.xcodeproj
├── dist/                 # Built web assets
├── capacitor.config.ts   # Capacitor configuration
└── BUILD_GUIDE.md        # This file
```

---

## Build Scripts

### Android Build Script (`build-android.sh`)
```bash
#!/bin/bash
set -e

echo "Building Evara Android APK..."

# Check prerequisites
if [ -z "$JAVA_HOME" ]; then
    echo "Error: JAVA_HOME is not set"
    exit 1
fi

if [ -z "$ANDROID_HOME" ]; then
    echo "Error: ANDROID_HOME is not set"
    exit 1
fi

# Sync web assets
echo "Syncing web assets..."
npx cap sync android

# Build APK
echo "Building APK..."
cd android
./gradlew assembleDebug

echo "Build complete!"
echo "APK location: android/app/build/outputs/apk/debug/app-debug.apk"
```

### iOS Build Script (`build-ios.sh`)
```bash
#!/bin/bash
set -e

echo "Building Evara iOS IPA..."

# Check prerequisites
if ! command -v xcodebuild &> /dev/null; then
    echo "Error: Xcode is not installed"
    exit 1
fi

# Sync web assets
echo "Syncing web assets..."
npx cap sync ios

# Install pods
echo "Installing CocoaPods..."
cd ios/App
pod install

# Build
echo "Building IPA..."
xcodebuild -workspace App.xcworkspace -scheme App -destination 'generic/platform=iOS' archive -archivePath build/App.xcarchive

echo "Build complete!"
echo "Archive location: ios/App/build/App.xcarchive"
```

---

## Troubleshooting

### Android Build Issues

**Issue: `JAVA_COMPILER not found`**
- Solution: Install JDK (not just JRE) and set JAVA_HOME

**Issue: `Duplicate class kotlin.collections.jdk8`**
- Solution: Already fixed in build.gradle with exclusion rules

**Issue: Gradle download fails**
- Solution: Use the Gradle wrapper or manually download Gradle

### iOS Build Issues

**Issue: `pod install` fails**
- Solution: Update CocoaPods: `sudo gem install cocoapods`

**Issue: Code signing errors**
- Solution: Set up Apple Developer account and provisioning profiles in Xcode

---

## App Features

The mobile app includes all web features:
- ✅ 39+ modern products (dresses, jewelry, beauty electronics)
- ✅ Shopping cart with add/remove/quantity
- ✅ Wishlist functionality
- ✅ Search with history & suggestions
- ✅ User authentication (Sign In/Sign Up)
- ✅ Category-based navigation
- ✅ Product details with images
- ✅ Offline support (PWA)
- ✅ Push notifications (configurable)

---

## Need Help?

If you encounter issues:
1. Check the [Capacitor documentation](https://capacitorjs.com/docs)
2. Review Android/iOS build logs
3. Ensure all prerequisites are installed
4. Try the Docker build method

---

## License

This project is for demonstration purposes.
