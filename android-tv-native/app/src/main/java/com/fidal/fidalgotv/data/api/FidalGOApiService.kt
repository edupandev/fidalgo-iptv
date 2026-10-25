package com.fidal.fidalgotv.data.api

import com.fidal.fidalgotv.data.models.*
import retrofit2.Call
import retrofit2.http.GET
import retrofit2.http.Query
import retrofit2.http.Url

/**
 * API Service para o servidor fidalGO
 * Usa as mesmas rotas do servidor Windows
 */
interface FidalGOApiService {

    // ============================================================
    // CANAIS AO VIVO
    // ============================================================

    /**
     * Lista todos os canais (Saimo TV + Ramys + VIP Canais)
     * GET /api/saimo-channels
     */
    @GET("api/saimo-channels")
    fun getChannels(): Call<ChannelsResponse>

    /**
     * Busca canais por query
     * GET /api/saimo-channels?q=...
     */
    @GET("api/saimo-channels")
    fun searchChannels(@Query("q") query: String): Call<ChannelsResponse>

    /**
     * EPG de um canal específico
     * GET /api/epg?channel_id=...
     */
    @GET("api/epg")
    fun getChannelEpg(@Query("channel_id") channelId: String): Call<ChannelEpg>

    /**
     * EPG completo (todos os canais)
     * GET /api/epg/all
     */
    @GET("api/epg/all")
    fun getAllEpg(): Call<List<ChannelEpg>>

    // ============================================================
    // VOD (FILMES & SÉRIES)
    // ============================================================

    /**
     * Destaques VOD (Filmes & Séries em destaque)
     * GET /api/saimo-vod
     */
    @GET("api/saimo-vod")
    fun getVodHighlights(): Call<VodResponse>

    /**
     * Busca VOD
     * GET /api/saimo-vod?q=...
     */
    @GET("api/saimo-vod")
    fun searchVod(@Query("q") query: String): Call<VodResponse>

    /**
     * Resolve streams de um VOD
     * GET /api/resolve-vod?title=...&type=...
     */
    @GET("api/resolve-vod")
    fun resolveVod(
        @Query("title") title: String,
        @Query("type") type: String
    ): Call<ResolvedStream>

    // ============================================================
    // EVENTOS ESPORTIVOS
    // ============================================================

    /**
     * Agenda de jogos
     * GET /api/events
     */
    @GET("api/events")
    fun getSportsEvents(): Call<List<SportsEvent>>

    // ============================================================
    // PLAYBACK / PROXY
    // ============================================================

    /**
     * Proxy de streaming (HLS/DASH com Range 206 e SSRF)
     * GET /api/proxy?url=...
     */
    @GET("api/proxy")
    fun proxyStream(
        @Query("url") url: String,
        @Query("referer") referer: String?
    ): Call<ResponseBody>

    // ============================================================
    // BUSCA UNIFICADA
    // ============================================================

    /**
     * Busca unificada (canais + VOD)
     * GET /api/search?q=...
     */
    @GET("api/search")
    fun searchUnified(@Query("q") query: String): Call<SearchResult>

    // ============================================================
    // M3U EXTERNO (importação)
    // ============================================================

    /**
     * Parse M3U externo
     * POST /api/parse-m3u
     */
    @GET("api/parse-m3u")
    fun parseM3u(@Query("url") url: String): Call<ChannelsResponse>

    // ============================================================
    // LEGENDAS
    // ============================================================

    /**
     * Legendas para um stream
     * GET /api/subtitles?url=...
     */
    @GET("api/subtitles")
    fun getSubtitles(@Query("url") streamUrl: String): Call<List<VodSubtitle>>

    // ============================================================
    // HEALTH CHECK
    // ============================================================

    /**
     * Health check do servidor
     * GET /
     */
    @GET("/")
    fun healthCheck(): Call<ResponseBody>

    // ============================================================
    // DOWNLOAD APK
    // ============================================================

    /**
     * Download do APK
     * GET /apk
     */
    @GET("apk")
    fun downloadApk(): Call<ResponseBody>
}

import okhttp3.ResponseBody