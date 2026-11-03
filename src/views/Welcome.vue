<template>
	<div id="login-page" class="ao-prompt">
		<form class="ao-prompt__form" aria-label="Create account" novalidate @submit.prevent="next">
			<div class="ao-prompt__wordmark">{{ brand.wordmark }}<span class="ao-cursor" aria-hidden="true"></span></div>
			<p class="ao-prompt__step">first run · step {{ step }}/3</p>

			<label class="ao-prompt__row">
				<span>user:</span>
				<input ref="username" v-model="username" :disabled="step !== 1" autocapitalize="off" autocomplete="username"
					   spellcheck="false" type="text">
			</label>

			<template v-if="step >= 2">
				<label class="ao-prompt__row">
					<span>password:</span>
					<input ref="password" v-model="password" :disabled="step !== 2" autocomplete="new-password" type="password">
				</label>
				<label class="ao-prompt__row">
					<span>again:</span>
					<input v-model="confirmation" :disabled="step !== 2" autocomplete="new-password" type="password">
				</label>
			</template>

			<p v-if="step === 3" class="ao-prompt__ok" role="status">● account created · signing in…</p>
			<p v-if="message" class="ao-prompt__err" role="alert">✕ {{ message }}</p>
			<button v-if="step < 3" :disabled="busy" class="ao-prompt__submit" type="submit">
				↵ {{ step === 1 ? 'next' : 'create account' }}
			</button>
		</form>
	</div>
</template>

<script>
import brand from '@/config/brand.config'

export default {
	name: "welcome-page",
	data() {
		return {
			brand,
			step: 1,
			username: '',
			password: '',
			confirmation: '',
			message: '',
			busy: false,
		}
	},

	mounted() {
		this.$refs.username.focus();
	},

	methods: {
		next() {
			this.message = '';
			if (this.step === 1) {
				if (!this.username.trim()) {
					this.message = 'enter a username';
					return;
				}
				this.step = 2;
				this.$nextTick(() => this.$refs.password.focus());
				return;
			}
			if (this.password.length < 5) {
				this.message = 'password must be at least 5 characters';
				return;
			}
			if (this.password !== this.confirmation) {
				this.message = 'passwords do not match';
				return;
			}
			this.register();
		},

		/**
		 * @description: register, then sign in with the new account
		 * @return {*}
		 */
		async register() {
			this.busy = true;
			const initKey = this.$store.state.initKey;
			try {
				const res = await this.$api.users.register(this.username, this.password, initKey)
				if (res.data.success != 200) {
					this.message = res.data.message || 'could not create the account';
					return;
				}
				this.step = 3;
				const isLogin = await this.login().catch(() => false);
				if (isLogin) {
					// First login set default app order
					this.$api.users.setCustomStorage("app_order", {data: ["App Store", "Files"]})
				}
				this.$router.push(isLogin ? "/" : "/login");
			} catch (err) {
				this.message = err.response?.data?.message || 'could not create the account';
			} finally {
				this.busy = false;
			}
		},

		/**
		 * @description: login
		 * @return {boolean} whether login succeeded
		 */
		async login() {
			const userRes = await this.$api.users.login(this.username, this.password)
			if (userRes.data.success != 200) {
				return false;
			}
			localStorage.setItem("access_token", userRes.data.data.token.access_token);
			localStorage.setItem("refresh_token", userRes.data.data.token.refresh_token);
			localStorage.setItem("expires_at", userRes.data.data.token.expires_at);
			localStorage.setItem("user", JSON.stringify(userRes.data.data.user));

			this.$store.commit("SET_NEED_INITIALIZATION", false);
			this.$store.commit("SET_INIT_KEY", "");
			this.$store.commit("SET_USER", userRes.data.data.user);
			this.$store.commit("SET_ACCESS_TOKEN", userRes.data.data.token.access_token);
			this.$store.commit("SET_REFRESH_TOKEN", userRes.data.data.token.refresh_token);

			const versionRes = await this.$api.sys.getVersion();
			if (versionRes.data.success == 200) {
				localStorage.setItem("version", versionRes.data.data.current_version);
			}
			sessionStorage.setItem("fromWelcome", true);
			return true;
		},
	}
}
</script>
