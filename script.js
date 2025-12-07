// --- CONFIGURATION ---
const serviceUUID = "19b10000-e8f2-537e-4f6c-d104768a1214"; 
const notifyUUID =  "19b10001-e8f2-537e-4f6c-d104768a1214"; // Read Data
const commandUUID = "19b10002-e8f2-537e-4f6c-d104768a1214"; // Send Commands

let device, server, service, notifyChar, commandChar;

// --- ELEMENT REFERENCES ---
const connectBtn = document.getElementById('connectBtn');
const btnStart = document.getElementById('btnStart');
const btnStop = document.getElementById('btnStop');
const btnTare = document.getElementById('btnTare');
const statusText = document.getElementById('status');
const statusDot = document.getElementById('statusDot');
const valueDisplay = document.getElementById('valueDisplay');

// --- EVENT LISTENERS ---
connectBtn.addEventListener('click', connectToBLE);
btnStart.addEventListener('click', () => sendCommand('start'));
btnStop.addEventListener('click', () => sendCommand('stop'));
btnTare.addEventListener('click', () => sendCommand('tare'));

// --- CHART SETUP ---
const ctx = document.getElementById('forceChart').getContext('2d');
const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Force (kg)',
            data: [],
            borderColor: 'rgb(255, 107, 53)',
            backgroundColor: 'rgba(255, 107, 53, 0.05)',
            borderWidth: 3,
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: 'rgb(255, 107, 53)',
            pointBorderColor: 'white',
            pointBorderWidth: 2,
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
            y: { 
                beginAtZero: true, 
                suggestedMax: 5,
                grid: { color: 'rgba(0,0,0,0.05)' } 
            },
            x: { display: false }
        }
    }
});

// --- BLUETOOTH FUNCTIONS ---
async function connectToBLE() {
    try {
        statusText.innerText = "Scanning...";
        statusDot.style.animation = 'pulse 1s infinite';
        
        device = await navigator.bluetooth.requestDevice({
            //acceptAllDevices: true,
            filters: [{ name: 'LoadCellUno' }],
            optionalServices: [serviceUUID]
        });

        statusText.innerText = "Connecting...";
        server = await device.gatt.connect();
        service = await server.getPrimaryService(serviceUUID);

        // 1. Get Notification Characteristic (Read)
        notifyChar = await service.getCharacteristic(notifyUUID);
        await notifyChar.startNotifications();
        notifyChar.addEventListener('characteristicvaluechanged', handleData);

        // 2. Get Command Characteristic (Write)
        try {
            commandChar = await service.getCharacteristic(commandUUID);
            // Enable buttons
            document.querySelectorAll('.control-btn').forEach(btn => btn.classList.add('active'));
        } catch (e) {
            console.warn("Command Characteristic not found. Arduino code might be outdated.");
        }

        // 3. Prevent Screen Sleep (Mobile Optimization)
        try {
            if (navigator.wakeLock) {
                await navigator.wakeLock.request('screen');
                console.log("Screen Wake Lock active");
            }
        } catch (err) {
            console.log("Wake Lock not supported or failed:", err);
        }

        // UI Updates
        statusText.innerText = "Connected";
        statusDot.classList.add('connected');
        connectBtn.disabled = true;
        connectBtn.innerText = "Connected";

        device.addEventListener('gattserverdisconnected', onDisconnect);

    } catch (error) {
        console.error(error);
        statusText.innerText = "Error: " + error;
        statusDot.style.animation = 'pulse-off 2s infinite';
    }
}

async function sendCommand(cmd) {
    if (!commandChar) {
        alert("Not connected or Arduino code is outdated!");
        return;
    }
    try {
        const encoder = new TextEncoder();
        await commandChar.writeValue(encoder.encode(cmd));
        console.log("Sent Command: " + cmd);
    } catch (e) {
        console.error("Failed to send command", e);
    }
}

function handleData(event) {
    const dataView = event.target.value;
    const massKg = dataView.getFloat32(0, true); 

    if (massKg <= 0) {
        massKg = 0;
    }
    
    valueDisplay.innerText = massKg.toFixed(2) + " kg";

    const now = new Date().toLocaleTimeString();
    if (chart.data.labels.length > 50) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }
    chart.data.labels.push(now);
    chart.data.datasets[0].data.push(massKg);
    chart.update();
}

function onDisconnect() {
    statusText.innerText = "Disconnected";
    statusDot.classList.remove('connected');
    connectBtn.disabled = false;
    connectBtn.innerText = "📡 Connect to Device";
    document.querySelectorAll('.control-btn').forEach(btn => btn.classList.remove('active'));
}