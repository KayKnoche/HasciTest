console.log('✅ script.js wird geladen...');

// --- Globale Variablen ---
let packages = [];
let parsedAddress = null;
let firstApiResponse = null;
let secondApiResponse = null;

// --- Paket-Definitionen (DHL-Standard) ---
const PACKAGE_TYPES = {
    'XS': { length: 20, width: 15, height: 10, label: 'XS (Mini)' },
    'S': { length: 30, width: 20, height: 15, label: 'S (Small)' },
    'M': { length: 45, width: 35, height: 20, label: 'M (Medium)' },
    'L': { length: 60, width: 40, height: 35, label: 'L (Large)' },
    'XL': { length: 80, width: 50, height: 45, label: 'XL (Extra Large)' }
};

// --- Environment ---
let currentEnv = 'prod';

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
    } else {
        currentEnv = 'prod';
        if (slider) slider.style.background = '#ccc';
        if (label) label.textContent = 'PROD';
        if (status) {
            status.textContent = 'PRODUCTION';
            status.style.background = '#28a745';
            status.style.color = 'white';
        }
        if (indicator) indicator.style.transform = 'translateX(0px)';
        console.log('🔄 Umgebung auf PRODUCTION umgeschaltet');
    }
}

// --- 1. Leitcode parsen ---
function parseLeitcode() {
    console.log('🔍 parseLeitcode() aufgerufen');
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
}

// --- 6. Alle Pakete löschen ---
function clearPackages() {
    console.log('🗑️ clearPackages() aufgerufen');
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
    
    const compatiblePackages = packages.filter(pkg => 
        pkg.length <= 60 && pkg.width <= 40 && pkg.height <= 35
    );
    const incompatiblePackages = packages.filter(pkg => 
        pkg.length > 60 || pkg.width > 40 || pkg.height > 35
    );
    
    const timestamp = Date.now();
    const correlationId = `TestDemo_${timestamp}_${Math.random().toString(36).substring(7)}`;
    
    const payload = {
        "productionLocationCode": "TestDemo",
        "deliveryRole": "Paketzusteller",
        "correlationId": correlationId,
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
    
    resultDiv.className = 'result info';
    resultDiv.innerHTML = '<strong>⏳</strong> <p>Prüfe Packstation-Kompatibilität beim Service...</p>';
    resultDiv.style.display = 'block';
    
    const authHeader = 'Basic SEFTQ0lBY2Nlc3M6RGVoamlzbGM/MnE=';
    const environment = getCurrentEnvironment();
    console.log(`🌍 Aktuelle Umgebung: ${environment.toUpperCase()}`);
    
    let targetUrl, secondUrl;
    
    if (environment === 'stg') {
        targetUrl = 'https://depst-mara-stg1-decisionhub.pegacloud.net/prweb/api/HASCI/02/notificationLocations';
        secondUrl = 'https://depst-mara-stg1-decisionhub.pegacloud.net/prweb/api/PegaMKTContainer/V3/Container';
    } else {
        targetUrl = 'https://depst-mara-prod1-decisionhub.pegacloud.net/prweb/api/HASCI/02/notificationLocations';
        secondUrl = 'https://depst-mara-prod1-decisionhub.pegacloud.net/prweb/api/PegaMKTContainer/V3/Container';
    }
    
    // CORS-PROXY
    const USE_PROXY = true;
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    const apiUrl = USE_PROXY ? `${proxyUrl}${encodeURIComponent(targetUrl)}` : targetUrl;
    
    try {
        console.log('📤 URL (1. Call):', apiUrl);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        console.log('📥 Status (1. Call):', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Fehler (1. Call):', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('✅ Antwort (1. Call):', data);
        
        firstApiResponse = data;
        showFirstApiResult(resultDiv, compatiblePackages, incompatiblePackages, data);
        
        // Zweiten Call mit Proxy
        const secondApiUrl = USE_PROXY ? `${proxyUrl}${encodeURIComponent(secondUrl)}` : secondUrl;
        await callSecondWebService(resultDiv, secondApiUrl, environment);
        
    } catch (error) {
        console.error('❌ Fehler beim 1. Call:', error);
        firstApiResponse = null;
        showPackstationResult(resultDiv, compatiblePackages, incompatiblePackages, null);
    }
}

// --- 9. Ergebnis des ersten API-Calls anzeigen ---
function showFirstApiResult(resultDiv, compatible, incompatible, apiData) {
    let html = '<strong>📊 Packstation-Kompatibilität (1. Call)</strong><div class="details">';
    
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
    
    if (apiData && apiData.locations) {
        html += '<hr style="margin:15px 0;">';
        html += '<h4 style="margin:10px 0;">📍 Vorschläge (1. Call)</h4>';
        
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
                <summary style="cursor:pointer;color:#667eea;">📄 JSON-Antwort (1. Call)</summary>
                <pre style="background:#f8f9fa;padding:10px;border-radius:5px;overflow:auto;max-height:150px;font-size:12px;">${JSON.stringify(apiData, null, 2)}</pre>
            </details>
        `;
    } else if (apiData) {
        html += '<hr style="margin:15px 0;">';
        html += `<p style="color: #856404;">ℹ️ Keine Standortdaten in der Antwort.</p>`;
    }
    
    html += `<p style="margin-top:15px;font-size:14px;color:#555;">
        📦 ${packages.length} Pakete | 📍 ${parsedAddress.plz} - ${parsedAddress.streetCode}/${parsedAddress.houseNumber}
    </p>`;
    html += '<div style="margin-top:15px;padding:10px;background:#e3f2fd;border-radius:8px;text-align:center;">⏳ Führe zweiten WebService-Call durch...</div>';
    html += '</div>';
    
    resultDiv.className = 'result success';
    resultDiv.innerHTML = html;
    resultDiv.style.display = 'block';
}

// --- 10. Zweiten WebService aufrufen ---
async function callSecondWebService(resultDiv, secondUrl, environment) {
    console.log('📞 callSecondWebService() aufgerufen');
    
    const secondPayload = {
        "ContainerName": "GetHASCI2",
        "Channel": "Web",
        "ContextName": "DeliveryTask",
        "Resource": "",
        "SubjectID": "TestDemo",
        "Direction": "Inbound",
        "AppID": "IBU"
    };
    
    const authHeader = 'Basic SEFTQ0lBY2Nlc3M6RGVoamlzbGM/MnE=';
    
    try {
        console.log('📤 Zweiter Call URL:', secondUrl);
        
        const response = await fetch(secondUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
                'Accept': 'application/json'
            },
            body: JSON.stringify(secondPayload)
        });
        
        console.log('📥 Status (2. Call):', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Fehler (2. Call):', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('✅ Antwort (2. Call):', data);
        
        secondApiResponse = data;
        showFinalResult(resultDiv, data);
        
    } catch (error) {
        console.error('❌ Fehler beim 2. Call:', error);
        secondApiResponse = null;
        showSecondApiError(resultDiv, error.message);
    }
}

// --- 11. Finales Ergebnis mit Tabelle anzeigen ---
function showFinalResult(resultDiv, data) {
    console.log('📊 showFinalResult() aufgerufen');
    let html = '<strong>📊 Endergebnis</strong><div class="details">';
    
    html += '<p style="color: #155724;">✅ 1. Call erfolgreich durchgeführt</p>';
    html += '<hr style="margin:15px 0;">';
    html += '<h4 style="margin:10px 0;">📋 Ergebnisse des 2. WebService-Calls</h4>';
    
    let results = null;
    
    if (data && data.Status === 'OK' && data.ContainerList && data.ContainerList.length > 0) {
        for (let container of data.ContainerList) {
            if (container.RankedResults && container.RankedResults.length > 0) {
                results = container.RankedResults;
                break;
            }
        }
    }
    
    if (results && results.length > 0) {
        html += '<div style="overflow-x:auto;margin:10px 0;">';
        html += '<table style="width:100%;border-collapse:collapse;font-size:14px;">';
        html += `
            <thead>
                <tr style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white;">
                    <th style="padding:10px;border:1px solid #ddd;text-align:left;">Outlet ID</th>
                    <th style="padding:10px;border:1px solid #ddd;text-align:left;">Outlet Type</th>
                    <th style="padding:10px;border:1px solid #ddd;text-align:right;">Distance (m)</th>
                    <th style="padding:10px;border:1px solid #ddd;text-align:right;">Utilization Score</th>
                    <th style="padding:10px;border:1px solid #ddd;text-align:center;">Availability</th>
                    <th style="padding:10px;border:1px solid #ddd;text-align:center;">Rating</th>
                </tr>
            </thead>
            <tbody>
        `;
        
        const displayResults = results.slice(0, 10);
        displayResults.forEach((item, index) => {
            const rowColor = index % 2 === 0 ? '#f8f9fa' : 'white';
            
            let outletType = item.OutletType || 'N/A';
            let typeIcon = '';
            let availabilityText = 'Available';
            
            const outletTypeLower = outletType.toLowerCase();
            
            if (outletTypeLower.includes('parcel')) {
                typeIcon = '📦 ';
                availabilityText = item.Available === true ? 'Available' : 'Unavailable';
            } else if (outletTypeLower.includes('post')) {
                typeIcon = '🏤 ';
                availabilityText = 'Available';
            } else {
                availabilityText = item.Available === true ? 'Available' : 'Unavailable';
            }
            
            let ratingDisplay = 'N/A';
            if (item.Rating !== undefined && item.Rating !== null) {
                const ratingNum = parseFloat(item.Rating);
                if (!isNaN(ratingNum)) {
                    ratingDisplay = ratingNum.toFixed(1);
                }
            }
            
            html += `
                <tr style="background:${rowColor};">
                    <td style="padding:10px;border:1px solid #ddd;">${item.OutletID || 'N/A'}</td>
                    <td style="padding:10px;border:1px solid #ddd;">${typeIcon}${outletType}</td>
                    <td style="padding:10px;border:1px solid #ddd;text-align:right;">${item.Distance || 'N/A'}</td>
                    <td style="padding:10px;border:1px solid #ddd;text-align:right;">${item.UtilizationScore !== undefined ? item.UtilizationScore : 'N/A'}</td>
                    <td style="padding:10px;border:1px solid #ddd;text-align:center;">${availabilityText}</td>
                    <td style="padding:10px;border:1px solid #ddd;text-align:center;">${ratingDisplay}</td>
                </tr>
            `;
        });
        
        html += `
            </tbody>
            </table>
            <p style="margin-top:10px;font-size:12px;color:#666;">
                Zeige ${Math.min(displayResults.length, 10)} von ${results.length} Ergebnissen
            </p>
        `;
        html += '</div>';
    } else {
        html += '<p style="color: #856404;">ℹ️ Keine RankedResults in der Antwort gefunden.</p>';
        html += `
            <details>
                <summary style="cursor:pointer;color:#667eea;">📄 JSON-Antwort (2. Call)</summary>
                <pre style="background:#f8f9fa;padding:10px;border-radius:5px;overflow:auto;max-height:200px;font-size:12px;">${JSON.stringify(data, null, 2)}</pre>
            </details>
        `;
    }
    
    html += `
        <div style="margin-top:15px;padding:15px;background:#f1f3f5;border-radius:8px;font-size:13px;color:#555;">
            <strong>📌 Zusammenfassung:</strong><br>
            📦 ${packages.length} Pakete | 📍 ${parsedAddress.plz} - ${parsedAddress.streetCode}/${parsedAddress.houseNumber}
            ${secondApiResponse ? ' | ✅ 2. Call erfolgreich' : ' | ⚠️ 2. Call fehlgeschlagen'}
            ${data && data.Status ? ` | Status: ${data.Status}` : ''}
        </div>
    `;
    
    html += '</div>';
    resultDiv.className = 'result success';
    resultDiv.innerHTML = html;
    resultDiv.style.display = 'block';
}

// --- 12. Fehler beim zweiten Call anzeigen ---
function showSecondApiError(resultDiv, errorMessage) {
    let html = resultDiv.innerHTML;
    html = html.replace('<div style="margin-top:15px;padding:10px;background:#e3f2fd;border-radius:8px;text-align:center;">⏳ Führe zweiten WebService-Call durch...</div>', '');
    html += `
        <div style="margin-top:15px;padding:15px;background:#f8d7da;border-radius:8px;border:1px solid #f5c6cb;">
            <strong style="color:#721c24;">❌ Fehler beim 2. WebService-Call</strong>
            <p style="color:#721c24;margin-top:5px;">${errorMessage}</p>
            <p style="color:#721c24;font-size:12px;margin-top:5px;">Bitte überprüfen Sie die Konsole für weitere Details.</p>
        </div>
    `;
    resultDiv.innerHTML = html;
}

// --- 13. Ergebnis anzeigen (Fallback) ---
function showPackstationResult(resultDiv, compatible, incompatible, apiData) {
    let html = '<strong>📊 Packstation-Kompatibilität</strong><div class="details">';
    
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

console.log('✅ script.js vollständig geladen!');
