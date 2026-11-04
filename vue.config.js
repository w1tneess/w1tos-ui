const webpack = require("webpack");
const path = require("path");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const dotenv = require("dotenv");
const isProd = process.env.NODE_ENV === "production";
const TerserPlugin = require("terser-webpack-plugin");

// Only NODE_ENV and VUE_APP_* may reach the bundle; the whole env includes tokens and paths.
const pub = Object.fromEntries(
	Object.entries(process.env).filter(([k]) => k === "NODE_ENV" || k.startsWith("VUE_APP_"))
);
pub.BASE_URL = "/"; // the router reads process.env.BASE_URL, which this define replaces

const target = `http://${process.env.VUE_APP_DEV_IP}:${process.env.VUE_APP_DEV_PORT}`;

// Runtime themes: Bulma bakes colours in at compile time, so the Sass palette uses unique "sentinel" hexes
// (scripts/brand.build.js) and this PostCSS step rewrites each one to its live var(--token).
const { sentinels } = require("./scripts/brand.build.js");
const sentinelToToken = Object.fromEntries(
	Object.entries(sentinels(require("./src/config/brand.config.js").theme)).map(([token, hex]) => [hex.toLowerCase(), token])
);
const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(",");
const rgbToToken = Object.fromEntries(Object.entries(sentinelToToken).map(([hex, token]) => [hexToRgb(hex), token]));
const themeTokens = {
	postcssPlugin: "w1tos-theme-tokens",
	Declaration(decl) {
		if (decl.prop.startsWith("--")) return; // the token definitions themselves
		const value = decl.value
			.replace(/#[0-9a-f]{6}\b/gi, (hex) => (sentinelToToken[hex.toLowerCase()] ? `var(--${sentinelToToken[hex.toLowerCase()]})` : hex))
			.replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/gi, (m, r, g, b, a) => {
				const token = rgbToToken[`${r},${g},${b}`];
				if (!token) return m;
				return a === undefined || Number(a) >= 1 ? `var(--${token})` : `color-mix(in srgb, var(--${token}) ${Math.round(a * 100)}%, transparent)`;
			});
		if (value !== decl.value) decl.value = value;
	},
};
const autoprefixer = require(require.resolve("autoprefixer", { paths: [path.dirname(require.resolve("@vue/cli-service/package.json"))] }));

module.exports = {
	publicPath: "/",
	runtimeCompiler: true,
	lintOnSave: false,
	productionSourceMap: false,
	pluginOptions: {},
	css: {
		loaderOptions: {
			// Supplying postcss options turns off Vue CLI's default autoprefixer, so it is listed here too
			postcss: { postcssOptions: { plugins: [themeTokens, autoprefixer] } },
			sass: {
				sassOptions: {
					includePaths: ["./node_modules", "./src/assets"],
				},
			},
		},
	},

	chainWebpack: (config) => {
		config.module
			.rule("mjs")
			.test(/\.mjs$/)
			.type("javascript/auto")
			.include.add(/node_modules/)
			.end();
		const oneOfsMap = config.module.rule("scss").oneOfs.store;
		oneOfsMap.forEach((item) => {
			item.use("style-resources-loader")
				.loader("style-resources-loader")
				.options({
					patterns: ["./src/assets/scss/common/_brand.generated.scss", "./src/assets/scss/common/_variables.scss", "./src/assets/scss/common/_color.scss"],
				})
				.end();
		});
		config.plugin("ignore").use(
			new webpack.IgnorePlugin({
				resourceRegExp: /^\.\/locale$/, // 这是一个示例，忽略所有 locale 文件
				contextRegExp: /moment$/, // 这是一个示例，只在 moment 库中忽略
			})
		);

		config.plugin("define").use(require("webpack/lib/DefinePlugin"), [
			{
				"process.env": JSON.stringify(pub),
				BUILT_TIME: JSON.stringify(Date()),
			},
		]);
		// 添加 NodePolyfillPlugin wbepack5 专用插件
		config.plugin("node-polyfill").use(NodePolyfillPlugin);

		// Production only
		if (isProd) {
			config.output.filename("[name].[contenthash:8].js").end();
			config.output.chunkFilename("[name].[contenthash:8].js").end();
			config.optimization.minimize(true);
			config.optimization.splitChunks({
				chunks: "all",
			});

			config.optimization
				.minimizer("css")
				.use(require("css-minimizer-webpack-plugin"), [
					{ minimizerOptions: { preset: ["default", { discardComments: { removeAll: true } }] } },
				]);
		} else if (process.env.ANALYZE) {
			config.plugin('webpack-bundle-analyzer')
				.use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin)
		}
	},
	devServer: {
		open: true,
		port: 8080,
		hot: true,
		proxy: {
			"/v1": {
				target,
				changeOrigin: true,
				ws: true,
			},
			"/v2": {
				target,
				changeOrigin: true,
				ws: true,
			},
		},
	},
};
