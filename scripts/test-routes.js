const http = require('http');

const urls = [
  '/dashboard',
  '/kasir',
  '/stok',
  '/laporan',
  '/transaksi',
  '/spare-part',
  '/kendaraan',
  '/pelanggan',
  '/mekanik',
  '/jasa-service',
  '/pengaturan',
  '/api/supplier',
  '/api/pembelian',
  '/api/spare-part'
];

async function check() {
  console.log('Testing server endpoints on http://localhost:3000 ...');
  let failures = 0;
  for (const u of urls) {
    await new Promise((resolve) => {
      http.get('http://localhost:3000' + u, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          console.log(`✅ [${res.statusCode}] ${u}`);
        } else {
          console.log(`❌ [${res.statusCode}] ${u}`);
          failures++;
        }
        res.resume(); // consume response data to free up memory
        resolve();
      }).on('error', (err) => {
        console.log(`❌ [ERR] ${u}: ${err.message}`);
        failures++;
        resolve();
      });
    });
  }

  if (failures === 0) {
    console.log('\n🎉 ALL 14 TESTED ENDPOINTS RETURNED 200/SUCCESS OK!');
  } else {
    console.log(`\n⚠️ Finished with ${failures} failures.`);
  }
}

check();
