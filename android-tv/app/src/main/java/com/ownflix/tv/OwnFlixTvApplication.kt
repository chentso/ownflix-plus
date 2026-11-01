package com.ownflix.tv

import android.app.Application
import com.ownflix.tv.data.repository.OwnFlixRepository
import com.ownflix.tv.data.repository.ServerPreferences

class OwnFlixTvApplication : Application() {

    lateinit var serverPreferences: ServerPreferences
        private set

    lateinit var repository: OwnFlixRepository
        private set

    override fun onCreate() {
        super.onCreate()
        serverPreferences = ServerPreferences(this)
        repository = OwnFlixRepository(serverPreferences)
    }
}
