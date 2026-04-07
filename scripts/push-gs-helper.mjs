export const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzfgoGvVv2hjHvLZ6pKOAr2728Q3DJ2MoprrPvKzUVLmRNlK8zMywn5u6s7P7mYhsvS/exec";

export async function pushToGoogleSheets({ clss = [], meds = [], bundles = [] }) {
  console.log("=== STARTING GOOGLE SHEETS SYNC ===");

  if (clss.length > 0) {
    console.log(`\n📦 Pushing ${clss.length} CLS (Catalog) records...`);
    for (const item of clss) {
      try {
        const payload = { action: 'create-catalog-entry', kind: 'cls', ...item };
        const res = await fetch(GOOGLE_APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).then(r => r.json());
        console.log(`[CLS] ${item.code} | ${res.ok ? "OK" : "ERROR"} | ${res.message || res.error}`);
      } catch (err) {
        console.error(`[CLS] ${item.code} Failed to fetch:`, err.message);
      }
    }
  }

  if (meds.length > 0) {
    console.log(`\n💊 Pushing ${meds.length} Medication (Catalog) records...`);
    for (const item of meds) {
      try {
        const payload = { action: 'create-catalog-entry', kind: 'medication', ...item };
        const res = await fetch(GOOGLE_APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).then(r => r.json());
        console.log(`[MED] ${item.code} | ${res.ok ? "OK" : "ERROR"} | ${res.message || res.error}`);
      } catch (err) {
        console.error(`[MED] ${item.code} Failed to fetch:`, err.message);
      }
    }
  }

  if (bundles.length > 0) {
    console.log(`\n📚 Pushing ${bundles.length} ICD Rule Bundles (ICD, Protocols, Rules, Mappings)...`);
    for (const item of bundles) {
      try {
        const payload = { action: 'create-icd-rule-bundle', ...item };
        const res = await fetch(GOOGLE_APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).then(r => r.json());
        console.log(`[BUNDLE] ${item.icdCode} - ${item.icdName} | ${res.ok ? "OK" : "ERROR"} | ${res.message || res.error}`);
      } catch (err) {
        console.error(`[BUNDLE] ${item.icdCode} Failed to fetch:`, err.message);
      }
    }
  }

  console.log("\n=== COMPLETED GOOGLE SHEETS SYNC ===");
}
