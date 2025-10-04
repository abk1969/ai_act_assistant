#!/bin/bash

# Script de Test Complet - Module Veille Réglementaire
# Audit approfondi de toutes les fonctionnalités

echo ""
echo "🔍 ====== AUDIT COMPLET - MODULE VEILLE RÉGLEMENTAIRE ======"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0
TOTAL=0

# Test 1: Status endpoint
echo "📊 Test 1: Vérification statut système..."
TOTAL=$((TOTAL + 1))
RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:5000/api/regulatory/status 2>/dev/null)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✅ Status endpoint OK${NC}"
    echo "   Response: $(echo $BODY | head -c 100)..."
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ Status endpoint failed: HTTP $HTTP_CODE${NC}"
    FAIL=$((FAIL + 1))
fi

# Test 2: Get updates
echo ""
echo "📰 Test 2: Récupération mises à jour réglementaires..."
TOTAL=$((TOTAL + 1))
RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:5000/api/regulatory/updates 2>/dev/null)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✅ Updates endpoint OK${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ Updates endpoint failed: HTTP $HTTP_CODE${NC}"
    FAIL=$((FAIL + 1))
fi

# Test 3: Sync (workflow multi-agents)
echo ""
echo "🔄 Test 3: Synchronisation multi-agents (peut prendre 30-60s)..."
TOTAL=$((TOTAL + 1))
START_TIME=$(date +%s)
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:5000/api/regulatory/sync --max-time 120 2>/dev/null)
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✅ Sync workflow OK (durée: ${DURATION}s)${NC}"
    echo "   Response: $BODY"
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ Sync failed: HTTP $HTTP_CODE${NC}"
    FAIL=$((FAIL + 1))
fi

# Test 4: Filter by source
echo ""
echo "🔍 Test 4: Filtrage par source..."
SOURCES=("Commission%20Europ%C3%A9enne" "CNIL" "AI%20Office")
for source in "${SOURCES[@]}"; do
    TOTAL=$((TOTAL + 1))
    RESPONSE=$(curl -s -w "\n%{http_code}" "http://localhost:5000/api/regulatory/updates?source=$source" 2>/dev/null)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

    if [ "$HTTP_CODE" == "200" ]; then
        echo -e "${GREEN}✅ Filter by source OK${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}❌ Filter by source failed: HTTP $HTTP_CODE${NC}"
        FAIL=$((FAIL + 1))
    fi
done

# Test 5: Filter by severity
echo ""
echo "⚠️  Test 5: Filtrage par sévérité..."
SEVERITIES=("critique" "important" "info")
for severity in "${SEVERITIES[@]}"; do
    TOTAL=$((TOTAL + 1))
    RESPONSE=$(curl -s -w "\n%{http_code}" "http://localhost:5000/api/regulatory/updates?severity=$severity" 2>/dev/null)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

    if [ "$HTTP_CODE" == "200" ]; then
        echo -e "${GREEN}✅ Filter by severity '$severity' OK${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}❌ Filter by severity '$severity' failed: HTTP $HTTP_CODE${NC}"
        FAIL=$((FAIL + 1))
    fi
done

# Résumé
echo ""
echo ""
echo "📊 ====== RÉSUMÉ DES TESTS ======"
echo ""
SUCCESS_RATE=$(echo "scale=1; ($PASS / $TOTAL) * 100" | bc)
echo -e "${GREEN}✅ PASS: $PASS${NC}"
echo -e "${RED}❌ FAIL: $FAIL${NC}"
echo -e "📈 Taux de réussite: ${SUCCESS_RATE}%"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 Tous les tests sont passés !${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Certains tests ont échoué${NC}"
    exit 1
fi
