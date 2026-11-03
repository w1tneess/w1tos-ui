import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fuzzyScore, fuzzyFilter } from '../src/utils/fuzzy.js'

const items = ['open jellyfin', 'open immich', 'go files', 'go app store', 'restart', 'shut down'].map((label) => ({ label }))
const labels = (q) => fuzzyFilter(q, items).map((i) => i.label)

test('no match returns -1', () => assert.equal(fuzzyScore('xyz', 'open jellyfin'), -1))
test('subsequence matches', () => assert.ok(fuzzyScore('jlf', 'open jellyfin') > 0))
test('word starts beat mid-word hits', () => assert.equal(labels('files')[0], 'go files'))
test('abbreviation finds the app store', () => assert.equal(labels('as')[0], 'go app store'))
test('empty query keeps order', () => assert.deepEqual(labels(''), items.map((i) => i.label)))
test('spaces in the query are ignored', () => assert.equal(labels('shut d')[0], 'shut down'))
