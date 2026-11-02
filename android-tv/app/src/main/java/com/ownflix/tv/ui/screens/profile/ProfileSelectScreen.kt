package com.ownflix.tv.ui.screens.profile

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.tv.foundation.lazy.list.TvLazyRow
import androidx.tv.foundation.lazy.list.items
import androidx.tv.material3.Border
import androidx.tv.material3.Button
import androidx.tv.material3.ButtonDefaults
import androidx.tv.material3.Card
import androidx.tv.material3.CardDefaults
import androidx.tv.material3.Glow
import androidx.tv.material3.Text
import com.ownflix.tv.data.model.Profile
import com.ownflix.tv.data.repository.OwnFlixRepository
import com.ownflix.tv.data.repository.ServerPreferences
import com.ownflix.tv.ui.theme.BrightBlue
import com.ownflix.tv.ui.theme.DangerRed
import com.ownflix.tv.ui.theme.DeepDark
import com.ownflix.tv.ui.theme.RoyalBlue
import com.ownflix.tv.ui.theme.SurfaceDark
import kotlinx.coroutines.launch

@Composable
fun ProfileSelectScreen(
    prefs: ServerPreferences,
    repository: OwnFlixRepository,
    onProfileSelected: (Profile) -> Unit
) {
    var profiles by remember { mutableStateOf<List<Profile>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    // Password verification dialog state
    var passwordDialogProfile by remember { mutableStateOf<Profile?>(null) }
    var pinInput by remember { mutableStateOf("") }
    var pinError by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        val result = repository.getProfiles()
        loading = false
        if (result.isSuccess) {
            profiles = result.getOrNull() ?: emptyList()
        } else {
            error = result.exceptionOrNull()?.localizedMessage
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DeepDark),
        contentAlignment = Alignment.Center
    ) {
        if (loading) {
            Text("Loading user profiles...", fontSize = 16.sp, color = Color.Gray)
        } else if (error != null) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("Failed to load profiles", color = DangerRed, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(6.dp))
                Text(error ?: "", color = Color.Gray, fontSize = 13.sp)
            }
        } else {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = "Who's Watching?",
                    fontSize = 36.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )

                Spacer(modifier = Modifier.height(40.dp))

                TvLazyRow(
                    contentPadding = PaddingValues(horizontal = 48.dp),
                    horizontalArrangement = Arrangement.spacedBy(28.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    items(profiles, key = { it.id }) { profile ->
                        ProfileCard(
                            profile = profile,
                            onClick = {
                                if (profile.hasPassword) {
                                    passwordDialogProfile = profile
                                    pinInput = ""
                                    pinError = false
                                } else {
                                    prefs.activeProfileId = profile.id
                                    prefs.activeProfileName = profile.name
                                    onProfileSelected(profile)
                                }
                            }
                        )
                    }
                }
            }
        }

        // Profile Password Dialog
        passwordDialogProfile?.let { profile ->
            val passwordFocusRequester = remember { FocusRequester() }
            var isInputFocused by remember { mutableStateOf(false) }
            var showPassword by remember { mutableStateOf(false) }

            LaunchedEffect(profile.id) {
                kotlinx.coroutines.delay(200)
                try {
                    passwordFocusRequester.requestFocus()
                } catch (_: Exception) {}
            }

            fun submitUnlock() {
                scope.launch {
                    val ok = repository.verifyPassword(profile.id, pinInput)
                    if (ok) {
                        passwordDialogProfile = null
                        prefs.activeProfileId = profile.id
                        prefs.activeProfileName = profile.name
                        onProfileSelected(profile)
                    } else {
                        pinError = true
                    }
                }
            }

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.88f)),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    modifier = Modifier
                        .width(460.dp)
                        .background(SurfaceDark, RoundedCornerShape(16.dp))
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "🔒 Profile Lock",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Enter password for ${profile.name}",
                        fontSize = 13.sp,
                        color = Color.LightGray
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Password Input Field with active focus border and keyboard support
                    BasicTextField(
                        value = pinInput,
                        onValueChange = {
                            pinInput = it
                            pinError = false
                        },
                        singleLine = true,
                        visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Password,
                            imeAction = ImeAction.Done
                        ),
                        keyboardActions = KeyboardActions(
                            onDone = { submitUnlock() }
                        ),
                        textStyle = TextStyle(
                            color = Color.White,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.SemiBold
                        ),
                        cursorBrush = SolidColor(BrightBlue),
                        modifier = Modifier
                            .fillMaxWidth()
                            .focusRequester(passwordFocusRequester)
                            .onFocusChanged { isInputFocused = it.isFocused }
                            .border(
                                width = if (isInputFocused) 2.5.dp else 1.dp,
                                color = if (isInputFocused) BrightBlue else Color.White.copy(alpha = 0.25f),
                                shape = RoundedCornerShape(8.dp)
                            )
                            .background(Color.Black.copy(alpha = 0.7f), RoundedCornerShape(8.dp))
                            .padding(horizontal = 14.dp, vertical = 12.dp),
                        decorationBox = { innerTextField ->
                            Box(modifier = Modifier.fillMaxWidth()) {
                                if (pinInput.isEmpty()) {
                                    Text("Enter PIN or Password", color = Color.Gray, fontSize = 14.sp)
                                }
                                innerTextField()
                            }
                        }
                    )

                    if (pinError) {
                        Spacer(modifier = Modifier.height(6.dp))
                        Text("Incorrect password", color = DangerRed, fontSize = 12.sp)
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // D-Pad Friendly On-Screen Numeric Keypad for TV Remote
                    Text(
                        text = "On-Screen Keypad",
                        fontSize = 11.sp,
                        color = Color.Gray,
                        modifier = Modifier.align(Alignment.Start)
                    )
                    Spacer(modifier = Modifier.height(6.dp))

                    val keypadRow1 = listOf("1", "2", "3", "4", "5")
                    val keypadRow2 = listOf("6", "7", "8", "9", "0")

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        keypadRow1.forEach { digit ->
                            Button(
                                onClick = {
                                    pinInput += digit
                                    pinError = false
                                },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.colors(
                                    containerColor = Color.White.copy(alpha = 0.1f),
                                    focusedContainerColor = BrightBlue
                                ),
                                shape = ButtonDefaults.shape(RoundedCornerShape(6.dp)),
                                contentPadding = PaddingValues(vertical = 8.dp)
                            ) {
                                Text(digit, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        keypadRow2.forEach { digit ->
                            Button(
                                onClick = {
                                    pinInput += digit
                                    pinError = false
                                },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.colors(
                                    containerColor = Color.White.copy(alpha = 0.1f),
                                    focusedContainerColor = BrightBlue
                                ),
                                shape = ButtonDefaults.shape(RoundedCornerShape(6.dp)),
                                contentPadding = PaddingValues(vertical = 8.dp)
                            ) {
                                Text(digit, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Button(
                            onClick = {
                                if (pinInput.isNotEmpty()) {
                                    pinInput = pinInput.dropLast(1)
                                    pinError = false
                                }
                            },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.colors(
                                containerColor = Color.White.copy(alpha = 0.08f),
                                focusedContainerColor = BrightBlue
                            ),
                            shape = ButtonDefaults.shape(RoundedCornerShape(6.dp)),
                            contentPadding = PaddingValues(vertical = 8.dp)
                        ) {
                            Text("⌫ Delete", fontSize = 12.sp)
                        }

                        Button(
                            onClick = {
                                pinInput = ""
                                pinError = false
                            },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.colors(
                                containerColor = Color.White.copy(alpha = 0.08f),
                                focusedContainerColor = BrightBlue
                            ),
                            shape = ButtonDefaults.shape(RoundedCornerShape(6.dp)),
                            contentPadding = PaddingValues(vertical = 8.dp)
                        ) {
                            Text("Clear", fontSize = 12.sp)
                        }

                        Button(
                            onClick = { showPassword = !showPassword },
                            modifier = Modifier.weight(1.2f),
                            colors = ButtonDefaults.colors(
                                containerColor = Color.White.copy(alpha = 0.08f),
                                focusedContainerColor = BrightBlue
                            ),
                            shape = ButtonDefaults.shape(RoundedCornerShape(6.dp)),
                            contentPadding = PaddingValues(vertical = 8.dp)
                        ) {
                            Text(if (showPassword) "Hide" else "Show", fontSize = 12.sp)
                        }
                    }

                    Spacer(modifier = Modifier.height(18.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Button(
                            onClick = { submitUnlock() },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.colors(
                                containerColor = RoyalBlue,
                                focusedContainerColor = BrightBlue
                            )
                        ) {
                            Text("Unlock", fontWeight = FontWeight.Bold)
                        }

                        Button(
                            onClick = {
                                passwordDialogProfile = null
                                pinInput = ""
                                pinError = false
                            },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.colors(
                                containerColor = Color.White.copy(alpha = 0.15f),
                                focusedContainerColor = Color.White.copy(alpha = 0.3f)
                            )
                        ) {
                            Text("Cancel")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ProfileCard(
    profile: Profile,
    onClick: () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isFocused by interactionSource.collectIsFocusedAsState()
    val scale by animateFloatAsState(if (isFocused) 1.12f else 1.0f, label = "profileScale")

    // Parse hex avatarColor safely
    val parsedColor = remember(profile.avatarColor) {
        try {
            Color(android.graphics.Color.parseColor(profile.avatarColor))
        } catch (e: Exception) {
            RoyalBlue
        }
    }

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.width(130.dp)
    ) {
        Card(
            onClick = onClick,
            interactionSource = interactionSource,
            modifier = Modifier
                .size(110.dp)
                .scale(scale),
            shape = CardDefaults.shape(RoundedCornerShape(12.dp)),
            colors = CardDefaults.colors(
                containerColor = parsedColor,
                focusedContainerColor = parsedColor
            ),
            border = CardDefaults.border(
                border = Border(BorderStroke(2.dp, Color.Transparent)),
                focusedBorder = Border(BorderStroke(3.dp, Color.White))
            ),
            glow = CardDefaults.glow(
                focusedGlow = Glow(elevationColor = Color.White.copy(alpha = 0.5f), elevation = 16.dp)
            )
        ) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                // Emoji or icon letter
                Text(
                    text = if (profile.avatarIcon.startsWith("emoji:")) {
                        profile.avatarIcon.removePrefix("emoji:")
                    } else if (profile.avatarIcon.isNotBlank()) {
                        profile.avatarIcon.take(2).uppercase()
                    } else {
                        profile.name.take(1).uppercase()
                    },
                    fontSize = 38.sp,
                    color = Color.White
                )

                if (profile.hasPassword) {
                    Box(
                        modifier = Modifier
                            .align(Alignment.BottomEnd)
                            .padding(6.dp)
                            .background(Color.Black.copy(alpha = 0.7f), RoundedCornerShape(4.dp))
                            .padding(horizontal = 4.dp, vertical = 2.dp)
                    ) {
                        Text("🔒", fontSize = 10.sp)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        Text(
            text = profile.name,
            fontSize = 15.sp,
            fontWeight = if (isFocused) FontWeight.Bold else FontWeight.Medium,
            color = if (isFocused) Color.White else Color.Gray,
            maxLines = 1
        )
    }
}
