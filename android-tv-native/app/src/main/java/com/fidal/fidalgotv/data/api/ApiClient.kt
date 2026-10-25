package com.fidal.fidalgotv.data.api

import android.content.Context
import com.fidal.fidalgotv.BuildConfig
import com.fidal.fidalgotv.utils.PreferencesManager
import com.google.gson.GsonBuilder
import okhttp3.*
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import java.util.concurrent.TimeUnit

/**
 * Cliente API configurado para o servidor fidalGO
 * Gerencia base URL dinâmica (ngrok/local), interceptors, cache, etc.
 */
object ApiClient {

    private const val CONNECT_TIMEOUT = 30L
    private const val READ_TIMEOUT = 30L
    private const val WRITE_TIMEOUT = 30L
    private const val CACHE_SIZE = 50 * 1024 * 1024 // 50MB

    @Volatile
    private var INSTANCE: FidalGOApiService? = null

    private var baseUrl: String = "https://fidalgotv.ngrok.app/"

    fun getInstance(context: Context): FidalGOApiService {
        return INSTANCE ?: synchronized(this) {
            INSTANCE ?: buildService(context).also { INSTANCE = it }
        }
    }

    fun forceRebuild(context: Context) {
        INSTANCE = null
        getInstance(context)
    }

    fun updateBaseUrl(newBaseUrl: String) {
        baseUrl = if (newBaseUrl.endsWith("/")) newBaseUrl else "$newBaseUrl/"
        INSTANCE = null // Força rebuild na próxima chamada
    }

    fun getCurrentBaseUrl(): String = baseUrl

    private fun buildService(context: Context): FidalGOApiService {
        val prefs = PreferencesManager(context)
        
        // Tenta usar URL salva, senão usa padrão
        val savedUrl = prefs.getServerUrl()
        if (savedUrl.isNotBlank()) {
            baseUrl = if (savedUrl.endsWith("/")) savedUrl else "$savedUrl/"
        }

        val moshi = Moshi.Builder()
            .add(KotlinJsonAdapterFactory())
            .build()

        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BODY else HttpLoggingInterceptor.Level.NONE
        }

        val authInterceptor = Interceptor { chain ->
            val original = chain.request()
            val builder = original.newBuilder()
                .header("User-Agent", "FidalGO-TV/${BuildConfig.VERSION_NAME} (Android ${android.os.Build.VERSION.SDK_INT}; ${android.os.Build.MODEL})")
                .header("Accept", "application/json")
                .method(original.method, original.body)
            chain.proceed(builder.build())
        }

        val okHttpClient = OkHttpClient.Builder()
            .connectTimeout(CONNECT_TIMEOUT, TimeUnit.SECONDS)
            .readTimeout(READ_TIMEOUT, TimeUnit.SECONDS)
            .writeTimeout(WRITE_TIMEOUT, TimeUnit.SECONDS)
            .addInterceptor(loggingInterceptor)
            .addInterceptor(authInterceptor)
            .cache(Cache(context.cacheDir, CACHE_SIZE.toLong()))
            .retryOnConnectionFailure(true)
            .build()

        return Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(okHttpClient)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
            .create(FidalGOApiService::class.java)
    }
}

/**
 * API Service para URLs dinâmicas (streaming proxy, etc.)
 * Usa URL completa em vez de base URL
 */
object DynamicApiClient {

    private val moshi = Moshi.Builder()
        .add(KotlinJsonAdapterFactory())
        .build()

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl("https://fidalgotv.ngrok.app/") // Base dummy, será sobrescrita
        .client(okHttpClient)
        .addConverterFactory(MoshiConverterFactory.create(moshi))
        .build()

    fun createService(serviceClass: Class<out Any>, baseUrl: String): Any {
        val dynamicRetrofit = retrofit.newBuilder()
            .baseUrl(if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/")
            .build()
        return dynamicRetrofit.create(serviceClass)
    }
}