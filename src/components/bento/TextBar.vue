<script>
// Meter: label [▮▮▮▮▮▮····] 61%. Drawn in CSS so it never depends on the font having block glyphs.
// Switches to warn + ▲ at the threshold.
export default {
	name: 'TextBar',
	props: {
		label: { type: String, default: '' },
		percent: { type: Number, default: 0 },
		warnAt: { type: Number, default: 80 },
	},
	computed: {
		pct() {
			return Math.min(100, Math.max(0, Math.round(this.percent || 0)))
		},
		warn() {
			return this.pct >= this.warnAt
		},
	},
}
</script>

<template>
	<div :aria-label="`${label} ${pct}%`" :aria-valuenow="pct" aria-valuemax="100" aria-valuemin="0" class="ao-bar" role="meter">
		<span v-if="label" class="ao-bar__lbl">{{ label }}</span>
		<span aria-hidden="true" class="ao-bar__track"><span :class="{ 'is-warn': warn }" :style="{ width: `${pct}%` }" class="ao-bar__fill" /></span>
		<span :class="{ 'ao-warn': warn }" class="ao-bar__pct"><template v-if="warn">▲ </template>{{ pct }}%</span>
		<span class="ao-sub"><slot /></span>
	</div>
</template>
