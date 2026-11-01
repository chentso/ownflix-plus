package com.ownflix.tv.data.api

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClient {

    private var currentBaseUrl: String = "http://10.0.2.2:3000/"
    private var apiService: OwnFlixApiService? = null

    private val okHttpClient: OkHttpClient by lazy {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BASIC
        }
        OkHttpClient.Builder()
            .addInterceptor(logging)
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .writeTimeout(20, TimeUnit.SECONDS)
            .build()
    }

    fun getService(baseUrl: String = currentBaseUrl): OwnFlixApiService {
        val normalizedUrl = if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/"
        if (apiService == null || currentBaseUrl != normalizedUrl) {
            currentBaseUrl = normalizedUrl
            apiService = Retrofit.Builder()
                .baseUrl(normalizedUrl)
                .client(okHttpClient)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(OwnFlixApiService::class.java)
        }
        return apiService!!
    }

    fun buildStreamUrl(baseUrl: String, mediaId: String?, episodeId: String? = null): String {
        val root = if (baseUrl.endsWith("/")) baseUrl.dropLast(1) else baseUrl
        return if (!episodeId.isNullOrBlank()) {
            "$root/api/stream?episodeId=$episodeId"
        } else {
            "$root/api/stream?mediaId=$mediaId"
        }
    }
}
