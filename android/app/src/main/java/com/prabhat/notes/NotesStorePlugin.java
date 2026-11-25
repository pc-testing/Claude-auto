package com.prabhat.notes;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;

/**
 * Stores all notes as one JSON file in the app's private files directory.
 * Unlike WebView localStorage, Android never clears this on its own, and it is
 * included in Android's automatic backup. Writes are atomic (temp file + rename).
 */
@CapacitorPlugin(name = "NotesStore")
public class NotesStorePlugin extends Plugin {

    private static final String FILE_NAME = "notes.json";

    private File file() {
        return new File(getContext().getFilesDir(), FILE_NAME);
    }

    @PluginMethod
    public synchronized void load(PluginCall call) {
        JSObject ret = new JSObject();
        try {
            File f = file();
            ret.put("data", f.exists()
                    ? new String(Files.readAllBytes(f.toPath()), StandardCharsets.UTF_8)
                    : null);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to read notes: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public synchronized void save(PluginCall call) {
        String data = call.getString("data");
        if (data == null) {
            call.reject("No data");
            return;
        }
        File target = file();
        File tmp = new File(target.getPath() + ".tmp");
        try {
            try (FileOutputStream out = new FileOutputStream(tmp)) {
                out.write(data.getBytes(StandardCharsets.UTF_8));
                out.getFD().sync();
            }
            if (!tmp.renameTo(target)) {
                throw new Exception("rename failed");
            }
            call.resolve();
        } catch (Exception e) {
            tmp.delete();
            call.reject("Failed to save notes: " + e.getMessage(), e);
        }
    }
}
