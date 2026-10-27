# Sicherung und Rücksetzen

Eine Kopie einer JSON-Datei ist kein vollständiges TV-Backup. Die Sicherung dieses Projekts erfasst Geräteinformationen, selbst dokumentierte Menüwerte, lokale Einstellungen und den Fernbedienungszugang. Sie enthält kein Firmware-Abbild und keine vollständige Liste interner Tizen-Einstellungen.

## Vor jeder Änderung

1. `node tools/tv-control.cjs status` ausführen und die erste Baseline aufbewahren.
2. `node tools/verify-backup.cjs` erstellt eine neue Kopie der Baseline mit SHA-256-Prüfsumme und prüft ihre Lesbarkeit und Übereinstimmung. Eine zweite Kopie sollte auf einem eigenen Datenträger liegen; zwei Ordner auf einem Computer schützen nicht vor einem Laufwerksausfall.
3. Das tatsächliche TV-Menü ansehen und Originalwerte unter `.local/changes.json` dokumentieren. Bei DNS auch Automatisch/Manuell erfassen.
4. Für jeden geplanten Schalter den Menüpfad und Rückweg notieren. Nur identifizierte Optionen mit bekanntem Rückweg ändern.
5. Nach einer Änderung das sichtbare Ergebnis prüfen. Ein erfolgreich gesendeter Tastendruck beweist keine sichtbare Änderung.

Beispiel für einen Eintrag, erst nach Sichtprüfung ausfüllen:

```json
{
  "menuPath": "tatsächlich angezeigter Menüpfad",
  "setting": "Name des Schalters",
  "originalValue": "am TV abgelesener Wert",
  "newValue": "genehmigter Zielwert",
  "observedAfter": null,
  "undo": "Diesen Schalter wieder auf originalValue setzen und sichtbar prüfen"
}
```

## Rückweg

Menüänderungen in umgekehrter Reihenfolge auf die dokumentierten Originalwerte zurückstellen. Vor jeder Bestätigung den sichtbaren Fokus prüfen. Ohne bekannte Originalwerte keine pauschalen Rücksetzbefehle ausführen.

Die Fernbedienungsfreigabe kann am TV über den Geräteverbindungsmanager widerrufen werden; der genaue Menüpfad hängt von der Firmware ab. Das lokale Löschen eines Tokens widerruft die TV-Freigabe nicht.

Eine später installierte eigene App darf nur über die offizielle App-Verwaltung entfernt werden. Dieses Projekt verändert keine native Home-Zuordnung. Bei anderen Projekten, die das tun, muss zuerst deren Originalzuordnung wiederhergestellt werden.

Ein erfolgreicher Rücksetztest darf erst dokumentiert werden, wenn der ursprüngliche Zustand sichtbar wiederhergestellt wurde. Bisher gab es keine Einstellungsänderungen und deshalb keinen solchen Test.
