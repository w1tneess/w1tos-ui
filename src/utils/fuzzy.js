// Subsequence match with a score: every query char must appear in order.
// Rewards matches at the start, after a separator, and consecutive runs. Returns -1 for no match.
export function fuzzyScore(query, text) {
	const q = query.toLowerCase().replace(/\s+/g, '')
	const t = text.toLowerCase()
	if (!q) return 0
	let score = 0
	let ti = 0
	let run = 0
	for (const ch of q) {
		const found = t.indexOf(ch, ti)
		if (found === -1) return -1
		const boundary = found === 0 || /[\s\-_/.]/.test(t[found - 1])
		run = found === ti ? run + 1 : 0
		score += 1 + (boundary ? 3 : 0) + run * 2 - Math.min(found - ti, 3) * 0.5
		ti = found + 1
	}
	return score - t.length * 0.01 // shorter labels win ties
}

// Items with a `label`; returns the matching ones, best first. Empty query keeps the original order.
export function fuzzyFilter(query, items) {
	if (!query.trim()) return items
	return items
		.map((item) => ({ item, score: fuzzyScore(query, item.label) }))
		.filter((r) => r.score >= 0)
		.sort((a, b) => b.score - a.score)
		.map((r) => r.item)
}
