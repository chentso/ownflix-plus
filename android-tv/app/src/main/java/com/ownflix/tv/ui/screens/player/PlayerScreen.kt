package com.ownflix.tv.ui.screens.player

import android.view.KeyEvent
import androidx.annotation.OptIn
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.common.MediaItem as ExoMediaItem
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import androidx.tv.material3.Button
import androidx.tv.material3.ButtonDefaults
import androidx.tv.material3.Text
import com.ownflix.tv.MainActivity
import com.ownflix.tv.data.model.Episode
import com.ownflix.tv.data.model.MediaItem
import com.ownflix.tv.data.repository.OwnFlixRepository
import com.ownflix.tv.ui.theme.BrightBlue
import com.ownflix.tv.ui.theme.DangerRed
import com.ownflix.tv.ui.theme.RoyalBlue
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(UnstableApi::class)
@Composable
fun PlayerScreen(
    mediaItem: MediaItem,
    episode: Episode? = null,
    repository: OwnFlixRepository,
    onClose: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    val streamUrl = remember(mediaItem.id, episode?.id) {
        repository.getStreamUrl(mediaItem.id, episode?.id)
    }

    // Playback state
    var isPlaying by remember { mutableStateOf(true) }
    var currentPositionMs by remember { mutableLongStateOf(0L) }
    var durationMs by remember { mutableLongStateOf(0L) }
    var showControls by remember { mutableStateOf(true) }
    var controlsResetTrigger by remember { mutableStateOf(0) }
    var seekFeedbackText by remember { mutableStateOf<String?>(null) }

    // Intro detection
    val introStart = episode?.introStart ?: mediaItem.introStart
    val introEnd = episode?.introEnd ?: mediaItem.introEnd
    val inIntro = introStart != null && introEnd != null &&
            (currentPositionMs / 1000.0) >= introStart &&
            (currentPositionMs / 1000.0) <= introEnd

    // Create ExoPlayer instance
    val exoPlayer = remember {
        ExoPlayer.Builder(context).build().apply {
            val exoItem = ExoMediaItem.fromUri(streamUrl)
            setMediaItem(exoItem)
            prepare()
            playWhenReady = true

            // Restore progress if available
            val startPositionSec = episode?.let { mediaItem.progress?.positionSeconds }
                ?: mediaItem.progress?.positionSeconds ?: 0.0
            if (startPositionSec > 2) {
                seekTo((startPositionSec * 1000).toLong())
            }
        }
    }

    // Save and exit helper
    fun handleExit() {
        scope.launch {
            repository.updateProgress(
                mediaItemId = mediaItem.id,
                positionSeconds = (exoPlayer.currentPosition / 1000.0),
                durationSeconds = (exoPlayer.duration / 1000.0),
                episodeId = episode?.id
            )
        }
        onClose()
    }

    // Seek helper that immediately updates both ExoPlayer and Compose UI
    fun seekBy(deltaMs: Long) {
        val dur = exoPlayer.duration.coerceAtLeast(0L)
        val maxPos = if (dur > 0) dur else Long.MAX_VALUE
        val targetPos = (exoPlayer.currentPosition + deltaMs).coerceIn(0L, maxPos)
        exoPlayer.seekTo(targetPos)
        currentPositionMs = targetPos
        seekFeedbackText = if (deltaMs > 0) "+10s" else "-10s"
        showControls = true
        controlsResetTrigger++
    }

    fun skipIntro() {
        if (introEnd != null) {
            val targetMs = (introEnd * 1000).toLong()
            exoPlayer.seekTo(targetMs)
            currentPositionMs = targetMs
            seekFeedbackText = "⏭ Intro Skipped"
            showControls = true
            controlsResetTrigger++
        }
    }

    fun togglePlayPause() {
        if (exoPlayer.isPlaying) {
            exoPlayer.pause()
            isPlaying = false
        } else {
            exoPlayer.play()
            isPlaying = true
        }
        showControls = true
        controlsResetTrigger++
    }

    // Register active global Activity key handler to guarantee 100% remote reliability
    DisposableEffect(Unit) {
        MainActivity.activePlayerKeyHandler = { event ->
            if (event.action == KeyEvent.ACTION_DOWN) {
                when (event.keyCode) {
                    KeyEvent.KEYCODE_DPAD_LEFT,
                    KeyEvent.KEYCODE_MEDIA_REWIND,
                    KeyEvent.KEYCODE_MINUS,
                    KeyEvent.KEYCODE_J -> {
                        seekBy(-10000)
                        true
                    }

                    KeyEvent.KEYCODE_DPAD_RIGHT,
                    KeyEvent.KEYCODE_MEDIA_FAST_FORWARD,
                    KeyEvent.KEYCODE_EQUALS,
                    KeyEvent.KEYCODE_L -> {
                        seekBy(10000)
                        true
                    }

                    KeyEvent.KEYCODE_SPACE,
                    KeyEvent.KEYCODE_K,
                    KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE -> {
                        togglePlayPause()
                        true
                    }

                    KeyEvent.KEYCODE_DPAD_CENTER,
                    KeyEvent.KEYCODE_ENTER -> {
                        if (inIntro && introEnd != null) {
                            skipIntro()
                            true
                        } else {
                            togglePlayPause()
                            true
                        }
                    }

                    KeyEvent.KEYCODE_S -> {
                        if (introEnd != null) {
                            skipIntro()
                            true
                        } else false
                    }

                    KeyEvent.KEYCODE_DPAD_UP,
                    KeyEvent.KEYCODE_DPAD_DOWN -> {
                        showControls = true
                        controlsResetTrigger++
                        true
                    }

                    KeyEvent.KEYCODE_BACK,
                    KeyEvent.KEYCODE_ESCAPE -> {
                        handleExit()
                        true
                    }

                    else -> false
                }
            } else false
        }

        onDispose {
            MainActivity.activePlayerKeyHandler = null
        }
    }

    // Listen to player state
    DisposableEffect(exoPlayer) {
        val listener = object : Player.Listener {
            override fun onIsPlayingChanged(playing: Boolean) {
                isPlaying = playing
            }

            override fun onPlaybackStateChanged(state: Int) {
                durationMs = exoPlayer.duration.coerceAtLeast(0L)
                if (state == Player.STATE_ENDED) {
                    scope.launch {
                        repository.updateProgress(
                            mediaItemId = mediaItem.id,
                            positionSeconds = (durationMs / 1000.0),
                            durationSeconds = (durationMs / 1000.0),
                            episodeId = episode?.id,
                            completed = true
                        )
                    }
                    onClose()
                }
            }
        }
        exoPlayer.addListener(listener)

        onDispose {
            exoPlayer.removeListener(listener)
            exoPlayer.release()
        }
    }

    // Periodic time update and server progress reporting
    LaunchedEffect(exoPlayer) {
        var elapsedSyncTicks = 0
        while (true) {
            delay(1000)
            currentPositionMs = exoPlayer.currentPosition
            durationMs = exoPlayer.duration.coerceAtLeast(0L)

            // Report progress every 10 seconds
            elapsedSyncTicks++
            if (elapsedSyncTicks >= 10 && currentPositionMs > 1000) {
                elapsedSyncTicks = 0
                val posSec = currentPositionMs / 1000.0
                val durSec = durationMs / 1000.0
                repository.updateProgress(
                    mediaItemId = mediaItem.id,
                    positionSeconds = posSec,
                    durationSeconds = durSec,
                    episodeId = episode?.id
                )
            }
        }
    }

    // Clear seek feedback bubble after 1.2 seconds
    LaunchedEffect(seekFeedbackText) {
        if (seekFeedbackText != null) {
            delay(1200)
            seekFeedbackText = null
        }
    }

    // Auto-hide controls after 5 seconds of inactivity
    LaunchedEffect(showControls, controlsResetTrigger) {
        if (showControls) {
            delay(5000)
            showControls = false
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        // ExoPlayer View (explicitly non-focusable so Compose controls keep focus)
        AndroidView(
            factory = { ctx ->
                PlayerView(ctx).apply {
                    player = exoPlayer
                    useController = false
                    isFocusable = false
                    isFocusableInTouchMode = false
                }
            },
            modifier = Modifier.fillMaxSize()
        )

        // Center On-Screen Feedback Indicator (e.g. ⏪ -10s or ⏩ +10s)
        seekFeedbackText?.let { feedback ->
            Box(
                modifier = Modifier
                    .align(Alignment.Center)
                    .background(Color.Black.copy(alpha = 0.85f), RoundedCornerShape(16.dp))
                    .border(2.dp, BrightBlue, RoundedCornerShape(16.dp))
                    .padding(horizontal = 28.dp, vertical = 16.dp)
            ) {
                Text(
                    text = feedback,
                    color = Color.White,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // "Skip Intro" Banner overlay (matching Netflix Web Player)
        if (inIntro && introEnd != null) {
            Box(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(bottom = 120.dp, end = 48.dp)
            ) {
                Button(
                    onClick = { skipIntro() },
                    colors = ButtonDefaults.colors(
                        containerColor = RoyalBlue,
                        focusedContainerColor = BrightBlue
                    ),
                    shape = ButtonDefaults.shape(RoundedCornerShape(8.dp)),
                    contentPadding = PaddingValues(horizontal = 22.dp, vertical = 12.dp)
                ) {
                    Text(
                        text = "⏭  Skip Intro  [Enter / S]",
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        color = Color.White
                    )
                }
            }
        }

        // TV Player Controls Overlay (matches Netflix Web Player controls layout)
        AnimatedVisibility(
            visible = showControls,
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier.fillMaxSize()
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(
                                Color.Black.copy(alpha = 0.82f),
                                Color.Transparent,
                                Color.Black.copy(alpha = 0.92f)
                            )
                        )
                    )
                    .padding(horizontal = 48.dp, vertical = 24.dp)
            ) {
                // Top Header: Back Button, Title, and Metadata
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .align(Alignment.TopCenter),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Button(
                            onClick = { handleExit() },
                            colors = ButtonDefaults.colors(
                                containerColor = Color.White.copy(alpha = 0.15f),
                                focusedContainerColor = BrightBlue
                            ),
                            shape = ButtonDefaults.shape(RoundedCornerShape(8.dp)),
                            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp)
                        ) {
                            Text("← Back", fontSize = 14.sp, color = Color.White, fontWeight = FontWeight.Bold)
                        }

                        Column {
                            Text(
                                text = mediaItem.title,
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            episode?.let { ep ->
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = "Season ${ep.seasonNumber} • Episode ${ep.episodeNumber}: \"${ep.title}\"",
                                    fontSize = 13.sp,
                                    color = Color.LightGray
                                )
                            }
                        }
                    }

                    // Format badge
                    Text(
                        text = mediaItem.resolution,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = BrightBlue,
                        modifier = Modifier
                            .background(Color.White.copy(alpha = 0.1f), RoundedCornerShape(4.dp))
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                }

                // Bottom Controls: Netflix-style Scrubber Seek Bar + Transport Control Buttons
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .align(Alignment.BottomCenter)
                ) {
                    // Full-width Netflix-style Seek Bar Track with circular Scrubber Knob
                    val progressFraction = if (durationMs > 0) {
                        (currentPositionMs.toFloat() / durationMs.toFloat()).coerceIn(0f, 1f)
                    } else 0f

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(18.dp),
                        contentAlignment = Alignment.CenterStart
                    ) {
                        // Background track
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(6.dp)
                                .clip(RoundedCornerShape(3.dp))
                                .background(Color.White.copy(alpha = 0.25f))
                        )

                        // Filled active progress track
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(progressFraction)
                                .height(6.dp)
                                .clip(RoundedCornerShape(3.dp))
                                .background(RoyalBlue)
                        )

                        // Scrubber Knob Circle
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(progressFraction)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(16.dp)
                                    .align(Alignment.CenterEnd)
                                    .clip(CircleShape)
                                    .background(BrightBlue)
                                    .border(2.dp, Color.White, CircleShape)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // Row with Left Time, Transport Buttons, Right Time
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Current time / Total time (matching web player)
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text(
                                text = formatTime(currentPositionMs),
                                fontSize = 15.sp,
                                fontFamily = FontFamily.Monospace,
                                color = Color.White,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "/",
                                fontSize = 13.sp,
                                color = Color.Gray
                            )
                            Text(
                                text = formatTime(durationMs),
                                fontSize = 14.sp,
                                fontFamily = FontFamily.Monospace,
                                color = Color.LightGray
                            )
                        }

                        // Web Player-style Transport Controls Row
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Play / Pause Button
                            Button(
                                onClick = { togglePlayPause() },
                                colors = ButtonDefaults.colors(
                                    containerColor = RoyalBlue,
                                    focusedContainerColor = BrightBlue
                                ),
                                shape = ButtonDefaults.shape(RoundedCornerShape(8.dp)),
                                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
                            ) {
                                Text(
                                    text = if (isPlaying) "⏸ Pause" else "▶ Play",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            }

                            // Rewind 10s Button
                            Button(
                                onClick = { seekBy(-10000) },
                                colors = ButtonDefaults.colors(
                                    containerColor = Color.White.copy(alpha = 0.12f),
                                    focusedContainerColor = BrightBlue
                                ),
                                shape = ButtonDefaults.shape(RoundedCornerShape(8.dp)),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp)
                            ) {
                                Text("↺ 10s [◀]", fontSize = 13.sp, color = Color.White, fontWeight = FontWeight.SemiBold)
                            }

                            // Forward 10s Button
                            Button(
                                onClick = { seekBy(10000) },
                                colors = ButtonDefaults.colors(
                                    containerColor = Color.White.copy(alpha = 0.12f),
                                    focusedContainerColor = BrightBlue
                                ),
                                shape = ButtonDefaults.shape(RoundedCornerShape(8.dp)),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp)
                            ) {
                                Text("↻ 10s [▶]", fontSize = 13.sp, color = Color.White, fontWeight = FontWeight.SemiBold)
                            }

                            // Skip Intro Button (when available)
                            if (introEnd != null) {
                                Button(
                                    onClick = { skipIntro() },
                                    colors = ButtonDefaults.colors(
                                        containerColor = if (inIntro) RoyalBlue else Color.White.copy(alpha = 0.12f),
                                        focusedContainerColor = BrightBlue
                                    ),
                                    shape = ButtonDefaults.shape(RoundedCornerShape(8.dp)),
                                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp)
                                ) {
                                    Text("⏭ Skip Intro", fontSize = 13.sp, color = Color.White, fontWeight = FontWeight.SemiBold)
                                }
                            }
                        }

                        // D-Pad navigation shortcuts legend
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            Text("◀ / ▶ Seek", fontSize = 11.sp, color = Color.Gray)
                            Text("Space/OK Play", fontSize = 11.sp, color = Color.Gray)
                            Text("Esc Exit", fontSize = 11.sp, color = Color.Gray)
                        }
                    }
                }
            }
        }
    }
}

private fun formatTime(ms: Long): String {
    val totalSeconds = (ms / 1000).coerceAtLeast(0)
    val hours = totalSeconds / 3600
    val minutes = (totalSeconds % 3600) / 60
    val seconds = totalSeconds % 60
    return if (hours > 0) {
        String.format("%d:%02d:%02d", hours, minutes, seconds)
    } else {
        String.format("%02d:%02d", minutes, seconds)
    }
}
