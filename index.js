const path = require('path');


function loaderNameMatches(rule, loaderName) {
	return rule && rule.loader && typeof rule.loader === 'string' &&
		(rule.loader.indexOf(`${path.sep}${loaderName}${path.sep}`) !== -1 ||
			rule.loader.indexOf(`@${loaderName}${path.sep}`) !== -1);
};

function getLoader(rules, matcher) {
	let loader;

	rules.some(rule => {
		return (loader = matcher(rule)
			? rule
			: getLoader(rule.use || rule.oneOf || (Array.isArray(rule.loader) && rule.loader) || [], matcher));
	});

	return loader;
};


// Function to find a rule with a specific loader
function getRuleByLoader(config, loaderName) {
	return config.module.rules.find((rule) => {
	  // Check if 'use' property includes the loader
	  if (Array.isArray(rule.use)) {
		return rule.use.some((use) =>
		  typeof use === 'string' ? use === loaderName : use.loader === loaderName
		);
	  }
	  if (typeof rule.use === 'string') {
		return rule.use === loaderName;
	  }
	  if (typeof rule.use === 'object' && rule.use.loader) {
		return rule.use.loader === loaderName;
	  }
	  return false;
	});
  }


class SassRuleRewirer {
	constructor() {
		this.loaderOptions = {};
	}

	withLoaderOptions(loaderOptions) {
		this.loaderOptions = loaderOptions;
		return this;
	}

	withRuleOptions(ruleOptions) {
		this.ruleOptions = ruleOptions;
		return this;
	}

	rewire(config) {
		const sassExtension = /(\.scss|\.sass)$/;
		// const fileLoaderRule = getRuleByLoader(config, 'file-loader');

		// if(!fileLoaderRule.exclude) fileLoaderRule.exclude = [];
		// fileLoaderRule.exclude.push(sassExtension);

		const cssRules = getLoader(config.module.rules, rule => String(rule.test) === String(/\.css$/));

		const { use, ...otherRulesOptions } = this.ruleOptions;

		const sassRules = {
			...otherRulesOptions,
			test: sassExtension,
			use: [...cssRules.use, { loader: 'sass-loader', options: this.loaderOptions }].concat(use),
		};

		const oneOfRule = config.module.rules
			.find(rule => rule.oneOf != null);

		if (oneOfRule) {
			oneOfRule.oneOf.unshift(sassRules);
		} else {
			config.module.rules.push(sassRules);
		}

		return config;
	}
}

module.exports = SassRuleRewirer;
