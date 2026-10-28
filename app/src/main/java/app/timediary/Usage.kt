package app.timediary

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.os.Build
import android.os.Process
import android.provider.Settings
import android.util.Base64
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream

/** Экранное время по приложениям (читаем системную статистику Android). */
object UsageReader {

    // Типы событий UsageEvents.Event (числа стабильны во всех версиях Android)
    private const val RESUMED = 1            // ACTIVITY_RESUMED / MOVE_TO_FOREGROUND
    private const val PAUSED = 2             // ACTIVITY_PAUSED / MOVE_TO_BACKGROUND
    private const val SCREEN_OFF = 16        // SCREEN_NON_INTERACTIVE
    private const val STOPPED = 23           // ACTIVITY_STOPPED
    private const val SHUTDOWN = 26          // DEVICE_SHUTDOWN

    fun hasAccess(ctx: Context): Boolean {
        val ops = ctx.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= 29) {
            ops.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), ctx.packageName)
        } else {
            @Suppress("DEPRECATION")
            ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), ctx.packageName)
        }
        return mode == AppOpsManager.MODE_ALLOWED
    }

    fun openSettings(ctx: Context) {
        val i = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        try {
            ctx.startActivity(i)
        } catch (e: Exception) {
            ctx.startActivity(Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        }
    }

    private fun homePackages(ctx: Context): Set<String> {
        val out = HashSet<String>()
        val i = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
        for (r in ctx.packageManager.queryIntentActivities(i, 0)) out.add(r.activityInfo.packageName)
        return out
    }

    /** Время на переднем плане по каждому приложению в окне [from, to), JSON: [{p, n, ms}]. */
    fun query(ctx: Context, from: Long, to: Long): String {
        if (!hasAccess(ctx)) return "[]"
        val usm = ctx.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val end = minOf(to, System.currentTimeMillis())
        if (end <= from) return "[]"

        val events = usm.queryEvents(from - 12 * 3600_000L, end)
        val ev = UsageEvents.Event()
        val open = HashMap<String, HashMap<String, Long>>() // пакет -> (активити -> начало)
        val total = HashMap<String, Long>()

        fun add(pkg: String, s: Long, t: Long) {
            val a = maxOf(s, from)
            val b = minOf(t, end)
            if (b > a) total[pkg] = (total[pkg] ?: 0L) + (b - a)
        }

        fun closeAll(t: Long) {
            for ((pkg, m) in open) for (s in m.values) add(pkg, s, t)
            open.clear()
        }

        while (events.hasNextEvent()) {
            events.getNextEvent(ev)
            val ts = ev.timeStamp
            when (ev.eventType) {
                RESUMED -> {
                    val pkg = ev.packageName ?: continue
                    open.getOrPut(pkg) { HashMap() }[ev.className ?: ""] = ts
                }
                PAUSED, STOPPED -> {
                    val pkg = ev.packageName ?: continue
                    val m = open[pkg]
                    val s = m?.remove(ev.className ?: "")
                    if (s != null) add(pkg, s, ts)
                    if (m != null && m.isEmpty()) open.remove(pkg)
                }
                SCREEN_OFF, SHUTDOWN -> closeAll(ts)
            }
        }
        closeAll(end)

        val pm = ctx.packageManager
        val skip = homePackages(ctx) + setOf(ctx.packageName, "com.android.systemui", "android")
        val arr = JSONArray()
        for ((pkg, ms) in total.entries.sortedByDescending { it.value }) {
            if (ms < 1000 || pkg in skip) continue
            if (pm.getLaunchIntentForPackage(pkg) == null) continue   // служебные компоненты
            val name = try {
                pm.getApplicationInfo(pkg, 0).loadLabel(pm).toString()
            } catch (e: Exception) {
                pkg
            }
            arr.put(JSONObject().put("p", pkg).put("n", name).put("ms", ms))
        }
        return arr.toString()
    }

    /** Иконка приложения как data:image/png;base64 (96x96). */
    fun icon(ctx: Context, pkg: String): String {
        return try {
            val d = ctx.packageManager.getApplicationIcon(pkg)
            val size = 96
            val bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
            val c = Canvas(bmp)
            d.setBounds(0, 0, size, size)
            d.draw(c)
            val bos = ByteArrayOutputStream()
            bmp.compress(Bitmap.CompressFormat.PNG, 100, bos)
            "data:image/png;base64," + Base64.encodeToString(bos.toByteArray(), Base64.NO_WRAP)
        } catch (e: Exception) {
            ""
        }
    }
}
