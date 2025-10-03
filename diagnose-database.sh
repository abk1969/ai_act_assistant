#!/bin/bash

echo "🔍 AI ACT NAVIGATOR - DIAGNOSTIC COMPLET DE LA BASE DE DONNÉES"
echo "=============================================================="

echo ""
echo "📊 1. État des conteneurs Docker:"
echo "--------------------------------"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(postgres|ai-act)"

echo ""
echo "🗄️ 2. Connexion à PostgreSQL:"
echo "------------------------------"
docker exec ai-act-postgres psql -U ai_act_admin -c "\conninfo" 2>/dev/null || echo "❌ Impossible de se connecter à PostgreSQL"

echo ""
echo "📋 3. Liste des bases de données:"
echo "--------------------------------"
docker exec ai-act-postgres psql -U ai_act_admin -c "\l" 2>/dev/null || echo "❌ Impossible de lister les bases de données"

echo ""
echo "🏗️ 4. Tables dans ai_act_navigator:"
echo "-----------------------------------"
docker exec ai-act-postgres psql -U ai_act_admin -d ai_act_navigator -c "\dt" 2>/dev/null || echo "❌ Impossible de lister les tables"

echo ""
echo "🔐 5. Vérification des tables de sécurité:"
echo "------------------------------------------"
echo "Vérification security_settings:"
docker exec ai-act-postgres psql -U ai_act_admin -d ai_act_navigator -c "SELECT COUNT(*) FROM security_settings;" 2>/dev/null || echo "❌ Table security_settings n'existe pas"

echo "Vérification failed_login_attempts:"
docker exec ai-act-postgres psql -U ai_act_admin -d ai_act_navigator -c "SELECT COUNT(*) FROM failed_login_attempts;" 2>/dev/null || echo "❌ Table failed_login_attempts n'existe pas"

echo "Vérification regulatory_updates:"
docker exec ai-act-postgres psql -U ai_act_admin -d ai_act_navigator -c "SELECT COUNT(*) FROM regulatory_updates;" 2>/dev/null || echo "❌ Table regulatory_updates n'existe pas"

echo ""
echo "👤 6. Permissions utilisateur:"
echo "-----------------------------"
docker exec ai-act-postgres psql -U ai_act_admin -d ai_act_navigator -c "SELECT current_user, current_database();" 2>/dev/null || echo "❌ Impossible de vérifier les permissions"

echo ""
echo "📊 7. Schéma de la base de données:"
echo "----------------------------------"
docker exec ai-act-postgres psql -U ai_act_admin -d ai_act_navigator -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" 2>/dev/null || echo "❌ Impossible de lister le schéma"

echo ""
echo "✅ Diagnostic terminé !"
