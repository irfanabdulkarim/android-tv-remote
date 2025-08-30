package com.example.tvremote;

import android.app.Fragment;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

public class ScreenFragment extends Fragment {
    private Button startScreenCapture, stopScreenCapture;
    private TextView fpsCounter;
    private ImageView screenCanvas;
    private Button screenControlLeft, screenControlCenter, screenControlRight;
    private FrameLayout mousePad;
    private Button mouseLeftClick, mouseRightClick;
    
    private boolean isCapturing = false;
    private Handler handler = new Handler();
    private Runnable captureRunnable;
    private int frameCount = 0;
    private long lastFpsUpdate = 0;
    
    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_screen, container, false);
        
        initializeViews(view);
        setupListeners();
        
        return view;
    }
    
    private void initializeViews(View view) {
        startScreenCapture = view.findViewById(R.id.startScreenCapture);
        stopScreenCapture = view.findViewById(R.id.stopScreenCapture);
        fpsCounter = view.findViewById(R.id.fpsCounter);
        screenCanvas = view.findViewById(R.id.screenCanvas);
        screenControlLeft = view.findViewById(R.id.screenControlLeft);
        screenControlCenter = view.findViewById(R.id.screenControlCenter);
        screenControlRight = view.findViewById(R.id.screenControlRight);
        mousePad = view.findViewById(R.id.mousePad);
        mouseLeftClick = view.findViewById(R.id.mouseLeftClick);
        mouseRightClick = view.findViewById(R.id.mouseRightClick);
    }
    
    private void setupListeners() {
        startScreenCapture.setOnClickListener(v -> startScreenCapture());
        stopScreenCapture.setOnClickListener(v -> stopScreenCapture());
        
        screenControlLeft.setOnClickListener(v -> sendCommand("input keyevent KEYCODE_DPAD_LEFT"));
        screenControlCenter.setOnClickListener(v -> sendCommand("input keyevent KEYCODE_DPAD_CENTER"));
        screenControlRight.setOnClickListener(v -> sendCommand("input keyevent KEYCODE_DPAD_RIGHT"));
        
        mouseLeftClick.setOnClickListener(v -> sendCommand("input keyevent KEYCODE_DPAD_CENTER"));
        mouseRightClick.setOnClickListener(v -> sendCommand("input keyevent KEYCODE_BACK"));
        
        // Set up touch listener for mouse pad
        setupMousePad();
    }
    
    private void setupMousePad() {
        mousePad.setOnTouchListener(new View.OnTouchListener() {
            private float lastX, lastY;
            private boolean isMoving = false;
            
            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        lastX = event.getX();
                        lastY = event.getY();
                        isMoving = false;
                        v.setBackgroundColor(Color.GRAY);
                        return true;
                        
                    case MotionEvent.ACTION_MOVE:
                        float deltaX = event.getX() - lastX;
                        float deltaY = event.getY() - lastY;
                        
                        // Only consider it a move if there's significant movement
                        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                            isMoving = true;
                            // Send swipe command
                            sendSwipe((int)deltaX, (int)deltaY);
                            lastX = event.getX();
                            lastY = event.getY();
                        }
                        return true;
                        
                    case MotionEvent.ACTION_UP:
                        v.setBackgroundColor(Color.TRANSPARENT);
                        // If it wasn't a move, treat as a tap
                        if (!isMoving) {
                            sendTap((int)event.getX(), (int)event.getY());
                        }
                        return true;
                }
                return false;
            }
        });
    }
    
    private void startScreenCapture() {
        if (isCapturing) return;
        
        isCapturing = true;
        startScreenCapture.setEnabled(false);
        stopScreenCapture.setEnabled(true);
        fpsCounter.setText("0 FPS");
        
        frameCount = 0;
        lastFpsUpdate = System.currentTimeMillis();
        
        // Start capturing frames
        captureRunnable = new Runnable() {
            @Override
            public void run() {
                if (isCapturing) {
                    // In a real implementation, this would capture the screen
                    captureScreenFrame();
                    
                    // Update FPS counter every second
                    long now = System.currentTimeMillis();
                    if (now - lastFpsUpdate >= 1000) {
                        int fps = frameCount;
                        fpsCounter.setText(fps + " FPS");
                        frameCount = 0;
                        lastFpsUpdate = now;
                    }
                    
                    // Schedule next frame capture
                    handler.postDelayed(this, 100); // 10 FPS
                }
            }
        };
        
        handler.post(captureRunnable);
        Toast.makeText(getActivity(), "Screen capture started", Toast.LENGTH_SHORT).show();
    }
    
    private void stopScreenCapture() {
        isCapturing = false;
        startScreenCapture.setEnabled(true);
        stopScreenCapture.setEnabled(false);
        fpsCounter.setText("0 FPS");
        
        if (captureRunnable != null) {
            handler.removeCallbacks(captureRunnable);
        }
        
        // Clear the screen canvas
        screenCanvas.setImageBitmap(null);
        Toast.makeText(getActivity(), "Screen capture stopped", Toast.LENGTH_SHORT).show();
    }
    
    private void captureScreenFrame() {
        frameCount++;
        
        // In a real implementation, this would capture an actual screen frame
        // For now, we'll just update the UI to show it's working
        if (frameCount % 10 == 0) {
            // Simulate receiving a screen frame
            // In a real app, this would be an actual bitmap from the device
        }
    }
    
    private void sendCommand(String command) {
        // In a real implementation, this would send the ADB command
        Toast.makeText(getActivity(), "Sending command: " + command, Toast.LENGTH_SHORT).show();
    }
    
    private void sendSwipe(int deltaX, int deltaY) {
        // In a real implementation, this would send a swipe command
        Toast.makeText(getActivity(), "Swipe: " + deltaX + ", " + deltaY, Toast.LENGTH_SHORT).show();
    }
    
    private void sendTap(int x, int y) {
        // In a real implementation, this would send a tap command
        Toast.makeText(getActivity(), "Tap at: " + x + ", " + y, Toast.LENGTH_SHORT).show();
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        if (isCapturing) {
            stopScreenCapture();
        }
    }
}