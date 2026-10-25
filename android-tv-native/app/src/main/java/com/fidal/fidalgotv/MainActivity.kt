package com.fidal.fidalgotv

import android.content.Intent
import android.content.res.Configuration
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.view.KeyEvent
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.fidal.fidalgotv.data.Repository
import com.fidal.fidalgotv.ui.MainFragment
import com.fidal.fidalgotv.ui.PlaybackFragment
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "MainActivity"
    }

    private lateinit var repository: Repository
    private var currentFragment: Fragment? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Fullscreen imersivo para Android TV
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_FULLSCREEN
        )

        // Mantém tela ligada
        window.addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        setContentView(R.layout.activity_main)

        // Inicializa repository
        val app = application as FidalGOApplication
        repository = app.getRepository()

        // Verifica se tem intent de deep link
        handleIntent(intent)

        // Carrega fragment principal se não houver savedInstanceState
        if (savedInstanceState == null) {
            loadMainFragment()
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent) {
        val action = intent.action
        val data = intent.data

        when {
            action == Intent.ACTION_VIEW && data != null -> {
                // Deep link: fidalgotv://channel/{id} ou fidalgotv://vod/{id}
                val uri = data.toString()
                if (uri.contains("channel/")) {
                    val channelId = uri.substringAfterLast("/")
                    openChannel(channelId)
                } else if (uri.contains("vod/")) {
                    val vodId = uri.substringAfterLast("/")
                    openVod(vodId)
                }
            }
            action == Intent.ACTION_SEARCH -> {
                val query = intent.getStringExtra(android.app.SearchManager.QUERY) ?: ""
                if (query.isNotBlank()) {
                    searchChannels(query)
                }
            }
        }
    }

    private fun loadMainFragment() {
        supportFragmentManager.beginTransaction()
            .replace(android.R.id.content, MainFragment(), "MAIN_FRAGMENT")
            .commit()
        currentFragment = supportFragmentManager.findFragmentByTag("MAIN_FRAGMENT")
    }

    fun openChannel(channelId: String) {
        lifecycleScope.launch {
            try {
                val channelsResult = repository.getChannels()
                if (channelsResult is Result.Success) {
                    val channel = channelsResult.value.find { it.id == channelId }
                    channel?.let { channel ->
                        runOnUiThread {
                            val playbackFragment = PlaybackFragment.newInstance(channel)
                            supportFragmentManager.beginTransaction()
                                .replace(android.R.id.content, playbackFragment, "PLAYBACK_FRAGMENT")
                                .addToBackStack(null)
                                .commit()
                        }
                    }
                }
            }
        }
    }

    fun openVod(vodId: String) {
        // TODO: Implementar abertura de VOD
    }

    fun searchChannels(query: String) {
        val mainFragment = supportFragmentManager.findFragmentByTag("MAIN_FRAGMENT") as? MainFragment
        mainFragment?.searchChannels(query)
    }

    // ============================================================
    // BACK BUTTON HANDLING
    // ============================================================

    override fun onBackPressed() {
        val playbackFragment = supportFragmentManager.findFragmentByTag("PLAYBACK_FRAGMENT") as? PlaybackFragment
        
        if (playbackFragment != null && playbackFragment.isVisible) {
            // Se está no player, volta para main
            supportFragmentManager.popBackStack()
        } else if (supportFragmentManager.backStackEntryCount > 0) {
            supportFragmentManager.popBackStack()
        } else {
            // Pergunta se quer sair
            showExitDialog()
        }
    }

    private fun showExitDialog() {
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("Sair do fidalGO?")
            .setMessage("Deseja realmente fechar o aplicativo?")
            .setPositiveButton("Sair") { _, _ ->
                finishAndRemoveTask()
                android.os.Process.killProcess(android.os.Process.myPid())
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }

    // ============================================================
    // KEY EVENTS (Controle Remoto)
    // ============================================================

    override fun onKeyDown(keyCode: Int, event: KeyEvent): Boolean {
        // Deixa o fragment atual processar primeiro
        val currentFrag = supportFragmentManager.findFragmentById(android.R.id.content)
        if (currentFrag != null && currentFrag.onKeyDown(keyCode, event)) {
            return true
        }

        // Teclas globais
        return when (keyCode) {
            KeyEvent.KEYCODE_BACK -> {
                onBackPressed()
                true
            }
            KeyEvent.KEYCODE_HOME -> {
                moveTaskToBack(true)
                true
            }
            KeyEvent.KEYCODE_MENU -> {
                // Menu rápido (favoritos, configurações, etc.)
                showQuickMenu()
                true
            }
            else -> super.onKeyDown(keyCode, event)
        }
    }

    private fun showQuickMenu() {
        // TODO: Implementar menu rápido lateral
        Toast.makeText(this, "Menu rápido (em desenvolvimento)", Toast.LENGTH_SHORT).show()
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        // Mantém landscape em TV
        if (newConfig.orientation == Configuration.ORIENTATION_PORTRAIT) {
            setRequestedOrientation(Configuration.ORIENTATION_LANDSCAPE)
        }
    }
}