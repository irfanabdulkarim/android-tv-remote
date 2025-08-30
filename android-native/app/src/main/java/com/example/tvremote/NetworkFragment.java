package com.example.tvremote;

import android.app.Fragment;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

public class NetworkFragment extends Fragment {
    private EditText networkRange;
    private Button scanNetwork;
    private TextView scanStatus;
    private ProgressBar scanProgress;
    private TextView progressText;
    private LinearLayout discoveredDevices;
    
    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_network, container, false);
        
        initializeViews(view);
        setupListeners();
        
        return view;
    }
    
    private void initializeViews(View view) {
        networkRange = view.findViewById(R.id.networkRange);
        scanNetwork = view.findViewById(R.id.scanNetwork);
        scanStatus = view.findViewById(R.id.scanStatus);
        scanProgress = view.findViewById(R.id.scanProgress);
        progressText = view.findViewById(R.id.progressText);
        discoveredDevices = view.findViewById(R.id.discoveredDevices);
    }
    
    private void setupListeners() {
        scanNetwork.setOnClickListener(v -> scanNetwork());
    }
    
    private void scanNetwork() {
        String range = networkRange.getText().toString();
        if (range.isEmpty()) {
            // Use default range from MainActivity
            MainActivity mainActivity = (MainActivity) getActivity();
            String localIp = mainActivity.getLocalIpAddress();
            // Extract network base (e.g., 192.168.0.x -> 192.168.0.0/24)
            String[] parts = localIp.split("\\.");
            range = parts[0] + "." + parts[1] + "." + parts[2] + ".0/24";
        }
        
        scanStatus.setText("Scanning network range: " + range);
        
        // In a real implementation, this would scan the network
        // For now, we'll simulate the scanning process
        simulateNetworkScan();
    }
    
    private void simulateNetworkScan() {
        // Reset progress
        scanProgress.setProgress(0);
        progressText.setText("0%");
        
        // Simulate scanning
        new Thread(() -> {
            for (int i = 0; i <= 100; i += 10) {
                final int progress = i;
                getActivity().runOnUiThread(() -> {
                    scanProgress.setProgress(progress);
                    progressText.setText(progress + "%");
                });
                
                try {
                    Thread.sleep(200);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
            
            getActivity().runOnUiThread(() -> {
                scanStatus.setText("Scan complete. Found 2 potential devices.");
                addDiscoveredDevice("192.168.0.100:5555");
                addDiscoveredDevice("192.168.0.102:5555");
            });
        }).start();
    }
    
    private void addDiscoveredDevice(String deviceId) {
        // In a real implementation, this would add a button to connect to the device
        TextView deviceView = new TextView(getActivity());
        deviceView.setText(deviceId);
        deviceView.setPadding(16, 16, 16, 16);
        deviceView.setBackgroundResource(R.color.surfaceDark);
        deviceView.setMarginBottom(8);
        
        discoveredDevices.addView(deviceView);
    }
}