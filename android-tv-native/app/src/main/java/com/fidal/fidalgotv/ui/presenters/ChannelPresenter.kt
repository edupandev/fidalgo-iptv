package com.fidal.fidalgotv.ui.presenters

import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.leanback.widget.BaseCardView
import androidx.leanback.widget.ImageCardView
import androidx.leanback.widget.Presenter
import com.bumptech.glide.Glide
import com.bumptech.glide.load.resource.bitmap.RoundedCorners
import com.bumptech.glide.request.RequestOptions
import com.fidal.fidalgotv.R
import com.fidal.fidalgotv.data.models.Channel

/**
 * Presenter para cards de canal (Horizontal Rail - tvOS style)
 */
class ChannelPresenter : Presenter() {

    private val cornerRadius = 16f
    private val logoOptions = RequestOptions()
        .transform(RoundedCorners(8))
        .placeholder(R.drawable.ic_launcher_foreground)
        .error(R.drawable.ic_launcher_foreground)
        .dontAnimate()

    override fun onCreateViewHolder(parent: ViewGroup): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_channel_card, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(viewHolder: ViewHolder, item: Any) {
        val channel = item as Channel
        val holder = viewHolder.view

        // Nome do canal
        val nameText = holder.findViewById<TextView>(R.id.channel_name)
        nameText.text = channel.name

        // Logo do canal
        val logoView = holder.findViewById<ImageView>(R.id.channel_logo)
        Glide.with(holder.context)
            .load(channel.logoUrl())
            .apply(logoOptions)
            .into(logoView)

        // Badge Live
        val liveBadge = holder.findViewById<TextView>(R.id.live_badge)
        liveBadge.visibility = if (channel.isVip()) View.VISIBLE else View.GONE

        // Focus Preview Label (inicialmente oculto)
        val focusLabel = holder.findViewById<TextView>(R.id.focus_preview_label)
        focusLabel.visibility = View.GONE
    }

    override fun onUnbindViewHolder(viewHolder: ViewHolder) {
        // Limpa referências se necessário
    }

    override fun onViewAttachedToWindow(holder: ViewHolder) {
        super.onViewAttachedToWindow(holder)
        // Configura foco
        holder.view.setOnFocusChangeListener { _, hasFocus ->
            val focusLabel = holder.view.findViewById<TextView>(R.id.focus_preview_label)
            if (hasFocus) {
                focusLabel.visibility = View.VISIBLE
                // TODO: Atualizar com programa atual do EPG
                focusLabel.text = "Carregando programação..."
            } else {
                focusLabel.visibility = View.GONE
            }
        }
    }
}

/**
 * Presenter para pílulas de categoria (Segmented Control)
 */
class CategoryPresenter : Presenter() {

    override fun onCreateViewHolder(parent: ViewGroup): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_category_pill, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(viewHolder: ViewHolder, item: Any) {
        val category = item as String
        val chip = viewHolder.view.findViewById<com.google.android.material.chip.Chip>(R.id.category_chip)
        chip.text = category
    }

    override fun onUnbindViewHolder(viewHolder: ViewHolder) {}

    override fun onViewAttachedToWindow(holder: ViewHolder) {
        super.onViewAttachedToWindow(holder)
        holder.view.setOnFocusChangeListener { _, hasFocus ->
            holder.view.isSelected = hasFocus
        }
    }
}

/**
 * Presenter para Hero Preview (Top Section)
 */
class HeroPresenter : Presenter() {

    private val backgroundOptions = RequestOptions()
        .centerCrop()
        .placeholder(R.color.tv_bg_secondary)
        .error(R.color.tv_bg_secondary)
        .dontAnimate()

    private val logoOptions = RequestOptions()
        .fitCenter()
        .placeholder(R.color.t_bg_secondary)
        .error(R.color.tv_bg_secondary)
        .dontAnimate()

    override fun onCreateViewHolder(parent: ViewGroup): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.hero_preview, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(viewHolder: ViewHolder, item: Any) {
        val data = item as HeroData
        val holder = viewHolder.view

        // Background image
        val backgroundView = holder.findViewById<ImageView>(R.id.hero_background)
        if (data.backdropUrl.isNotBlank()) {
            Glide.with(holder.context)
                .load(data.backdropUrl)
                .apply(backgroundOptions)
                .into(backgroundView)
        } else {
            backgroundView.setBackgroundResource(R.color.tv_bg_secondary)
        }

        // Live Badge
        val liveBadge = holder.findViewById<TextView>(R.id.hero_live_badge)
        liveBadge.visibility = if (data.isLive) View.VISIBLE else View.GONE

        // Program Title
        val titleView = holder.findViewById<TextView>(R.id.hero_program_title)
        titleView.text = data.programTitle

        // Channel Name
        val channelNameView = holder.findViewById<TextView>(R.id.hero_channel_name)
        channelNameView.text = data.channelName

        // EPG Progress
        val progressBar = holder.findViewById<android.widget.ProgressBar>(R.id.hero_epg_progress)
        val progressText = holder.findViewById<TextView>(R.id.hero_epg_progress_text)
        
        if (data.epgProgress >= 0) {
            progressBar.visibility = View.VISIBLE
            progressBar.progress = data.epgProgress
            progressText.visibility = View.VISIBLE
            progressText.text = "${data.epgProgress}% concluído"
        } else {
            progressBar.visibility = View.GONE
            progressText.visibility = View.GONE
        }

        // Channel Logo
        val logoView = holder.findViewById<ImageView>(R.id.hero_channel_logo)
        if (data.channelLogoUrl.isNotBlank()) {
            logoView.visibility = View.VISIBLE
            Glide.with(holder.context)
                .load(data.channelLogoUrl)
                .apply(RequestOptions().fitCenter().dontAnimate())
                .into(logoView)
        } else {
            logoView.visibility = View.GONE
        }
    }

    override fun onUnbindViewHolder(viewHolder: ViewHolder) {}

    override fun onViewAttachedToWindow(holder: ViewHolder) {
        super.onViewAttachedToWindow(holder)
    }
}

/**
 * Data class para Hero Preview
 */
data class HeroData(
    val channelId: String,
    val channelName: String,
    val channelLogoUrl: String,
    val programTitle: String,
    val backdropUrl: String = "",
    val isLive: Boolean = true,
    val epgProgress: Int = -1,
    val currentProgram: String = ""
)