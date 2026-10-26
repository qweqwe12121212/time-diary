package app.timediary

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.webkit.JavascriptInterface

/** Мост между веб-интерфейсом (JS) и Android. */
class Bridge(private val ctx: Context) {

    @JavascriptInterface
    fun getTimer(): String = TimerStore.raw(ctx)

    @JavascriptInterface
    fun setTimer(json: String) {
        TimerStore.setRaw(ctx, json)
        val st = TimerStore.get(ctx)
        val intent = Intent(ctx, TimerService::class.java)
        if (st != null && !st.optBoolean("finished", false)) {
            ctx.startForegroundService(intent)
        } else {
            ctx.stopService(intent)
            (ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
                .cancel(TimerNotifier.NOTIF_ID)
        }
    }

    @JavascriptInterface
    fun setReminders(json: String) {
        Reminders.set(ctx, json)
    }
}
