# Evara Mobile Apps

Complete mobile app build setup for Evara - Ladies Fashion & Beauty E-commerce Platform.

## 📱 What's Included

- **Android APK** - Build scripts and Docker setup
- **iOS IPA** - Build scripts for macOS/Xcode
- **39+ Products** - Dresses, Jewelry, Beauty Electronics
- **Full Features** - Cart, Wishlist, Auth, Search, Offline Support

---

## 🚀 Quick Start

### Option 1: Docker Build (Easiest - Android Only)

```bash
# Build the Docker image and generate APK
docker-compose up android-build

# The APK will be in ./output/app-debug.apk
```

### Option 2: Local Build

#### Android APK
```bash
# 1. Install prerequisites:
#    - JDK 21: https://adoptium.net/temurin/releases/?version=21
#    - Android Studio: https://developer.android.com/studio

# 2. Set environment variables:
export JAVA_HOME=/path/to/jdk-21
export ANDROID_HOME=$HOME/Android/Sdk

# 3. Run build script:
./build-android.sh
```

#### iOS IPA (macOS only)
```bash
# 1. Install prerequisites:
#    - Xcode from Mac App Store
#    - CocoaPods: sudo gem install cocoapods

# 2. Run build script:
./build-ios.sh
```

---

## 📁 Project Structure

```
evara/
├── app/                      # Web app source code
│   ├── android/              # Android native project
│   ├── ios/                  # iOS native project
│   ├── dist/                 # Built web assets
│   └── ...
├── build-android.sh          # Android build script
├── build-ios.sh              # iOS build script
├── Dockerfile.android        # Docker build for Android
├── docker-compose.yml        # Docker compose config
├── BUILD_GUIDE.md            # Detailed build instructions
└── README.md                 # This file
```

---

## 📲 Installing the Apps

### Android APK

1. **Enable Unknown Sources**
   - Settings → Security → Unknown Sources → Enable

2. **Install APK**
   - Transfer `app-debug.apk` to your device
   - Tap the file to install

3. **Or use ADB**
   ```bash
   adb install app-debug.apk
   ```

### iOS IPA

1. **Build in Xcode**
   - Open `ios/App/App.xcworkspace`
   - Connect your iPhone
   - Click Run button

2. **For Distribution**
   - Product → Archive
   - Distribute App → Ad Hoc / App Store

---

## 🛠️ Features

| Feature | Web | Android | iOS |
|---------|-----|---------|-----|
| Browse Products | ✅ | ✅ | ✅ |
| Shopping Cart | ✅ | ✅ | ✅ |
| Wishlist | ✅ | ✅ | ✅ |
| User Auth | ✅ | ✅ | ✅ |
| Search & Suggestions | ✅ | ✅ | ✅ |
| Offline Support | ✅ | ✅ | ✅ |
| Push Notifications | ❌ | 🔄 | 🔄 |

---

## 🐛 Troubleshooting

### Android Issues

**Gradle download fails**
```bash
# Use the Gradle wrapper instead
./gradlew assembleDebug
```

**SDK not found**
```bash
# Set ANDROID_HOME
export ANDROID_HOME=$HOME/Android/Sdk
```

### iOS Issues

**Pod install fails**
```bash
# Update CocoaPods
sudo gem install cocoapods
```

**Code signing errors**
- Open Xcode → Signing & Capabilities
- Select your Apple ID team

---

## 📦 Build Outputs

| Platform | Output Path | Size |
|----------|-------------|------|
| Android Debug | `android/app/build/outputs/apk/debug/app-debug.apk` | ~15-25 MB |
| Android Release | `android/app/build/outputs/apk/release/app-release.apk` | ~10-20 MB |
| iOS Simulator | `ios/App/build/` | - |
| iOS Archive | `ios/App/build/App.xcarchive` | - |

---

## 🔗 Links

- **Live Web App**: https://jgf7xwsyp32pk.ok.kimi.link
- **Capacitor Docs**: https://capacitorjs.com/docs
- **Android Studio**: https://developer.android.com/studio
- **Xcode**: https://apps.apple.com/us/app/xcode/id497799835

---

## 📝 Notes

- The APK is a debug build for testing
- For Play Store release, you need to sign the APK
- iOS builds require a Mac and Apple Developer account for distribution
- Both apps support offline browsing thanks to service workers

---

## 🆘 Need Help?

1. Check `BUILD_GUIDE.md` for detailed instructions
2. Review the error logs
3. Ensure all prerequisites are installed
4. Try the Docker build method

---

## 📄 License

This project is for demonstration purposes.
