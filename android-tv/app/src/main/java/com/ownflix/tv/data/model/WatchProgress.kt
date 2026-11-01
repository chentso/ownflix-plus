package com.ownflix.tv.data.model

import com.google.gson.annotations.SerializedName

data class WatchProgress(
    @SerializedName("id") val id: String,
    @SerializedName("profileId") val profileId: String,
    @SerializedName("mediaItemId") val mediaItemId: String,
    @SerializedName("episodeId") val episodeId: String? = null,
    @SerializedName("positionSeconds") val positionSeconds: Double = 0.0,
    @SerializedName("durationSeconds") val durationSeconds: Double = 0.0,
    @SerializedName("completed") val completed: Boolean = false,
    @SerializedName("updatedAt") val updatedAt: String? = null
)

data class ProgressUpdateRequest(
    @SerializedName("profileId") val profileId: String,
    @SerializedName("mediaItemId") val mediaItemId: String,
    @SerializedName("episodeId") val episodeId: String? = null,
    @SerializedName("positionSeconds") val positionSeconds: Double,
    @SerializedName("durationSeconds") val durationSeconds: Double,
    @SerializedName("completed") val completed: Boolean = false
)
