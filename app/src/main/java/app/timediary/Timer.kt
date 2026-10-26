package app.timediary

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.drawable.Icon
import android.os.Build
import android.os.IBinder
import org.json.JSONObject

/**
 * Состояние активного таймера хранится JSON-строкой:
 * { name, icon, startedAt, running, pauseStart, pausedTotal, finished, endedAt }
 */
object TimerStore {
    private const val PREFS = "td_native"
    private const val KEY = "timer"

    fun raw(ctx: Context): String =
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, "") ?: ""

    fun setRaw(ctx: Context, json: String) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, json).apply()
    }

    fun get(ctx: Context): JSONObject? {
        val s = raw(ctx)
        if (s.isBlank()) return null
        return try { JSONObject(s) } catch (e: Exception) { null }
    }

    fun set(ctx: Context, st: JSONObject) = setRaw(ctx, st.toString())
}

object TimerNotifier {
    const val NOTIF_ID = 1
    private const val CHANNEL = "timer"

    fun ensureChannel(ctx: Context) {
        val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (nm.getNotificationChannel(CHANNEL) == null) {
            val ch = NotificationChannel(
                CHANNEL, ctx.getString(R.string.channel_timer), NotificationManager.IMPORTANCE_LOW
            )
            ch.setShowBadge(false)
            nm.createNotificationChannel(ch)
        }
    }

    private fun action(ctx: Context, name: String, label: String, code: Int): Notification.Action {
        val pi = PendingIntent.getBroadcast(
            ctx, code,
            Intent(ctx, TimerActionReceiver::class.java).setAction(name),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        return Notification.Action.Builder(Icon.createWithResource(ctx, R.drawable.ic_stat), label, pi).build()
    }

    fun build(ctx: Context, st: JSONObject?): Notification {
        ensureChannel(ctx)
        val open = PendingIntent.getActivity(
            ctx, 0, Intent(ctx, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        val b = Notification.Builder(ctx, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat)
            .setContentIntent(open)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
        if (Build.VERSION.SDK_INT >= 31) {
            b.setForegroundServiceBehavior(Notification.FOREGROUND_SERVICE_IMMEDIATE)
        }

        if (st == null) {
            return b.setContentTitle(ctx.getString(R.string.app_name)).build()
        }

        val icon = st.optString("icon", "")
        val name = st.optString("name", ctx.getString(R.string.app_name))
        b.setContentTitle(if (icon.isNotEmpty()) "$icon $name" else name)

        val started = st.optLong("startedAt")
        val pausedTotal = st.optLong("pausedTotal", 0L)
        val running = st.optBoolean("running", true)

        if (running) {
            val elapsed = System.currentTimeMillis() - started - pausedTotal
            b.setUsesChronometer(true)
            b.setShowWhen(true)
            b.setWhen(System.currentTimeMillis() - elapsed)
            b.setContentText(ctx.getString(R.string.running))
            b.addAction(action(ctx, "pause", ctx.getString(R.string.pause), 1))
        } else {
            val elapsed = st.optLong("pauseStart") - started - pausedTotal
            val sec = (elapsed / 1000).coerceAtLeast(0)
            val txt = String.format("%02d:%02d:%02d", sec / 3600, (sec % 3600) / 60, sec % 60)
            b.setUsesChronometer(false)
            b.setShowWhen(false)
            b.setContentText(ctx.getString(R.string.paused) + " · " + txt)
            b.addAction(action(ctx, "resume", ctx.getString(R.string.resume), 2))
        }
        b.addAction(action(ctx, "stop", ctx.getString(R.string.stop), 3))
        return b.build()
    }
}

class TimerService : Service() {
    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val st = TimerStore.get(this)
        val n = TimerNotifier.build(this, st)
        if (Build.VERSION.SDK_INT >= 34) {
            startForeground(TimerNotifier.NOTIF_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
        } else {
            startForeground(TimerNotifier.NOTIF_ID, n)
        }
        if (st == null || st.optBoolean("finished", false)) {
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
        }
        return START_STICKY
    }
}

/** Кнопки «Пауза / Продолжить / Завершить» в шторке уведомлений. */
class TimerActionReceiver : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) {
        val st = TimerStore.get(ctx) ?: return
        if (st.optBoolean("finished", false)) return
        val now = System.currentTimeMillis()
        val running = st.optBoolean("running", true)
        val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        when (intent.action) {
            "pause" -> if (running) {
                st.put("running", false)
                st.put("pauseStart", now)
            }
            "resume" -> if (!running) {
                st.put("pausedTotal", st.optLong("pausedTotal", 0L) + (now - st.optLong("pauseStart")))
                st.put("pauseStart", JSONObject.NULL)
                st.put("running", true)
            }
            "stop" -> {
                if (!running) {
                    st.put("pausedTotal", st.optLong("pausedTotal", 0L) + (now - st.optLong("pauseStart")))
                    st.put("pauseStart", JSONObject.NULL)
                    st.put("running", true)
                }
                st.put("finished", true)
                st.put("endedAt", now)
            }
            else -> return
        }
        TimerStore.set(ctx, st)

        if (st.optBoolean("finished", false)) {
            ctx.stopService(Intent(ctx, TimerService::class.java))
            nm.cancel(TimerNotifier.NOTIF_ID)
        } else {
            nm.notify(TimerNotifier.NOTIF_ID, TimerNotifier.build(ctx, st))
        }
    }
}
