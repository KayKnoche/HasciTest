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
    
    // --- API-KONFIGURATION mit Environment-Unterstützung ---
    const authHeader = 'Basic SEFTQ0lBY2Nlc3M6RGVoamlzbGM/MnE=';
    
    // Umgebung aus dem Toggle lesen
    const environment = typeof getCurrentEnvironment === 'function' ? getCurrentEnvironment() : 'prod';
    console.log(`🌍 Aktuelle Umgebung: ${environment.toUpperCase()}`);
    
    // URLs je nach Umgebung
    let targetUrl;
    let secondUrl;
    
    if (environment === 'stg') {
        // STAGING
        targetUrl = 'https://depst-mara-stg1-decisionhub.pegacloud.net/prweb/api/HASCI/02/notificationLocations';
        secondUrl = 'https://depst-mara-stg1-decisionhub.pegacloud.net/prweb/api/PegaMKTContainer/V3/Container';
        console.log('🌍 Verwende STAGING Umgebung');
    } else {
        // PRODUCTION (Default)
        targetUrl = 'https://depst-mara-prod1-decisionhub.pegacloud.net/prweb/api/HASCI/02/notificationLocations';
        secondUrl = 'https://depst-mara-prod1-decisionhub.pegacloud.net/prweb/api/PegaMKTContainer/V3/Container';
        console.log('🌍 Verwende PRODUCTION Umgebung');
    }
    
    const useProxy = false;
    const apiUrl = useProxy ? `https://cors-anywhere.herokuapp.com/${targetUrl}` : targetUrl;
    
    try {
        console.log('📤 URL (1. Call):', apiUrl);
        console.log('📦 Payload (1. Call):', JSON.stringify(payload, null, 2));
        
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
        await callSecondWebService(resultDiv, secondUrl, environment);
        
    } catch (error) {
        console.error('❌ Fehler beim 1. Call:', error);
        firstApiResponse = null;
        showPackstationResult(resultDiv, compatiblePackages, incompatiblePackages, null);
    }
}

// --- 10. Zweiten WebService aufrufen ---
async function callSecondWebService(resultDiv, secondUrl, environment) {
    console.log('📞 callSecondWebService() aufgerufen');
    console.log(`🌍 Zweiter Call in Umgebung: ${environment.toUpperCase()}`);
    
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
        console.log('📦 Payload (2. Call):', JSON.stringify(secondPayload, null, 2));
        
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
