package com.ownflix.tv.data.model

import com.google.gson.annotations.SerializedName

data class MediaItem(
    @SerializedName("id") val id: String,
    @SerializedName("title") val title: String,
    @SerializedName("overview") val overview: String = "",
    @SerializedName("tagline") val tagline: String? = null,
    @SerializedName("type") val type: String = "MOVIE", // "MOVIE" or "SERIES"
    @SerializedName("releaseYear") val releaseYear: Int = 2025,
    @SerializedName("maturityRating") val maturityRating: String = "PG-13",
    @SerializedName("genres") val genres: String = "",
    @SerializedName("cast") val cast: String = "",
    @SerializedName("director") val director: String? = null,
    @SerializedName("posterUrl") val posterUrl: String? = null,
    @SerializedName("backdropUrl") val backdropUrl: String? = null,
    @SerializedName("videoUrl") val videoUrl: String? = null,
    @SerializedName("filePath") val filePath: String? = null,
    @SerializedName("duration") val duration: Int = 0,
    @SerializedName("introStart") val introStart: Double? = null,
    @SerializedName("introEnd") val introEnd: Double? = null,
    @SerializedName("creditsStart") val creditsStart: Double? = null,
    @SerializedName("matchScore") val matchScore: Int = 95,
    @SerializedName("isFeatured") val isFeatured: Boolean = false,
    @SerializedName("audioTracks") val audioTracks: String = "",
    @SerializedName("subtitleTracks") val subtitleTracks: String = "",
    @SerializedName("resolution") val resolution: String = "1080p HD",
    @SerializedName("markedForDeletion") val markedForDeletion: Boolean = false,
    @SerializedName("episodes") val episodes: List<Episode> = emptyList(),
    @SerializedName("progress") val progress: WatchProgress? = null,
    @SerializedName("inMyList") val inMyList: Boolean = false
) {
    val isSeries: Boolean get() = type.equals("SERIES", ignoreCase = true)
    val isLocal: Boolean get() = !filePath.isNullOrBlank()

    fun formattedDuration(): String {
        if (duration <= 0) return "1h 30m"
        val hours = duration / 3600
        val mins = (duration % 3600) / 60
        return if (hours > 0) "${hours}h ${mins}m" else "${mins}m"
    }
}
