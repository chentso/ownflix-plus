package com.ownflix.tv.data.repository

import android.content.Context
import android.content.SharedPreferences

class ServerPreferences(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("ownflix_tv_prefs", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_SERVER_URL = "server_url"
        private const val KEY_ACTIVE_PROFILE_ID = "active_profile_id"
        private const val KEY_ACTIVE_PROFILE_NAME = "active_profile_name"
        private const val DEFAULT_URL = "http://10.0.2.2:3000" // Default for Android Emulator
    }

    var serverUrl: String
        get() = prefs.getString(KEY_SERVER_URL, DEFAULT_URL) ?: DEFAULT_URL
        set(value) = prefs.edit().putString(KEY_SERVER_URL, value.trim()).apply()

    var activeProfileId: String?
        get() = prefs.getString(KEY_ACTIVE_PROFILE_ID, null)
        set(value) = prefs.edit().putString(KEY_ACTIVE_PROFILE_ID, value).apply()

    var activeProfileName: String?
        get() = prefs.getString(KEY_ACTIVE_PROFILE_NAME, null)
        set(value) = prefs.edit().putString(KEY_ACTIVE_PROFILE_NAME, value).apply()

    fun clearProfile() {
        prefs.edit()
            .remove(KEY_ACTIVE_PROFILE_ID)
            .remove(KEY_ACTIVE_PROFILE_NAME)
            .apply()
    }
}
