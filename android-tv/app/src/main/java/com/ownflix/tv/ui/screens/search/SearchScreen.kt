package com.ownflix.tv.ui.screens.search

import androidx.compose.foundation.background
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
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.tv.foundation.lazy.grid.TvGridCells
import androidx.tv.foundation.lazy.grid.TvLazyVerticalGrid
import androidx.tv.foundation.lazy.grid.items
import androidx.tv.material3.Button
import androidx.tv.material3.ButtonDefaults
import androidx.tv.material3.Text
import com.ownflix.tv.data.model.MediaItem
import com.ownflix.tv.data.repository.OwnFlixRepository
import com.ownflix.tv.ui.components.MediaCard
import com.ownflix.tv.ui.theme.BrightBlue
import com.ownflix.tv.ui.theme.DeepDark

@Composable
fun SearchScreen(
    repository: OwnFlixRepository,
    onMediaClick: (MediaItem) -> Unit,
    onBack: () -> Unit
) {
    var allMedia by remember { mutableStateOf<List<MediaItem>>(emptyList()) }
    var searchQuery by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        val res = repository.getMedia()
        if (res.isSuccess) {
            allMedia = res.getOrNull() ?: emptyList()
        }
    }

    val filteredMedia = remember(searchQuery, allMedia) {
        if (searchQuery.isBlank()) emptyList()
        else {
            val q = searchQuery.trim().lowercase()
            allMedia.filter {
                it.title.lowercase().contains(q) ||
                        it.genres.lowercase().contains(q) ||
                        it.cast.lowercase().contains(q) ||
                        (it.director?.lowercase()?.contains(q) == true)
            }
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
                // Search Input Box
                BasicTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    singleLine = true,
                    textStyle = TextStyle(
                        color = Color.White,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Medium
                    ),
                    cursorBrush = SolidColor(BrightBlue),
                    modifier = Modifier.width(480.dp),
                    decorationBox = { innerTextField ->
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color.White.copy(alpha = 0.1f), RoundedCornerShape(8.dp))
                                .padding(horizontal = 16.dp, vertical = 12.dp)
                        ) {
                            if (searchQuery.isEmpty()) {
                                Text(
                                    text = "🔍 Search movies, shows, actors, genres...",
                                    color = Color.Gray,
                                    fontSize = 15.sp
                                )
                            }
                            innerTextField()
                        }
                    }
                )

                Button(
                    onClick = onBack,
                    colors = ButtonDefaults.colors(
                        containerColor = Color.White.copy(alpha = 0.12f),
                        focusedContainerColor = BrightBlue
                    ),
                    shape = ButtonDefaults.shape(RoundedCornerShape(4.dp))
                ) {
                    Text("← Back to Browse", fontSize = 12.sp, color = Color.White)
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            if (searchQuery.isNotBlank() && filteredMedia.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No results found for \"$searchQuery\"",
                        color = Color.Gray,
                        fontSize = 16.sp
                    )
                }
            } else {
                TvLazyVerticalGrid(
                    columns = TvGridCells.Fixed(5),
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                    contentPadding = PaddingValues(bottom = 40.dp)
                ) {
                    items(filteredMedia, key = { it.id }) { item ->
                        MediaCard(
                            item = item,
                            onClick = { onMediaClick(item) }
                        )
                    }
                }
            }
        }
    }
}
