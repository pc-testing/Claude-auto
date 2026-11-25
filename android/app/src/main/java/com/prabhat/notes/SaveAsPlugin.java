package com.prabhat.notes;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "SaveAs")
public class SaveAsPlugin extends Plugin {

    @PluginMethod
    public void saveAs(PluginCall call) {
        String fileName = call.getString("fileName", "export.txt");

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("text/plain");
        intent.putExtra(Intent.EXTRA_TITLE, fileName);

        startActivityForResult(call, intent, "handleSaveAsResult");
    }

    @ActivityCallback
    private void handleSaveAsResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }

        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            call.reject("Save canceled");
            return;
        }

        Uri uri = result.getData().getData();
        if (uri == null) {
            call.reject("No file URI returned");
            return;
        }

        String data = call.getString("data", "");
        try {
            ContentResolver resolver = getContext().getContentResolver();
            try (OutputStream out = resolver.openOutputStream(uri)) {
                if (out == null) {
                    call.reject("Unable to open output stream");
                    return;
                }
                out.write(data.getBytes(StandardCharsets.UTF_8));
                out.flush();
            }

            JSObject ret = new JSObject();
            ret.put("uri", uri.toString());
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to write file: " + e.getMessage(), e);
        }
    }
}
