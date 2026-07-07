// --- 11. Finales Ergebnis mit Tabelle anzeigen ---
function showFinalResult(resultDiv, data) {
    let html = '<strong>📊 Endergebnis</strong><div class="details">';
    
    // Erfolgsmeldung für den ersten Call
    html += '<p style="color: #155724;">✅ 1. Call erfolgreich durchgeführt</p>';
    
    // Tabelle für den zweiten Call
    html += '<hr style="margin:15px 0;">';
    html += '<h4 style="margin:10px 0;">📋 Ergebnisse des 2. WebService-Calls</h4>';
    
    // Prüfen ob wir Daten haben - Struktur: ContainerList[0].RankedResults
    let results = null;
    
    if (data && data.Status === 'OK' && data.ContainerList && data.ContainerList.length > 0) {
        // Durchsuche alle Container nach RankedResults
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
        
        // Nur die ersten 10 Ergebnisse anzeigen
        const displayResults = results.slice(0, 10);
        displayResults.forEach((item, index) => {
            const rowColor = index % 2 === 0 ? '#f8f9fa' : 'white';
            
            // OutletType bestimmen und Availability setzen
            let outletType = item.OutletType || 'N/A';
            let typeIcon = '';
            let availabilityText = 'Available'; // Default
            
            if (outletType.toLowerCase().includes('parcel')) {
                typeIcon = '📦 ';
                // Bei Packstationen: Verfügbarkeit aus dem Feld Available
                availabilityText = item.Available === true ? 'Available' : 'Unavailable';
            } else if (outletType.toLowerCase().includes('post')) {
                typeIcon = '🏤 ';
                // Post Offices sind immer verfügbar
                availabilityText = 'Available';
            } else {
                // Fallback: Feld Available verwenden
                availabilityText = item.Available === true ? 'Available' : 'Unavailable';
            }
            
            // Rating als Zahl
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
    
    // Zusätzliche Informationen
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
