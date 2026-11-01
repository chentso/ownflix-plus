package com.ownflix.tv.ui.navigation

sealed class Screen(val route: String) {
    data object ServerConnect : Screen("server_connect")
    data object ProfileSelect : Screen("profile_select")
    data object Home : Screen("home")
    data object MediaDetail : Screen("media_detail/{mediaId}") {
        fun createRoute(mediaId: String) = "media_detail/$mediaId"
    }
    data object Player : Screen("player/{mediaId}?episodeId={episodeId}") {
        fun createRoute(mediaId: String, episodeId: String? = null): String {
            return if (!episodeId.isNullOrBlank()) {
                "player/$mediaId?episodeId=$episodeId"
            } else {
                "player/$mediaId"
            }
        }
    }
    data object Playlists : Screen("playlists")
    data object Search : Screen("search")
}
