package com.ownflix.tv.data.repository

import com.ownflix.tv.data.api.RetrofitClient
import com.ownflix.tv.data.model.MediaItem
import com.ownflix.tv.data.model.MyListToggleRequest
import com.ownflix.tv.data.model.Playlist
import com.ownflix.tv.data.model.Profile
import com.ownflix.tv.data.model.ProgressUpdateRequest
import com.ownflix.tv.data.model.VerifyPasswordRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class OwnFlixRepository(private val prefs: ServerPreferences) {

    private val api get() = RetrofitClient.getService(prefs.serverUrl)

    suspend fun getProfiles(): Result<List<Profile>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getProfiles()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.profiles)
            } else {
                Result.failure(Exception("Failed to load profiles (${response.code()})"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun verifyPassword(profileId: String, pin: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val res = api.verifyProfilePassword(VerifyPasswordRequest(profileId, pin))
            res.isSuccessful && (res.body()?.ok == true)
        } catch (e: Exception) {
            false
        }
    }

    suspend fun getMedia(profileId: String? = prefs.activeProfileId): Result<List<MediaItem>> =
        withContext(Dispatchers.IO) {
            try {
                val response = api.getMedia(profileId)
                if (response.isSuccessful && response.body() != null) {
                    Result.success(response.body()!!.items)
                } else {
                    Result.failure(Exception("Failed to load catalog (${response.code()})"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun getMediaDetail(id: String, profileId: String? = prefs.activeProfileId): Result<MediaItem> =
        withContext(Dispatchers.IO) {
            try {
                val res = api.getMediaDetail(id, profileId)
                if (res.isSuccessful && res.body() != null) {
                    Result.success(res.body()!!.item)
                } else {
                    Result.failure(Exception("Failed to load media detail"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun updateProgress(
        mediaItemId: String,
        positionSeconds: Double,
        durationSeconds: Double,
        episodeId: String? = null,
        completed: Boolean = false
    ) = withContext(Dispatchers.IO) {
        val profileId = prefs.activeProfileId ?: return@withContext
        try {
            api.updateProgress(
                ProgressUpdateRequest(
                    profileId = profileId,
                    mediaItemId = mediaItemId,
                    episodeId = episodeId,
                    positionSeconds = positionSeconds,
                    durationSeconds = durationSeconds,
                    completed = completed
                )
            )
        } catch (e: Exception) {
            // Non-blocking progress sync
        }
    }

    suspend fun toggleMyList(mediaItemId: String): Result<Boolean> = withContext(Dispatchers.IO) {
        val profileId = prefs.activeProfileId ?: return@withContext Result.failure(Exception("No profile selected"))
        try {
            val res = api.toggleMyList(MyListToggleRequest(profileId, mediaItemId))
            if (res.isSuccessful && res.body() != null) {
                Result.success(res.body()!!.inMyList)
            } else {
                Result.failure(Exception("Failed to toggle My List"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getPlaylists(profileId: String? = prefs.activeProfileId): Result<List<Playlist>> =
        withContext(Dispatchers.IO) {
            try {
                val res = api.getPlaylists(profileId, includePublic = true)
                if (res.isSuccessful && res.body() != null) {
                    Result.success(res.body()!!.playlists)
                } else {
                    Result.failure(Exception("Failed to load playlists"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun markForDeletion(mediaItemId: String, marked: Boolean = true): Result<Unit> =
        withContext(Dispatchers.IO) {
            try {
                val res = api.markForDeletion(
                    mediaItemId,
                    mapOf(
                        "markedForDeletion" to marked,
                        "profileName" to (prefs.activeProfileName ?: "Android TV User"),
                        "profileId" to (prefs.activeProfileId ?: "")
                    )
                )
                if (res.isSuccessful) Result.success(Unit) else Result.failure(Exception("Failed"))
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    fun getStreamUrl(mediaItemId: String?, episodeId: String? = null): String {
        return RetrofitClient.buildStreamUrl(prefs.serverUrl, mediaItemId, episodeId)
    }
}
