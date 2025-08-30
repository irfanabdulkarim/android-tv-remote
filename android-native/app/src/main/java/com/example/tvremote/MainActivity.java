package com.example.tvremote;

import android.app.Activity;
import android.content.Context;
import android.net.wifi.WifiManager;
import android.os.Bundle;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends Activity {
    private Spinner deviceSpinner;
    private ImageButton refreshButton;
    private ImageButton disconnectButton;
    private TextView statusText;
    private Button tabRemote;
    private Button tabNetwork;
    private Button tabScreen;
    
    private List<String> devices = new ArrayList<>();
    private ArrayAdapter<String> deviceAdapter;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        // Initialize UI components
        initializeViews();
        setupListeners();
        setupDeviceSpinner();
        
        // Load devices
        loadDevices();
    }
    
    private void initializeViews() {
        deviceSpinner = findViewById(R.id.deviceSpinner);
        refreshButton = findViewById(R.id.refreshButton);
        disconnectButton = findViewById(R.id.disconnectButton);
        statusText = findViewById(R.id.statusText);
        tabRemote = findViewById(R.id.tabRemote);
        tabNetwork = findViewById(R.id.tabNetwork);
        tabScreen = findViewById(R.id.tabScreen);
    }
    
    private void setupListeners() {
        refreshButton.setOnClickListener(v -> refreshDevices());
        disconnectButton.setOnClickListener(v -> disconnectDevice());
        
        tabRemote.setOnClickListener(v -> switchToTab(0));
        tabNetwork.setOnClickListener(v -> switchToTab(1));
        tabScreen.setOnClickListener(v -> switchToTab(2));
    }
    
    private void setupDeviceSpinner() {
        deviceAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, devices);
        deviceAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        deviceSpinner.setAdapter(deviceAdapter);
        
        deviceSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                if (position > 0) {
                    statusText.setText("Device selected: " + devices.get(position));
                }
            }
            
            @Override
            public void onNothingSelected(AdapterView<?> parent) {
                statusText.setText("No device selected");
            }
        });
    }
    
    private void loadDevices() {
        // For now, we'll add some dummy devices
        // In a real implementation, we would scan for ADB devices
        devices.clear();
        devices.add("Select device");
        devices.add("192.168.0.100:5555 (connected)");
        devices.add("192.168.0.101:5555 (offline)");
        deviceAdapter.notifyDataSetChanged();
    }
    
    private void refreshDevices() {
        statusText.setText("Refreshing devices...");
        // In a real implementation, we would scan for devices here
        loadDevices();
        statusText.setText("Devices refreshed");
        Toast.makeText(this, "Devices refreshed", Toast.LENGTH_SHORT).show();
    }
    
    private void disconnectDevice() {
        int selectedPosition = deviceSpinner.getSelectedItemPosition();
        if (selectedPosition > 0) {
            String device = devices.get(selectedPosition);
            statusText.setText("Disconnecting device: " + device);
            // In a real implementation, we would disconnect the device here
            devices.remove(selectedPosition);
            deviceAdapter.notifyDataSetChanged();
            deviceSpinner.setSelection(0);
            statusText.setText("Device disconnected");
            Toast.makeText(this, "Device disconnected", Toast.LENGTH_SHORT).show();
        } else {
            statusText.setText("Please select a device first");
            Toast.makeText(this, "Please select a device first", Toast.LENGTH_SHORT).show();
        }
    }
    
    private void switchToTab(int tabIndex) {
        // Reset all tabs
        tabRemote.setBackgroundColor(getResources().getColor(R.color.buttonNormal));
        tabNetwork.setBackgroundColor(getResources().getColor(R.color.buttonNormal));
        tabScreen.setBackgroundColor(getResources().getColor(R.color.buttonNormal));
        
        tabRemote.setTextColor(getResources().getColor(R.color.textSecondary));
        tabNetwork.setTextColor(getResources().getColor(R.color.textSecondary));
        tabScreen.setTextColor(getResources().getColor(R.color.textSecondary));
        
        // Highlight selected tab
        switch (tabIndex) {
            case 0: // Remote
                tabRemote.setBackgroundColor(getResources().getColor(R.color.colorPrimary));
                tabRemote.setTextColor(getResources().getColor(android.R.color.white));
                // Load remote fragment
                getFragmentManager().beginTransaction()
                    .replace(R.id.tabContent, new RemoteFragment())
                    .commit();
                break;
            case 1: // Network
                tabNetwork.setBackgroundColor(getResources().getColor(R.color.colorPrimary));
                tabNetwork.setTextColor(getResources().getColor(android.R.color.white));
                // Load network fragment
                getFragmentManager().beginTransaction()
                    .replace(R.id.tabContent, new NetworkFragment())
                    .commit();
                break;
            case 2: // Screen
                tabScreen.setBackgroundColor(getResources().getColor(R.color.colorPrimary));
                tabScreen.setTextColor(getResources().getColor(android.R.color.white));
                // Load screen fragment
                getFragmentManager().beginTransaction()
                    .replace(R.id.tabContent, new ScreenFragment())
                    .commit();
                break;
        }
    }
    
    // Get local IP address for network scanning
    public String getLocalIpAddress() {
        WifiManager wifiManager = (WifiManager) getApplicationContext().getSystemService(Context.WIFI_SERVICE);
        int ipAddress = wifiManager.getConnectionInfo().getIpAddress();
        
        return String.format("%d.%d.%d.%d",
                (ipAddress & 0xff),
                (ipAddress >> 8 & 0xff),
                (ipAddress >> 16 & 0xff),
                (ipAddress >> 24 & 0xff));
    }
}