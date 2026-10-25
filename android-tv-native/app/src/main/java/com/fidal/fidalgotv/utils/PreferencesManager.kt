package com.fidal.fidalgotv.utils

import android.content.Context
import android.content.SharedPreferences

/**
 * Gerenciador de preferências do app
 */
class PreferencesManager(private val context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences("fidalgo_prefs", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_SERVER_URL = "server_url"
        private const val KEY_LOCAL_URL = "local_url"
        private const val KEY_USE_LOCAL = "use_local"
        private const val KEY_FAVORITES = "favorites"
        private const val KEY_RECENT = "recent"
        private const val KEY_PLAYER_SETTINGS = "player_settings"
        private const val KEY_THEME = "theme"
        private const val KEY_PARENTAL_PIN = "parental_pin"
        private const val KEY_PARENTAL_ENABLED = "parental_enabled"
    }

    // ============================================================
    // URL DO SERVIDOR
    // ============================================================

    fun getServerUrl(): String = prefs.getString(KEY_SERVER_URL, "") ?: "https://fidalgotv.ngrok.app/"

    fun setServerUrl(url: String) {
        prefs.edit().putString(KEY_SERVER_URL, url).apply()
    }

    fun getLocalUrl(): String = prefs.getString(KEY_LOCAL_URL, "") ?: "http://192.168.1.15:5000/"

    fun setLocalUrl(url: String) {
        prefs.edit().putString(KEY_LOCAL_URL, url).apply()
    }

    fun isUseLocal(): Boolean = prefs.getBoolean(KEY_USE_LOCAL, false)

    fun setUseLocal(useLocal: Boolean) {
        prefs.edit().putBoolean(KEY_USE_LOCAL, useLocal).apply()
    }

    fun getActiveBaseUrl(): String {
        return if (isUseLocal()) getLocalUrl() else getServerUrl()
    }

    // ============================================================
    // FAVORITOS
    // ============================================================

    fun getFavorites(): List<String> {
        val json = prefs.getString(KEY_FAVORITES, "[]") ?: "[]"
        return com.google.gson.Gson().fromJson(json, Array<String>::class.java).toList()
    }

    fun addFavorite(channelId: String) {
        val favorites = getFavorites().toMutableSet()
        favorites.add(channelId)
        prefs.edit().putString(KEY_FAVORITES, com.google.gson.Gson().toJson(favorites)).apply()
    }

    fun removeFavorite(channelId: String) {
        val favorites = getFavorites().toMutableSet()
        favorites.remove(channelId)
        prefs.edit().putString(KEY_FAVORITES, com.google.gson.Gson().toJson(favorites)).apply()
    }

    fun isFavorite(channelId: String): Boolean = channelId in getFavorites()

    fun toggleFavorite(channelId: String): Boolean {
        if (isFavorite(channelId)) {
            removeFavorite(channelId)
            return false
        } else {
            addFavorite(channelId)
            return true
        }
    }

    // ============================================================
    // RECENTES (Histórico)
    // ============================================================

    fun getRecent(): List<String> {
        val json = prefs.getString(KEY_RECENT, "[]") ?: "[]"
        return com.google.gson.Gson().fromJson(json, Array<String>::class.java).toList()
    }

    fun addRecent(channelId: String) {
        val recent = getRecent().toMutableList()
        recent.remove(channelId) // Remove se já existe
        recent.add(0, channelId) // Adiciona no topo
        if (recent.size > 20) recent.removeLast() // Mantém apenas 20
        prefs.edit().putString(KEY_RECENT, com.google.gson.Gson().toJson(recent)).apply()
    }

    fun clearRecent() {
        prefs.edit().remove(KEY_RECENT).apply()
    }

    // ============================================================
    // CONFIGURAÇÕES DO PLAYER
    // ============================================================

    data class PlayerSettings(
        val preferredQuality: String = "auto", // auto, 1080p, 720p, 480p
        val preferredAudio: String = "pt-BR",
        val subtitlesEnabled: Boolean = true,
        val preferredSubtitle: String = "pt-BR",
        val playbackSpeed: Float = 1.0f,
        val bufferSize: Int = 5000, // ms
        val enableHwAcceleration: Boolean = true,
        val autoPlayNext: Boolean = true
    )

    fun getPlayerSettings(): PlayerSettings {
        val json = prefs.getString(KEY_PLAYER_SETTINGS, "") ?: return PlayerSettings()
        return com.google.gson.Gson().fromJson(json, PlayerSettings::class.java)
    }

    fun setPlayerSettings(settings: PlayerSettings) {
        prefs.edit().putString(KEY_PLAYER_SETTINGS, com.google.gson.Gson().toJson(settings)).apply()
    }

    // ============================================================
    // TEMA / APARÊNCIA
    // ============================================================

    fun getTheme(): String = prefs.getString(KEY_THEME, "dark") ?: "dark"

    fun setTheme(theme: String) {
        prefs.edit().putString(KEY_THEME, theme).apply()
    }

    // ============================================================
    // CONTROLE PARENTAL
    // ============================================================

    fun isParentalEnabled(): Boolean = prefs.getBoolean(KEY_PARENTAL_ENABLED, false)

    fun setParentalEnabled(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_PARENTAL_ENABLED, enabled).apply()
    }

    fun getParentalPin(): String? = prefs.getString(KEY_PARENTAL_PIN, null)

    fun setParentalPin(pin: String?) {
        prefs.edit().putString(KEY_PARENTAL_PIN, pin).apply()
    }

    fun verifyParentalPin(pin: String): Boolean = pin == getParentalPin()

    // ============================================================
    // UTILITÁRIOS
    // ============================================================

    fun clearAll() {
        prefs.edit().clear().apply()
    }
}