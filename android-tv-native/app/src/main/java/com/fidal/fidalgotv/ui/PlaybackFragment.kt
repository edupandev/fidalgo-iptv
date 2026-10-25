package com.fidal.fidalgotv.ui

import android.annotation.SuppressLint
import android.content.Context
import android.media.AudioAttributes
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.view.KeyEvent
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DataSource
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.datasource.HttpDataSource
import androidx.media3.datasource.cache.CacheDataSource
import androidx.media3.datasource.cache.LeastRecentlyUsedCacheEvictor
import androidx.media3.datasource.cache.SimpleCache
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.MediaSource
import androidx.media3.exoplayer.hls.HlsMediaSource
import androidx.media3.exoplayer.dash.DashMediaSource
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.exoplayer.source.MediaSourceFactory
import androidx.media3.exoplayer.trackselection.DefaultTrackSelector
import androidx.media3.exoplayer.trackselection.MappingTrackSelector
import androidx.media3.exoplayer.text.SubtitleView
import androidx.media3.exoplayer.ui.PlayerView
import androidx.media3.exoplayer.upstream.DefaultBandwidthMeter
import androidx.media3.exoplayer.upstream.DefaultHttpDataSourceFactory
import androidx.media3.ui.AspectRatioFrameLayout
import com.fidal.fidalgotv.R
import com.fidal.fidalgotv.data.Repository
import com.fidal.fidalgotv.data.models.Channel
import com.fidal.fidalgotv.data.models.ResolvedStream
import com.fidal.fidalgotv.data.models.VodItem
import com.fidal.fidalgotv.data.models.VodSubtitle
import com.fidal.fidalgotv.data.models.VodStream
import com.fidal.fidalgotv.utils.PreferencesManager
import com.google.android.exoplayer2.C as ExoC
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.concurrent.TimeUnit

/**
 * Fragment de Playback com ExoPlayer nativo
 * Suporte a HLS, DASH, DRM, múltiplas faixas de áudio, legendas
 */
class PlaybackFragment : Fragment() {

    companion object {
        private const val TAG = "PlaybackFragment"
        private const val ARG_CHANNEL = "arg_channel"
        private const val ARG_VOD = "arg_vod"
        private const val ARG_STREAM = "arg_stream"
        private const val ARG_AUTO_PLAY = "arg_auto_play"

        fun newInstance(channel: Channel): PlaybackFragment {
            val fragment = PlaybackFragment()
            fragment.arguments = Bundle().apply { putParcelable(ARG_CHANNEL, channel) }
            return fragment
        }

        fun newInstance(vod: VodItem, stream: VodStream): PlaybackFragment {
            val fragment = PlaybackFragment()
            fragment.arguments = Bundle().apply {
                putParcelable(ARG_VOD, vod)
                putParcelable(ARG_STREAM, stream)
            }
            return fragment
        }

        fun newInstance(stream: ResolvedStream, autoPlay: Boolean = true): PlaybackFragment {
            val fragment = PlaybackFragment()
            fragment.arguments = Bundle().apply {
                putString("stream_url", stream.url)
                putString("stream_headers", com.google.gson.Gson().toJson(stream.headers))
                putBoolean(ARG_AUTO_PLAY, autoPlay)
            }
            return fragment
        }
    }

    private lateinit var repository: Repository
    private lateinit var preferences: PreferencesManager

    // UI Components
    private lateinit var playerView: PlayerView
    private lateinit var subtitleView: SubtitleView
    private lateinit var loadingProgress: ProgressBar
    private lateinit var errorContainer: View
    private lateinit var errorText: TextView
    private lateinit var retryButton: View
    private lateinit var overlayControls: View
    private lateinit var channelInfoContainer: View
    private lateinit var channelNameText: TextView
    private lateinit var programTitleText: TextView
    private lateinit var liveBadge: TextView

    // Player
    private var exoPlayer: ExoPlayer? = null
    private var mediaSource: MediaSource? = null
    private var currentChannel: Channel? = null
    private var currentVod: VodItem? = null
    private var currentStream: VodStream? = null
    private var resolvedStream: ResolvedStream? = null
    private var isLiveStream = true
    private var autoPlay = true
    private var playbackPosition = 0L
    private var currentWindow = 0
    private var playWhenReady = true

    // Cache para streams
    private var simpleCache: SimpleCache? = null

    override fun onAttach(context: Context) {
        super.onAttach(context)
        val app = requireActivity().application as FidalGOApplication
        repository = app.getRepository()
        preferences = app.getPreferences()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        parseArguments()
        retainInstance = true
    }

    private fun parseArguments() {
        arguments?.let { args ->
            currentChannel = args.getParcelable(ARG_CHANNEL)
            currentVod = args.getParcelable(ARG_VOD)
            currentStream = args.getParcelable(ARG_STREAM)
            autoPlay = args.getBoolean(ARG_AUTO_PLAY, true)
            
            // Resolved stream direto
            if (args.containsKey("stream_url")) {
                resolvedStream = ResolvedStream(
                    url = args.getString("stream_url")!!,
                    headers = com.google.gson.Gson().fromJson(
                        args.getString("stream_headers", "{}"),
                        Map::class.java
                    )
                )
            }
        }
    }

    @SuppressLint("ClickableViewAccessibility")
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val view = inflater.inflate(R.layout.fragment_playback, container, false)

        playerView = view.findViewById(R.id.player_view)
        subtitleView = view.findViewById(R.id.subtitle_view)
        loadingProgress = view.findViewById(R.id.loading_progress)
        errorContainer = view.findViewById(R.id.error_container)
        errorText = view.findViewById(R.id.error_text)
        retryButton = view.findViewById(R.id.retry_button)
        overlayControls = view.findViewById(R.id.overlay_controls)
        channelInfoContainer = view.findViewById(R.id.channel_info_container)
        channelNameText = view.findViewById(R.id.channel_name_text)
        programTitleText = view.findViewById(R.id.program_title_text)
        liveBadge = view.findViewById(R.id.live_badge)

        // Configura SubtitleView
        subtitleView.setStyle(
            android.graphics.Typeface.DEFAULT,
            1f,
            android.graphics.Color.WHITE,
            android.graphics.Color.BLACK,
            1f
        )

        // Configura botão de retry
        retryButton.setOnClickListener { retryPlayback() }

        // Configura player view
        playerView.setControllerShowTimeoutMs(5000)
        playerView.setControllerHideOnTouch(true)
        playerView.setUseController(true)
        playerView.resizeMode = AspectRatioFrameLayout.RESIZE_MODE_FIT

        // Subtitle view
        playerView.subtitleView = subtitleView

        return view
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        initializeCache()
        initializePlayer()
    }

    private fun initializeCache() {
        lifecycleScope.launch {
            try {
                val cacheDir = requireContext().cacheDir.resolve("media_cache")
                val evictor = LeastRecentlyUsedCacheEvictor(200 * 1024 * 1024) // 200MB
                simpleCache = SimpleCache(cacheDir, evictor)
            } catch (e: Exception) {
                Log.w(TAG, "Erro ao inicializar cache: ${e.message}")
            }
        }
    }

    @SuppressLint("SwitchIntDef")
    private fun initializePlayer() {
        val trackSelector = DefaultTrackSelector(requireContext()).apply {
            // Configura preferências de áudio/legenda
            setParameters(buildUponParameters()
                .setPreferredAudioLanguage(preferences.getPlayerSettings().preferredAudio)
                .setPreferredTextLanguage(preferences.getPlayerSettings().preferredSubtitle)
                .setSelectUndeterminedTextLanguage(true)
            )
        }

        val bandwidthMeter = DefaultBandwidthMeter.Builder(requireContext()).build()

        val dataSourceFactory = object : DefaultHttpDataSource.Factory {
            override fun createDataSource(): HttpDataSource {
                return DefaultHttpDataSource.Factory()
                    .setUserAgent("FidalGO-TV/1.0 (Android; ${android.os.Build.MODEL})")
                    .setAllowCrossProtocolRedirects(true)
                    .setConnectTimeoutMs(30000)
                    .setReadTimeoutMs(30000)
                    .createDataSource()
            }
        }

        exoPlayer = ExoPlayer.Builder(requireContext())
            .setTrackSelector(trackSelector)
            .setBandwidthMeter(bandwidthMeter)
            .setMediaSourceFactory(DefaultMediaSourceFactory(dataSourceFactory))
            .build()
            .also { player ->
                playerView.player = player
                playerView.setKeepContentOnPlayerReset(true)
                
                player.addListener(object : Player.Listener {
                    override fun onPlaybackStateChanged(playbackState: Int) {
                        updateLoadingState(playbackState)
                    }

                    override fun onPlayerError(error: PlaybackException) {
                        handleError(error)
                    }

                    override fun onTracksChanged(
                        trackGroups: androidx.media3.exoplayer.trackselection.TrackGroupArray?,
                        trackSelections: androidx.media3.exoplayer.trackselection.TrackSelectionArray?
                    ) {
                        updateTrackSelection()
                    }

                    @SuppressLint("SwitchIntDef")
                    override fun onIsPlayingChanged(isPlaying: Boolean) {
                        updateLiveBadge(isPlaying)
                    }
                })
            }

        // Restaura posição se houver
        if (savedInstanceState != null) {
            playbackPosition = savedInstanceState.getLong("playback_position", 0)
            currentWindow = savedInstanceState.getInt("current_window", 0)
            playWhenReady = savedInstanceState.getBoolean("play_when_ready", true)
        }

        // Prepara stream
        prepareStream()
    }

    private fun prepareStream() {
        showLoading(true)
        hideError()

        val streamUrl = resolvedStream?.url 
            ?: currentStream?.url 
            ?: currentChannel?.url 
            ?: currentVod?.streams?.firstOrNull()?.url
            ?: return

        val headers = resolvedStream?.headers 
            ?: currentStream?.let { mapOf("Referer" to it.url) } 
            ?: emptyMap<String, String>()

        isLiveStream = currentChannel != null || (currentStream?.type == "hls" && currentChannel != null)

        // Configura MediaItem
        val mediaItem = MediaItem.fromUri(streamUrl).buildUpon()
            .setHttpHeaders(headers)
            .setMediaId(currentChannel?.id ?: currentVod?.id ?: "stream")
            .build()

        val trackSelector = (exoPlayer?.trackSelector as? DefaultTrackSelector) ?: return
        
        // Configura MediaSource baseado no tipo
        val mediaSource = when {
            streamUrl.contains(".m3u8") || streamUrl.contains("hls") -> {
                HlsMediaSource.Factory(DefaultMediaSourceFactory(DefaultHttpDataSource.Factory()
                    .setUserAgent("FidalGO-TV/1.0")
                    .setAllowCrossProtocolRedirects(true)))
                    .createMediaSource(mediaItem)
            }
            streamUrl.contains(".mpd") || streamUrl.contains("dash") -> {
                DashMediaSource.Factory(DefaultMediaSourceFactory(DefaultHttpDataSource.Factory()
                    .setUserAgent("FidalGO-TV/1.0")
                    .setAllowCrossProtocolRedirects(true)))
                    .createMediaSource(mediaItem)
            }
            else -> {
                val factory = DefaultMediaSourceFactory(DefaultHttpDataSource.Factory()
                    .setUserAgent("FidalGO-TV/1.0")
                    .setAllowCrossProtocolRedirects(true))
                factory.createMediaSource(mediaItem)
            }
        }

        this.mediaSource = mediaSource
        exoPlayer?.setMediaSource(mediaSource)
        exoPlayer?.prepare()
        exoPlayer?.playWhenReady = autoPlay

        // Restaura posição se não for ao vivo
        if (!isLiveStream && playbackPosition > 0) {
            exoPlayer?.seekTo(currentWindow, playbackPosition)
        }

        // Atualiza info do canal
        updateChannelInfo()
    }

    private fun updateChannelInfo() {
        currentChannel?.let { channel ->
            channelNameText.text = channel.name
            liveBadge.visibility = if (isLiveStream) View.VISIBLE else View.GONE
            
            // Carrega programa atual do EPG
            loadCurrentProgram(channel.id)
        }
    }

    private fun loadCurrentProgram(channelId: String) {
        lifecycleScope.launch {
            try {
                val epgResult = repository.getChannelEpg(channelId)
                if (epgResult is Result.Success) {
                    val currentProgram = epgResult.value.currentProgram
                    requireActivity().runOnUiThread {
                        currentProgram?.let {
                            programTitleText.text = "${it.title} (${it.formatTime()})"
                        }
                    }
                }
            }
        }
    }

    private fun showLoading(show: Boolean) {
        loadingProgress.visibility = if (show) View.VISIBLE else View.GONE
        playerView.visibility = if (show) View.INVISIBLE else View.VISIBLE
    }

    private fun showError(message: String) {
        errorContainer.visibility = View.VISIBLE
        errorText.text = message
        loadingProgress.visibility = View.GONE
        playerView.visibility = View.INVISIBLE
    }

    private fun hideError() {
        errorContainer.visibility = View.GONE
    }

    private fun retryPlayback() {
        hideError()
        initializePlayer()
    }

    private fun updateLoadingState(playbackState: Int) {
        when (playbackState) {
            Player.STATE_BUFFERING -> showLoading(true)
            Player.STATE_READY -> showLoading(false)
            Player.STATE_ENDED -> onPlaybackEnded()
        }
    }

    private fun handleError(error: PlaybackException) {
        Log.e(TAG, "Erro de reprodução: ${error.message}", error)
        showError("Erro na reprodução: ${error.errorCode} - ${error.message}")
    }

    private fun updateTrackSelection() {
        // Atualiza menus de áudio/legenda se necessário
    }

    private fun updateLiveBadge(isPlaying: Boolean) {
        if (isLiveStream) {
            liveBadge.visibility = if (isPlaying) View.VISIBLE else View.GONE
        } else {
            liveBadge.visibility = View.GONE
        }
    }

    private fun onPlaybackEnded() {
        if (!isLiveStream) {
            // Para VOD, pode sugerir próximo ou voltar
            Toast.makeText(requireContext(), "Reprodução finalizada", Toast.LENGTH_SHORT).show()
        }
    }

    // ============================================================
    // CONTROLES DE TECLADO / CONTROLE REMOTO
    // ============================================================

    override fun onKeyDown(keyCode: Int, event: KeyEvent): Boolean {
        val player = exoPlayer ?: return false

        return when (keyCode) {
            KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.KEYCODE_ENTER -> {
                player.playWhenReady = !player.playWhenReady
                true
            }
            KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE, KeyEvent.KEYCODE_SPACE -> {
                player.playWhenReady = !player.playWhenReady
                true
            }
            KeyEvent.KEYCODE_MEDIA_PLAY -> {
                player.playWhenReady = true
                true
            }
            KeyEvent.KEYCODE_MEDIA_PAUSE -> {
                player.playWhenReady = false
                true
            }
            KeyEvent.KEYCODE_MEDIA_FAST_FORWARD, KeyEvent.KEYCODE_DPAD_RIGHT -> {
                player.seekTo(player.currentPosition + 10_000) // +10s
                true
            }
            KeyEvent.KEYCODE_MEDIA_REWIND, KeyEvent.KEYCODE_DPAD_LEFT -> {
                player.seekTo(max(0, player.currentPosition - 10_000)) // -10s
                true
            }
            KeyEvent.KEYCODE_MEDIA_NEXT -> {
                player.seekTo(player.currentPosition + 30_000) // +30s
                true
            }
            KeyEvent.KEYCODE_MEDIA_PREVIOUS -> {
                player.seekTo(max(0, player.currentPosition - 30_000)) // -30s
                true
            }
            KeyEvent.KEYCODE_BACK, KeyEvent.KEYCODE_ESCAPE -> {
                onBackPressed()
                true
            }
            KeyEvent.KEYCODE_DPAD_UP -> {
                // Mostra/oculta controles
                playerView.showController()
                true
            }
            KeyEvent.KEYCODE_DPAD_DOWN -> {
                // Menu de configurações (áudio/legenda/qualidade)
                showSettingsMenu()
                true
            }
            KeyEvent.KEYCODE_INFO -> {
                showChannelInfo()
                true
            }
            else -> false
        }
    }

    private fun onBackPressed() {
        // Salva posição atual antes de sair
        savePlaybackState()
        
        // Libera player
        releasePlayer()
        
        // Volta para fragment anterior
        requireActivity().onBackPressed()
    }

    private fun showSettingsMenu() {
        // TODO: Implementar menu de áudio/legenda/qualidade
        Toast.makeText(requireContext(), "Menu de configurações (em desenvolvimento)", Toast.LENGTH_SHORT).show()
    }

    private fun showChannelInfo() {
        // TODO: Implementar overlay de info do canal
    }

    // ============================================================
    // LIFECYCLE
    // ============================================================

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        savePlaybackState()
    }

    private fun savePlaybackState() {
        exoPlayer?.let { player ->
            playbackPosition = player.currentPosition
            currentWindow = player.currentWindowIndex
            playWhenReady = player.playWhenReady
        }
    }

    override fun onPause() {
        super.onPause()
        if (exoPlayer != null) {
            savePlaybackState()
        }
    }

    override fun onStop() {
        super.onStop()
        releasePlayer()
    }

    override fun onDestroy() {
        super.onDestroy()
        releasePlayer()
    }

    private fun releasePlayer() {
        exoPlayer?.run {
            savePlaybackState()
            release()
        }
        exoPlayer = null
        mediaSource = null
    }

    // ============================================================
    // LEGENDAS EXTERNAS
    // ============================================================

    fun addExternalSubtitle(subtitle: VodSubtitle) {
        // TODO: Implementar adição de legenda externa
    }
}