package com.ownflix.tv.data.model

import com.google.gson.annotations.SerializedName

data class Episode(
    @SerializedName("id") val id: String,
    @SerializedName("mediaItemId") val mediaItemId: String,
    @SerializedName("seasonNumber") val seasonNumber: Int,
    @SerializedName("episodeNumber") val episodeNumber: Int,
    @SerializedName("title") val title: String,
    @SerializedName("overview") val overview: String? = null,
    @SerializedName("thumbnailUrl") val thumbnailUrl: String? = null,
    @SerializedName("videoUrl") val videoUrl: String? = null,
    @SerializedName("filePath") val filePath: String? = null,
    @SerializedName("duration") val duration: Int = 0,
    @SerializedName("introStart") val introStart: Double? = null,
    @SerializedName("introEnd") val introEnd: Double? = null,
    @SerializedName("creditsStart") val creditsStart: Double? = null
)
