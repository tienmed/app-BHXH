// test-preview.js
const fs = require('fs');
const url = "https://script.google.com/macros/s/AKfycbzfgoGvVv2hjHvLZ6pKOAr2728Q3DJ2MoprrPvKzUVLmRNlK8zMywn5u6s7P7mYhsvS/exec";

async function run() {
    const payload = {
        action: "recommendations-preview",
        encounterCode: "OP-IM-0001",
        diagnoses: [
            { icd: "E11.9" }
        ]
    };

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    }).then(r => r.json());

    fs.writeFileSync('preview-output.json', JSON.stringify(res, null, 2), 'utf8');
}

run();
