#!/bin/bash

# ==============================================
# 🔍 REPORTE DE ESTADO DEL SERVIDOR
# Ejecutar: bash /var/www/moovy/scripts/server-status.sh
# ==============================================

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          🔍 REPORTE DE ESTADO DEL SERVIDOR                  ║"
echo "║          $(date '+%Y-%m-%d %H:%M:%S')                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============ SISTEMA ============
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 SISTEMA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Uptime: $(uptime -p)"
echo "Memoria: $(free -h | awk '/^Mem:/ {print $3 "/" $2 " usado"}')"
echo "Disco:  $(df -h / | awk 'NR==2 {print $3 "/" $2 " usado (" $5 ")"}')"
echo ""

# ============ PM2 APLICACIONES ============
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 PM2 APLICACIONES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 list
echo ""

# ============ NGINX ============
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 NGINX"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx está ACTIVO${NC}"
else
    echo -e "${RED}❌ Nginx está INACTIVO${NC}"
fi
echo ""
echo "Sitios habilitados:"
ls -la /etc/nginx/sites-enabled/ | grep -v "^total" | grep -v "^\." | awk '{print "  → " $NF}'
echo ""

# ============ CERTIFICADOS SSL ============
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔒 CERTIFICADOS SSL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for cert_dir in /etc/letsencrypt/live/*/; do
    if [ -d "$cert_dir" ]; then
        domain=$(basename "$cert_dir")
        if [ "$domain" != "README" ]; then
            expiry=$(openssl x509 -enddate -noout -in "${cert_dir}fullchain.pem" 2>/dev/null | cut -d= -f2)
            expiry_epoch=$(date -d "$expiry" +%s 2>/dev/null)
            now_epoch=$(date +%s)
            days_left=$(( (expiry_epoch - now_epoch) / 86400 ))
            
            if [ $days_left -gt 30 ]; then
                echo -e "${GREEN}✅ $domain - Expira: $expiry ($days_left días restantes)${NC}"
            elif [ $days_left -gt 7 ]; then
                echo -e "${YELLOW}⚠️  $domain - Expira: $expiry ($days_left días restantes)${NC}"
            else
                echo -e "${RED}❌ $domain - Expira: $expiry ($days_left días restantes)${NC}"
            fi
        fi
    fi
done
echo ""

# ============ FIREWALL ============
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🛡️  FIREWALL (UFW)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ufw status | head -10
echo ""

# ============ DNS ============
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌍 DNS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
domains=("somosmoovy.com" "www.somosmoovy.com" "usev.app" "ogdeco.usev.app" "airecm.usev.app" "limone.usev.app" "vora.usev.app")
for domain in "${domains[@]}"; do
    ip=$(dig +short "$domain" 2>/dev/null | head -1)
    if [ -n "$ip" ]; then
        echo -e "${GREEN}✅ $domain → $ip${NC}"
    else
        echo -e "${RED}❌ $domain → No resuelve${NC}"
    fi
done
echo ""

# ============ PUERTOS ============
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔌 PUERTOS EN USO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ss -tlnp | grep -E "(3000|3001|3002|3005|3006|80|443)" | awk '{print "  " $4 " → " $6}'
echo ""

# ============ ÚLTIMOS ERRORES ============
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  ÚLTIMOS ERRORES (Nginx)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
tail -5 /var/log/nginx/error.log 2>/dev/null | head -5 || echo "Sin errores recientes"
echo ""

# ============ RESUMEN ============
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 RESUMEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Contar apps online
online_apps=$(pm2 list 2>/dev/null | grep -c "online")
errored_apps=$(pm2 list 2>/dev/null | grep -c "errored")

echo "Apps online: $online_apps"
echo "Apps con error: $errored_apps"
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    FIN DEL REPORTE                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
