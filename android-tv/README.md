# OwnFlix+ Android TV Client

A native Android TV client built specifically for **OwnFlix+** using **Jetpack Compose for TV** (`androidx.tv:tv-material`) and **AndroidX Media3 ExoPlayer** (`androidx.media3`).

---

## 📺 Features & 10-Foot Leanback UI

1. **Spatial D-Pad Remote Navigation**:
   - Smooth focus-driven card elevation, border glow, and scaling across all rows and grids.
   - Remote key-handling for D-Pad Left/Right, Up/Down, Center (Select), and Back navigation.

2. **Server Configuration (`ServerConnectScreen`)**:
   - Custom HTTP/HTTPS server address configuration (supports custom IP and ports, e.g. `http://192.168.1.100:3000`).
   - One-click presets for **Android Emulator (`http://10.0.2.2:3000`)** and **Localhost (`http://localhost:3000`)**.
   - Instant live ping test to verify server reachability.

3. **Multi-User Profile Selection (`ProfileSelectScreen`)**:
   - "Who's Watching?" profile grid displaying user avatars, custom background colors, and badge emblems.
   - Secure PIN / Password verification dialog for protected profiles.

4. **Home Browse (`HomeScreen`)**:
   - **Hero Billboard**: Cinematic high-res backdrop banner, title, metadata badges (HD, 4K, release year), description, and quick Play / More Info actions.
   - **Categorized Swimlanes (`TvLazyRow`)**:
     - *Continue Watching* with resume progress indicator bar.
     - *My List* (pinned default playlist).
     - *Trending Movies* & *TV Series*.
     - *Local Disk Direct Streams* (direct from mounted storage).

5. **Media Details (`MediaDetailScreen`)**:
   - Full backdrop artwork, genre chips, release date, duration, and synopsis.
   - **Play / Resume** button.
   - **My List** toggle button (syncs with backend playlist).
   - **Mark for Deletion** toggle button (marks one-time watch movies for cleanup).
   - **TV Series Episode Carousel**: Browse and select specific seasons and episodes.

6. **Video Player (`PlayerScreen`)**:
   - Built with **AndroidX Media3 ExoPlayer** supporting HTTP 206 byte-range seeking and live MKV container remuxing.
   - Auto-hiding TV remote overlay with transport controls:
     - D-Pad Center: Play / Pause toggle.
     - D-Pad Left / Right: Seek backward / forward 10 seconds.
     - D-Pad Down: Reveal playback timeline and controls.
     - **Skip Intro** quick jump (+85s).
   - **Continuous Progress Sync**: Transmits playback timestamp back to the OwnFlix+ server every 10 seconds and on exit (`/api/progress`).

7. **Unified Playlists (`PlaylistsScreen`)**:
   - Browse the default pinned **"My List"** playlist and custom user-created playlists.
   - View items inside each list and trigger direct playback.

8. **On-Screen D-Pad Search (`SearchScreen`)**:
   - On-screen keyboard and search field with live querying across titles, genres, and cast members.

---

## 🛠 Tech Stack & Architecture

- **UI Framework**: [Jetpack Compose for TV](https://developer.android.com/develop/ui/compose/tv) (`androidx.tv:tv-material`, `androidx.tv:tv-foundation` `1.0.0-alpha11`)
- **Video Playback**: [AndroidX Media3 ExoPlayer](https://developer.android.com/guide/topics/media/media3) (`1.4.1`)
- **Networking**: Retrofit 2 (`2.11.0`) + OkHttp 3 (`4.12.0`)
- **Image Loading**: Coil 3 (`io.coil-kt.coil3:coil-compose:3.0.0-rc01`)
- **Architecture**: MVVM with Kotlin Coroutines & StateFlow
- **Target SDK**: Android 14 (API 34) | **Min SDK**: Android 8.0 Oreo (API 26)

---

## 🚀 Getting Started

### Prerequisites

- **Android Studio** (Koala / Ladybug or newer recommended)
- **Android SDK** API 34 installed
- **JDK 17** configured as Gradle JDK
- An active OwnFlix+ server running on your network (e.g., `npm run dev` on port `3000`)

### Opening in Android Studio

1. Open Android Studio.
2. Select **Open** and choose the `android-tv/` folder (`c:\code\ownflix-plus\android-tv`).
3. Allow Gradle to sync dependencies.

### Running on an Android TV Emulator

1. In Android Studio, go to **Tools** > **Device Manager**.
2. Click **Create Device** and choose **TV** (e.g. *Android TV (1080p)* or *Google TV (1080p)*).
3. Select an API 34 system image and finish the wizard.
4. Start the emulator and run the app.
5. In the app's server configuration screen, select the **Emulator (10.0.2.2:3000)** preset to connect to your host machine's OwnFlix+ server.

### Installing on a Physical Android TV / Google TV Device

1. **Enable Developer Options & ADB Debugging on your TV**:
   - Go to **Settings** > **System** > **About**.
   - Scroll down to **Android TV OS build** and click it 7 times until developer options are unlocked.
   - Go to **Settings** > **System** > **Developer options** and turn on **Network debugging** (or USB debugging).
   - Note the TV's IP address displayed on screen.

2. **Connect via ADB from your PC**:
   ```bash
   adb connect <TV_IP_ADDRESS>:5555
   ```
   *(Accept the debugging authorization prompt on your TV screen).*

3. **Build and install the debug APK**:
   ```bash
   cd android-tv
   ./gradlew assembleDebug
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```

4. Launch **OwnFlix+** from your Android TV Home launcher banner.
5. Enter your server's LAN address (e.g. `http://192.168.1.50:3000`) and test connection.

---

## 🔒 Network Security Configuration

The client includes a custom network security configuration (`app/src/main/res/xml/network_security_config.xml`) that permits cleartext HTTP traffic across local and private IP ranges (`10.x.x.x`, `192.168.x.x`, `172.16.x.x`, and `localhost`). This allows streaming from self-hosted servers without requiring a local SSL/TLS certificate.
