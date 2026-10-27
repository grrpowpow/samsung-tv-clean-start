# Samsung TV Clean Start

Ein eigener ruhiger TV-Startbildschirm und ein nachvollziehbarer Arbeitsablauf für Samsung Tizen. Inspiriert von [CleanFrame](https://github.com/nthnclrk/CleanFrame) und dem Sicherungsprinzip von [TV Detox](https://github.com/Ansub/tv-detox). Dies ist ein unabhängiges Projekt, kein Samsung-Produkt.

## Aktueller Stand

Auf einem Samsung UE65U8090HUXXN wurden Geräteinformationen abgerufen, eine Netzwerkfernbedienung über Port 8002 gekoppelt und eine einzelne Menütaste gesendet. Die sichtbare Wirkung der Menütaste ist noch nicht bestätigt. Es wurden keine Systemeinstellungen oder Pakete verändert. Ein Firmwarebackup, vollständiger Einstellungsdump und geprüfter TV-Rollback liegen nicht vor.

Die eigene Oberfläche unter `app/` ist eine lokale Vorschau. Sie bietet Uhr, App-Leiste, Navigation per Pfeiltasten und einstellbaren Hintergrund. App-Starts sind erst nach Prüfung der echten Tizen-App-IDs verfügbar. Sie ist noch keine signierte, installierte TV-App und ersetzt die Samsung-Home-Taste nicht.

## Vorschau

`app/index.html` lokal im Browser öffnen. Mit Pfeiltasten navigieren, Enter auswählen und Escape das Menü schließen. Über das Zahnrad lässt sich ein eigenes Hintergrundfoto wählen. Dieses Foto wird nur lokal im Browser gespeichert, nicht hochgeladen.

## Fernbedienung und Sicherung

Node.js 22 oder neuer wird benötigt. Keine npm-Abhängigkeiten.

```powershell
$env:TV_HOST = "DEINE_TV_IP"
node tools/tv-control.cjs status
node tools/verify-backup.cjs
node tools/tv-control.cjs pair-secure
```

Am TV die Anfrage für „PC TV Steuerung“ selbst erlauben. Anschließend kann eine einzelne Menütaste gesendet werden:

```powershell
node tools/tv-control.cjs menu
```

Der TV muss eingeschaltet und im selben vertrauenswürdigen Heimnetz sein. Die verschlüsselte Verbindung verwendet das selbstsignierte TV-Zertifikat; dessen Zertifikatskette wird für diese einzelne Verbindung nicht geprüft. Niemals Ports im Router freigeben. Die Netzwerkfernbedienung ist keine Garantie für eine langfristig stabile, öffentlich dokumentierte Samsung-API.

Geräteinformationen, Zugangstoken und Protokolle landen ausschließlich unter `.local/`. `status` überschreibt die erste Baseline nicht. Die Baseline enthält lediglich die vom Geräteendpunkt gelieferten Informationen. Vor Menüänderungen müssen die sichtbaren Originalwerte zusätzlich aufgenommen werden.

## Rücksetzen und Grenzen

Siehe [Sicherung und Rücksetzen](docs/recovery.md) und [geprüfter Stand](docs/status.md).

**TV Detox ist für Android gedacht. Seine ADB- und Paketbefehle sind auf Samsung Tizen nicht anwendbar.** Dieses Projekt deaktiviert keine Systempakete, benötigt kein Root und schreibt keine native Home-/Boot-Zuordnung. Ein Werksreset ist kein vorgesehener Rücksetzschritt.

Die Abschaltung personalisierter Werbung garantiert keine werbefreie Startseite. Geschwindigkeit wurde nicht gemessen. DNS kann keine vollständige Entfernung von Werbung versprechen; die Android-Einstellung „Private DNS“ wird hier nicht verwendet.

## Veröffentlichung

Nur diesen Projektordner veröffentlichen. Keine übergeordneten Geräte-, Sicherungs- oder Zugangsdaten hinzufügen. Vor dem Push `git status --short` und `git diff --cached` prüfen. Keine Kopien dieses Chats oder persönliche TV-Fotos mit Kennungen veröffentlichen.

## Nächste Schritte

- Tatsächliche Datenschutz- und Startoptionen am TV dokumentieren.
- Jede genehmigte Änderung mit Originalwert, Ergebnis und Rückweg protokollieren.
- Offizielle Samsung-Entwicklerwerkzeuge, eigene App-Identität und Signierzertifikate einrichten.
- App-IDs auf dem eigenen TV ermitteln, Oberfläche signieren und als zusätzliche App testen.
- Den gewünschten YouTube-Link erst nach Prüfung der unterstützten Wiedergabesteuerung integrieren.

Offizielle Quellen: [Samsung-Geräteverbindung](https://developer.samsung.com/smarttv/develop/getting-started/using-sdk/tv-device.html), [Samsung-Zertifikate](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/creating-certificates.html).
