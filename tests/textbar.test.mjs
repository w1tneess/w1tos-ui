// Run: pnpm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

// Pull the computed functions out of the SFC script without a Vue compiler
const src = fs.readFileSync(new URL('../src/components/bento/TextBar.vue', import.meta.url), 'utf8')
const script = src.match(/<script>([\s\S]*?)<\/script>/)[1].replace('export default', 'return')
const { computed } = new Function(script)()

function bar(percent, warnAt = 80) {
	const vm = { percent, warnAt }
	vm.pct = computed.pct.call(vm)
	return { pct: vm.pct, warn: computed.warn.call(vm) }
}

test('rounds the percentage', () => assert.deepEqual(bar(61.4), { pct: 61, warn: false }))
test('warns at the threshold', () => assert.equal(bar(80).warn, true))
test('clamps bad input', () => {
	assert.deepEqual(bar(140), { pct: 100, warn: true })
	assert.equal(bar(-5).pct, 0)
	assert.equal(bar(NaN).pct, 0)
})
