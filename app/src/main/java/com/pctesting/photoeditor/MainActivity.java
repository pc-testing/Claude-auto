package com.pctesting.photoeditor;

import android.Manifest;
import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.ColorMatrix;
import android.graphics.ColorMatrixColorFilter;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.RadialGradient;
import android.graphics.Shader;
import android.media.ExifInterface;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.HorizontalScrollView;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.SeekBar;
import android.widget.TextView;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {

    private static final int REQ_PICK = 1;
    private static final int REQ_WRITE_PERM = 2;
    private static final int MAX_DIM = 2048;
    private static final int MAX_UNDO = 6;

    private interface Op {
        Bitmap apply(Bitmap src);
    }

    private ImageView imageView;
    private TextView hintView;
    private FrameLayout panelContainer;
    private View transformPanel, filterPanel, adjustPanel;
    private Button tabTransform, tabFilters, tabAdjust;
    private SeekBar seekBrightness, seekContrast, seekSaturation, seekWarmth;
    private TextView labelBrightness, labelContrast, labelSaturation, labelWarmth;

    private Bitmap current;
    private Bitmap original;
    private final Deque<Bitmap> undoStack = new ArrayDeque<>();
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private Runnable pendingAfterPermission;
    private boolean busy;

    // ---------------------------------------------------------------- lifecycle

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        imageView = findViewById(R.id.imageView);
        hintView = findViewById(R.id.hint);
        panelContainer = findViewById(R.id.panelContainer);
        tabTransform = findViewById(R.id.tabTransform);
        tabFilters = findViewById(R.id.tabFilters);
        tabAdjust = findViewById(R.id.tabAdjust);

        findViewById(R.id.btnOpen).setOnClickListener(v -> pickImage());
        findViewById(R.id.btnUndo).setOnClickListener(v -> undo());
        findViewById(R.id.btnSave).setOnClickListener(v -> saveImage(false));
        findViewById(R.id.btnShare).setOnClickListener(v -> saveImage(true));
        hintView.setOnClickListener(v -> pickImage());

        transformPanel = buildTransformPanel();
        filterPanel = buildFilterPanel();
        adjustPanel = buildAdjustPanel();
        panelContainer.addView(transformPanel);
        panelContainer.addView(filterPanel);
        panelContainer.addView(adjustPanel);

        tabTransform.setOnClickListener(v -> showTab(0));
        tabFilters.setOnClickListener(v -> showTab(1));
        tabAdjust.setOnClickListener(v -> showTab(2));
        showTab(0);

        handleIncomingIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleIncomingIntent(intent);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        executor.shutdownNow();
    }

    private void handleIncomingIntent(Intent intent) {
        if (intent == null) return;
        Uri uri = null;
        if (Intent.ACTION_SEND.equals(intent.getAction())) {
            uri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
        } else if (Intent.ACTION_EDIT.equals(intent.getAction())) {
            uri = intent.getData();
        }
        if (uri != null) loadImage(uri);
    }

    // ---------------------------------------------------------------- UI building

    private int dp(float v) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v,
                getResources().getDisplayMetrics());
    }

    private Button makeButton(String label, View.OnClickListener l) {
        Button b = new Button(this, null, android.R.attr.borderlessButtonStyle);
        b.setText(label);
        b.setAllCaps(false);
        b.setTextColor(Color.WHITE);
        b.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        b.setOnClickListener(l);
        return b;
    }

    private View makeRow(Button... buttons) {
        HorizontalScrollView sv = new HorizontalScrollView(this);
        sv.setHorizontalScrollBarEnabled(false);
        sv.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT,
                Gravity.CENTER_VERTICAL));
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setPadding(dp(8), 0, dp(8), 0);
        for (Button b : buttons) row.addView(b);
        sv.addView(row);
        return sv;
    }

    private View buildTransformPanel() {
        return makeRow(
                makeButton("Rotate ⟲", v -> edit(b -> rotate(b, -90))),
                makeButton("Rotate ⟳", v -> edit(b -> rotate(b, 90))),
                makeButton("Flip ↔", v -> edit(b -> flip(b, true))),
                makeButton("Flip ↕", v -> edit(b -> flip(b, false))),
                makeButton("Crop 1:1", v -> edit(b -> cropToRatio(b, 1, 1))),
                makeButton("Crop 4:5", v -> edit(b -> cropToRatio(b, 4, 5))),
                makeButton("Crop 4:3", v -> edit(b -> cropToRatio(b, 4, 3))),
                makeButton("Crop 16:9", v -> edit(b -> cropToRatio(b, 16, 9))),
                makeButton("Reset all", v -> resetToOriginal()));
    }

    private View buildFilterPanel() {
        return makeRow(
                makeButton("B&W", v -> edit(b -> applyMatrix(b, grayscaleMatrix()))),
                makeButton("Sepia", v -> edit(b -> applyMatrix(b, sepiaMatrix()))),
                makeButton("Vintage", v -> edit(b -> applyMatrix(b, vintageMatrix()))),
                makeButton("Vivid", v -> edit(b -> applyMatrix(b, saturationMatrix(1.6f)))),
                makeButton("Warm", v -> edit(b -> applyMatrix(b, scaleMatrix(1.10f, 1.0f, 0.85f)))),
                makeButton("Cool", v -> edit(b -> applyMatrix(b, scaleMatrix(0.88f, 1.0f, 1.12f)))),
                makeButton("Invert", v -> edit(b -> applyMatrix(b, invertMatrix()))),
                makeButton("Vignette", v -> edit(MainActivity::vignette)));
    }

    private View buildAdjustPanel() {
        LinearLayout col = new LinearLayout(this);
        col.setOrientation(LinearLayout.VERTICAL);
        col.setPadding(dp(16), dp(4), dp(8), dp(4));

        labelBrightness = new TextView(this);
        seekBrightness = addSlider(col, labelBrightness);
        labelContrast = new TextView(this);
        seekContrast = addSlider(col, labelContrast);
        labelSaturation = new TextView(this);
        seekSaturation = addSlider(col, labelSaturation);
        labelWarmth = new TextView(this);
        seekWarmth = addSlider(col, labelWarmth);

        LinearLayout buttons = new LinearLayout(this);
        buttons.setOrientation(LinearLayout.HORIZONTAL);
        buttons.setGravity(Gravity.END);
        buttons.addView(makeButton("Reset sliders", v -> resetSliders()));
        Button apply = makeButton("Apply", v -> commitAdjustments());
        apply.setTextColor(getColor(R.color.accent));
        buttons.addView(apply);
        col.addView(buttons);

        updateSliderLabels();
        return col;
    }

    private SeekBar addSlider(LinearLayout parent, TextView label) {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);

        label.setTextColor(Color.WHITE);
        label.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
        row.addView(label, new LinearLayout.LayoutParams(dp(120), ViewGroup.LayoutParams.WRAP_CONTENT));

        SeekBar sb = new SeekBar(this);
        sb.setMax(200);
        sb.setProgress(100);
        sb.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                updateSliderLabels();
                updatePreview();
            }

            @Override
            public void onStartTrackingTouch(SeekBar seekBar) {
            }

            @Override
            public void onStopTrackingTouch(SeekBar seekBar) {
            }
        });
        row.addView(sb, new LinearLayout.LayoutParams(0, dp(40), 1f));
        parent.addView(row);
        return sb;
    }

    private void showTab(int index) {
        if (index != 2) commitAdjustments();
        transformPanel.setVisibility(index == 0 ? View.VISIBLE : View.GONE);
        filterPanel.setVisibility(index == 1 ? View.VISIBLE : View.GONE);
        adjustPanel.setVisibility(index == 2 ? View.VISIBLE : View.GONE);
        int on = getColor(R.color.accent);
        int off = getColor(R.color.text_dim);
        tabTransform.setTextColor(index == 0 ? on : off);
        tabFilters.setTextColor(index == 1 ? on : off);
        tabAdjust.setTextColor(index == 2 ? on : off);
    }

    private void toast(String msg) {
        Toast.makeText(this, msg, Toast.LENGTH_SHORT).show();
    }

    // ---------------------------------------------------------------- open

    private void pickImage() {
        if (busy) return;
        Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
        intent.setType("image/*");
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        try {
            startActivityForResult(Intent.createChooser(intent, "Choose a photo"), REQ_PICK);
        } catch (Exception e) {
            toast("No app available to pick photos");
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_PICK && resultCode == RESULT_OK && data != null && data.getData() != null) {
            loadImage(data.getData());
        }
    }

    private void loadImage(final Uri uri) {
        busy = true;
        hintView.setText("Loading…");
        hintView.setVisibility(View.VISIBLE);
        executor.execute(() -> {
            try {
                final Bitmap bmp = decodeSampled(uri);
                mainHandler.post(() -> {
                    busy = false;
                    undoStack.clear();
                    original = bmp;
                    resetSliders();
                    setCurrent(bmp);
                });
            } catch (Exception | OutOfMemoryError e) {
                mainHandler.post(() -> {
                    busy = false;
                    if (current == null) {
                        hintView.setText(R.string.hint_open);
                    } else {
                        hintView.setVisibility(View.GONE);
                    }
                    toast("Couldn't open that image");
                });
            }
        });
    }

    private Bitmap decodeSampled(Uri uri) throws IOException {
        BitmapFactory.Options bounds = new BitmapFactory.Options();
        bounds.inJustDecodeBounds = true;
        try (InputStream in = getContentResolver().openInputStream(uri)) {
            BitmapFactory.decodeStream(in, null, bounds);
        }
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) throw new IOException("Not an image");

        int sample = 1;
        while (Math.max(bounds.outWidth, bounds.outHeight) / sample > MAX_DIM) sample *= 2;

        BitmapFactory.Options opts = new BitmapFactory.Options();
        opts.inSampleSize = sample;
        opts.inPreferredConfig = Bitmap.Config.ARGB_8888;
        Bitmap bmp;
        try (InputStream in = getContentResolver().openInputStream(uri)) {
            bmp = BitmapFactory.decodeStream(in, null, opts);
        }
        if (bmp == null) throw new IOException("Decode failed");

        // Respect the camera's orientation flag so photos aren't sideways.
        int orientation = ExifInterface.ORIENTATION_NORMAL;
        try (InputStream in = getContentResolver().openInputStream(uri)) {
            if (in != null) {
                orientation = new ExifInterface(in).getAttributeInt(
                        ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL);
            }
        } catch (Exception ignored) {
        }
        Matrix m = new Matrix();
        switch (orientation) {
            case ExifInterface.ORIENTATION_ROTATE_90: m.postRotate(90); break;
            case ExifInterface.ORIENTATION_ROTATE_180: m.postRotate(180); break;
            case ExifInterface.ORIENTATION_ROTATE_270: m.postRotate(270); break;
            case ExifInterface.ORIENTATION_FLIP_HORIZONTAL: m.postScale(-1, 1); break;
            case ExifInterface.ORIENTATION_FLIP_VERTICAL: m.postScale(1, -1); break;
            case ExifInterface.ORIENTATION_TRANSPOSE: m.postRotate(90); m.postScale(-1, 1); break;
            case ExifInterface.ORIENTATION_TRANSVERSE: m.postRotate(270); m.postScale(-1, 1); break;
            default: return bmp;
        }
        return Bitmap.createBitmap(bmp, 0, 0, bmp.getWidth(), bmp.getHeight(), m, true);
    }

    // ---------------------------------------------------------------- editing core

    private void setCurrent(Bitmap bmp) {
        current = bmp;
        imageView.setImageBitmap(bmp);
        updatePreview();
        hintView.setVisibility(bmp == null ? View.VISIBLE : View.GONE);
    }

    private void pushUndo(Bitmap bmp) {
        if (bmp == null) return;
        undoStack.push(bmp);
        while (undoStack.size() > MAX_UNDO) undoStack.removeLast();
    }

    private void edit(Op op) {
        if (busy) return;
        if (current == null) {
            toast("Open a photo first");
            return;
        }
        commitAdjustments();
        try {
            Bitmap result = op.apply(current);
            if (result == null) return;
            pushUndo(current);
            setCurrent(result);
        } catch (OutOfMemoryError e) {
            undoStack.clear();
            toast("Not enough memory for that edit");
        }
    }

    private void undo() {
        if (busy) return;
        if (hasPendingAdjust()) {
            resetSliders();
            return;
        }
        if (undoStack.isEmpty()) {
            toast("Nothing to undo");
            return;
        }
        setCurrent(undoStack.pop());
    }

    private void resetToOriginal() {
        if (original == null) {
            toast("Open a photo first");
            return;
        }
        resetSliders();
        if (current != original) {
            pushUndo(current);
            setCurrent(original);
        }
    }

    // ---------------------------------------------------------------- adjustments

    private boolean hasPendingAdjust() {
        return seekBrightness.getProgress() != 100 || seekContrast.getProgress() != 100
                || seekSaturation.getProgress() != 100 || seekWarmth.getProgress() != 100;
    }

    private void resetSliders() {
        seekBrightness.setProgress(100);
        seekContrast.setProgress(100);
        seekSaturation.setProgress(100);
        seekWarmth.setProgress(100);
        updateSliderLabels();
        updatePreview();
    }

    private void updateSliderLabels() {
        if (labelBrightness == null || seekWarmth == null) return;
        labelBrightness.setText("Brightness " + signed(seekBrightness.getProgress() - 100));
        labelContrast.setText("Contrast " + signed(seekContrast.getProgress() - 100));
        labelSaturation.setText("Saturation " + signed(seekSaturation.getProgress() - 100));
        labelWarmth.setText("Warmth " + signed(seekWarmth.getProgress() - 100));
    }

    private static String signed(int v) {
        return v > 0 ? "+" + v : String.valueOf(v);
    }

    /** Live preview: the sliders are shown as a color filter on the view until applied. */
    private void updatePreview() {
        if (imageView == null || seekWarmth == null) return;
        if (current != null && hasPendingAdjust()) {
            imageView.setColorFilter(new ColorMatrixColorFilter(buildAdjustMatrix()));
        } else {
            imageView.clearColorFilter();
        }
    }

    private ColorMatrix buildAdjustMatrix() {
        float brightness = (seekBrightness.getProgress() - 100) * 1.2f;   // -120..+120
        float contrast = seekContrast.getProgress() / 100f;               // 0..2
        float saturation = seekSaturation.getProgress() / 100f;           // 0..2
        float warmth = (seekWarmth.getProgress() - 100) / 100f;           // -1..1

        ColorMatrix cm = saturationMatrix(saturation);

        float t = 128f * (1f - contrast);
        cm.postConcat(new ColorMatrix(new float[]{
                contrast, 0, 0, 0, t,
                0, contrast, 0, 0, t,
                0, 0, contrast, 0, t,
                0, 0, 0, 1, 0}));

        cm.postConcat(new ColorMatrix(new float[]{
                1, 0, 0, 0, brightness,
                0, 1, 0, 0, brightness,
                0, 0, 1, 0, brightness,
                0, 0, 0, 1, 0}));

        cm.postConcat(scaleMatrix(1f + 0.2f * warmth, 1f, 1f - 0.2f * warmth));
        return cm;
    }

    private void commitAdjustments() {
        if (current == null || seekWarmth == null || !hasPendingAdjust()) return;
        try {
            Bitmap result = applyMatrix(current, buildAdjustMatrix());
            pushUndo(current);
            seekBrightness.setProgress(100);
            seekContrast.setProgress(100);
            seekSaturation.setProgress(100);
            seekWarmth.setProgress(100);
            updateSliderLabels();
            setCurrent(result);
        } catch (OutOfMemoryError e) {
            toast("Not enough memory to apply");
        }
    }

    // ---------------------------------------------------------------- image operations

    private static Bitmap rotate(Bitmap src, float degrees) {
        Matrix m = new Matrix();
        m.postRotate(degrees);
        return Bitmap.createBitmap(src, 0, 0, src.getWidth(), src.getHeight(), m, true);
    }

    private static Bitmap flip(Bitmap src, boolean horizontal) {
        Matrix m = new Matrix();
        if (horizontal) m.preScale(-1, 1);
        else m.preScale(1, -1);
        return Bitmap.createBitmap(src, 0, 0, src.getWidth(), src.getHeight(), m, true);
    }

    /** Center crop to the given aspect ratio (landscape or portrait as written). */
    private static Bitmap cropToRatio(Bitmap src, int rw, int rh) {
        int w = src.getWidth();
        int h = src.getHeight();
        int targetW = w;
        int targetH = (int) ((long) w * rh / rw);
        if (targetH > h) {
            targetH = h;
            targetW = (int) ((long) h * rw / rh);
        }
        if (targetW == w && targetH == h) return src;
        int x = (w - targetW) / 2;
        int y = (h - targetH) / 2;
        return Bitmap.createBitmap(src, x, y, Math.max(1, targetW), Math.max(1, targetH));
    }

    private static Bitmap applyMatrix(Bitmap src, ColorMatrix cm) {
        Bitmap out = Bitmap.createBitmap(src.getWidth(), src.getHeight(), Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(out);
        Paint paint = new Paint(Paint.FILTER_BITMAP_FLAG);
        paint.setColorFilter(new ColorMatrixColorFilter(cm));
        canvas.drawBitmap(src, 0, 0, paint);
        return out;
    }

    private static Bitmap vignette(Bitmap src) {
        int w = src.getWidth();
        int h = src.getHeight();
        Bitmap out = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(out);
        canvas.drawBitmap(src, 0, 0, null);
        float cx = w / 2f;
        float cy = h / 2f;
        float r = (float) Math.hypot(cx, cy);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        p.setShader(new RadialGradient(cx, cy, r,
                new int[]{0x00000000, 0x00000000, 0xB4000000},
                new float[]{0f, 0.5f, 1f}, Shader.TileMode.CLAMP));
        canvas.drawRect(0, 0, w, h, p);
        return out;
    }

    private static ColorMatrix saturationMatrix(float s) {
        ColorMatrix cm = new ColorMatrix();
        cm.setSaturation(s);
        return cm;
    }

    private static ColorMatrix grayscaleMatrix() {
        return saturationMatrix(0f);
    }

    private static ColorMatrix scaleMatrix(float r, float g, float b) {
        ColorMatrix cm = new ColorMatrix();
        cm.setScale(r, g, b, 1f);
        return cm;
    }

    private static ColorMatrix sepiaMatrix() {
        ColorMatrix cm = grayscaleMatrix();
        cm.postConcat(scaleMatrix(1.07f, 0.93f, 0.74f));
        return cm;
    }

    private static ColorMatrix vintageMatrix() {
        ColorMatrix cm = saturationMatrix(0.45f);
        float c = 0.85f;
        float t = 128f * (1f - c) + 12f;
        cm.postConcat(new ColorMatrix(new float[]{
                c, 0, 0, 0, t + 8,
                0, c, 0, 0, t,
                0, 0, c, 0, t - 14,
                0, 0, 0, 1, 0}));
        return cm;
    }

    private static ColorMatrix invertMatrix() {
        return new ColorMatrix(new float[]{
                -1, 0, 0, 0, 255,
                0, -1, 0, 0, 255,
                0, 0, -1, 0, 255,
                0, 0, 0, 1, 0});
    }

    // ---------------------------------------------------------------- save & share

    private void saveImage(final boolean thenShare) {
        if (busy) return;
        if (current == null) {
            toast("Open a photo first");
            return;
        }
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q
                && checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE)
                != PackageManager.PERMISSION_GRANTED) {
            pendingAfterPermission = () -> saveImage(thenShare);
            requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, REQ_WRITE_PERM);
            return;
        }
        commitAdjustments();
        final Bitmap out = current;
        busy = true;
        executor.execute(() -> {
            try {
                final Uri uri = writeToGallery(out);
                mainHandler.post(() -> {
                    busy = false;
                    toast("Saved to Pictures/PhotoEditor");
                    if (thenShare && uri != null) share(uri);
                });
            } catch (Exception | OutOfMemoryError e) {
                mainHandler.post(() -> {
                    busy = false;
                    toast("Save failed");
                });
            }
        });
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_WRITE_PERM) {
            Runnable r = pendingAfterPermission;
            pendingAfterPermission = null;
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                if (r != null) r.run();
            } else {
                toast("Storage permission is needed to save");
            }
        }
    }

    @SuppressWarnings("deprecation")
    private Uri writeToGallery(Bitmap bmp) throws IOException {
        String name = "PhotoEditor_" + System.currentTimeMillis() + ".jpg";
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ContentValues values = new ContentValues();
            values.put(MediaStore.Images.Media.DISPLAY_NAME, name);
            values.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
            values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/PhotoEditor");
            values.put(MediaStore.Images.Media.IS_PENDING, 1);
            Uri uri = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
            if (uri == null) throw new IOException("Could not create gallery entry");
            try (OutputStream os = getContentResolver().openOutputStream(uri)) {
                if (os == null || !bmp.compress(Bitmap.CompressFormat.JPEG, 95, os)) {
                    throw new IOException("Could not write image");
                }
            } catch (IOException e) {
                getContentResolver().delete(uri, null, null);
                throw e;
            }
            values.clear();
            values.put(MediaStore.Images.Media.IS_PENDING, 0);
            getContentResolver().update(uri, values, null, null);
            return uri;
        } else {
            File dir = new File(Environment.getExternalStoragePublicDirectory(
                    Environment.DIRECTORY_PICTURES), "PhotoEditor");
            if (!dir.exists() && !dir.mkdirs()) throw new IOException("Could not create folder");
            File file = new File(dir, name);
            try (FileOutputStream os = new FileOutputStream(file)) {
                if (!bmp.compress(Bitmap.CompressFormat.JPEG, 95, os)) {
                    throw new IOException("Could not write image");
                }
            }
            ContentValues values = new ContentValues();
            values.put(MediaStore.Images.Media.DATA, file.getAbsolutePath());
            values.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
            values.put(MediaStore.Images.Media.DISPLAY_NAME, name);
            return getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
        }
    }

    private void share(Uri uri) {
        Intent send = new Intent(Intent.ACTION_SEND);
        send.setType("image/jpeg");
        send.putExtra(Intent.EXTRA_STREAM, uri);
        send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        try {
            startActivity(Intent.createChooser(send, "Share photo"));
        } catch (Exception e) {
            toast("No app available to share");
        }
    }
}
