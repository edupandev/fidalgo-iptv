package com.fidal.fidalgotv.data

import com.fidal.fidalgotv.data.api.ApiClient
import com.fidal.fidalgotv.data.api.FidalGOApiService
import com.fidal.fidalgotv.data.models.*
import com.fidal.fidalgotv.utils.PreferencesManager
import kotlinx.coroutines.*
import java.util.concurrent.TimeUnit

/**
 * Repositório central de dados
 * Gerencia cache, fallback local/remoto, favoritos, etc.
 */
class Repository(
    private val apiService: FidalGOApiService,
    private val preferences: PreferencesManager,
    private val scope: CoroutineScope
) {

    // Cache em memória
    private val channelsCache = mutableMapOf<String, List<Channel>>()
    private val epgCache = mutableMapOf<String, ChannelEpg>()
    private val vodCache = mutableMapOf<String, List<VodItem>>()
    private var lastChannelsFetch = 0L
    private var lastVodFetch = 0L

    companion object {
        const val CACHE_DURATION_MS = 5 * 60 * 1000 // 5 minutos
        const val EPG_CACHE_DURATION_MS = 15 * 60 * 1000 // 15 minutos
    }

    // ============================================================
    // CANAIS
    // ============================================================

    suspend fun getChannels(forceRefresh: Boolean = false): Result<List<Channel>> {
        val cacheKey = "all_channels"
        val now = System.currentTimeMillis()

        // Verifica cache
        if (!forceRefresh && channelsCache.containsKey(cacheKey) && (now - lastChannelsFetch < CACHE_DURATION_MS)) {
            return Result.success(channelsCache[cacheKey]!!)
        }

        return try {
            val response = apiService.getChannels().await()
            if (response.isSuccessful && response.body()?.status == "ok") {
                val channels = response.body()?.channels ?: emptyList()
                val processed = processChannels(channels)
                channelsCache[cacheKey] = processed
                lastChannelsFetch = now
                Result.success(processed)
            } else {
                // Fallback para cache se tiver
                if (channelsCache.containsKey(cacheKey)) {
                    Result.success(channelsCache[cacheKey]!!)
                } else {
                    Result.failure(Exception("Erro ao carregar canais: ${response.message()}"))
                }
            }
        } catch (e: Exception) {
            // Fallback para cache em caso de erro de rede
            if (channelsCache.containsKey(cacheKey)) {
                Result.success(channelsCache[cacheKey]!!)
            } else {
                Result.failure(e)
            }
        }
    }

    private fun processChannels(channels: List<Channel>): List<Channel> {
        val favorites = preferences.getFavorites().toSet()
        return channels.map { channel ->
            channel.copy(
                isFavorite = channel.id in favorites
            )
        }.sortedBy { it.number }.sortedByDescending { it.isFavorite }
    }

    suspend fun searchChannels(query: String): Result<List<Channel>> {
        return try {
            val response = apiService.searchChannels(query).await()
            if (response.isSuccessful && response.body()?.status == "ok") {
                Result.success(processChannels(response.body()?.channels ?: emptyList()))
            } else {
                Result.failure(Exception("Erro na busca: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getChannelsByCategory(category: String): Result<List<Channel>> {
        return getChannels().map { channels ->
            if (category == "Todos" || category == "Favoritos") {
                if (category == "Favoritos") {
                    channels.filter { it.isFavorite }
                } else {
                    channels
                }
            } else {
                channels.filter { it.normalizedGroup() == category }
            }
        }
    }

    // ============================================================
    // EPG
    // ============================================================

    suspend fun getChannelEpg(channelId: String): Result<ChannelEpg> {
        val now = System.currentTimeMillis()

        if (epgCache.containsKey(channelId) && (now - epgCache[channelId]?.hashCode() ?: 0L < EPG_CACHE_DURATION_MS)) {
            return Result.success(epgCache[channelId]!!)
        }

        return try {
            val response = apiService.getChannelEpg(channelId).await()
            if (response.isSuccessful && response.body() != null) {
                val epg = response.body()!!
                epgCache[channelId] = epg
                Result.success(epg)
            } else {
                Result.failure(Exception("EPG não encontrado"))
            }
        } catch (e: Exception) {
            if (epgCache.containsKey(channelId)) {
                Result.success(epgCache[channelId]!!)
            } else {
                Result.failure(e)
            }
        }
    }

    suspend fun getAllEpg(): Result<List<ChannelEpg>> {
        return try {
            val response = apiService.getAllEpg().await()
            if (response.isSuccessful) {
                val epgList = response.body() ?: emptyList()
                epgList.forEach { epgCache[it.channelId] = it }
                Result.success(epgList)
            } else {
                Result.failure(Exception("Erro ao carregar EPG completo"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // ============================================================
    // VOD
    // ============================================================

    suspend fun getVodHighlights(): Result<List<VodItem>> {
        val cacheKey = "highlights"
        val now = System.currentTimeMillis()

        if (vodCache.containsKey(cacheKey) && (now - lastVodFetch < CACHE_DURATION_MS)) {
            return Result.success(vodCache[cacheKey]!!)
        }

        return try {
            val response = apiService.getVodHighlights().await()
            if (response.isSuccessful && response.body()?.status == "ok") {
                val items = response.body()?.highlights ?: emptyList()
                vodCache[cacheKey] = items
                lastVodFetch = now
                Result.success(items)
            } else {
                if (vodCache.containsKey(cacheKey)) {
                    Result.success(vodCache[cacheKey]!!)
                } else {
                    Result.failure(Exception("Erro ao carregar destaques"))
                }
            }
        } catch (e: Exception) {
            if (vodCache.containsKey(cacheKey)) {
                Result.success(vodCache[cacheKey]!!)
            } else {
                Result.failure(e)
            }
        }
    }

    suspend fun searchVod(query: String): Result<List<VodItem>> {
        return try {
            val response = apiService.searchVod(query).await()
            if (response.isSuccessful && response.body()?.status == "ok") {
                Result.success(response.body()?.highlights ?: emptyList())
            } else {
                Result.failure(Exception("Erro na busca VOD"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun resolveVod(title: String, type: String): Result<ResolvedStream> {
        return try {
            val response = apiService.resolveVod(title, type).await()
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Erro ao resolver stream"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // ============================================================
    // EVENTOS ESPORTIVOS
    // ============================================================

    suspend fun getSportsEvents(): Result<List<SportsEvent>> {
        return try {
            val response = apiService.getSportsEvents().await()
            if (response.isSuccessful) {
                Result.success(response.body() ?: emptyList())
            } else {
                Result.failure(Exception("Erro ao carregar eventos"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // ============================================================
    // BUSCA UNIFICADA
    // ============================================================

    suspend fun searchUnified(query: String): Result<SearchResult> {
        return try {
            val response = apiService.searchUnified(query).await()
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Erro na busca"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // ============================================================
    // FAVORITOS
    // ============================================================

    fun toggleFavorite(channelId: String): Boolean {
        return preferences.toggleFavorite(channelId)
    }

    fun isFavorite(channelId: String): Boolean = preferences.isFavorite(channelId)

    fun getFavorites(): List<String> = preferences.getFavorites()

    // ============================================================
    // RECENTES
    // ============================================================

    fun addRecent(channelId: String) {
        preferences.addRecent(channelId)
    }

    fun getRecent(): List<String> = preferences.getRecent()

    // ============================================================
    // CACHE
    // ============================================================

    fun clearCache() {
        channelsCache.clear()
        epgCache.clear()
        vodCache.clear()
        lastChannelsFetch = 0
        lastVodFetch = 0
    }
}