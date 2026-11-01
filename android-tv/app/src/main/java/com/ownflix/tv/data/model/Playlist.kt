package com.ownflix.tv.data.model

import com.google.gson.annotations.SerializedName

data class Playlist(
    @SerializedName("id") val id: String,
    @SerializedName("title") val title: String,
    @SerializedName("description") val description: String? = null,
    @SerializedName("isPublic") val isPublic: Boolean = true,
    @SerializedName("shareCode") val shareCode: String? = null,
    @SerializedName("profileId") val profileId: String,
    @SerializedName("items") val items: List<PlaylistItem> = emptyList()
) {
    val isDefaultMyList: Boolean
        get() = title.equals("My List", ignoreCase = true)
}

data class PlaylistItem(
    @SerializedName("id") val id: String,
    @SerializedName("playlistId") val playlistId: String,
    @SerializedName("mediaItemId") val mediaItemId: String,
    @SerializedName("mediaItem") val mediaItem: MediaItem,
    @SerializedName("order") val order: Int = 0
)
