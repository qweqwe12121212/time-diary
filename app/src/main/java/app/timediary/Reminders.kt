package app.timediary

import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.graphics.drawable.Icon
import org.json.JSONArray
import org.json.JSONObject

/** Напоминания: JS присылает полный список [{id, title, at}], мы ставим будильники. */
object Reminders {
    private const val PREFS = "td_native"
    private const val KEY_LIST = "reminders"
    private const val KEY_IDS = "reminder_ids"

    fun set(ctx: Context, json: String) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY_LIST, json).apply()
        schedule(ctx)
    }

    private fun pending(ctx: Context, id: String, title: String?, flags: Int): PendingIntent? {
        val i = Intent(ctx, ReminderReceiver::class.java)
        if (title != null) {
            i.putExtra("title", title)
            i.putExtra("id", id)
        }
        return PendingIntent.getBroadcast(ctx, id.hashCode(), i, flags or PendingIntent.FLAG_IMMUTABLE)
    }

    fun schedule(ctx: Context) {
        val prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager

        // снять старые
        try {
            val old = JSONArray(prefs.getString(KEY_IDS, "[]"))
            for (k in 0 until old.length()) {
                val id = old.getString(k)
                pending(ctx, id, null, PendingIntent.FLAG_NO_CREATE)?.let {
                    am.cancel(it)
                    it.cancel()
                }
            }
        } catch (_: Exception) {}

        val ids = JSONArray()
        try {
            val list = JSONArray(prefs.getString(KEY_LIST, "[]"))
            val now = System.currentTimeMillis()
            for (k in 0 until list.length()) {
                val o: JSONObject = list.getJSONObject(k)
                val at = o.getLong("at")
                if (at <= now) continue
                val id = o.getString("id")
                val pi = pending(ctx, id, o.optString("title", ""), PendingIntent.FLAG_UPDATE_CURRENT) ?: continue
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi)
                ids.put(id)
            }
        } catch (_: Exception) {}
        prefs.edit().putString(KEY_IDS, ids.toString()).apply()
    }
}

class ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) {
        val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (nm.getNotificationChannel("reminders") == null) {
            nm.createNotificationChannel(
                NotificationChannel("reminders", ctx.getString(R.string.channel_reminders), NotificationManager.IMPORTANCE_HIGH)
            )
        }
        val open = PendingIntent.getActivity(
            ctx, 0, Intent(ctx, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        val title = intent.getStringExtra("title") ?: ""
        val id = intent.getStringExtra("id") ?: title
        val n = Notification.Builder(ctx, "reminders")
            .setSmallIcon(R.drawable.ic_stat)
            .setContentTitle(ctx.getString(R.string.app_name))
            .setContentText(title)
            .setStyle(Notification.BigTextStyle().bigText(title))
            .setContentIntent(open)
            .setAutoCancel(true)
            .build()
        nm.notify(id.hashCode(), n)
    }
}

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) Reminders.schedule(ctx)
    }
}
