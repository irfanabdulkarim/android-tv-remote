package com.example.tvremote;

import android.app.Fragment;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.Toast;

public class RemoteFragment extends Fragment {
    private Button navUp, navDown, navLeft, navRight, navCenter;
    private Button actionBack, actionHome, actionMenu;
    private Button volUp, mute, volDown;
    private Button power;
    private Button toggleKeyboard;
    private LinearLayout keyboardSection;
    private EditText visibleInput;
    private Button clearInput, sendInput;
    
    private boolean keyboardVisible = false;
    
    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_remote, container, false);
        
        initializeViews(view);
        setupListeners();
        
        return view;
    }
    
    private void initializeViews(View view) {
        navUp = view.findViewById(R.id.navUp);
        navDown = view.findViewById(R.id.navDown);
        navLeft = view.findViewById(R.id.navLeft);
        navRight = view.findViewById(R.id.navRight);
        navCenter = view.findViewById(R.id.navCenter);
        
        actionBack = view.findViewById(R.id.actionBack);
        actionHome = view.findViewById(R.id.actionHome);
        actionMenu = view.findViewById(R.id.actionMenu);
        
        volUp = view.findViewById(R.id.volUp);
        mute = view.findViewById(R.id.mute);
        volDown = view.findViewById(R.id.volDown);
        
        power = view.findViewById(R.id.power);
        
        toggleKeyboard = view.findViewById(R.id.toggleKeyboard);
        keyboardSection = view.findViewById(R.id.keyboardSection);
        visibleInput = view.findViewById(R.id.visibleInput);
        clearInput = view.findViewById(R.id.clearInput);
        sendInput = view.findViewById(R.id.sendInput);
    }
    
    private void setupListeners() {
        // Navigation buttons
        navUp.setOnClickListener(v -> sendCommand("input keyevent KEYCODE_DPAD_UP"));
        navDown.setOnClickListener(v -> sendCommand("input keyevent KEYCODE_DPAD_DOWN"));
        navLeft.setOnClickListener(v -> sendCommand("input keyevent KEYCODE_DPAD_LEFT"));
        navRight.setOnClickListener(v -> sendCommand("input keyevent KEYCODE_DPAD_RIGHT"));
        navCenter.setOnClickListener(v -> sendCommand("input keyevent KEYCODE_DPAD_CENTER"));
        
        // Action buttons
        actionBack.setOnClickListener(v -> sendCommand("input keyevent KEYCODE_BACK"));
        actionHome.setOnClickListener(v -> sendCommand("input keyevent KEYCODE_HOME"));
        actionMenu.setOnClickListener(v -> sendCommand("input keyevent KEYCODE_MENU"));
        
        // Volume buttons
        volUp.setOnClickListener(v -> sendCommand("input keyevent KEYCODE_VOLUME_UP"));
        mute.setOnClickListener(v -> sendCommand("input keyevent KEYCODE_MUTE"));
        volDown.setOnClickListener(v -> sendCommand("input keyevent KEYCODE_VOLUME_DOWN"));
        
        // Power button
        power.setOnClickListener(v -> sendCommand("input keyevent KEYCODE_POWER"));
        
        // Keyboard toggle
        toggleKeyboard.setOnClickListener(v -> toggleKeyboard());
        
        // Input controls
        clearInput.setOnClickListener(v -> clearInput());
        sendInput.setOnClickListener(v -> sendInput());
    }
    
    private void sendCommand(String command) {
        // In a real implementation, this would send the ADB command
        Toast.makeText(getActivity(), "Sending command: " + command, Toast.LENGTH_SHORT).show();
    }
    
    private void toggleKeyboard() {
        keyboardVisible = !keyboardVisible;
        keyboardSection.setVisibility(keyboardVisible ? View.VISIBLE : View.GONE);
        toggleKeyboard.setText(keyboardVisible ? "Hide Keyboard" : "Show Keyboard");
    }
    
    private void clearInput() {
        visibleInput.setText("");
    }
    
    private void sendInput() {
        String text = visibleInput.getText().toString();
        if (!text.isEmpty()) {
            // In a real implementation, this would send the text
            Toast.makeText(getActivity(), "Sending text: " + text, Toast.LENGTH_SHORT).show();
            clearInput();
        }
    }
}