package com.ownflix.tv.ui.screens.server

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.tv.material3.Button
import androidx.tv.material3.ButtonDefaults
import androidx.tv.material3.Text
import com.ownflix.tv.data.repository.OwnFlixRepository
import com.ownflix.tv.data.repository.ServerPreferences
import com.ownflix.tv.ui.theme.AccentGreen
import com.ownflix.tv.ui.theme.BrightBlue
import com.ownflix.tv.ui.theme.DangerRed
import com.ownflix.tv.ui.theme.DeepDark
import com.ownflix.tv.ui.theme.RoyalBlue
import com.ownflix.tv.ui.theme.SurfaceDark
import kotlinx.coroutines.launch

@Composable
fun ServerConnectScreen(
    prefs: ServerPreferences,
    repository: OwnFlixRepository,
    onConnected: () -> Unit
) {
    var serverInput by remember { mutableStateOf(prefs.serverUrl) }
    var testing by remember { mutableStateOf(false) }
    var statusMessage by remember { mutableStateOf<String?>(null) }
    var isError by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DeepDark),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .width(480.dp)
                .background(SurfaceDark, RoundedCornerShape(12.dp))
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "OWNFLIX+",
                color = RoyalBlue,
                fontSize = 28.sp,
                fontWeight = FontWeight.Black
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Connect to OwnFlix+ Streaming Server",
                fontSize = 14.sp,
                color = Color.LightGray
            )

            Spacer(modifier = Modifier.height(24.dp))

            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "Server IP / Address",
                    fontSize = 12.sp,
                    color = Color.Gray,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(6.dp))

                var isServerFieldFocused by remember { mutableStateOf(false) }

                BasicTextField(
                    value = serverInput,
                    onValueChange = { serverInput = it },
                    singleLine = true,
                    textStyle = TextStyle(
                        color = Color.White,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Medium
                    ),
                    cursorBrush = SolidColor(BrightBlue),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
                    modifier = Modifier
                        .fillMaxWidth()
                        .onFocusChanged { isServerFieldFocused = it.isFocused }
                        .border(
                            width = if (isServerFieldFocused) 2.dp else 1.dp,
                            color = if (isServerFieldFocused) BrightBlue else Color.White.copy(alpha = 0.2f),
                            shape = RoundedCornerShape(6.dp)
                        )
                        .background(Color.Black.copy(alpha = 0.6f), RoundedCornerShape(6.dp))
                        .padding(horizontal = 14.dp, vertical = 12.dp),
                    decorationBox = { innerTextField ->
                        Box(modifier = Modifier.fillMaxWidth()) {
                            if (serverInput.isEmpty()) {
                                Text("http://192.168.1.100:3000", color = Color.DarkGray, fontSize = 15.sp)
                            }
                            innerTextField()
                        }
                    }
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Quick preset buttons for convenience on TV
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = { serverInput = "http://10.0.2.2:3000" },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.colors(
                        containerColor = Color.White.copy(alpha = 0.08f),
                        focusedContainerColor = BrightBlue
                    ),
                    shape = ButtonDefaults.shape(RoundedCornerShape(4.dp))
                ) {
                    Text("Emulator (10.0.2.2)", fontSize = 11.sp, maxLines = 1)
                }

                Button(
                    onClick = { serverInput = "http://localhost:3000" },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.colors(
                        containerColor = Color.White.copy(alpha = 0.08f),
                        focusedContainerColor = BrightBlue
                    ),
                    shape = ButtonDefaults.shape(RoundedCornerShape(4.dp))
                ) {
                    Text("Localhost", fontSize = 11.sp, maxLines = 1)
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Connect button
            Button(
                onClick = {
                    testing = true
                    statusMessage = "Testing connection to $serverInput..."
                    isError = false
                    prefs.serverUrl = serverInput

                    scope.launch {
                        val result = repository.getProfiles()
                        testing = false
                        if (result.isSuccess) {
                            statusMessage = "Connected successfully!"
                            isError = false
                            onConnected()
                        } else {
                            statusMessage = "Failed to connect: ${result.exceptionOrNull()?.localizedMessage ?: "Unknown error"}"
                            isError = true
                        }
                    }
                },
                enabled = !testing && serverInput.isNotBlank(),
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.colors(
                    containerColor = RoyalBlue,
                    focusedContainerColor = BrightBlue
                ),
                shape = ButtonDefaults.shape(RoundedCornerShape(6.dp))
            ) {
                Text(
                    text = if (testing) "Connecting..." else "Connect Server",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
            }

            // Status message
            statusMessage?.let { msg ->
                Spacer(modifier = Modifier.height(14.dp))
                Text(
                    text = msg,
                    fontSize = 12.sp,
                    color = if (isError) DangerRed else AccentGreen,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}
