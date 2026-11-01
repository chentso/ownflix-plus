package com.ownflix.tv.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.tv.material3.Button
import androidx.tv.material3.ButtonDefaults
import androidx.tv.material3.Text
import coil.compose.AsyncImage
import com.ownflix.tv.data.model.MediaItem
import com.ownflix.tv.ui.theme.AccentGreen
import com.ownflix.tv.ui.theme.BrightBlue
import com.ownflix.tv.ui.theme.DeepDark
import com.ownflix.tv.ui.theme.RoyalBlue

@Composable
fun HeroBillboard(
    item: MediaItem?,
    onPlay: (MediaItem) -> Unit,
    onDetails: (MediaItem) -> Unit,
    modifier: Modifier = Modifier
) {
    if (item == null) return

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(340.dp)
            .background(DeepDark)
    ) {
        // Backdrop Image
        AsyncImage(
            model = item.backdropUrl ?: item.posterUrl,
            contentDescription = item.title,
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize()
        )

        // Gradient vignettes for TV readability
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.horizontalGradient(
                        colors = listOf(
                            DeepDark,
                            DeepDark.copy(alpha = 0.85f),
                            DeepDark.copy(alpha = 0.4f),
                            Color.Transparent
                        )
                    )
                )
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color.Transparent,
                            DeepDark.copy(alpha = 0.8f),
                            DeepDark
                        )
                    )
                )
        )

        // Billboard Content
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(start = 48.dp, bottom = 32.dp, top = 24.dp)
                .width(520.dp),
            verticalArrangement = Arrangement.Bottom
        ) {
            // OwnFlix+ Tag
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .background(RoyalBlue, RoundedCornerShape(2.dp))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = "OWNFLIX+",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = if (item.isSeries) "SERIES" else "FILM",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.LightGray,
                    letterSpacing = 1.sp
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Title
            Text(
                text = item.title,
                fontSize = 32.sp,
                fontWeight = FontWeight.Black,
                color = Color.White,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            Spacer(modifier = Modifier.height(6.dp))

            // Metadata row
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "${item.matchScore}% Match",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = AccentGreen
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = item.releaseYear.toString(),
                    fontSize = 13.sp,
                    color = Color.LightGray
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = item.maturityRating,
                    fontSize = 11.sp,
                    color = Color.White,
                    modifier = Modifier
                        .background(Color.White.copy(alpha = 0.2f), RoundedCornerShape(3.dp))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = item.resolution,
                    fontSize = 11.sp,
                    color = Color.LightGray
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Overview
            Text(
                text = item.overview,
                fontSize = 13.sp,
                color = Color.LightGray,
                maxLines = 3,
                overflow = TextOverflow.Ellipsis,
                lineHeight = 18.sp
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Action Buttons
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Button(
                    onClick = { onPlay(item) },
                    colors = ButtonDefaults.colors(
                        containerColor = Color.White,
                        focusedContainerColor = BrightBlue
                    ),
                    shape = ButtonDefaults.shape(RoundedCornerShape(6.dp))
                ) {
                    Text(
                        text = "▶  Play",
                        fontWeight = FontWeight.Bold,
                        color = Color.Black
                    )
                }

                Button(
                    onClick = { onDetails(item) },
                    colors = ButtonDefaults.colors(
                        containerColor = Color.White.copy(alpha = 0.2f),
                        focusedContainerColor = Color.White.copy(alpha = 0.4f)
                    ),
                    shape = ButtonDefaults.shape(RoundedCornerShape(6.dp))
                ) {
                    Text(
                        text = "ⓘ  More Info",
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White
                    )
                }
            }
        }
    }
}
