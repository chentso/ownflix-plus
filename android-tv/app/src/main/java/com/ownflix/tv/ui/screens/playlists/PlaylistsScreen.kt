package com.ownflix.tv.ui.screens.playlists

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.tv.foundation.lazy.grid.TvGridCells
import androidx.tv.foundation.lazy.grid.TvLazyVerticalGrid
import androidx.tv.foundation.lazy.grid.items
import androidx.tv.material3.Button
import androidx.tv.material3.ButtonDefaults
import androidx.tv.material3.Card
import androidx.tv.material3.CardDefaults
import androidx.tv.material3.Text
import coil.compose.AsyncImage
import com.ownflix.tv.data.model.MediaItem
import com.ownflix.tv.data.model.Playlist
import com.ownflix.tv.data.repository.OwnFlixRepository
import com.ownflix.tv.ui.components.MediaRow
import com.ownflix.tv.ui.theme.BrightBlue
import com.ownflix.tv.ui.theme.DeepDark
import com.ownflix.tv.ui.theme.RoyalBlue
import com.ownflix.tv.ui.theme.SurfaceCard

@Composable
fun PlaylistsScreen(
    repository: OwnFlixRepository,
    onMediaClick: (MediaItem) -> Unit,
    onBack: () -> Unit
) {
    var playlists by remember { mutableStateOf<List<Playlist>>(emptyList()) }
    var selectedPlaylist by remember { mutableStateOf<Playlist?>(null) }
    var loading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        val res = repository.getPlaylists()
        loading = false
        if (res.isSuccess) {
            playlists = res.getOrNull() ?: emptyList()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DeepDark)
            .padding(horizontal = 48.dp, vertical = 28.dp)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = if (selectedPlaylist != null) selectedPlaylist!!.title else "Playlists & My List",
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = if (selectedPlaylist != null) {
                            selectedPlaylist!!.description ?: "${selectedPlaylist!!.items.size} titles"
                        } else {
                            "Your personal watchlist and custom playlists"
                        },
                        fontSize = 13.sp,
                        color = Color.Gray
                    )
                }

                Button(
                    onClick = {
                        if (selectedPlaylist != null) selectedPlaylist = null else onBack()
                    },
                    colors = ButtonDefaults.colors(
                        containerColor = Color.White.copy(alpha = 0.12f),
                        focusedContainerColor = BrightBlue
                    ),
                    shape = ButtonDefaults.shape(RoundedCornerShape(4.dp))
                ) {
                    Text("← Back", fontSize = 12.sp, color = Color.White)
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            if (selectedPlaylist != null) {
                // Expanded playlist item row
                val items = selectedPlaylist!!.items.map { it.mediaItem }
                if (items.isEmpty()) {
                    Text("This playlist has no items yet.", color = Color.Gray, fontSize = 14.sp)
                } else {
                    MediaRow(
                        title = "Playlist Titles (${items.size})",
                        items = items,
                        onItemClick = onMediaClick
                    )
                }
            } else {
                // Playlists Grid
                TvLazyVerticalGrid(
                    columns = TvGridCells.Fixed(3),
                    horizontalArrangement = Arrangement.spacedBy(20.dp),
                    verticalArrangement = Arrangement.spacedBy(20.dp),
                    contentPadding = PaddingValues(bottom = 40.dp)
                ) {
                    items(playlists, key = { it.id }) { playlist ->
                        PlaylistCard(
                            playlist = playlist,
                            onClick = { selectedPlaylist = playlist }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun PlaylistCard(
    playlist: Playlist,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        colors = CardDefaults.colors(containerColor = SurfaceCard),
        shape = CardDefaults.shape(RoundedCornerShape(8.dp)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(16f / 9f)
                    .background(Color.Black)
            ) {
                val firstPoster = playlist.items.firstOrNull()?.mediaItem?.backdropUrl
                    ?: playlist.items.firstOrNull()?.mediaItem?.posterUrl
                if (firstPoster != null) {
                    AsyncImage(
                        model = firstPoster,
                        contentDescription = playlist.title,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                }

                // Default My List badge
                if (playlist.isDefaultMyList) {
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopStart)
                            .padding(8.dp)
                            .background(RoyalBlue, RoundedCornerShape(4.dp))
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = "★ DEFAULT LIST",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White
                        )
                    }
                }
            }

            Column(modifier = Modifier.padding(12.dp)) {
                Text(
                    text = playlist.title,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "${playlist.items.size} titles",
                    fontSize = 12.sp,
                    color = Color.LightGray
                )
            }
        }
    }
}
