package com.ownflix.tv.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.tv.material3.Button
import androidx.tv.material3.ButtonDefaults
import androidx.tv.material3.Text
import com.ownflix.tv.ui.theme.BrightBlue
import com.ownflix.tv.ui.theme.DeepDark
import com.ownflix.tv.ui.theme.RoyalBlue

@Composable
fun TvTopBar(
    selectedTab: String,
    onTabSelected: (String) -> Unit,
    activeProfileName: String?,
    onSwitchProfile: () -> Unit,
    onOpenServerSettings: () -> Unit,
    modifier: Modifier = Modifier
) {
    val tabs = listOf("Home", "TV Shows", "Movies", "Playlists", "Search")

    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(56.dp)
            .background(DeepDark.copy(alpha = 0.95f))
            .padding(horizontal = 48.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        // Brand logo
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = "OWNFLIX+",
                color = RoyalBlue,
                fontSize = 20.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = (-0.5).sp
            )

            Spacer(modifier = Modifier.width(32.dp))

            // Navigation tabs
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                tabs.forEach { tab ->
                    val isSelected = selectedTab.equals(tab, ignoreCase = true)
                    Button(
                        onClick = { onTabSelected(tab) },
                        colors = ButtonDefaults.colors(
                            containerColor = if (isSelected) Color.White.copy(alpha = 0.15f) else Color.Transparent,
                            focusedContainerColor = BrightBlue
                        ),
                        shape = ButtonDefaults.shape(RoundedCornerShape(4.dp))
                    ) {
                        Text(
                            text = tab,
                            fontSize = 13.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                            color = Color.White
                        )
                    }
                }
            }
        }

        // Right side: Profile indicator and Server settings
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Button(
                onClick = onSwitchProfile,
                colors = ButtonDefaults.colors(
                    containerColor = Color.White.copy(alpha = 0.1f),
                    focusedContainerColor = BrightBlue
                ),
                shape = ButtonDefaults.shape(RoundedCornerShape(4.dp))
            ) {
                Text(
                    text = "👤 ${activeProfileName ?: "Profile"}",
                    fontSize = 12.sp,
                    color = Color.White
                )
            }

            Button(
                onClick = onOpenServerSettings,
                colors = ButtonDefaults.colors(
                    containerColor = Color.White.copy(alpha = 0.1f),
                    focusedContainerColor = BrightBlue
                ),
                shape = ButtonDefaults.shape(RoundedCornerShape(4.dp))
            ) {
                Text(
                    text = "⚙ Server",
                    fontSize = 12.sp,
                    color = Color.White
                )
            }
        }
    }
}
