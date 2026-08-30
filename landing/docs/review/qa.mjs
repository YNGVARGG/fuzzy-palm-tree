// QA automatisé de la landing — vérifie le rendu réel via Playwright.
// Usage : node docs/review/qa.mjs [url]
import { chromium } from "playwright"

const url = process.argv[2] ?? "http://localhost:3001"
const results = []
const ok = (name, detail = "") => results.push(`PASS ${name}${detail ? " — " + detail : ""}`)
const bad = (name, detail = "") => results.push(`FAIL ${name}${detail ? " — " + detail : ""}`)

async function qaViewport(browser, viewport, label, colorScheme = "light") {
  const page = await browser.newPage({ viewport, colorScheme })
  const errors = []
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text())
  })
  page.on("pageerror", (err) => errors.push(String(err)))

  await page.goto(url, { waitUntil: "networkidle" })
  await page.waitForTimeout(1500)

  ok(`${label}: titre`, await page.title())

  // Débordement horizontal
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth
  )
  overflow <= 1 ? ok(`${label}: pas de débordement horizontal`) : bad(`${label}: débordement de ${overflow}px`)

  // Sections présentes
  for (const id of ["top", "fonctionnalites", "demo", "tarifs", "faq", "cta"]) {
    const el = await page.$(`#${id}`)
    el ? ok(`${label}: section #${id}`) : bad(`${label}: section #${id} manquante`)
  }

  // Placeholders d'animation (4 posés ; le 5e — révélations au scroll — est
  // volontairement non posé tant que la lib d'animation n'est pas choisie).
  const ph = await page.$$("[data-placeholder]")
  ph.length === 4 ? ok(`${label}: 4 placeholders d'animation`) : bad(`${label}: ${ph.length} placeholders au lieu de 4`)

  // Nav fixe
  const navPos = await page.$eval("header", (h) => getComputedStyle(h).position)
  navPos === "fixed" ? ok(`${label}: nav fixed`) : bad(`${label}: nav ${navPos}`)

  // Contraste texte hero (fond) — échantillonnage canvas (gère oklch/lab/rgb natifs)
  const heroContrast = await page.evaluate(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = 1
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    const sample = (fill) => {
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = "#000"
      ctx.fillRect(0, 0, 1, 1)
      ctx.fillStyle = fill
      ctx.globalCompositeOperation = "source-over"
      ctx.fillRect(0, 0, 1, 1)
      const d = ctx.getImageData(0, 0, 1, 1).data
      return [d[0], d[1], d[2]]
    }
    const lum = (v) => {
      const f = (x) => {
        x /= 255
        return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
      }
      return 0.2126 * f(v[0]) + 0.7152 * f(v[1]) + 0.0722 * f(v[2])
    }
    const ratio = (a, b) => {
      const [hi, lo] = lum(a) > lum(b) ? [lum(a), lum(b)] : [lum(b), lum(a)]
      return (hi + 0.05) / (lo + 0.05)
    }
    // Fond effectif : body puis ancêtres peints dans l'ordre.
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = getComputedStyle(document.body).backgroundColor
    ctx.fillRect(0, 0, 1, 1)
    let node = document.querySelector("section#top").parentElement
    while (node) {
      const c = getComputedStyle(node).backgroundColor
      if (c && c !== "rgba(0, 0, 0, 0)") {
        ctx.fillStyle = c
        ctx.fillRect(0, 0, 1, 1)
      }
      node = node.parentElement
    }
    const bg = Array.from(ctx.getImageData(0, 0, 1, 1).data.slice(0, 3))
    const h1 = document.querySelector("h1")
    const p = document.querySelector("section#top p")
    const titleC = sample(getComputedStyle(h1).color)
    const bodyC = sample(getComputedStyle(p).color)
    return { title: ratio(titleC, bg), body: ratio(bodyC, bg) }
  })
  heroContrast.title >= 4.5
    ? ok(`${label}: contraste h1 ${heroContrast.title.toFixed(2)}`)
    : bad(`${label}: contraste h1 ${heroContrast.title.toFixed(2)}`)
  heroContrast.body >= 4.5
    ? ok(`${label}: contraste corps ${heroContrast.body.toFixed(2)}`)
    : bad(`${label}: contraste corps ${heroContrast.body.toFixed(2)}`)

  // Test interaction pricing (toggle mensuel/annuel)
  if (label.startsWith("desktop")) {
    const before = await page.$eval("#tarifs article", (a) => a.textContent)
    await page.click('#tarifs button[role="switch"]')
    await page.waitForTimeout(300)
    const after = await page.$eval("#tarifs article", (a) => a.textContent)
    before !== after ? ok("pricing: le toggle change le prix") : bad("pricing: le toggle ne change rien")
  }

  // Test interaction thème (clair ↔ sombre)
  if (label.startsWith("desktop")) {
    const wasDark = await page.evaluate(() => document.documentElement.classList.contains("dark"))
    await page.click('header button[aria-label="Changer de thème (clair / sombre)"]')
    await page.waitForTimeout(400)
    const nowDark = await page.evaluate(() => document.documentElement.classList.contains("dark"))
    wasDark !== nowDark ? ok(`thème: bascule fonctionne (${wasDark ? "sombre" : "clair"} → ${nowDark ? "sombre" : "clair"})`) : bad("thème: la bascule ne change rien")
    // Remettre l'état initial pour les passes suivantes
    if (nowDark !== false && colorScheme === "light") {
      await page.click('header button[aria-label="Changer de thème (clair / sombre)"]')
      await page.waitForTimeout(300)
    }
  }

  // Test interaction menu mobile (ouvrir → liens visibles → fermer par Échap)
  if (label.startsWith("mobile")) {
    const hamburger = 'header button[aria-label="Ouvrir le menu"]'
    await page.click(hamburger)
    await page.waitForTimeout(300)
    const panelVisible = await page.evaluate(() => {
      const panel = document.getElementById("mobile-menu")
      return panel ? panel.getBoundingClientRect().height > 0 : false
    })
    panelVisible ? ok("mobile: le menu s'ouvre") : bad("mobile: le menu ne s'ouvre pas")
    const menuLinks = await page.$$("#mobile-menu a")
    menuLinks.length >= 4 ? ok(`mobile: ${menuLinks.length} liens dans le menu`) : bad(`mobile: ${menuLinks.length} liens seulement`)
    await page.keyboard.press("Escape")
    await page.waitForTimeout(300)
    const closed = await page.evaluate(() => {
      const panel = document.getElementById("mobile-menu")
      return panel === null || panel.getBoundingClientRect().height === 0
    })
    closed ? ok("mobile: Échap ferme le menu") : bad("mobile: Échap ne ferme pas le menu")
  }

  // Test interaction FAQ (details)
  if (label.startsWith("desktop")) {
    const first = await page.$("#faq details")
    const openBefore = await first.getAttribute("open")
    await first.click()
    await page.waitForTimeout(300)
    const openAfter = await first.getAttribute("open")
    openBefore === null && openAfter !== null
      ? ok("faq: le details s'ouvre au clic")
      : bad(`faq: état open avant=${openBefore} après=${openAfter}`)
  }

  // Erreurs console
  errors.length === 0 ? ok(`${label}: aucune erreur console`) : bad(`${label}: erreurs console : ${errors.slice(0, 3).join(" | ")}`)

  // Débordement de texte (éléments clés) : scrollWidth > clientWidth = texte coupé
  const clipSelectors = [
    "h1",
    "section#top p",
    "#fonctionnalites article",
    "#tarifs article",
    "#faq summary span",
    "footer nav a",
    "header nav a",
    "button",
  ]
  const clipped = await page.evaluate((sels) => {
    const out = []
    for (const sel of sels) {
      for (const el of document.querySelectorAll(sel)) {
        if (el.scrollWidth > el.clientWidth + 2) {
          out.push(`${sel} → "${(el.textContent || "").trim().slice(0, 40)}" (${el.scrollWidth}>${el.clientWidth})`)
        }
      }
    }
    return out
  }, clipSelectors)
  clipped.length === 0
    ? ok(`${label}: aucun texte coupé`)
    : bad(`${label}: texte coupé : ${clipped.slice(0, 5).join(" | ")}`)

  await page.close()
}

const browser = await chromium.launch()
try {
  await qaViewport(browser, { width: 1440, height: 900 }, "desktop")
  await qaViewport(browser, { width: 390, height: 844 }, "mobile")
  await qaViewport(browser, { width: 1440, height: 900 }, "desktop-dark", "dark")
} finally {
  await browser.close()
}

console.log(results.join("\n"))
const fails = results.filter((r) => r.startsWith("FAIL"))
console.log(fails.length === 0 ? "\nVERDICT: ALL PASS" : `\nVERDICT: ${fails.length} FAIL`)
