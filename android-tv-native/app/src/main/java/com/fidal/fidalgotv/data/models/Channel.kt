package com.fidal.fidalgotv.data.models

import com.squareup.moshi.Json

/**
 * Modelo de Canal unificado (Saimo TV + Ramys IPTV Brasil 2026 + VIP Canais)
 * Correspondente à estrutura do servidor fidalGO
 */
data class Channel(
    @Json(name = "id") val id: String,
    @Json(name = "name") val name: String,
    @Json(name = "logo") val logo: String,
    @Json(name = "group") val group: String,
    @Json(name = "url") val url: String,
    @Json(name = "origin") val origin: String,
    @Json(name = "tvgId") val tvgId: String = "",
    @Json(name = "number") val number: Int = 0,
    @Json(name = "isFavorite") val isFavorite: Boolean = false
) {
    /** Normaliza o grupo/categoria para categorias padrão */
    fun normalizedGroup(): String = when (group.lowercase().trim()) {
        contains("esporte") || contains("futebol") || contains("sports") || contains("laliga") || contains("deportes") -> "Esportes"
        contains("aberta") || contains("aberto") || contains("band") || contains("globo") || contains("sbt") || contains("record") -> "Abertos"
        contains("filme") || contains("serie") || contains("série") || contains("cinema") || contains("telecine") || contains("hbo") -> "Filmes & Séries"
        contains("infantil") || contains("kids") || contains("desenho") || contains("cartoon") || contains("nick") -> "Infantis"
        contains("noticia") || contains("notícia") || contains("jornal") || contains("news") || contains("cnn") -> "Notícias"
        contains("document") || contains("discovery") || contains("history") || contains("animal") -> "Documentários"
        contains("24 hora") || contains("24h") -> "24 Horas"
        contains("musica") || contains("música") || contains("bis") || contains("mtv") -> "Música"
        contains("religioso") || contains("igreja") || contains("gospel") -> "Religiosos"
        else -> "Variedades"
    }

    /** Retorna a URL do logo com fallback */
    fun logoUrl(): String = if (logo.isNotBlank()) logo else "https://ui-avatars.com/api/?name=${name.encodeURIComponent()}&background=312e81&color=fff&size=200"

    /** Verifica se é canal VIP */
    fun isVip(): Boolean = origin.lowercase().contains("vip") || url.contains("vipcanais")
}

/**
 * Programa do EPG (Electronic Program Guide)
 */
data class EpgProgram(
    @Json(name = "title") val title: String,
    @Json(name = "start") val start: Long, // timestamp Unix
    @Json(name = "end") val end: Long,     // timestamp Unix
    @Json(name = "description") val description: String = "",
    @Json(name = "category") val category: String = ""
) {
    val duration: Long = end - start
    val progressPercent: Int = if (duration > 0) {
        val now = System.currentTimeMillis() / 1000
        ((now - start) * 100 / duration).coerceIn(0, 100)
    } else 0
    
    val isLive: Boolean = System.currentTimeMillis() / 1000 in start..end
    
    fun formatTime(): String = java.text.SimpleDateFormat("HH:mm", java.util.Locale.getDefault()).format(java.util.Date(start * 1000))
}

/**
 * EPG completo de um canal
 */
data class ChannelEpg(
    @Json(name = "channel_id") val channelId: String,
    @Json(name = "programs") val programs: List<EpgProgram>
) {
    /** Programa atual */
    val currentProgram: EpgProgram? = programs.find { it.isLive }
    
    /** Próximos programas */
    val upcomingPrograms: List<EpgProgram> = programs.filter { it.start > System.currentTimeMillis() / 1000 }
}

/**
 * Item VOD (Filme/Série)
 */
data class VodItem(
    @Json(name = "id") val id: String,
    @Json(name = "title") val title: String,
    @Json(name = "type") val type: String, // "movie" ou "series"
    @Json(name = "year") val year: String = "",
    @Json(name = "poster") val poster: String = "",
    @Json(name = "backdrop") val backdrop: String = "",
    @Json(name = "group") val group: String = "",
    @Json(name = "plot") val plot: String = "",
    @Json(name = "rating") val rating: Double = 0.0,
    @Json(name = "duration") val duration: String = "",
    @Json(name = "streams") val streams: List<VodStream> = emptyList(),
    @Json(name = "isRamysVod") val isRamysVod: Boolean = false
) {
    val displayTitle: String = if (year.isNotBlank()) "$title ($year)" else title
    val posterUrl: String = if (poster.isNotBlank()) poster else "https://ui-avatars.com/api/?name=${title.encodeURIComponent()}&background=312e81&color=fff"
    val backdropUrl: String = if (backdrop.isNotBlank()) backdrop else posterUrl
}

/**
 * Stream de VOD (diferentes qualidades/legendas)
 */
data class VodStream(
    @Json(name = "url") val url: String,
    @Json(name = "quality") val quality: String = "HD",
    @Json(name = "type") val type: String = "hls",
    @Json(name = "audio") val audio: String = "pt-BR",
    @Json(name = "subtitles") val subtitles: List<VodSubtitle> = emptyList()
)

/**
 * Legenda de VOD
 */
data class VodSubtitle(
    @Json(name = "url") val url: String,
    @Json(name = "language") val language: String,
    @Json(name = "label") val label: String
)

/**
 * Resultado de busca unificado
 */
data class SearchResult(
    @Json(name = "channels") val channels: List<Channel> = emptyList(),
    @Json(name = "vod") val vod: List<VodItem> = emptyList()
)

/**
 * Resposta da API de canais
 */
data class ChannelsResponse(
    @Json(name = "status") val status: String,
    @Json(name = "count") val count: Int,
    @Json(name = "channels") val channels: List<Channel>
)

/**
 * Resposta da API VOD
 */
data class VodResponse(
    @Json(name = "status") val status: String,
    @Json(name = "highlights") val highlights: List<VodItem> = emptyList(),
    @Json(name = "categories") val categories: List<String> = emptyList()
)

/**
 * Stream resolvido (para player)
 */
data class ResolvedStream(
    @Json(name = "url") val url: String,
    @Json(name = "headers") val headers: Map<String, String> = emptyMap(),
    @Json(name = "drm") val drm: DrmInfo? = null,
    @Json(name = "subtitles") val subtitles: List<VodSubtitle> = emptyList()
)

data class DrmInfo(
    @Json(name = "type") val type: String,
    @Json(name = "licenseUrl") val licenseUrl: String,
    @Json(name = "headers") val headers: Map<String, String> = emptyMap()
)

/**
 * Evento esportivo (agenda de jogos)
 */
data class SportsEvent(
    @Json(name = "id") val id: String,
    @Json(name = "title") val title: String,
    @Json(name = "start_time") val startTime: Long,
    @Json(name = "league") val league: String,
    @Json(name = "home_team") val homeTeam: String,
    @Json(name = "away_team") val awayTeam: String,
    @Json(name = "home_logo") val homeLogo: String = "",
    @Json(name = "away_logo") val awayLogo: String = "",
    @Json(name = "channel") val channel: String = "",
    @Json(name = "stream_url") val streamUrl: String = ""
) {
    val formattedTime: String = java.text.SimpleDateFormat("dd/MM HH:mm", java.util.Locale.getDefault()).format(java.util.Date(startTime * 1000))
}