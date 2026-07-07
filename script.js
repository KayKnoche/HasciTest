console.log('✅ script.js wird geladen...');

// --- Globale Variablen ---
let packages = [];
let parsedAddress = null;
let lastCorrelationId = null;

// --- Paket-Definitionen (DHL-Standard) ---
const PACKAGE_TYPES = {
    'XS': { length: 20, width: 15, height: 10, label: 'XS (Mini)' },
    'S': { length: 30, width: 20, height: 15, label: 'S (Small)' },
    'M': { length: 45, width: 35, height: 20, label: 'M (Medium)' },
    'L': { length: 60, width: 40, height: 35, label: 'L (Large)' },
    'XL': { length: 80, width: 50, height: 45, label: 'XL (Extra Large)' }
};

// --- Environment ---
let currentEnv = 'stg';

function getCurrentEnvironment() {
    return currentEnv;
}

function toggleEnvironment() {
    const toggle = document.getElementById('envToggle');
    const slider = document.getElementById('envSlider');
    const indicator = document.getElementById('envIndicator');
    const status = document.getElementById('envStatus');
    const label = document.getElementById('envLabel');
    
    if (toggle && toggle.checked) {
        currentEnv = 'stg';
        if (slider) slider.style.background = '#ffc107';
        if (label) label.textContent = 'STG';
        if (status) {
            status.textContent = 'STAGING';
            status.style.background = '#ffc107';
            status.style.color = '#333';
        }
        if (indicator) indicator.style.transform = 'translateX(26px)';
        console.log('🔄 Umgebung auf STAGING umgeschaltet');
        resetResult();
    } else {
        currentEnv = 'prod';
        if (slider) slider.style.background = '#28a745';
        if (label) label.textContent = 'PROD';
        if (status) {
            status.textContent = 'PRODUCTION';
            status.style.background = '#28a745';
            status.style.color = 'white';
        }
        if (indicator) indicator.style.transform = 'translateX(0px)';
        console.log('🔄 Umgebung auf PRODUCTION umgeschaltet');
        resetResult();
    }
}

// --- RESULT RESET ---
function resetResult() {
    const resultDiv = document.getElementById('result');
    if (resultDiv) {
        resultDiv.style.display = 'none';
        resultDiv.className = 'result';
        resultDiv.innerHTML = '';
    }
    lastCorrelationId = null;
    console.log('🔄 Ergebnis zurückgesetzt');
}

// --- 1. Leitcode parsen ---
function parseLeitcode() {
    console.log('🔍 parseLeitcode() aufgerufen');
    resetResult();
    
    const input = document.getElementById('leitcodeInput');
    const leitcode = input.value.trim().replace(/\D/g, '');
    const resultDiv = document.getElementById('result');
    
    if (leitcode.length !== 11) {
        showError(resultDiv, `Der Leitcode muss genau 11 Ziffern haben. Aktuelle Länge: ${leitcode.length}`);
        return;
    }
    
    const plz = leitcode.substring(0, 5);
    const streetCode = leitcode.substring(5, 8);
    const houseNumber = leitcode.substring(8, 11);
    
    if (!isValidPLZ(plz)) {
        showError(resultDiv, `Ungültige PLZ: ${plz}`);
        return;
    }
    
    parsedAddress = { plz, streetCode, houseNumber };
    
    document.getElementById('displayPlz').textContent = plz;
    document.getElementById('displayStreet').textContent = streetCode;
    document.getElementById('displayHn').textContent = parseInt(houseNumber);
    document.getElementById('addressPreview').style.display = 'block';
    
    resultDiv.style.display = 'none';
    showSuccess(resultDiv, `Leitcode erfolgreich geparst: ${plz} - Straße ${streetCode}, Nr. ${parseInt(houseNumber)}`);
}

// --- 2. Paketgröße aktualisieren ---
function updatePackageDimensions() {
    console.log('📐 updatePackageDimensions() aufgerufen');
    const type = document.getElementById('packageType').value;
    const dims = PACKAGE_TYPES[type];
    document.getElementById('pkgLength').value = dims.length;
    document.getElementById('pkgWidth').value = dims.width;
    document.getElementById('pkgHeight').value = dims.height;
}

// --- 3. Paket hinzufügen ---
function addPackage() {
    console.log('➕ addPackage() aufgerufen');
    const length = parseFloat(document.getElementById('pkgLength').value);
    const width = parseFloat(document.getElementById('pkgWidth').value);
    const height = parseFloat(document.getElementById('pkgHeight').value);
    const resultDiv = document.getElementById('result');
    
    if (isNaN(length) || isNaN(width) || isNaN(height) || length <= 0 || width <= 0 || height <= 0) {
        showError(resultDiv, 'Bitte gültige Maße eingeben (alle > 0).');
        return;
    }
    
    if (length > 80 || width > 50 || height > 45) {
        showError(resultDiv, 'Paket ist zu groß für Packstationen (max. 80x50x45 cm).');
        return;
    }
    
    packages.push({ length, width, height });
    renderPackageList();
    resultDiv.style.display = 'none';
    console.log(`✅ Paket hinzugefügt: ${length}×${width}×${height} cm`);
}

// --- 4. Beispielpakete laden ---
function addPresetPackages() {
    console.log('📋 addPresetPackages() aufgerufen');
    resetResult();
    
    const preset = [
        { length: 30, width: 20, height: 15 },
        { length: 45, width: 35, height: 20 },
        { length: 60, width: 40, height: 30 }
    ];
    packages = packages.concat(preset);
    renderPackageList();
    document.getElementById('result').style.display = 'none';
    console.log(`✅ ${preset.length} Beispielpakete hinzugefügt`);
}

// --- 5. Paket entfernen ---
function removePackage(index) {
    console.log(`🗑️ removePackage(${index}) aufgerufen`);
    packages.splice(index, 1);
    renderPackageList();
    resetResult();
}

// --- 6. Alle Pakete löschen ---
function clearPackages() {
    console.log('🗑️ clearPackages() aufgerufen');
    packages = [];
    renderPackageList();
    resetResult();
}

// --- 7. Paketliste rendern ---
function renderPackageList() {
    const list = document.getElementById('packageList');
    const count = document.getElementById('packageCount');
    count.textContent = packages.length;
    
    if (packages.length === 0) {
        list.innerHTML = '<p class="empty-message">Noch keine Pakete hinzugefügt.</p>';
        return;
    }
    
    let html = '';
    packages.forEach((pkg, index) => {
        html += `
            <div class="package-item">
                <div class="info">
                    <span>📦 Paket ${index + 1}</span>
                    <span>${pkg.length}×${pkg.width}×${pkg.height} cm</span>
                    <span>Volumen: ${(pkg.length * pkg.width * pkg.height / 1000).toFixed(1)} L</span>
                </div>
                <button class="remove-btn" onclick="removePackage(${index})">✕</button>
            </div>
        `;
    });
    list.innerHTML = html;
}

// --- 8. Hauptfunktion: NUR LOKALE PRÜFUNG (KEIN API-CALL) ---
function checkPackstationCompatibility() {
    console.log('🔍 checkPackstationCompatibility() aufgerufen');
    const resultDiv = document.getElementById('result');
    
    if (!parsedAddress) {
        showError(resultDiv, 'Bitte zuerst einen gültigen Leitcode eingeben.');
        return;
    }
    
    if (packages.length === 0) {
        showError(resultDiv, 'Bitte mindestens ein Paket hinzufügen.');
        return;
    }
    
    // LOKALE PRÜFUNG (kein API-Call)
    const compatiblePackages = packages.filter(pkg => 
        pkg.length <= 60 && pkg.width <= 40 && pkg.height <= 35
    );
    const incompatiblePackages = packages.filter(pkg => 
        pkg.length > 60 || pkg.width > 40 || pkg.height > 35
    );
    
    // Größte Maße
    let maxLength = Math.max(...packages.map(p => p.length));
    let maxWidth = Math.max(...packages.map(p => p.width));
    let maxHeight = Math.max(...packages.map(p => p.height));
    
    let html = '<strong>📊 Packstation-Kompatibilität</strong><div class="details">';
    
    // Gesamtbewertung
    if (incompatiblePackages.length === 0) {
        html += '<p style="color: #155724;font-size:16px;">✅ <strong>Alle Pakete passen in Packstationsfächer</strong></p>';
        html += '<p style="color: #155724;margin-left:20px;">Maximale Packstations-Maße: 60×40×35 cm</p>';
        html += `<p style="color: #155724;margin-left:20px;">Ihre größten Maße: ${maxLength}×${maxWidth}×${maxHeight} cm</p>`;
    } else {
        html += `<p style="color: #721c24;font-size:16px;">⚠️ <strong>${incompatiblePackages.length} Paket(e) sind zu groß</strong></p>`;
        html += '<p style="color: #721c24;margin-left:20px;">Maximale Packstations-Maße: 60×40×35 cm</p>';
        html += `<p style="color: #721c24;margin-left:20px;">Ihre größten Maße: ${maxLength}×${maxWidth}×${maxHeight} cm</p>`;
        
        html += '<p style="margin-top:10px;"><strong>Zu große Pakete:</strong></p>';
        incompatiblePackages.forEach((pkg, idx) => {
            html += `<p style="margin-left:20px;">📦 ${idx+1}: ${pkg.length}×${pkg.width}×${pkg.height} cm</p>`;
        });
        
        if (compatiblePackages.length > 0) {
            html += `<p style="color: #155724;margin-top:10px;">✅ ${compatiblePackages.length} Paket(e) passen.</p>`;
        }
    }
    
    // Paket-Tabelle
    html += '<hr style="margin:15px 0;">';
    html += '<h4 style="margin:10px 0;">📦 Alle Pakete im Überblick</h4>';
    html += '<table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:10px;">';
    html += `
        <thead>
            <tr style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white;">
                <th style="padding:8px;border:1px solid #ddd;text-align:left;">#</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:left;">Länge (cm)</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:left;">Breite (cm)</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:left;">Höhe (cm)</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:center;">Volumen (L)</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:center;">Status</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    packages.forEach((pkg, index) => {
        const isCompatible = pkg.length <= 60 && pkg.width <= 40 && pkg.height <= 35;
        const rowColor = index % 2 === 0 ? '#f8f9fa' : 'white';
        const statusColor = isCompatible ? '#28a745' : '#dc3545';
        const statusText = isCompatible ? '✅ Passt' : '❌ Zu groß';
        const volume = (pkg.length * pkg.width * pkg.height / 1000).toFixed(1);
        
        html += `
            <tr style="background:${rowColor};">
                <td style="padding:8px;border:1px solid #ddd;">${index + 1}</td>
                <td style="padding:8px;border:1px solid #ddd;">${pkg.length}</td>
                <td style="padding:8px;border:1px solid #ddd;">${pkg.width}</td>
                <td style="padding:8px;border:1px solid #ddd;">${pkg.height}</td>
                <td style="padding:8px;border:1px solid #ddd;text-align:center;">${volume}</td>
                <td style="padding:8px;border:1px solid #ddd;text-align:center;">
                    <span style="background:${statusColor};color:white;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:bold;">
                        ${statusText}
                    </span>
                </td>
            </tr>
        `;
    });
    
    html += `
        </tbody>
        </table>
    `;
    
    // Zusammenfassung
    html += `
        <div style="margin-top:15px;padding:15px;background:#f1f3f5;border-radius:8px;font-size:13px;color:#555;">
            <strong>📌 Zusammenfassung:</strong><br>
            📦 ${packages.length} Pakete | 📍 ${parsedAddress.plz} - ${parsedAddress.streetCode}/${parsedAddress.houseNumber}
            ${incompatiblePackages.length === 0 ? ' | ✅ Alle Pakete kompatibel' : ` | ⚠️ ${incompatiblePackages.length} Pakete zu groß`}
        </div>
    `;
    
    // Hinweis: API nicht verfügbar
    html += `
        <div style="margin-top:10px;padding:10px;background:#fff3cd;border-radius:8px;font-size:12px;color:#856404;border:1px solid #ffc107;">
            ℹ️ <strong>Hinweis:</strong> Die API ist aufgrund von CORS-Einschränkungen nicht erreichbar. 
            Die Prüfung basiert daher auf den lokalen Packstations-Maßen (max. 60×40×35 cm).
        </div>
    `;
    
    html += '</div>';
    
    resultDiv.className = 'result success';
    resultDiv.innerHTML = html;
    resultDiv.style.display = 'block';
}

// --- Hilfsfunktionen ---
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16).toUpperCase();
    });
}

function isValidPLZ(plz) {
    if (plz.length !== 5) return false;
    const plzInt = parseInt(plz);
    return plzInt >= 1000 && plzInt <= 99999;
}

function showSuccess(resultDiv, message) {
    resultDiv.className = 'result success';
    resultDiv.innerHTML = `<strong>✅</strong> <p>${message}</p>`;
    resultDiv.style.display = 'block';
}

function showError(resultDiv, message) {
    resultDiv.className = 'result error';
    resultDiv.innerHTML = `<strong>❌ Fehler</strong><p>${message}</p>`;
    resultDiv.style.display = 'block';
}

console.log('✅ script.js vollständig geladen!');
