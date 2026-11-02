package com.ownflix.tv.ui.screens.player

import android.view.KeyEvent
import androidx.annotation.OptIn
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.focusable
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
import androidx.compose.foundation.layout.width
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
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.platform.LocalContext
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
import com.ownflix.tv.data.model.Episode
import com.ownflix.tv.data.model.MediaItem
import com.ownflix.tv.data.repository.OwnFlixRepository
import com.ownflix.tv.ui.theme.BrightBlue
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

    val focusRequester = remember { FocusRequester() }

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

    // Seek helper that immediately reflects on UI
    fun seekBy(deltaMs: Long) {
        val dur = exoPlayer.duration.coerceAtLeast(0L)
        val maxPos = if (dur > 0) dur else Long.MAX_VALUE
        val newPos = (exoPlayer.currentPosition + deltaMs).coerceIn(0L, maxPos)
        exoPlayer.seekTo(newPos)
        currentPositionMs = newPos
        showControls = true
        controlsResetTrigger++
    }

    // Intro detection
    val introStart = episode?.introStart ?: mediaItem.introStart
    val introEnd = episode?.introEnd ?: mediaItem.introEnd
    val inIntro = introStart != null && introEnd != null &&
            (currentPositionMs / 1000.0) >= introStart &&
            (currentPositionMs / 1000.0) <= introEnd

    fun skipIntro() {
        if (introEnd != null) {
            val targetMs = (introEnd * 1000).toLong()
            exoPlayer.seekTo(targetMs)
            currentPositionMs = targetMs
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

    // Listen to player events
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
            .focusRequester(focusRequester)
            .focusable()
            .onPreviewKeyEvent { event ->
                if (event.nativeKeyEvent.action == KeyEvent.ACTION_DOWN) {
                    when (event.nativeKeyEvent.keyCode) {
                        KeyEvent.KEYCODE_DPAD_LEFT,
                        KeyEvent.KEYCODE_MEDIA_REWIND,
                        KeyEvent.KEYCODE_MINUS -> {
                            seekBy(-10000)
                            true
                        }

                        KeyEvent.KEYCODE_DPAD_RIGHT,
                        KeyEvent.KEYCODE_MEDIA_FAST_FORWARD,
                        KeyEvent.KEYCODE_EQUALS -> {
                            seekBy(10000)
                            true
                        }

                        KeyEvent.KEYCODE_SPACE,
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

                        KeyEvent.KEYCODE_DPAD_UP,
                        KeyEvent.KEYCODE_DPAD_DOWN -> {
                            showControls = true
                            controlsResetTrigger++
                            true
                        }

                        KeyEvent.KEYCODE_BACK,
                        KeyEvent.KEYCODE_ESCAPE -> {
                            // Save progress before leaving
                            scope.launch {
                                repository.updateProgress(
                                    mediaItemId = mediaItem.id,
                                    positionSeconds = (exoPlayer.currentPosition / 1000.0),
                                    durationSeconds = (exoPlayer.duration / 1000.0),
                                    episodeId = episode?.id
                                )
                            }
                            onClose()
                            true
                        }

                        else -> false
                    }
                } else false
            }
    ) {
        LaunchedEffect(Unit) {
            focusRequester.requestFocus()
        }

        // ExoPlayer View (explicitly non-focusable so Compose keeps remote D-pad focus)
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

        // "Skip Intro" Banner overlay
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
                    contentPadding = PaddingValues(horizontal = 20.dp, vertical = 12.dp)
                ) {
                    Text(
                        text = "⏭  Skip Intro  [Press Enter / OK]",
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        color = Color.White
                    )
                }
            }
        }

        // TV Player Controls Overlay
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
                                Color.Black.copy(alpha = 0.75f),
                                Color.Transparent,
                                Color.Black.copy(alpha = 0.9f)
                            )
                        )
                    )
                    .padding(horizontal = 48.dp, vertical = 28.dp)
            ) {
                // Top header: title and close
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .align(Alignment.TopCenter),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
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
                                fontSize = 14.sp,
                                color = Color.LightGray
                            )
                        }
                    }

                    Button(
                        onClick = {
                            scope.launch {
                                repository.updateProgress(
                                    mediaItemId = mediaItem.id,
                                    positionSeconds = (exoPlayer.currentPosition / 1000.0),
                                    durationSeconds = (exoPlayer.duration / 1000.0),
                                    episodeId = episode?.id
                                )
                            }
                            onClose()
                        },
                        colors = ButtonDefaults.colors(
                            containerColor = Color.White.copy(alpha = 0.15f),
                            focusedContainerColor = BrightBlue
                        ),
                        shape = ButtonDefaults.shape(RoundedCornerShape(6.dp))
                    ) {
                        Text("✕ Exit [Esc]", fontSize = 12.sp, color = Color.White, fontWeight = FontWeight.SemiBold)
                    }
                }

                // Bottom Timeline & Transport
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .align(Alignment.BottomCenter)
                ) {
                    // Timeline track
                    val progressFraction = if (durationMs > 0) {
                        (currentPositionMs.toFloat() / durationMs.toFloat()).coerceIn(0f, 1f)
                    } else 0f

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .background(Color.White.copy(alpha = 0.25f), RoundedCornerShape(4.dp))
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(progressFraction)
                                .height(8.dp)
                                .background(BrightBlue, RoundedCornerShape(4.dp))
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = formatTime(currentPositionMs),
                            fontSize = 14.sp,
                            color = Color.White,
                            fontWeight = FontWeight.SemiBold
                        )

                        // Interactive / D-Pad Transport Controls
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Button(
                                onClick = { seekBy(-10000) },
                                colors = ButtonDefaults.colors(
                                    containerColor = Color.White.copy(alpha = 0.12f),
                                    focusedContainerColor = BrightBlue
                                ),
                                shape = ButtonDefaults.shape(RoundedCornerShape(6.dp)),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                            ) {
                                Text("⏪ -10s [◀]", fontSize = 12.sp, color = Color.White)
                            }

                            Button(
                                onClick = { togglePlayPause() },
                                colors = ButtonDefaults.colors(
                                    containerColor = RoyalBlue,
                                    focusedContainerColor = BrightBlue
                                ),
                                shape = ButtonDefaults.shape(RoundedCornerShape(6.dp)),
                                contentPadding = PaddingValues(horizontal = 18.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    if (isPlaying) "⏸ Pause" else "▶ Play",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            }

                            Button(
                                onClick = { seekBy(10000) },
                                colors = ButtonDefaults.colors(
                                    containerColor = Color.White.copy(alpha = 0.12f),
                                    focusedContainerColor = BrightBlue
                                ),
                                shape = ButtonDefaults.shape(RoundedCornerShape(6.dp)),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                            ) {
                                Text("⏩ +10s [▶]", fontSize = 12.sp, color = Color.White)
                            }

                            if (introEnd != null) {
                                Button(
                                    onClick = { skipIntro() },
                                    colors = ButtonDefaults.colors(
                                        containerColor = Color.White.copy(alpha = 0.12f),
                                        focusedContainerColor = BrightBlue
                                    ),
                                    shape = ButtonDefaults.shape(RoundedCornerShape(6.dp)),
                                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                                ) {
                                    Text("⏭ Skip Intro", fontSize = 12.sp, color = Color.White)
                                }
                            }
                        }

                        Text(
                            text = formatTime(durationMs),
                            fontSize = 14.sp,
                            color = Color.LightGray,
                            fontWeight = FontWeight.SemiBold
                        )
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
