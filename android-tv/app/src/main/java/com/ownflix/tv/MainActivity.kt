package com.ownflix.tv

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.ownflix.tv.data.model.Episode
import com.ownflix.tv.data.model.MediaItem
import com.ownflix.tv.ui.navigation.Screen
import com.ownflix.tv.ui.screens.detail.MediaDetailScreen
import com.ownflix.tv.ui.screens.home.HomeScreen
import com.ownflix.tv.ui.screens.player.PlayerScreen
import com.ownflix.tv.ui.screens.playlists.PlaylistsScreen
import com.ownflix.tv.ui.screens.profile.ProfileSelectScreen
import com.ownflix.tv.ui.screens.search.SearchScreen
import com.ownflix.tv.ui.screens.server.ServerConnectScreen
import com.ownflix.tv.ui.theme.OwnFlixTvTheme

import android.view.KeyEvent

class MainActivity : ComponentActivity() {

    companion object {
        var activePlayerKeyHandler: ((KeyEvent) -> Boolean)? = null
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (activePlayerKeyHandler?.invoke(event) == true) {
            return true
        }
        return super.dispatchKeyEvent(event)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val app = application as OwnFlixTvApplication
        val prefs = app.serverPreferences
        val repository = app.repository

        setContent {
            OwnFlixTvTheme {
                OwnFlixTvNavHost(prefs = prefs, repository = repository)
            }
        }
    }
}

@Composable
fun OwnFlixTvNavHost(
    prefs: com.ownflix.tv.data.repository.ServerPreferences,
    repository: com.ownflix.tv.data.repository.OwnFlixRepository
) {
    // Initial destination: If active profile is stored, go to Home, else ProfileSelect, else ServerConnect
    var currentScreen by remember {
        mutableStateOf<Screen>(
            if (prefs.activeProfileId != null) Screen.Home
            else Screen.ProfileSelect
        )
    }

    // Active detail and player parameters
    var selectedMediaId by remember { mutableStateOf<String?>(null) }
    var activePlayingItem by remember { mutableStateOf<MediaItem?>(null) }
    var activePlayingEpisode by remember { mutableStateOf<Episode?>(null) }

    // Back handler management for Android TV remote
    BackHandler(enabled = currentScreen != Screen.Home && currentScreen != Screen.ProfileSelect) {
        when (currentScreen) {
            is Screen.MediaDetail -> currentScreen = Screen.Home
            is Screen.Player -> {
                activePlayingItem = null
                activePlayingEpisode = null
                currentScreen = if (selectedMediaId != null) Screen.MediaDetail else Screen.Home
            }
            is Screen.Playlists, is Screen.Search -> currentScreen = Screen.Home
            is Screen.ServerConnect -> {
                if (prefs.activeProfileId != null) currentScreen = Screen.Home
                else currentScreen = Screen.ProfileSelect
            }
            else -> {}
        }
    }

    when (currentScreen) {
        is Screen.ServerConnect -> {
            ServerConnectScreen(
                prefs = prefs,
                repository = repository,
                onConnected = {
                    currentScreen = Screen.ProfileSelect
                }
            )
        }

        is Screen.ProfileSelect -> {
            ProfileSelectScreen(
                prefs = prefs,
                repository = repository,
                onProfileSelected = {
                    currentScreen = Screen.Home
                }
            )
        }

        is Screen.Home -> {
            HomeScreen(
                prefs = prefs,
                repository = repository,
                onMediaClick = { media ->
                    selectedMediaId = media.id
                    currentScreen = Screen.MediaDetail
                },
                onPlayClick = { media ->
                    activePlayingItem = media
                    activePlayingEpisode = null
                    currentScreen = Screen.Player
                },
                onSwitchProfile = {
                    prefs.clearProfile()
                    currentScreen = Screen.ProfileSelect
                },
                onOpenServerSettings = {
                    currentScreen = Screen.ServerConnect
                },
                onNavigateTab = { tab ->
                    when (tab.lowercase()) {
                        "search" -> currentScreen = Screen.Search
                        "playlists" -> currentScreen = Screen.Playlists
                        "home" -> currentScreen = Screen.Home
                    }
                }
            )
        }

        is Screen.MediaDetail -> {
            selectedMediaId?.let { id ->
                MediaDetailScreen(
                    mediaId = id,
                    repository = repository,
                    onPlay = { media, ep ->
                        activePlayingItem = media
                        activePlayingEpisode = ep
                        currentScreen = Screen.Player
                    },
                    onBack = {
                        currentScreen = Screen.Home
                    }
                )
            }
        }

        is Screen.Player -> {
            activePlayingItem?.let { media ->
                PlayerScreen(
                    mediaItem = media,
                    episode = activePlayingEpisode,
                    repository = repository,
                    onClose = {
                        activePlayingItem = null
                        activePlayingEpisode = null
                        currentScreen = if (selectedMediaId != null) Screen.MediaDetail else Screen.Home
                    }
                )
            }
        }

        is Screen.Playlists -> {
            PlaylistsScreen(
                repository = repository,
                onMediaClick = { media ->
                    selectedMediaId = media.id
                    currentScreen = Screen.MediaDetail
                },
                onBack = {
                    currentScreen = Screen.Home
                }
            )
        }

        is Screen.Search -> {
            SearchScreen(
                repository = repository,
                onMediaClick = { media ->
                    selectedMediaId = media.id
                    currentScreen = Screen.MediaDetail
                },
                onBack = {
                    currentScreen = Screen.Home
                }
            )
        }
    }
}
