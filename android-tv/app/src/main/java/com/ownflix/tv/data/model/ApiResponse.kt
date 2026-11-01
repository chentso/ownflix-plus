package com.ownflix.tv.data.model

import com.google.gson.annotations.SerializedName

data class MediaListResponse(
    @SerializedName("items") val items: List<MediaItem> = emptyList()
)

data class MediaDetailResponse(
    @SerializedName("item") val item: MediaItem
)

data class ProfilesResponse(
    @SerializedName("profiles") val profiles: List<Profile> = emptyList()
)

data class PlaylistsResponse(
    @SerializedName("playlists") val playlists: List<Playlist> = emptyList()
)

data class MyListToggleRequest(
    @SerializedName("profileId") val profileId: String,
    @SerializedName("mediaItemId") val mediaItemId: String
)

data class MyListToggleResponse(
    @SerializedName("inMyList") val inMyList: Boolean
)
