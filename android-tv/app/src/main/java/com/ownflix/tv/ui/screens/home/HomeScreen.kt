package com.ownflix.tv.ui.screens.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.tv.foundation.lazy.list.TvLazyColumn
import androidx.tv.material3.Text
import com.ownflix.tv.data.model.MediaItem
import com.ownflix.tv.data.repository.OwnFlixRepository
import com.ownflix.tv.data.repository.ServerPreferences
import com.ownflix.tv.ui.components.HeroBillboard
import com.ownflix.tv.ui.components.MediaRow
import com.ownflix.tv.ui.components.TvTopBar
import com.ownflix.tv.ui.theme.DeepDark

@Composable
fun HomeScreen(
    prefs: ServerPreferences,
    repository: OwnFlixRepository,
    onMediaClick: (MediaItem) -> Unit,
    onPlayClick: (MediaItem) -> Unit,
    onSwitchProfile: () -> Unit,
    onOpenServerSettings: () -> Unit,
    onNavigateTab: (String) -> Unit
) {
    var allMedia by remember { mutableStateOf<List<MediaItem>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var currentTab by remember { mutableStateOf("Home") }

    LaunchedEffect(prefs.activeProfileId) {
        val result = repository.getMedia()
        loading = false
        if (result.isSuccess) {
            allMedia = result.getOrNull() ?: emptyList()
        }
    }

    // Featured billboard item
    val billboardItem = remember(allMedia) {
        allMedia.firstOrNull { it.isFeatured } ?: allMedia.firstOrNull()
    }

    // Categorized swimlanes
    val continueWatching = remember(allMedia) {
        allMedia.filter { it.progress != null && !it.progress.completed }
    }
    val myListItems = remember(allMedia) {
        allMedia.filter { it.inMyList }
    }
    val movies = remember(allMedia) {
        allMedia.filter { !it.isSeries }
    }
    val series = remember(allMedia) {
        allMedia.filter { it.isSeries }
    }
    val localDiskItems = remember(allMedia) {
        allMedia.filter { it.isLocal }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DeepDark)
    ) {
        if (loading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(48.dp),
                contentAlignment = androidx.compose.ui.Alignment.Center
            ) {
                Text("Loading OwnFlix+ media catalog...", color = Color.Gray, fontSize = 16.sp)
            }
        } else {
            TvLazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(bottom = 60.dp)
            ) {
                // Top Navigation Bar
                item {
                    TvTopBar(
                        selectedTab = currentTab,
                        onTabSelected = { tab ->
                            currentTab = tab
                            onNavigateTab(tab)
                        },
                        activeProfileName = prefs.activeProfileName,
                        onSwitchProfile = onSwitchProfile,
                        onOpenServerSettings = onOpenServerSettings
                    )
                }

                // Cinematic Hero Billboard
                item {
                    HeroBillboard(
                        item = billboardItem,
                        onPlay = onPlayClick,
                        onDetails = onMediaClick
                    )
                }

                // Swimlane 1: Continue Watching
                if (continueWatching.isNotEmpty()) {
                    item {
                        MediaRow(
                            title = "Continue Watching",
                            items = continueWatching,
                            onItemClick = onMediaClick
                        )
                    }
                }

                // Swimlane 2: My List (Default Playlist)
                if (myListItems.isNotEmpty()) {
                    item {
                        MediaRow(
                            title = "My List",
                            items = myListItems,
                            onItemClick = onMediaClick
                        )
                    }
                }

                // Swimlane 3: Trending Movies
                if (movies.isNotEmpty()) {
                    item {
                        MediaRow(
                            title = "Trending Movies",
                            items = movies,
                            onItemClick = onMediaClick
                        )
                    }
                }

                // Swimlane 4: TV Shows & Series
                if (series.isNotEmpty()) {
                    item {
                        MediaRow(
                            title = "TV Series & Shows",
                            items = series,
                            onItemClick = onMediaClick
                        )
                    }
                }

                // Swimlane 5: Local Disk Direct Streams
                if (localDiskItems.isNotEmpty()) {
                    item {
                        MediaRow(
                            title = "Streamed from Your Local Disk",
                            items = localDiskItems,
                            onItemClick = onMediaClick
                        )
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(24.dp))
                }
            }
        }
    }
}
