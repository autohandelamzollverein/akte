# Akte — Anwaltsdokumentation

Verschlüsselte Single-Page-App. Eine `index.html`, alles drin (PDFs, Bilder, Markdown), AES-256-GCM, PBKDF2 (250k Iterationen).

## Ordnerstruktur

```
_repo/
├── source/         ← Inhalte (Markdown + Assets), hier editieren
├── template.html   ← UI-Template (HTML/CSS/JS)
├── build.js        ← Build-Script
├── index.html      ← Build-Output (verschlüsselt, → GitHub Pages)
└── README.md
```

## Build

```bash
PW="dein-passwort" node build.js
```

Ohne `PW=` wird `CHANGE_ME` genommen (nur zum Testen).

## Inhalte editieren

- `.md` Dateien in `source/` mit normalem Markdown.
- Links auf andere Dateien:
  - **Markdown-Syntax** (relative Pfade, ggf. URL-encoded):  
    `[Ankaufsrechnung](../Vorgeschichte%20Kia%20Picanto/01_Ankaufsrechnung.pdf)`
  - **Plain-Text-Auto-Link** funktioniert auch — jede Erwähnung eines bekannten Dateinamens (auch `Folder/Datei.pdf`) wird automatisch klickbar.

Nach Änderungen: `node build.js` neu laufen lassen → `index.html` updaten → committen → push.

## GitHub Pages

1. Repo erstellen, `index.html` ins Root committen (das `source/` braucht GH nicht — kannst es auch im Repo behalten oder via `.gitignore` ausschließen, deine Wahl).
2. Settings → Pages → Branch wählen → Save.
3. URL: `https://<user>.github.io/<repo>/` → an Anwalt + Passwort.

⚠️ Repo darf **public** sein — der Inhalt ist verschlüsselt. **Aber** wenn du `source/` mit-committest, liegt der Klartext im Repo. Also entweder:
- `source/` in `.gitignore` (empfohlen), oder
- Repo **private** machen.

## Sicherheitshinweise

- AES-256-GCM mit PBKDF2-SHA256 (250k Iter). Brute-Force ist bei einem starken Passwort (≥12 Zeichen, gemischt) nicht praktikabel.
- Schwaches Passwort = schwacher Schutz. Nimm was Vernünftiges.
- Originalordner (`Desktop/Dokumentation/*`) bleibt unangetastet — `_repo/source/` ist eine Kopie.
