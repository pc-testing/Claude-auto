package com.prabhat.notes;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SaveAsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
