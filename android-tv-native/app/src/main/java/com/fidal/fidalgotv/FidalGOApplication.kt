package com.fidal.fidalgotv

import android.app.Application
import android.content.Context
import android.util.Log
import android.webkit.WebView
import com.fidal.fidalgotv.data.Repository
import com.fidal.fidalgotv.data.api.ApiClient
import com.fidal.fidalgotv.data.api.FidalGOApiService
import com.fidal.fidalgotv.utils.PreferencesManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob

class FidalGOApplication : Application() {

    companion object {
        @Volatile
        private var INSTANCE: FidalGOApplication? = null

        fun getInstance(): FidalGOApplication = INSTANCE!!
    }

    // Componentes principais
    private val supervisorJob = SupervisorJob()
    val coroutineScope = CoroutineScope(Dispatchers.Default + supervisorJob)

    private lateinit var repository: Repository
    private lateinit var preferences: PreferencesManager
    private lateinit var apiService: FidalGOApiService

    override fun onCreate() {
        super.onCreate()
        INSTANCE = this

        // Inicializa componentes
        preferences = PreferencesManager(this)
        apiService = ApiClient.getInstance(this)
        repository = Repository(apiService, preferences, coroutineScope)

        // Configura WebView debugging apenas em debug
        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true)
        }

        Log.d("FidalGO", "Application iniciada - Base URL: ${ApiClient.getInstance(this).getCurrentBaseUrl()}")
    }

    override fun onTerminate() {
        supervisorJob.cancel()
        super.onTerminate()
    }

    // Getters públicos
    fun getRepository(): Repository = repository
    fun getPreferences(): PreferencesManager = preferences
    fun getApiService(): FidalGOApiService = apiService
    fun getCoroutineScope(): CoroutineScope = coroutineScope

    fun refreshApiClient() {
        ApiClient.forceRebuild(this)
        apiService = ApiClient.getInstance(this)
        repository = Repository(apiService, preferences, coroutineScope)
    }
}