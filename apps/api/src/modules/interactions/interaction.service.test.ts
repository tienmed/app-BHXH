import test from "node:test";
import assert from "node:assert/strict";
import { inferIcdGroup, ensureDateKey, toDateDisplay, buildPdfContent } from "./interaction.service";

test("inferIcdGroup maps common specialty groups", () => {
  assert.equal(inferIcdGroup("I10"), "noi");
  assert.equal(inferIcdGroup("S72.0"), "ngoai");
  assert.equal(inferIcdGroup("O80"), "san");
  assert.equal(inferIcdGroup("P07"), "nhi");
});

test("ensureDateKey validates format and fallback", () => {
  assert.equal(ensureDateKey("2026-04-30", "2026-01-01"), "2026-04-30");
  assert.equal(ensureDateKey("30-04-2026", "2026-01-01"), "2026-01-01");
});

test("toDateDisplay converts yyyy-mm-dd to dd-mm-yyyy", () => {
  assert.equal(toDateDisplay("2026-04-30"), "30-04-2026");
});


test("buildPdfContent returns a PDF-like binary", () => {
  const buf = buildPdfContent({
    timezone: "Asia/Ho_Chi_Minh",
    from: "2026-04-01",
    to: "2026-04-30",
    totalCalls: 100,
    trendByDay: [{ date: "2026-04-30", dateDisplay: "30-04-2026", totalCalls: 10 }],
    topIcd: [{ icdCode: "I10", totalCalls: 30 }],
    topGroups: [{ icdGroup: "noi", totalCalls: 70 }],
    byAction: [{ action: "search", totalCalls: 100 }]
  });

  const text = buf.toString("utf-8");
  assert.equal(text.startsWith("%PDF-1.4"), true);
  assert.equal(text.includes("%%EOF"), true);
});
