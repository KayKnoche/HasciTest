console.log('✅ script.js wird geladen...');

// --- Globale Variablen ---
let packages = [];
let parsedAddress = null;

// --- Paket-Definitionen ---
const PACKAGE_TYPES = {
    'XS': { length: 20, width: 15, height: 10, label: 'XS (Mini)' },
    'S': { length: 30, width: 20, height: 15, label: 'S (Small)' },
    'M': { length: 45, width: 35, height: 20, label: 'M (Medium)' },
    'L': { length: 60, width: 40, height: 35, label: 'L (Large)' },
    'XL': { length: 80, width: 50, height: 45, label: 'XL (Extra Large)' }
};

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
    
    // Einfache lokale Prüfung (ohne API)
    const compatible = packages.filter(pkg => 
        pkg.length <= 60 && pkg.width <= 40 && pkg.height <= 35
    );
    const incompatible = packages.filter(pkg => 
        pkg.length > 60 || pkg.width > 40 || pkg.height > 35
    );
    
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
    
    html += `<p style="margin-top:15px;font-size:14px;color:#555;">
        📦 ${packages.length} Pakete | 📍 ${parsedAddress.plz} - ${parsedAddress.streetCode}/${parsedAddress.houseNumber}
    </p>`;
    html += '</div>';
    
    resultDiv.className = 'result success';
    resultDiv.innerHTML = html;
    resultDiv.style.display = 'block';
}

// --- Hilfsfunktionen ---
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

// --- Event-Listener (wichtig: KEINE onclick-Attribute mehr in HTML) ---
document.addEventListener('DOMContentLoaded', function() {
    console.log('📍 DOM geladen - registriere Event-Listener...');
    
    // 1. Leitcode parsen
    document.getElementById('btnParseLeitcode').addEventListener('click', parseLeitcode);
    
    // 2. Paketgröße aktualisieren
    document.getElementById('packageType').addEventListener('change', updatePackageDimensions);
    
    // 3. Paket hinzufügen
    document.getElementById('btnAddPackage').addEventListener('click', addPackage);
    
    // 4. Beispielpakete laden
    document.getElementById('btnPresetPackages').addEventListener('click', addPresetPackages);
    
    // 5. Alle Pakete löschen
    document.getElementById('btnClearPackages').addEventListener('click', clearPackages);
    
    // 6. Kompatibilität prüfen
    document.getElementById('btnCheckCompatibility').addEventListener('click', checkPackstationCompatibility);
    
    // 7. Enter-Taste für Leitcode
    document.getElementById('leitcodeInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            parseLeitcode();
        }
    });
    
    // Initiale Paketgröße setzen
    updatePackageDimensions();
    
    console.log('✅ Alle Event-Listener registriert!');
    console.log('🔍 Verfügbare Funktionen:');
    console.log('  - parseLeitcode:', typeof parseLeitcode);
    console.log('  - addPackage:', typeof addPackage);
    console.log('  - addPresetPackages:', typeof addPresetPackages);
    console.log('  - clearPackages:', typeof clearPackages);
    console.log('  - checkPackstationCompatibility:', typeof checkPackstationCompatibility);
});
