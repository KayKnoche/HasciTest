// --- Globale Variablen ---
let packages = [];
let parsedAddress = null;

// --- Paket-Definitionen (DHL-Standard) ---
const PACKAGE_TYPES = {
    'XS': { length: 20, width: 15, height: 10, label: 'XS (Mini)' },
    'S': { length: 30, width: 20, height: 15, label: 'S (Small)' },
    'M': { length: 45, width: 35, height: 20, label: 'M (Medium)' },
    'L': { length: 60, width: 40, height: 35, label: 'L (Large)' },
    'XL': { length: 80, width: 50, height: 45, label: 'XL (Extra Large)' }
};

// --- 1. Leitcode parsen ---
function parseLeitcode() {
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
    const type = document.getElementById('packageType').value;
    const dims = PACKAGE_TYPES[type];
    document.getElementById('pkgLength').value = dims.length;
    document.getElementById('pkgWidth').value = dims.width;
    document.getElementById('pkgHeight').value = dims.height;
}

// --- 3. Paket hinzufügen ---
function addPackage() {
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
}

// --- 4. Beispielpakete laden ---
function addPresetPackages() {
    const preset = [
        { length: 30, width: 20, height: 15 },
        { length: 45, width: 35, height: 20 },
        { length: 60, width: 40, height: 30 }
    ];
    packages = packages.concat(preset);
    renderPackageList();
    document.getElementById('result').style.display = 'none';
}

// --- 5. Paket entfernen ---
function removePackage(index) {
    packages.splice(index, 1);
    renderPackageList();
}

// --- 6. Alle Pakete löschen ---
function clearPackages() {
    packages = [];
    renderPackageList();
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

// --- 8. Hauptfunktion: Packstation-Kompatibilität prüfen ---
async function checkPackstationCompatibility() {
    const resultDiv = document.getElementById('result');
    
    if (!parsedAddress) {
        showError(resultDiv, 'Bitte zuerst einen gültigen Leitcode eingeben.');
        return;
    }
    
    if (packages.length === 0) {
        showError(resultDiv, 'Bitte mindestens ein Paket hinzufügen.');
        return;
    }
    
    const compatiblePackages = packages.filter(pkg => 
        pkg.length <= 60 && pkg.width <= 40 && pkg.height <= 35
    );
    const incompatiblePackages = packages.filter(pkg => 
        pkg.length > 60 || pkg.width > 40 || pkg.height > 35
    );
    
    // Payload erstellen
    const payload = {
        "productionLocationCode": "TestDemo",
        "deliveryRole": "Paketzusteller",
        "correlationId": `TestDemo_${Date.now()}`,
        "recipientCostumerId": "",
        "recipientAddress": {
            "zipCode": parsedAddress.plz,
            "streetCode": parsedAddress.streetCode,
            "housenumberCode": parsedAddress.houseNumber
        },
        "shipments": packages.map((pkg, index) => ({
            "uuid": generateUUID(),
            "identcode": `003404341655502413${String(index + 1).padStart(2, '0')}`,
            "shipmentWidthCm": pkg.width,
            "shipmentLengthCm": pkg.length,
            "shipmentHeightCm": pkg.height
        }))
    };
    
    // Status anzeigen
    resultDiv.className = 'result info';
    resultDiv.innerHTML = '<strong>⏳</strong> <p>Prüfe Packstation-Kompatibilität beim Service...</p>';
    resultDiv.style.display = 'block';
    
    // --- API-KONFIGURATION ---
    const authHeader = 'Basic SEFTQ0lBY2Nlc3M6RGVoamlzbGM/MnE=';
    const targetUrl = 'https://depst-mara-prod1-decisionhub.pegacloud.net/prweb/api/HASCI/02/notificationLocations';
    
    // CORS-Proxy deaktiviert (direkter Aufruf)
    const useProxy = false;
    const apiUrl = useProxy ? `https://cors-anywhere.herokuapp.com/${targetUrl}` : targetUrl;
    
    try {
        console.log('📤 URL:', apiUrl);
        console.log('📦 Payload:', JSON.stringify(payload, null, 2));
        console.log('🔐 Auth:', authHeader);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        console.log('📥 Status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Fehler:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('✅ Antwort:', data);
        
        showPackstationResult(resultDiv, compatiblePackages, incompatiblePackages, data);
        
    } catch (error) {
        console.error('❌ Fehler:', error);
        showPackstationResult(resultDiv, compatiblePackages, incompatiblePackages, null);
    }
}

// --- 9. Ergebnis anzeigen ---
function showPackstationResult(resultDiv, compatible, incompatible, apiData) {
    let html = '<strong>📊 Packstation-Kompatibilität</strong><div class="details">';
    
    // Lokale Bewertung
    if (incompatible.length === 0) {
        html += '<p style="color: #155724;">✅ Alle Pakete passen in Packstationsfächer (max. 60×40×35 cm)</p>';
    } else {
        html += `<p style="color: #721c24;">⚠️ ${incompatible.length} Paket(e) sind zu groß:</p>`;
        incompatible.forEach((pkg) => {
            html += `<p style="margin-left:20px;">📦 ${pkg.length}×${pkg.width}×${pkg.height} cm</p>`;
        });
        if (compatible.length > 0) {
            html += `<p style="color: #155724;">✅ ${compatible.length} Paket(e) passen.</p>`;
        }
    }
    
    // Service-Antwort
    if (apiData && apiData.locations) {
        html += '<hr style="margin:15px 0;">';
        html += '<h4 style="margin:10px 0;">📍 Vorschläge</h4>';
        
        const locations = apiData.locations;
        const parcelStations = locations.filter(loc => loc.type === 'parcel station');
        const postOffices = locations.filter(loc => loc.type === 'post office');
        
        if (parcelStations.length > 0) {
            html += '<p><strong>📦 Packstationen:</strong></p>';
            parcelStations.slice(0, 5).forEach((station, index) => {
                const rating = parseInt(station.rating);
                const stars = rating > 0 ? '⭐'.repeat(Math.min(rating, 5)) : '⚠️';
                html += `
                    <div style="background:#f8f9fa;padding:10px;margin:5px 0;border-radius:5px;border-left:3px solid ${rating > 0 ? '#28a745' : '#ffc107'};">
                        <strong>#${index + 1}</strong> ${station.id} - 
                        ${station.address.zipCode} ${station.address.streetCode}/${station.address.housenumberCode}
                        <span style="float:right;">${stars} (${station.rating})</span>
                    </div>
                `;
            });
        }
        
        if (postOffices.length > 0) {
            html += '<p style="margin-top:10px;"><strong>🏤 Postfilialen:</strong></p>';
            postOffices.slice(0, 3).forEach((office, index) => {
                const rating = parseInt(office.rating);
                const stars = rating > 0 ? '⭐'.repeat(Math.min(rating, 3)) : '⚠️';
                html += `
                    <div style="background:#f8f9fa;padding:10px;margin:5px 0;border-radius:5px;border-left:3px solid ${rating > 0 ? '#17a2b8' : '#ffc107'};">
                        <strong>#${index + 1}</strong> ${office.id} - 
                        ${office.address.zipCode} ${office.address.streetCode}/${office.address.housenumberCode}
                        <span style="float:right;">${stars} (${office.rating})</span>
                    </div>
                `;
            });
        }
        
        html += `<p style="margin-top:10px;font-size:12px;color:#666;">
            Preference: ${apiData.preference || 'n/a'} | ${locations.length} Standorte
        </p>`;
        
        html += `
            <details style="margin-top:10px;">
                <summary style="cursor:pointer;color:#667eea;">📄 JSON-Antwort</summary>
                <pre style="background:#f8f9fa;padding:10px;border-radius:5px;overflow:auto;max-height:200px;font-size:12px;">${JSON.stringify(apiData, null, 2)}</pre>
            </details>
        `;
        
    } else if (apiData) {
        html += '<hr style="margin:15px 0;">';
        html += `<p style="color: #856404;">ℹ️ Keine Standortdaten in der Antwort.</p>`;
        html += `
            <details>
                <summary style="cursor:pointer;color:#667eea;">📄 JSON-Antwort</summary>
                <pre style="background:#f8f9fa;padding:10px;border-radius:5px;overflow:auto;max-height:200px;font-size:12px;">${JSON.stringify(apiData, null, 2)}</pre>
            </details>
        `;
    } else {
        html += `<p style="color: #856404;margin-top:10px;">ℹ️ Service nicht erreichbar. Lokale Prüfung.</p>`;
    }
    
    html += `<p style="margin-top:15px;font-size:14px;color:#555;">
        📦 ${packages.length} Pakete | 📍 ${parsedAddress.plz} - ${parsedAddress.streetCode}/${parsedAddress.houseNumber}
    </p>`;
    
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

// --- Event-Listener ---
document.addEventListener('DOMContentLoaded', function() {
    console.log('📍 Seite geladen:', window.location.origin);
    console.log('🔗 API:', 'https://depst-mara-prod1-decisionhub.pegacloud.net');
    console.log('🔐 Basic Auth aktiviert');
    
    updatePackageDimensions();
    
    document.getElementById('leitcodeInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            parseLeitcode();
        }
    });
});
