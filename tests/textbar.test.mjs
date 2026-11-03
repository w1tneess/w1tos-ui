// Run: node --test tests/
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

// Pull the computed functions out of the SFC script without a Vue compiler
const src = fs.readFileSync(new URL('../src/components/bento/TextBar.vue', import.meta.url), 'utf8')
const script = src.match(/<script>([\s\S]*?)<\/script>/)[1].replace('export default', 'return')
const { computed } = new Function(script)()

function bar(percent, warnAt = 80, cells = 10) {
	const vm = { percent, warnAt, cells }
	vm.pct = computed.pct.call(vm)
	return { pct: vm.pct, filled: computed.filled.call(vm), warn: computed.warn.call(vm) }
}

test('fills cells in proportion', () => assert.deepEqual(bar(61), { pct: 61, filled: 6, warn: false }))
test('warns at the threshold', () => assert.equal(bar(80).warn, true))
test('clamps bad input', () => {
	assert.deepEqual(bar(140), { pct: 100, filled: 10, warn: true })
	assert.equal(bar(-5).filled, 0)
	assert.equal(bar(NaN).pct, 0)
})
