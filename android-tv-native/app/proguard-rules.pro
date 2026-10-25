# ProGuard/R8 Rules para APK mínimo nativo
# ============================================================

# Mantém a classe Application
-keep class com.fidal.fidalgotv.FidalGOApplication { *; }

# Mantém a Activity principal
-keep class com.fidal.fidalgotv.MainActivity { *; }

# Mantém Fragments
-keep class com.fidal.fidalgotv.ui.MainFragment { *; }
-keep class com.fidal.fidalgotv.ui.PlaybackFragment { *; }

# Mantém Presenters
-keep class com.fidal.fidalgotv.ui.presenters.** { *; }

# Mantém Models (data classes)
-keep class com.fidal.fidalgotv.data.models.** { *; }

# Mantém Repository
-keep class com.fidal.fidalgotv.data.Repository { *; }

# Mantém API Service
-keep class com.fidal.fidalgotv.data.api.FidalGOApiService { *; }
-keep class com.fidal.fidalgotv.data.api.ApiClient { *; }

# Mantém PreferencesManager
-keep class com.fidal.fidalgotv.utils.PreferencesManager { *; }

# ViewBinding & DataBinding
-keep class com.fidal.fidalgotv.databinding.** { *; }

# AndroidX Leanback
-keep class androidx.leanback.** { *; }
-dontwarn androidx.leanback.**

# AndroidX TV Foundation
-keep class androidx.tv.** { *; }
-dontwarn androidx.tv.**

# ExoPlayer
-keep class com.google.android.exoplayer2.** { *; }
-keep class androidx.media3.** { *; }
-dontwarn com.google.android.exoplayer2.**
-dontwarn androidx.media3.**

# Retrofit / OkHttp / Moshi
-keep class retrofit2.** { *; }
-keep class okhttp3.** { *; }
-keep class com.squareup.moshi.** { *; }
-dontwarn retrofit2.**
-dontwarn okhttp3.**
-dontwarn com.squareup.moshi.**

# Glide
-keep class com.bumptech.glide.** { *; }
-keep class com.bumptech.glide.load.resource.bitmap.** { *; }
-dontwarn com.bumptech.glide.**

# Coroutines
-keep class kotlinx.coroutines.** { *; }
-dontwarn kotlinx.coroutines.**

# Lifecycle
-keep class androidx.lifecycle.** { *; }
-dontwarn androidx.lifecycle.**

# Material Components
-keep class com.google.android.material.** { *; }
-dontwarn com.google.android.material.**

# Moshi adapters
-keepclassmembers class * {
    @com.squareup.moshi.Json *;
}

# Mantém Parcelable
-keepclassmembers class * implements android.os.Parcelable {
    static ** CREATOR;
}

# Remove logs em release
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}

# Otimizações
-optimizationpasses 5
-allowaccessmodification
-merginginterfacesaggressively
-overloadaggressively

# Mantém atributos necessários
-keepattributes SourceFile,LineNumberTable,Signature,EnclosingMethod
-keepattributes *Annotation*
-keepattributes JavascriptInterface
-keepattributes InnerClasses
-keepattributes EnclosingMethod