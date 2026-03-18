package com.fisheye.mvp

import android.content.ClipboardManager
import android.content.Context
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.TextView
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class BubbleModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "BubbleModule"

    private var bubbleView: TextView? = null
    private var layoutParams: WindowManager.LayoutParams? = null
    private var isShowing = false

    private val mainHandler = Handler(Looper.getMainLooper())

    private var clipboardListener: ClipboardManager.OnPrimaryClipChangedListener? = null

    // ── Event helper ───────────────────────────────────────────────
    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    // ── JS-callable methods ────────────────────────────────────────
    @ReactMethod
    fun showBubble() {
        if (!Settings.canDrawOverlays(reactApplicationContext)) {
            sendEvent("OverlayPermissionRequired", null)
            return
        }

        if (isShowing) return

        mainHandler.post {
            val context = reactApplicationContext

            val wm = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager

            // Circular background
            val bg = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#888888"))
            }

            // Bubble view
            val tv = TextView(context).apply {
                text = "\uD83D\uDC1F"          // 🐟
                textSize = 24f
                gravity = Gravity.CENTER
                background = bg
            }

            val params = WindowManager.LayoutParams(
                dpToPx(60),
                dpToPx(60),
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.TOP or Gravity.END
                x = 16
                y = 100
            }

            // Touch handling: drag + tap
            var initialX = 0
            var initialY = 0
            var initialTouchX = 0f
            var initialTouchY = 0f
            var isMoved = false

            tv.setOnTouchListener { v: View, event: MotionEvent ->
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        initialX = params.x
                        initialY = params.y
                        initialTouchX = event.rawX
                        initialTouchY = event.rawY
                        isMoved = false
                        true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        val dx = (event.rawX - initialTouchX).toInt()
                        val dy = (event.rawY - initialTouchY).toInt()
                        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                            isMoved = true
                            params.x = initialX - dx   // END gravity inverts x
                            params.y = initialY + dy
                            wm.updateViewLayout(tv, params)
                        }
                        true
                    }
                    MotionEvent.ACTION_UP -> {
                        if (!isMoved) {
                            sendEvent("BubbleTapped", Arguments.createMap())
                        }
                        true
                    }
                    else -> false
                }
            }

            wm.addView(tv, params)
            bubbleView = tv
            layoutParams = params
            isShowing = true

            registerClipboardListener()
        }
    }

    @ReactMethod
    fun hideBubble() {
        mainHandler.post {
            bubbleView?.let { view ->
                val wm = reactApplicationContext
                    .getSystemService(Context.WINDOW_SERVICE) as WindowManager
                try {
                    wm.removeView(view)
                } catch (_: Exception) { }
            }
            bubbleView = null
            layoutParams = null
            isShowing = false
            unregisterClipboardListener()
        }
    }

    @ReactMethod
    fun setBubbleVerdict(verdict: String) {
        val color = when (verdict) {
            "DANGEROUS"  -> "#ff3333"
            "SUSPICIOUS" -> "#ffaa00"
            "SAFE"       -> "#33ff33"
            "SCANNING"   -> "#888888"
            else         -> "#888888"
        }
        mainHandler.post {
            bubbleView?.let { tv ->
                (tv.background as? GradientDrawable)?.setColor(Color.parseColor(color))
            }
        }
    }

    // ── Clipboard listener ─────────────────────────────────────────
    private val urlRegex = Regex("https?://[^\\s]+|www\\.[^\\s]+")

    private fun registerClipboardListener() {
        val cm = reactApplicationContext
            .getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager

        val listener = ClipboardManager.OnPrimaryClipChangedListener {
            val clip = cm.primaryClip
            if (clip != null && clip.itemCount > 0) {
                val text = clip.getItemAt(0).text?.toString() ?: return@OnPrimaryClipChangedListener
                val match = urlRegex.find(text)
                if (match != null) {
                    val map = Arguments.createMap().apply {
                        putString("url", match.value)
                    }
                    sendEvent("UrlCopied", map)
                }
            }
        }

        cm.addPrimaryClipChangedListener(listener)
        clipboardListener = listener
    }

    private fun unregisterClipboardListener() {
        clipboardListener?.let { listener ->
            val cm = reactApplicationContext
                .getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            cm.removePrimaryClipChangedListener(listener)
        }
        clipboardListener = null
    }

    // ── Cleanup ────────────────────────────────────────────────────
    override fun onCatalystInstanceDestroy() {
        hideBubble()
        super.onCatalystInstanceDestroy()
    }

    // ── Util ───────────────────────────────────────────────────────
    private fun dpToPx(dp: Int): Int {
        val density = reactApplicationContext.resources.displayMetrics.density
        return (dp * density).toInt()
    }
}
