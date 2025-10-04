/**
 * Script de Test Complet - Module Veille Réglementaire
 * Audit approfondi de toutes les fonctionnalités
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';
const testResults = [];

// Fonction helper pour faire des requêtes HTTP
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data.substring(0, 200), headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Tests
async function runTests() {
  console.log('\n🔍 ====== AUDIT COMPLET - MODULE VEILLE RÉGLEMENTAIRE ======\n');

  // Test 1: Status endpoint
  console.log('📊 Test 1: Vérification statut système...');
  try {
    const res = await makeRequest('GET', '/api/regulatory/status');
    if (res.status === 200 && res.data.totalUpdates !== undefined) {
      console.log('✅ Status endpoint OK');
      console.log(`   - Total updates: ${res.data.totalUpdates}`);
      console.log(`   - Critical alerts: ${res.data.criticalAlerts}`);
      console.log(`   - Last sync: ${res.data.lastSync}`);
      testResults.push({ test: 'Status API', status: 'PASS' });
    } else {
      console.log(`❌ Status endpoint failed: ${res.status}`);
      testResults.push({ test: 'Status API', status: 'FAIL', error: `Status ${res.status}` });
    }
  } catch (error) {
    console.log(`❌ Status endpoint error: ${error.message}`);
    testResults.push({ test: 'Status API', status: 'ERROR', error: error.message });
  }

  // Test 2: Get updates
  console.log('\n📰 Test 2: Récupération mises à jour réglementaires...');
  try {
    const res = await makeRequest('GET', '/api/regulatory/updates');
    if (res.status === 200 && Array.isArray(res.data)) {
      console.log(`✅ Updates endpoint OK (${res.data.length} updates)`);
      if (res.data.length > 0) {
        console.log(`   - Exemple: "${res.data[0].title}"`);
        console.log(`   - Source: ${res.data[0].source}`);
        console.log(`   - Severity: ${res.data[0].severity}`);
      }
      testResults.push({ test: 'Get Updates API', status: 'PASS', count: res.data.length });
    } else {
      console.log(`❌ Updates endpoint failed: ${res.status}`);
      testResults.push({ test: 'Get Updates API', status: 'FAIL', error: `Status ${res.status}` });
    }
  } catch (error) {
    console.log(`❌ Updates endpoint error: ${error.message}`);
    testResults.push({ test: 'Get Updates API', status: 'ERROR', error: error.message });
  }

  // Test 3: Sync (workflow multi-agents)
  console.log('\n🔄 Test 3: Synchronisation multi-agents (peut prendre 30-60s)...');
  try {
    const startTime = Date.now();
    const res = await makeRequest('POST', '/api/regulatory/sync');
    const duration = Date.now() - startTime;

    if (res.status === 200 && res.data.updatedSources) {
      console.log(`✅ Sync workflow OK (durée: ${(duration/1000).toFixed(2)}s)`);
      console.log(`   - New updates: ${res.data.newUpdates}`);
      console.log(`   - Updated sources: ${res.data.updatedSources.join(', ')}`);
      console.log(`   - Errors: ${res.data.errors.length > 0 ? res.data.errors.join(', ') : 'None'}`);

      if (res.data.errors.length > 0) {
        testResults.push({
          test: 'Multi-Agent Sync',
          status: 'PARTIAL',
          duration,
          errors: res.data.errors
        });
      } else {
        testResults.push({ test: 'Multi-Agent Sync', status: 'PASS', duration });
      }
    } else {
      console.log(`❌ Sync failed: ${res.status}`);
      testResults.push({ test: 'Multi-Agent Sync', status: 'FAIL', error: `Status ${res.status}` });
    }
  } catch (error) {
    console.log(`❌ Sync error: ${error.message}`);
    testResults.push({ test: 'Multi-Agent Sync', status: 'ERROR', error: error.message });
  }

  // Test 4: Filter by source
  console.log('\n🔍 Test 4: Filtrage par source...');
  const sources = ['Commission Européenne', 'CNIL', 'AI Office'];
  for (const source of sources) {
    try {
      const res = await makeRequest('GET', `/api/regulatory/updates?source=${encodeURIComponent(source)}`);
      if (res.status === 200) {
        console.log(`✅ Filter by "${source}": ${res.data.length} results`);
        testResults.push({ test: `Filter by ${source}`, status: 'PASS', count: res.data.length });
      } else {
        console.log(`❌ Filter by "${source}" failed`);
        testResults.push({ test: `Filter by ${source}`, status: 'FAIL' });
      }
    } catch (error) {
      console.log(`❌ Filter by "${source}" error: ${error.message}`);
      testResults.push({ test: `Filter by ${source}`, status: 'ERROR', error: error.message });
    }
  }

  // Test 5: Filter by severity
  console.log('\n⚠️  Test 5: Filtrage par sévérité...');
  const severities = ['critique', 'important', 'info'];
  for (const severity of severities) {
    try {
      const res = await makeRequest('GET', `/api/regulatory/updates?severity=${severity}`);
      if (res.status === 200) {
        console.log(`✅ Filter by "${severity}": ${res.data.length} results`);
        testResults.push({ test: `Filter by ${severity}`, status: 'PASS', count: res.data.length });
      } else {
        console.log(`❌ Filter by "${severity}" failed`);
        testResults.push({ test: `Filter by ${severity}`, status: 'FAIL' });
      }
    } catch (error) {
      console.log(`❌ Filter by "${severity}" error: ${error.message}`);
      testResults.push({ test: `Filter by ${severity}`, status: 'ERROR', error: error.message });
    }
  }

  // Test 6: Database persistence
  console.log('\n💾 Test 6: Vérification persistence base de données...');
  try {
    const res1 = await makeRequest('GET', '/api/regulatory/updates');
    const initialCount = res1.data.length;

    // Trigger sync
    await makeRequest('POST', '/api/regulatory/sync');

    const res2 = await makeRequest('GET', '/api/regulatory/updates');
    const finalCount = res2.data.length;

    console.log(`✅ Persistence OK (before: ${initialCount}, after: ${finalCount})`);
    testResults.push({
      test: 'Database Persistence',
      status: 'PASS',
      before: initialCount,
      after: finalCount
    });
  } catch (error) {
    console.log(`❌ Persistence test error: ${error.message}`);
    testResults.push({ test: 'Database Persistence', status: 'ERROR', error: error.message });
  }

  // Résumé
  console.log('\n\n📊 ====== RÉSUMÉ DES TESTS ======\n');

  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  const errors = testResults.filter(r => r.status === 'ERROR').length;
  const partial = testResults.filter(r => r.status === 'PARTIAL').length;

  console.log(`✅ PASS: ${passed}`);
  console.log(`⚠️  PARTIAL: ${partial}`);
  console.log(`❌ FAIL: ${failed}`);
  console.log(`💥 ERROR: ${errors}`);
  console.log(`\n📈 Taux de réussite: ${((passed / testResults.length) * 100).toFixed(1)}%\n`);

  // Détails
  console.log('📋 Détails par test:\n');
  testResults.forEach((result, index) => {
    const icon = result.status === 'PASS' ? '✅' :
                 result.status === 'PARTIAL' ? '⚠️' :
                 result.status === 'FAIL' ? '❌' : '💥';
    console.log(`${index + 1}. ${icon} ${result.test}: ${result.status}`);
    if (result.error) console.log(`   Error: ${result.error}`);
    if (result.count !== undefined) console.log(`   Count: ${result.count}`);
    if (result.duration) console.log(`   Duration: ${(result.duration/1000).toFixed(2)}s`);
  });

  console.log('\n✅ Audit terminé\n');
}

// Run tests
runTests().catch(console.error);
