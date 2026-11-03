<template>
	<div id="login-page" class="ao-prompt">
		<form class="ao-prompt__form" aria-label="Sign in" novalidate @submit.prevent="login">
			<div class="ao-prompt__wordmark">{{ brand.wordmark }}<span class="ao-cursor" aria-hidden="true"></span></div>
			<label class="ao-prompt__row">
				<span>{{ brand.host }} login:</span>
				<input ref="username" v-model="username" autocapitalize="off" autocomplete="username" spellcheck="false" type="text">
			</label>
			<label class="ao-prompt__row">
				<span>password:</span>
				<input ref="password" v-model="password" autocomplete="current-password" type="password">
			</label>
			<p v-if="message" class="ao-prompt__err" role="alert">✕ {{ message }}</p>
			<button :disabled="busy" class="ao-prompt__submit" type="submit">↵ {{ busy ? 'signing in…' : 'login' }}</button>
		</form>
	</div>
</template>

<script>
import brand from '@/config/brand.config'

export default {
	name: "login-page",
	data() {
		return {
			brand,
			username: '',
			password: '',
			message: '',
			busy: false,
		}
	},
	beforeMount() {
		let userString = localStorage.getItem('user')
		if (userString) {
			this.username = JSON.parse(userString).username || '';
		}
	},
	mounted() {
		document.querySelector('.modal.is-active ')?.remove();
		(this.username ? this.$refs.password : this.$refs.username).focus();
	},

	methods: {
		async login() {
			if (!this.username || !this.password) {
				this.message = this.$t('Username and password are required');
				return;
			}
			this.busy = true;
			this.message = '';
			try {
				const userRes = await this.$api.users.login(this.username, this.password)
				localStorage.setItem("access_token", userRes.data.data.token.access_token);
				localStorage.setItem("refresh_token", userRes.data.data.token.refresh_token);
				localStorage.setItem("expires_at", userRes.data.data.token.expires_at);
				localStorage.setItem("user", JSON.stringify(userRes.data.data.user));

				this.$store.commit("SET_USER", userRes.data.data.user);
				this.$store.commit("SET_ACCESS_TOKEN", userRes.data.data.token.access_token);
				this.$store.commit("SET_REFRESH_TOKEN", userRes.data.data.token.refresh_token);

				const versionRes = await this.$api.sys.getVersion();
				if (versionRes.data.success == 200) {
					localStorage.setItem("version", versionRes.data.data.current_version);
				}
				this.$router.push("/");
			} catch (err) {
				this.message = this.$t(err.response?.data?.message || 'Login failed');
				this.password = '';
				this.$refs.password.focus();
			} finally {
				this.busy = false;
			}
		}
	}
}
</script>
