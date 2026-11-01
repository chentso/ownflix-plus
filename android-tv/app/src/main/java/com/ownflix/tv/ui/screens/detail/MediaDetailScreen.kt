package com.ownflix.tv.ui.screens.detail

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
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.tv.foundation.lazy.list.TvLazyColumn
import androidx.tv.foundation.lazy.list.TvLazyRow
import androidx.tv.foundation.lazy.list.items
import androidx.tv.material3.Button
import androidx.tv.material3.ButtonDefaults
import androidx.tv.material3.Card
import androidx.tv.material3.CardDefaults
import androidx.tv.material3.Text
import coil.compose.AsyncImage
import com.ownflix.tv.data.model.Episode
import com.ownflix.tv.data.model.MediaItem
import com.ownflix.tv.data.repository.OwnFlixRepository
import com.ownflix.tv.ui.theme.AccentGreen
import com.ownflix.tv.ui.theme.BrightBlue
import com.ownflix.tv.ui.theme.DangerRed
import com.ownflix.tv.ui.theme.DeepDark
import com.ownflix.tv.ui.theme.RoyalBlue
import com.ownflix.tv.ui.theme.SurfaceCard
import kotlinx.coroutines.launch

@Composable
fun MediaDetailScreen(
    mediaId: String,
    repository: OwnFlixRepository,
    onPlay: (MediaItem, Episode?) -> Unit,
    onBack: () -> Unit
) {
    var item by remember { mutableStateOf<MediaItem?>(null) }
    var loading by remember { mutableStateOf(true) }
    var inMyList by remember { mutableStateOf(false) }
    var markedForDeletion by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(mediaId) {
        val result = repository.getMediaDetail(mediaId)
        loading = false
        if (result.isSuccess) {
            item = result.getOrNull()
            inMyList = item?.inMyList ?: false
            markedForDeletion = item?.markedForDeletion ?: false
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DeepDark)
    ) {
        val currentItem = item
        if (loading || currentItem == null) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("Loading title details...", color = Color.Gray, fontSize = 16.sp)
            }
            return
        }

        // Fullscreen Backdrop Image with Gradients
        AsyncImage(
            model = currentItem.backdropUrl ?: currentItem.posterUrl,
            contentDescription = currentItem.title,
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize()
        )

        // Dark Vignettes
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.horizontalGradient(
                        colors = listOf(
                            DeepDark,
                            DeepDark.copy(alpha = 0.95f),
                            DeepDark.copy(alpha = 0.6f),
                            DeepDark.copy(alpha = 0.2f)
                        )
                    )
                )
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(Color.Transparent, DeepDark.copy(alpha = 0.8f), DeepDark)
                    )
                )
        )

        // Detail Content
        TvLazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 48.dp, vertical = 32.dp)
        ) {
            item {
                // Back button
                Button(
                    onClick = onBack,
                    colors = ButtonDefaults.colors(
                        containerColor = Color.White.copy(alpha = 0.1f),
                        focusedContainerColor = BrightBlue
                    ),
                    shape = ButtonDefaults.shape(RoundedCornerShape(4.dp))
                ) {
                    Text("← Back to Browse", fontSize = 12.sp, color = Color.White)
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Title
                Text(
                    text = currentItem.title,
                    fontSize = 38.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Badges
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "${currentItem.matchScore}% Match",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = AccentGreen
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(text = currentItem.releaseYear.toString(), fontSize = 14.sp, color = Color.LightGray)
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = currentItem.maturityRating,
                        fontSize = 12.sp,
                        color = Color.White,
                        modifier = Modifier
                            .background(Color.White.copy(alpha = 0.2f), RoundedCornerShape(3.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(text = currentItem.resolution, fontSize = 13.sp, color = Color.LightGray)
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = if (currentItem.isSeries) "${currentItem.episodes.size} Episodes" else currentItem.formattedDuration(),
                        fontSize = 13.sp,
                        color = Color.LightGray
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Overview
                Text(
                    text = currentItem.overview,
                    fontSize = 14.sp,
                    color = Color.LightGray,
                    lineHeight = 20.sp,
                    modifier = Modifier.width(620.dp)
                )

                Spacer(modifier = Modifier.height(20.dp))

                // Action Buttons
                Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    Button(
                        onClick = { onPlay(currentItem, null) },
                        colors = ButtonDefaults.colors(
                            containerColor = Color.White,
                            focusedContainerColor = BrightBlue
                        ),
                        shape = ButtonDefaults.shape(RoundedCornerShape(6.dp))
                    ) {
                        Text(
                            text = if (currentItem.progress != null && !currentItem.progress.completed) "▶  Resume" else "▶  Play",
                            fontWeight = FontWeight.Bold,
                            color = Color.Black
                        )
                    }

                    // Add to My List Toggle
                    Button(
                        onClick = {
                            scope.launch {
                                val result = repository.toggleMyList(currentItem.id)
                                if (result.isSuccess) {
                                    inMyList = result.getOrNull() ?: false
                                }
                            }
                        },
                        colors = ButtonDefaults.colors(
                            containerColor = if (inMyList) RoyalBlue else Color.White.copy(alpha = 0.15f),
                            focusedContainerColor = BrightBlue
                        ),
                        shape = ButtonDefaults.shape(RoundedCornerShape(6.dp))
                    ) {
                        Text(
                            text = if (inMyList) "✓  In My List" else "+  Add to My List",
                            fontWeight = FontWeight.SemiBold,
                            color = Color.White
                        )
                    }

                    // Mark for Deletion Option
                    Button(
                        onClick = {
                            scope.launch {
                                val nextState = !markedForDeletion
                                val res = repository.markForDeletion(currentItem.id, nextState)
                                if (res.isSuccess) {
                                    markedForDeletion = nextState
                                }
                            }
                        },
                        colors = ButtonDefaults.colors(
                            containerColor = if (markedForDeletion) DangerRed.copy(alpha = 0.8f) else Color.White.copy(alpha = 0.1f),
                            focusedContainerColor = DangerRed
                        ),
                        shape = ButtonDefaults.shape(RoundedCornerShape(6.dp))
                    ) {
                        Text(
                            text = if (markedForDeletion) "🗑 Flagged for Deletion" else "Mark for Deletion",
                            fontSize = 12.sp,
                            color = Color.White
                        )
                    }
                }

                Spacer(modifier = Modifier.height(32.dp))
            }

            // Series Episodes Row
            if (currentItem.isSeries && currentItem.episodes.isNotEmpty()) {
                item {
                    Text(
                        text = "Episodes",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )

                    TvLazyRow(
                        contentPadding = PaddingValues(end = 48.dp),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        items(currentItem.episodes, key = { it.id }) { ep ->
                            EpisodeCard(
                                episode = ep,
                                onClick = { onPlay(currentItem, ep) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun EpisodeCard(
    episode: Episode,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.width(220.dp),
        shape = CardDefaults.shape(RoundedCornerShape(6.dp)),
        colors = CardDefaults.colors(containerColor = SurfaceCard)
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(16f / 9f)
                    .background(Color.Black)
            ) {
                AsyncImage(
                    model = episode.thumbnailUrl,
                    contentDescription = episode.title,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
            }
            Column(modifier = Modifier.padding(8.dp)) {
                Text(
                    text = "S${episode.seasonNumber}:E${episode.episodeNumber} \"${episode.title}\"",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                episode.overview?.let { ov ->
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = ov,
                        fontSize = 11.sp,
                        color = Color.Gray,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }
    }
}
