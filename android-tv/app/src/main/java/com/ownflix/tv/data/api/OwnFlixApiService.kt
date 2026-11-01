package com.ownflix.tv.data.api

import com.ownflix.tv.data.model.MediaDetailResponse
import com.ownflix.tv.data.model.MediaListResponse
import com.ownflix.tv.data.model.MyListToggleRequest
import com.ownflix.tv.data.model.MyListToggleResponse
import com.ownflix.tv.data.model.PlaylistsResponse
import com.ownflix.tv.data.model.ProfilesResponse
import com.ownflix.tv.data.model.ProgressUpdateRequest
import com.ownflix.tv.data.model.VerifyPasswordRequest
import com.ownflix.tv.data.model.VerifyPasswordResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface OwnFlixApiService {

    @GET("api/profiles")
    suspend fun getProfiles(): Response<ProfilesResponse>

    @POST("api/profiles/verify-password")
    suspend fun verifyProfilePassword(
        @Body request: VerifyPasswordRequest
    ): Response<VerifyPasswordResponse>

    @GET("api/media")
    suspend fun getMedia(
        @Query("profileId") profileId: String? = null
    ): Response<MediaListResponse>

    @GET("api/media/{id}")
    suspend fun getMediaDetail(
        @Path("id") id: String,
        @Query("profileId") profileId: String? = null
    ): Response<MediaDetailResponse>

    @POST("api/progress")
    suspend fun updateProgress(
        @Body request: ProgressUpdateRequest
    ): Response<Unit>

    @POST("api/mylist")
    suspend fun toggleMyList(
        @Body request: MyListToggleRequest
    ): Response<MyListToggleResponse>

    @GET("api/playlists")
    suspend fun getPlaylists(
        @Query("profileId") profileId: String? = null,
        @Query("includePublic") includePublic: Boolean = true
    ): Response<PlaylistsResponse>

    @PATCH("api/media/{id}")
    suspend fun markForDeletion(
        @Path("id") id: String,
        @Body body: Map<String, Any>
    ): Response<Unit>
}
