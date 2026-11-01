package com.ownflix.tv.data.model

import com.google.gson.annotations.SerializedName

data class Profile(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("avatarColor") val avatarColor: String,
    @SerializedName("avatarIcon") val avatarIcon: String,
    @SerializedName("hasPassword") val hasPassword: Boolean = false,
    @SerializedName("isKids") val isKids: Boolean = false,
    @SerializedName("isAdmin") val isAdmin: Boolean = false
)

data class VerifyPasswordRequest(
    @SerializedName("profileId") val profileId: String,
    @SerializedName("password") val password: String
)

data class VerifyPasswordResponse(
    @SerializedName("ok") val ok: Boolean = false,
    @SerializedName("error") val error: String? = null
)
