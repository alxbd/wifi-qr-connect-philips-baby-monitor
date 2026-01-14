// DOM Elements
const form = document.getElementById('wifiForm');
const ssidInput = document.getElementById('ssid');
const passwordInput = document.getElementById('password');
const showPasswordCheckbox = document.getElementById('showPassword');
const formView = document.getElementById('formView');
const qrView = document.getElementById('qrView');
const qrSSID = document.getElementById('qrSSID');
const qrCanvas = document.getElementById('qrCanvas');
const downloadBtn = document.getElementById('downloadBtn');
const printBtn = document.getElementById('printBtn');
const backBtn = document.getElementById('backBtn');

// Password obfuscation (not true encryption. Just prevents casual inspection)
const OBFUSCATION_SEED = '43dad696-5039-4ed7-b79e-53307971f1cb';

function deriveKey(ssid) {
    const combined = OBFUSCATION_SEED + ssid;
    let key = [];
    for (let i = 0; i < combined.length; i++) {
        key.push(combined.charCodeAt(i));
    }
    return key;
}

function xorWithKey(text, key) {
    let result = [];
    for (let i = 0; i < text.length; i++) {
        result.push(text.charCodeAt(i) ^ key[i % key.length]);
    }
    return result;
}

function obfuscatePassword(password, ssid) {
    const key = deriveKey(ssid);
    const xored = xorWithKey(password, key);
    return btoa(String.fromCharCode(...xored));
}

function deobfuscatePassword(encoded, ssid) {
    try {
        const decoded = atob(encoded);
        const key = deriveKey(ssid);
        const bytes = [];
        for (let i = 0; i < decoded.length; i++) {
            bytes.push(decoded.charCodeAt(i));
        }
        const result = bytes.map((byte, i) => String.fromCharCode(byte ^ key[i % key.length]));
        return result.join('');
    } catch (e) {
        return null;
    }
}

// Load saved credentials from localStorage
function loadSavedCredentials() {
    try {
        const savedSSID = localStorage.getItem('wifi_ssid');
        const savedPassword = localStorage.getItem('wifi_password');

        if (savedSSID) {
            ssidInput.value = savedSSID;
        }
        if (savedPassword && savedSSID) {
            const password = deobfuscatePassword(savedPassword, savedSSID);
            if (password) {
                passwordInput.value = password;
            }
        }
    } catch (error) {
        console.error('Error loading saved credentials:', error);
    }
}

// Save credentials to localStorage
function saveCredentials(ssid, password) {
    try {
        localStorage.setItem('wifi_ssid', ssid);
        localStorage.setItem('wifi_password', obfuscatePassword(password, ssid));
    } catch (error) {
        console.error('Error saving credentials:', error);
    }
}

// Load saved credentials on page load
loadSavedCredentials();

// Password visibility toggle
showPasswordCheckbox.addEventListener('change', function() {
    passwordInput.type = this.checked ? 'text' : 'password';
});

// Back button
backBtn.addEventListener('click', function(e) {
    e.preventDefault();
    qrView.classList.add('hidden');
    formView.classList.remove('hidden');
});

// Form submission
form.addEventListener('submit', function(e) {
    e.preventDefault();

    const ssid = ssidInput.value.trim();
    const password = passwordInput.value;

    // Validate inputs
    if (!ssid) {
        alert('Please enter a Wi-Fi network name (SSID)');
        return;
    }

    if (!password || password.length < 8) {
        alert('Please enter a password with at least 8 characters');
        return;
    }

    // Save credentials to localStorage
    saveCredentials(ssid, password);

    // Generate QR code
    const t = '000000000000'; // Seems hardcoded...
    generateQRCode(ssid, password, t);

    // Switch to QR view
    qrSSID.textContent = ssid;
    formView.classList.add('hidden');
    qrView.classList.remove('hidden');
    window.scrollTo(0, 0);
});

// Generate QR Code
function generateQRCode(ssid, password, token) {
    // Create JSON payload
    const payload = JSON.stringify({
        s: ssid,
        p: password,
        t: token
    });

    console.log('Generating QR code with payload:', payload);

    // Clear previous QR code
    qrCanvas.innerHTML = '';

    try {
        // Generate QR code using QRCode.js library
        new QRCode(qrCanvas, {
            text: payload,
            width: 250,
            height: 250,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });

        console.log('QR code generated successfully');
    } catch (error) {
        console.error('Error generating QR code:', error);
        alert('Error generating QR code. Please try again.');
    }
}

// Generate composite download image with QR code, SSID, and instructions
function generateDownloadCanvas(qrCodeCanvas, ssid) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 400;
    canvas.height = 580;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';

    let y = 35;

    // Title
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText('👶 Philips Baby Monitor', canvas.width / 2, y);
    y += 25;

    ctx.font = '16px Arial, sans-serif';
    ctx.fillText('Scan to Connect', canvas.width / 2, y);
    y += 35;

    // SSID
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText(`Network: ${ssid}`, canvas.width / 2, y);
    y += 25;

    // QR Code (centered)
    const qrX = (canvas.width - qrCodeCanvas.width) / 2;
    ctx.drawImage(qrCodeCanvas, qrX, y);
    y += qrCodeCanvas.height + 30;

    // Instructions
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillText('Quick Instructions:', canvas.width / 2, y);
    y += 25;

    ctx.font = '13px Arial, sans-serif';
    ctx.textAlign = 'left';
    const leftMargin = 50;

    ctx.fillText('1. Hold NIGHTLIGHT + LULLABY buttons 3 sec', leftMargin, y);
    y += 22;
    ctx.fillText('2. Wait for orange pulse on nightlight', leftMargin, y);
    y += 22;
    ctx.fillText('3. Show this QR code to the camera', leftMargin, y);

    return canvas;
}

// Download QR Code as PNG
downloadBtn.addEventListener('click', function() {
    const qrCodeCanvas = qrCanvas.querySelector('canvas');
    if (!qrCodeCanvas) {
        alert('QR code not found. Please generate a QR code first.');
        return;
    }

    const ssid = qrSSID.textContent || 'Unknown';
    const downloadCanvas = generateDownloadCanvas(qrCodeCanvas, ssid);

    downloadCanvas.toBlob(function(blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeSsid = ssid.replace(/[^a-zA-Z0-9]/g, '-');
        a.download = `philips-wifi-${safeSsid}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
});

// Print QR Code
printBtn.addEventListener('click', function() {
    window.print();
});
