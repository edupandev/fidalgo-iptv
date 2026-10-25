package com.fidal.fidalgo

import android.annotation.SuppressLint
import android.app.AlertDialog
import android.content.pm.ActivityInfo
import android.graphics.Bitmap
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.*
import android.widget.FrameLayout
import android.widget.ProgressBar
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var container: FrameLayout
    private var customView: View? = null
    private var customViewCallback: WebChromeClient.CustomViewCallback? = null

    companion object {
        // Altere aqui para a URL oficial do seu servidor FIDAL GO
        const val APP_URL = "https://fidalgotv.ngrok.app"
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Configurações de Tela Cheia e Paisagem para Smart TV
        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        hideSystemUI()

        // Layout Raiz
        container = FrameLayout(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#050507"))
        }

        // Barra de Carregamento
        progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                8
            )
            max = 100
            progress = 0
            visibility = View.VISIBLE
        }

        // WebView Otimizado para TV Box & Android TV
        webView = WebView(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#050507"))
            isFocusable = true
            isFocusableInTouchMode = true
            requestFocus()
        }

        configureWebViewSettings()
        setupWebViewClients()

        container.addView(webView)
        container.addView(progressBar)
        setContentView(container)

        // Carrega a URL do FIDAL GO
        webView.loadUrl(APP_URL)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebViewSettings() {
        val s = webView.settings

        // JavaScript & Armazenamento Local
        s.javaScriptEnabled = true
        s.domStorageEnabled = true
        s.databaseEnabled = true

        // Reprodução Automática de Mídia sem exigir clique de toque (Essencial para TV)
        s.mediaPlaybackRequiresUserGesture = false

        // Cache e Desempenho
        s.cacheMode = WebSettings.LOAD_DEFAULT
        s.allowFileAccess = true
        s.allowContentAccess = true

        // Viewport e Zoom
        s.useWideViewPort = true
        s.loadWithOverviewMode = true
        s.setSupportZoom(false)
        s.builtInZoomControls = false
        s.displayZoomControls = false

        // Aceleração por Hardware & Conteúdo Misto (HTTP/HTTPS de streams IPTV)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            s.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)
        }
        CookieManager.getInstance().setAcceptCookie(true)

        // User Agent de Smart TV Moderna
        s.userAgentString = "Mozilla/5.0 (Linux; Android 12; Android TV Build/STT.220610.001) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 SmartTV/FIDALGO"
    }

    private fun setupWebViewClients() {
        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                progressBar.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                progressBar.visibility = View.GONE
                hideSystemUI()
                // Garante que o WebView receba o foco para o controle remoto (D-Pad)
                webView.requestFocus()
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                super.onReceivedError(view, request, error)
                // Se a página principal falhar ao carregar, exibe aviso e botão de reconectar
                if (request?.isForMainFrame == true) {
                    showErrorAndRetryDialog()
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                progressBar.progress = newProgress
                if (newProgress >= 100) {
                    progressBar.visibility = View.GONE
                }
            }

            // Suporte Oficial a Vídeo em Tela Cheia no Android TV
            override fun onShowCustomView(view: View?, callback: CustomViewCallback?) {
                if (customView != null) {
                    callback?.onCustomViewHidden()
                    return
                }
                customView = view
                customViewCallback = callback
                webView.visibility = View.GONE
                container.addView(customView)
                hideSystemUI()
            }

            override fun onHideCustomView() {
                if (customView == null) return
                container.removeView(customView)
                customView = null
                webView.visibility = View.VISIBLE
                customViewCallback?.onCustomViewHidden()
                hideSystemUI()
                webView.requestFocus()
            }
        }
    }

    /**
     * Mapeamento de Teclas do Controle Remoto (D-Pad, OK, Números 0-9 e Voltar)
     */
    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        val action = event.action
        val keyCode = event.keyCode

        // Trata o botão "Voltar" (Back) do controle remoto
        if (action == KeyEvent.ACTION_DOWN && keyCode == KeyEvent.KEYCODE_BACK) {
            if (customView != null) {
                // Sai do modo tela cheia se um vídeo estiver expandido
                webView.webChromeClient?.onHideCustomView()
                return true
            }

            // Se o WebView puder voltar (navegar entre páginas/modais)
            if (webView.canGoBack()) {
                webView.goBack()
                return true
            }

            // Diálogo de confirmação para sair do app
            showExitConfirmationDialog()
            return true
        }

        // Se o evento for no controle remoto (D-Pad ou teclas numéricas), repassa ao WebView
        return super.dispatchKeyEvent(event)
    }

    private fun showExitConfirmationDialog() {
        AlertDialog.Builder(this, android.R.style.Theme_DeviceDefault_Dialog_Alert)
            .setTitle("FIDAL GO")
            .setMessage("Deseja fechar o aplicativo?")
            .setPositiveButton("Sair") { _, _ -> finishAffinity() }
            .setNegativeButton("Continuar Assistindo") { dialog, _ ->
                dialog.dismiss()
                hideSystemUI()
                webView.requestFocus()
            }
            .show()
    }

    private fun showErrorAndRetryDialog() {
        AlertDialog.Builder(this, android.R.style.Theme_DeviceDefault_Dialog_Alert)
            .setTitle("Falha na Conexão")
            .setMessage("Não foi possível conectar ao servidor FIDAL GO em $APP_URL.\n\nVerifique se o seu computador está ligado e com o Iniciar-com-Ngrok.bat aberto.")
            .setPositiveButton("Tentar Novamente") { _, _ ->
                webView.reload()
            }
            .setNegativeButton("Fechar") { _, _ -> finish() }
            .setCancelable(false)
            .show()
    }

    private fun hideSystemUI() {
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_FULLSCREEN
        )
    }

    override fun onResume() {
        super.onResume()
        hideSystemUI()
        webView.onResume()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
