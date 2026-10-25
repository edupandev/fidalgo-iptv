package com.fidal.fidalgotv.ui

import android.content.Context
import android.os.Bundle
import android.util.Log
import android.view.KeyEvent
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import androidx.leanback.app.BrowseFragment
import androidx.leanback.app.SearchFragment
import androidx.leanback.widget.*
import androidx.lifecycle.lifecycleScope
import com.fidal.fidalgotv.R
import com.fidal.fidalgotv.data.Repository
import com.fidal.fidalgotv.data.models.*
import com.fidal.fidalgotv.ui.presenters.ChannelPresenter
import com.fidal.fidalgotv.ui.presenters.CategoryPresenter
import com.fidal.fidalgotv.ui.presenters.HeroData
import com.fidal.fidalgotv.ui.presenters.HeroPresenter
import com.fidal.fidalgotv.utils.PreferencesManager
import kotlinx.coroutines.launch
import java.util.concurrent.TimeUnit

/**
 * Fragment principal - BrowseFragment (Home com Hero + Category Rail + Channel Rail)
 * Implementa a especificação visual tvOS style
 */
class MainFragment : BrowseFragment(), SearchFragment.SearchResultProvider {

    companion object {
        private const val TAG = "MainFragment"
        private const val HERO_ROW_ID = 0L
        private const val CATEGORY_ROW_ID = 1L
        private const val CHANNEL_ROW_ID = 2L
    }

    private lateinit var repository: Repository
    private lateinit var preferences: PreferencesManager
    private var currentCategory = "Todos"
    private var allChannels: List<Channel> = emptyList()
    private var categories: List<String> = listOf("Todos", "Favoritos", "Esportes", "Abertos", "Filmes & Séries", "Notícias", "Infantis", "Variedades", "Música", "Documentários", "Religiosos")
    private var currentChannels: List<Channel> = emptyList()
    private var epgData: Map<String, ChannelEpg> = emptyMap()

    override fun onAttach(context: Context) {
        super.onAttach(context)
        val app = activity?.application as FidalGOApplication
        repository = app.getRepository()
        preferences = app.getPreferences()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setupUI()
        loadData()
    }

    private fun setupUI() {
        title = "fidalGO TV"
        setHeadersState(HEADERS_DISABLED)
        setHeadersTransitionOnBackEnabled(false)

        // Configura busca
        setSearchFragment(SearchFragment().apply {
            setSearchResultProvider(this@MainFragment)
            setSpeechRecognitionCallback { query ->
                searchChannels(query)
                true
            }
        })

        // Presenter para cards de canal
        val cardPresenter = ChannelPresenter()
        val cardPresenterSelector = ClassPresenterSelector().apply {
            addClassPresenter(Channel::class.java, ChannelPresenter())
        }

        // Category Presenter
        val categoryPresenter = CategoryPresenter()
        val categorySelector = ClassPresenterSelector().apply {
            addClassPresenter(String::class.java, CategoryPresenter())
        }

        // Hero Presenter
        val heroPresenter = HeroPresenter()
        val heroSelector = ClassPresenterSelector().apply {
            addClassPresenter(HeroData::class.java, HeroPresenter())
        }

        setAdapter(ArrayObjectAdapter(cardPresenterSelector))
    }

    private fun loadData() {
        showLoading()

        lifecycleScope.launch {
            try {
                // Carrega canais
                val channelsResult = repository.getChannels()
                if (channelsResult is Result.Success) {
                    val channels = channelsResult.value
                    allChannels = channels
                    currentChannels = filterChannelsByCategory(channels, currentCategory)
                    
                    // Atualiza UI na thread principal
                    requireActivity().runOnUiThread {
                        setupRows(channels)
                        hideLoading()
                    }
                } else {
                    handleError("Erro ao carregar canais")
                }

                // Carrega EPG em background
                loadEpgForVisibleChannels()
            } catch (e: Exception) {
                requireActivity().runOnUiThread { handleError(e.message ?: "Erro desconhecido") }
            }
        }
    }

    private fun setupRows(channels: List<Channel>) {
        val adapter = ArrayObjectAdapter(ClassPresenterSelector().apply {
            addClassPresenter(HeroData::class.java, HeroPresenter())
            addClassPresenter(String::class.java, CategoryPresenter())
            addClassPresenter(Channel::class.java, ChannelPresenter())
        }).also { setAdapter(it) }

        // 1. Hero Row (Top Section)
        val heroRow = HeaderItem(HERO_ROW_ID, "")
        val heroAdapter = ArrayObjectAdapter(ClassPresenterSelector().apply {
            addClassPresenter(HeroData::class.java, HeroPresenter())
        })
        
        // Primeiro canal como hero inicial
        allChannels.firstOrNull()?.let { firstChannel ->
            val epg = repository.getChannelEpg(firstChannel.id)
            val heroData = buildHeroData(firstChannel)
            heroAdapter.add(HeroData(
                channelId = firstChannel.id,
                channelName = firstChannel.name,
                channelLogoUrl = firstChannel.logoUrl(),
                programTitle = "Carregando programação...",
                isLive = true
            ))
        }
        
        val heroRowAdapter = ListRow(heroRow, heroAdapter)
        adapter.add(heroRowAdapter)

        // 2. Category Row (Segmented Control)
        val categoryRow = HeaderItem(CATEGORY_ROW_ID, "Categorias")
        val categoryAdapter = ArrayObjectAdapter(ClassPresenterSelector().apply {
            addClassPresenter(String::class.java, CategoryPresenter())
        })
        categories.forEach { categoryAdapter.add(it) }
        
        val categoryRowAdapter = ListRow(categoryRow, categoryAdapter)
        adapter.add(categoryRowAdapter)

        // 3. Channel Row (Horizontal Rail)
        val channelRow = HeaderItem(CHANNEL_ROW_ID, currentCategory)
        val channelAdapter = ArrayObjectAdapter(ClassPresenterSelector().apply {
            addClassPresenter(Channel::class.java, ChannelPresenter())
        })
        currentChannels.forEach { channelAdapter.add(it) }
        
        val channelRowAdapter = ListRow(channelRow, channelAdapter)
        adapter.add(channelRowAdapter)

        // Listener de foco para atualizar Hero
        onItemViewSelectedListener = OnItemViewSelectedListener { _, item, _, _ ->
            when (item) {
                is Channel -> updateHeroPreview(item)
                is String -> {
                    currentCategory = item
                    filterAndUpdateChannels(item)
                }
            }
        }

        // Listener de seleção (Enter/OK)
        onItemViewClickedListener = OnItemViewClickedListener { _, item, _, _ ->
            when (item) {
                is Channel -> openPlayer(item)
                is String -> {
                    currentCategory = item
                    filterAndUpdateChannels(item)
                }
            }
        }
    }

    private fun buildHeroData(channel: Channel): HeroData {
        val epg = repository.getChannelEpg(channel.id)
        return HeroData(
            channelId = channel.id,
            channelName = channel.name,
            channelLogoUrl = channel.logoUrl(),
            programTitle = epg?.currentProgram?.title ?: "Carregando...",
            isLive = epg?.currentProgram?.isLive ?: true
        )
    }

    private fun updateHeroPreview(channel: Channel) {
        val heroRow = adapter as? ArrayObjectAdapter
            ?.filter { it is ListRow }
            ?.firstOrNull { it.header.id == HERO_ROW_ID }
            ?.let { (it as ListRow).adapter }
            ?.filter { it is ArrayObjectAdapter }
            ?.firstOrNull()

        heroRow?.let { adapter ->
            val heroData = HeroData(
                channelId = channel.id,
                channelName = channel.name,
                channelLogoUrl = channel.logoUrl(),
                programTitle = epgData[channel.id]?.currentProgram?.title ?: "Carregando...",
                isLive = epgData[channel.id]?.currentProgram?.isLive ?: true,
                epgProgress = epgData[channel.id]?.currentProgram?.progressPercent ?: -1
            )
            
            runOnUiThread {
                (adapter as ArrayObjectAdapter).apply {
                    if (size() > 0) {
                        replace(0, HeroData(
                            channelId = channel.id,
                            channelName = channel.name,
                            channelLogoUrl = channel.logoUrl(),
                            programTitle = epgData[channel.id]?.currentProgram?.title ?: "Carregando...",
                            isLive = epgData[channel.id]?.currentProgram?.isLive ?: true,
                            epgProgress = epgData[channel.id]?.currentProgram?.progressPercent ?: -1
                        ))
                    } else {
                        add(HeroData(
                            channelId = channel.id,
                            channelName = channel.name,
                            channelLogoUrl = channel.logoUrl(),
                            programTitle = epgData[channel.id]?.currentProgram?.title ?: "Carregando...",
                            isLive = epgData[channel.id]?.currentProgram?.isLive ?: true,
                            epgProgress = epgData[channel.id]?.currentProgram?.progressPercent ?: -1
                        ))
                    }
                }
            }
        }
    }

    private fun filterAndUpdateChannels(category: String) {
        currentCategory = category
        val filtered = if (category == "Favoritos") {
            allChannels.filter { it.isFavorite }
        } else if (category == "Todos") {
            allChannels
        } else {
            allChannels.filter { it.normalizedGroup() == category }
        }

        currentChannels = filtered

        // Atualiza adapter do Channel Rail
        val channelRow = adapter as? ArrayObjectAdapter
            ?.filter { it is ListRow }
            ?.firstOrNull { it.header.id == CHANNEL_ROW_ID }
            ?.let { (it as ListRow).adapter }
            ?.filter { it is ArrayObjectAdapter }
            ?.firstOrNull()

        channelRow?.let { channelAdapter ->
            runOnUiThread {
                (channelAdapter as ArrayObjectAdapter).apply {
                    clear()
                    currentChannels.forEach { add(it) }
                }
            }
        }

        // Atualiza header do Channel Rail
        val channelRowHeader = (adapter as? ArrayObjectAdapter)
            ?.filter { it is ListRow }
            ?.firstOrNull { it.header.id == CHANNEL_ROW_ID }
            ?.header
        
        channelRowHeader?.let { header ->
            runOnUiThread { header.name = category }
        }
    }

    private fun loadEpgForVisibleChannels() {
        lifecycleScope.launch {
            // Carrega EPG dos primeiros 20 canais visíveis
            allChannels.take(20).forEach { channel ->
                try {
                    val epgResult = repository.getChannelEpg(channel.id)
                    if (epgResult is Result.Success) {
                        epgData[channel.id] = epgResult.value
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "Erro ao carregar EPG para ${channel.name}: ${e.message}")
                }
                delay(100) // Rate limiting
            }
        }
    }

    private fun searchChannels(query: String) {
        lifecycleScope.launch {
            val result = repository.searchChannels(query)
            if (result is Result.Success) {
                showSearchResults(result.value)
            }
        }
    }

    private fun showSearchResults(channels: List<Channel>) {
        // TODO: Implementar fragment de resultados de busca
    }

    private fun filterChannelsByCategory(channels: List<Channel>, category: String): List<Channel> {
        return when (category) {
            "Favoritos" -> channels.filter { it.isFavorite }
            "Todos" -> channels
            else -> channels.filter { it.normalizedGroup() == category }
        }
    }

    private fun openPlayer(channel: Channel) {
        // Abre PlaybackFragment
        val playbackFragment = PlaybackFragment.newInstance(channel)
        parentFragmentManager.beginTransaction()
            .replace(android.R.id.content, playbackFragment)
            .addToBackStack(null)
            .commit()
    }

    override fun onResults(query: String?): MutableList<Any> {
        val results = mutableListOf<Any>()
        if (query.isNullOrBlank()) return results
        
        lifecycleScope.launch {
            val result = repository.searchUnified(query)
            if (result is Result.Success) {
                result.value.channels.forEach { results.add(it) }
                result.value.vod.forEach { results.add(it) }
            }
        }
        return results
    }

    override fun getResultsAdapter(): ObjectAdapter {
        val adapter = ArrayObjectAdapter(ClassPresenterSelector().apply {
            addClassPresenter(Channel::class.java, ChannelPresenter())
        })
        return adapter
    }
}