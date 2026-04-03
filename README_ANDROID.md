# Shreya Petroleum - Android Build Instructions

This project is configured with **Capacitor** to build a native Android APK.

## Prerequisites
- **Node.js** installed on your computer.
- **Android Studio** installed and configured.
- **Java JDK 17+** installed.

## Steps to build the APK locally:

1. **Download the project** from AI Studio (Export as ZIP).
2. **Extract the ZIP** and open a terminal in the project folder.
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Build the web app**:
   ```bash
   npm run build
   ```
5. **Sync with Android**:
   ```bash
   npx cap sync android
   ```
6. **Open in Android Studio**:
   ```bash
   npx cap open android
   ```
7. **Build the APK**:
   - In Android Studio, go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
   - Once finished, you will find the APK in `android/app/build/outputs/apk/debug/app-debug.apk`.

## Alternative: PWA (Instant Install)
You don't need an APK to use this as an app! 
1. Open the app URL in your mobile browser (Chrome for Android, Safari for iOS).
2. Look for the **"Install App"** button in the sidebar or use the browser's **"Add to Home Screen"** option.
3. The app will appear on your home screen and work like a native app.
