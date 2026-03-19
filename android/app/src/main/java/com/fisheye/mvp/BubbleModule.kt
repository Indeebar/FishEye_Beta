package com.fisheye.mvp

import android.content.ClipboardManager
import android.content.Context
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.DisplayMetrics
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class BubbleModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "BubbleModule"

    private val mainHandler = Handler(Looper.getMainLooper())
    private var windowManager: WindowManager? = null
    private var bubbleView: TextView? = null
    private var bubbleParams: WindowManager.LayoutParams? = null
    private var resultDialogView: View? = null
    private var clipboardManager: ClipboardManager? = null
    private var clipboardListener: ClipboardManager.OnPrimaryClipChangedListener? = null
    private var isShowing = false
    private var lastVerdict: String? = null
    private var lastUrl: String? = null
    private var lastReason: String? = null
    private var lastReasonHindi: String? = null
    private val resetHandler = Handler(Looper.getMainLooper())
    private var resetRunnable: Runnable? = null

    // ── Event helper ───────────────────────────────────────────────
    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    // ── Utility ────────────────────────────────────────────────────
    private fun dpToPx(dp: Int): Int {
        val density = reactApplicationContext.resources.displayMetrics.density
        return (dp * density).toInt()
    }

    private fun setBubbleColor(hexColor: String) {
        val drawable = GradientDrawable()
        drawable.shape = GradientDrawable.OVAL
        drawable.setColor(Color.parseColor(hexColor))
        bubbleView?.background = drawable
    }

    // ── JS-callable methods ────────────────────────────────────────
    @ReactMethod
    fun showBubble() {
        if (!Settings.canDrawOverlays(reactApplicationContext)) {
            val params = Arguments.createMap()
            params.putString("message", "overlay_permission_required")
            sendEvent("OverlayPermissionRequired", params)
            return
        }
        if (isShowing) return
        mainHandler.post {
            val context = reactApplicationContext

            windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager

            val displayMetrics = DisplayMetrics()
            windowManager!!.defaultDisplay.getMetrics(displayMetrics)
            val screenWidth = displayMetrics.widthPixels
            val screenHeight = displayMetrics.heightPixels

            val bg = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#555555"))
            }

            val tv = TextView(context).apply {
                text = "\uD83D\uDC1F"
                textSize = 20f
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
                gravity = Gravity.TOP or Gravity.START
                x = screenWidth - dpToPx(80)
                y = screenHeight / 2
            }

            var initialX = 0
            var initialY = 0
            var initialTouchX = 0f
            var initialTouchY = 0f
            val dragThreshold = 10

            tv.setOnTouchListener { v, event ->
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        initialX = params.x
                        initialY = params.y
                        initialTouchX = event.rawX
                        initialTouchY = event.rawY
                        true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        params.x = initialX + (event.rawX - initialTouchX).toInt()
                        params.y = initialY + (event.rawY - initialTouchY).toInt()
                        windowManager?.updateViewLayout(tv, params)
                        true
                    }
                    MotionEvent.ACTION_UP -> {
                        val dx = Math.abs(event.rawX - initialTouchX)
                        val dy = Math.abs(event.rawY - initialTouchY)
                        if (dx < dragThreshold && dy < dragThreshold) {
                            handleBubbleTap()
                        }
                        true
                    }
                    else -> false
                }
            }

            windowManager?.addView(tv, params)
            bubbleView = tv
            bubbleParams = params
            isShowing = true

            registerClipboardListener()
        }
    }

    @ReactMethod
    fun hideBubble() {
        mainHandler.post {
            bubbleView?.let {
                try { windowManager?.removeView(it) } catch (_: Exception) {}
            }
            bubbleView = null
            resultDialogView?.let {
                try { windowManager?.removeView(it) } catch (_: Exception) {}
            }
            resultDialogView = null
            clipboardListener?.let { clipboardManager?.removePrimaryClipChangedListener(it) }
            isShowing = false
            lastVerdict = null
            lastUrl = null
            lastReason = null
            lastReasonHindi = null
        }
    }

    @ReactMethod
    fun setBubbleVerdict(verdict: String, url: String, reason: String, reasonHindi: String) {
        lastVerdict = verdict
        lastUrl = url
        lastReason = reason
        lastReasonHindi = reasonHindi

        resetRunnable?.let { resetHandler.removeCallbacks(it) }

        mainHandler.post {
            val color: String
            val text: String
            when (verdict) {
                "DANGEROUS" -> {
                    color = "#ff3333"
                    text = "\u26A0\uFE0F DANGER"
                }
                "SUSPICIOUS" -> {
                    color = "#ffaa00"
                    text = "\u26A0\uFE0F SUS"
                }
                "SAFE" -> {
                    color = "#33ff33"
                    text = "\u2713 SAFE"
                }
                else -> {
                    color = "#888888"
                    text = "..."
                }
            }
            setBubbleColor(color)
            bubbleView?.text = text
            bubbleView?.textSize = 11f
        }

        if (verdict != "SCANNING") {
            resetRunnable = Runnable {
                mainHandler.post {
                    setBubbleColor("#555555")
                    bubbleView?.text = "\uD83D\uDC1F"
                    bubbleView?.textSize = 20f
                    lastVerdict = null
                    lastUrl = null
                    lastReason = null
                    lastReasonHindi = null
                }
            }
            resetHandler.postDelayed(resetRunnable!!, 5000)
        }
    }

    // ── Bubble tap handling ────────────────────────────────────────
    private fun handleBubbleTap() {
        if (lastVerdict == null) {
            mainHandler.post {
                Toast.makeText(
                    reactApplicationContext,
                    "Copy a link in WhatsApp to scan",
                    Toast.LENGTH_SHORT
                ).show()
            }
            return
        }
        showResultDialog()
        sendEvent("BubbleTapped", null)
    }

    private fun showResultDialog() {
        resultDialogView?.let {
            try { windowManager?.removeView(it) } catch (_: Exception) {}
        }

        mainHandler.post {
            val context = reactApplicationContext

            val displayMetrics = DisplayMetrics()
            windowManager!!.defaultDisplay.getMetrics(displayMetrics)
            val screenWidth = displayMetrics.widthPixels

            val container = LinearLayout(context).apply {
                orientation = LinearLayout.VERTICAL
                val cardBg = GradientDrawable().apply {
                    setColor(Color.parseColor("#1a1a1a"))
                    cornerRadius = dpToPx(16).toFloat()
                }
                background = cardBg
                setPadding(dpToPx(20), dpToPx(20), dpToPx(20), dpToPx(20))
            }

            val emoji: String
            val verdictColor: String
            when (lastVerdict) {
                "DANGEROUS" -> {
                    emoji = "\uD83D\uDD34"
                    verdictColor = "#ff3333"
                }
                "SUSPICIOUS" -> {
                    emoji = "\uD83D\uDFE1"
                    verdictColor = "#ffaa00"
                }
                "SAFE" -> {
                    emoji = "\uD83D\uDFE2"
                    verdictColor = "#33ff33"
                }
                else -> {
                    emoji = "\u231B"
                    verdictColor = "#888888"
                }
            }

            val emojiView = TextView(context).apply {
                text = emoji
                textSize = 40f
                gravity = Gravity.CENTER
            }
            container.addView(emojiView)

            val verdictView = TextView(context).apply {
                text = lastVerdict ?: "UNKNOWN"
                textSize = 22f
                setTextColor(Color.parseColor(verdictColor))
                gravity = Gravity.CENTER
                paint.isFakeBoldText = true
                setPadding(0, dpToPx(8), 0, dpToPx(8))
            }
            container.addView(verdictView)

            val urlText = lastUrl?.let {
                if (it.length > 50) it.substring(0, 50) + "..." else it
            } ?: ""
            val urlView = TextView(context).apply {
                text = urlText
                textSize = 12f
                setTextColor(Color.parseColor("#888888"))
                gravity = Gravity.CENTER
                setPadding(0, 0, 0, dpToPx(12))
            }
            container.addView(urlView)

            val reasonView = TextView(context).apply {
                text = lastReason ?: ""
                textSize = 14f
                setTextColor(Color.WHITE)
                gravity = Gravity.CENTER
                setPadding(0, 0, 0, dpToPx(4))
            }
            container.addView(reasonView)

            val hindiView = TextView(context).apply {
                text = lastReasonHindi ?: ""
                textSize = 12f
                setTextColor(Color.parseColor("#888888"))
                gravity = Gravity.CENTER
                setPadding(0, 0, 0, dpToPx(12))
            }
            container.addView(hindiView)

            val adviceText: String
            when (lastVerdict) {
                "DANGEROUS" -> {
                    adviceText = "DO NOT open this link! It may steal your data."
                }
                "SUSPICIOUS" -> {
                    adviceText = "Be careful before opening this link."
                }
                "SAFE" -> {
                    adviceText = "Looks safe. Stay alert always."
                }
                else -> {
                    adviceText = ""
                }
            }
            val adviceView = TextView(context).apply {
                text = adviceText
                textSize = 13f
                setTextColor(Color.parseColor("#cccccc"))
                gravity = Gravity.CENTER
                setPadding(0, 0, 0, dpToPx(16))
            }
            container.addView(adviceView)

            val closeBtn = TextView(context).apply {
                text = "\u2715 Close"
                textSize = 16f
                setTextColor(Color.WHITE)
                gravity = Gravity.CENTER
                setPadding(0, dpToPx(12), 0, dpToPx(12))
                val btnBg = GradientDrawable().apply {
                    setColor(Color.parseColor("#333333"))
                    cornerRadius = dpToPx(8).toFloat()
                }
                background = btnBg
            }
            closeBtn.setOnClickListener {
                try {
                    windowManager?.removeView(container)
                } catch (_: Exception) {}
                resultDialogView = null
            }
            container.addView(closeBtn)

            val dialogWidth = (screenWidth * 0.9).toInt()
            val dialogParams = WindowManager.LayoutParams(
                dialogWidth,
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
                y = dpToPx(32)
            }

            windowManager?.addView(container, dialogParams)
            resultDialogView = container
        }
    }

    // ── Clipboard listener ─────────────────────────────────────────
    private fun registerClipboardListener() {
        clipboardManager = reactApplicationContext
            .getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        clipboardListener = ClipboardManager.OnPrimaryClipChangedListener {
            val clip = clipboardManager?.primaryClip
            val text = clip?.getItemAt(0)?.text?.toString()
                ?: return@OnPrimaryClipChangedListener
            val urlRegex = Regex("https?://[^\\s]+|www\\.[^\\s]+")
            val url = urlRegex.find(text)?.value
                ?: return@OnPrimaryClipChangedListener
            val params = Arguments.createMap()
            params.putString("url", url)
            sendEvent("UrlCopied", params)
        }
        clipboardManager?.addPrimaryClipChangedListener(clipboardListener)
    }

    // ── Cleanup ────────────────────────────────────────────────────
    override fun onCatalystInstanceDestroy() {
        hideBubble()
        super.onCatalystInstanceDestroy()
    }
}
