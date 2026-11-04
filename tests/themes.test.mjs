import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { themes, sassKeys, sentinels } = require('../scripts/brand.build.js')

const L = (hex) => {
	const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
	return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const contrast = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }

test('every theme defines every token', () => {
	for (const [id, t] of Object.entries(themes))
		for (const k of [...sassKeys, 'line-glow', 'accent-tint', 'accent-gradient', 'terminal']) assert.ok(t[k], `${id} is missing ${k}`)
})

test('stand-in colours are unique, so the CSS rewrite cannot mix tokens up', () => {
	for (const id of Object.keys(themes)) {
		const values = Object.values(sentinels(id))
		assert.equal(new Set(values).size, values.length, id)
	}
})

test('text and status colours meet WCAG AA in every theme', () => {
	for (const [id, t] of Object.entries(themes)) {
		for (const fg of ['text', 'text-soft', 'muted', 'ok', 'warn', 'err'])
			for (const bg of ['surface', 'raised']) assert.ok(contrast(t[fg], t[bg]) >= 4.5, `${id}: ${fg} on ${bg}`)
		assert.ok(contrast(t.bg, t.accent) >= 4.5, `${id}: text on primary button`)
		assert.ok(contrast(t['line-strong'], t.bg) >= 3, `${id}: input edge`)
	}
})
