// Audit accessibilité (axe-core) de la landing.
// Usage : node docs/review/audit.mjs [url]
import { readFileSync } from "node:fs"
import { chromium } from "playwright"

const url = process.argv[2] ?? "http://localhost:3001"
const axeSource = readFileSync(new URL("../../node_modules/axe-core/axe.min.js", import.meta.url), "utf8")

async function auditViewport(browser, viewport, label, colorScheme = "light") {
  const page = await browser.newPage({ viewport, colorScheme })
  await page.goto(url, { waitUntil: "networkidle" })
  await page.addScriptTag({ content: axeSource })
  const results = await page.evaluate(async () => {
    const r = await window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"] },
    })
    return r.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.length,
      details: v.nodes.slice(0, 8).map((n) => ({
        target: n.target.join(" "),
        text: (n.any[0]?.data ?? n.failureSummary ?? "").toString().slice(0, 200),
      })),
    }))
  })
  console.log(`\n=== ${label} (${colorScheme}) ===`)
  if (results.length === 0) {
    console.log("AXE: aucune violation")
  } else {
    for (const v of results) {
      console.log(`VIOLATION ${v.impact} ${v.id} — ${v.nodes} nœud(s)`)
      console.log(`  ${v.help}`)
      for (const d of v.details) console.log(`  → ${d.target}\n    ${d.text}`)
    }
  }
  await page.close()
  return results.length
}

const browser = await chromium.launch()
let total = 0
try {
  total += await auditViewport(browser, { width: 1440, height: 900 }, "desktop", "light")
  total += await auditViewport(browser, { width: 390, height: 844 }, "mobile", "light")
  total += await auditViewport(browser, { width: 1440, height: 900 }, "desktop-dark", "dark")
} finally {
  await browser.close()
}
console.log(total === 0 ? "\nVERDICT: ALL AXE PASS" : `\nVERDICT: ${total} VIOLATION(S)`)
