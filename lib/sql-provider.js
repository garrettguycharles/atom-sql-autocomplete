'use babel';

// data source is an array of objects
import suggestions from '../data/sql';

class Schema {
	constructor() {
		this.name = "";
		this.properties = [];
	}
}

class SqlProvider {
	constructor() {
		// offer suggestions only when editing plain text or HTML files
		this.selector = '.text.plain, .text.html.basic, .sql';


		this.schemaText = "";
		this.schema = [];
		this.aliases = {};
	}

	getSuggestions(options) {
		const { prefix } = options;
		const bufferText = options.editor.buffer.getText();
		const bufferPosition = options.bufferPosition;

		this.updateSchema(bufferText);
		this.updateAliases(bufferText);

		return this.findMatchingSuggestions(bufferText, bufferPosition);
	}

	getLastToken(bufferText, cursorLocation) {

		let col = cursorLocation.column;
		let row = cursorLocation.row;

		let lines = bufferText.split(/\r?\n/).slice(0, row + 1);
		let line = lines[lines.length - 1].substring(0, col);

		const tokens = line.split(/\s+/);

		if (tokens.length) {
			for (let i = tokens.length - 1; i >= 0; i--) {
				if (tokens[i].length) {
					return tokens[tokens.length - 1];
				}
			}
		}

		return "";
	}

	updateAliases(bufferText) {
		this.aliases = {};
		let lowerText = bufferText.toLowerCase();
		let startIndex = lowerText.indexOf("from");

		if (startIndex < 0) {
			return;
		}

		let endIndex = lowerText.indexOf("where");

		if (endIndex < 0) {
			endIndex = lowerText.length;
		}

		let searchText = bufferText.substring(startIndex, endIndex);


		searchText = searchText.replace(/from/ig, 'from');
		searchText = searchText.replace(/join/ig, 'join');
		searchText = searchText.replace(/on/ig, 'on');

		let fragments = [];

		if (searchText.indexOf('join') > -1) {
			let toAdd = searchText.substring(4, searchText.indexOf('join'));
			fragments.push(toAdd);

			searchText = searchText.substring(searchText.indexOf('join'));
		}

		while (searchText.indexOf('join') > -1 && searchText.indexOf('on') > -1) {
			fragments.push(searchText.substring(searchText.indexOf('join') + 'join'.length, searchText.indexOf('on')));
			searchText = searchText.substring(searchText.indexOf('on') + 'on'.length);
		}

		// console.log(fragments);

		for (const f of fragments) {
			let split_f = f.split(/\s+/).filter(x => x.length > 0);

			if (split_f.length == 2) {
				this.aliases[split_f[1]] = split_f[0];
			}
		}

		// console.log(this.aliases);
	}

	updateSchema(bufferText) {
		const schemaText = this.getSchemaText(bufferText);

		if (schemaText != this.schemaText) {
			this.schema = this.getSchema(schemaText);
		}
	}

	getSchemaText(bufferText) {
		const openTag = '<schema>';
		const closeTag = '</schema>';

		let startIndex = bufferText.indexOf(openTag) + openTag.length;
		let endIndex = bufferText.indexOf(closeTag);

		const toReturn = bufferText.substring(startIndex, endIndex);
		// console.log(toReturn);

		return toReturn;
	}

	getSchema(schemaText) {

		function isAlphaNum(ch) {
			return /^[A-Z0-9]$/i.test(ch);
		}

		const schemaToReturn = [];
		const STATES = {
			name: "name",
			prop: "prop"
		}

		let state = STATES.name;
		let currentSchema = new Schema();

		for (let i = 0; i < schemaText.length; i++) {
			let currentChar = schemaText[i];
			if (i % 10 == 0) {
				// console.log(state + " " + currentChar + " " + JSON.stringify(currentSchema));
			}

			if (state == STATES.name) {
				if (isAlphaNum(currentChar)) {
					currentSchema.name += currentChar;
				}

				if (currentChar == '(') {
					state = STATES.prop;
					currentSchema.properties.push("");
				}
			} else if (state == STATES.prop) {
				if (isAlphaNum(currentChar)) {
					currentSchema.properties[currentSchema.properties.length - 1] =
						currentSchema.properties[currentSchema.properties.length - 1] +	currentChar;
				}

				if (currentChar == ",") {
					currentSchema.properties.push("");
				}

				if (currentChar == ")") {
					schemaToReturn.push(currentSchema);
					currentSchema = new Schema();
					state = STATES.name;
				}
			}
		}

		return schemaToReturn;
	}

	findMatchingSuggestions(bufferText, bufferPosition) {

		let prefix = [this.getLastToken(bufferText, bufferPosition)];

		if (prefix[0].indexOf('.') > -1) {
			prefix = prefix[0].split('.');
		}

		// console.log(prefix);

		// find type to search for suggestions
		let applicable = [];

		if (prefix.length == 1) {

		}

		if (prefix.length == 2) {
			if (this.aliases.hasOwnProperty(prefix[0])) {
				let tpe = this.aliases[prefix[0]];
				applicable.push(this.schema.filter(x => x.name == tpe)[0]);
			}
		}

		// console.log("Applicable: " + JSON.stringify(applicable));

		// filter list of suggestions to those matching the prefix, case insensitive
		let prefixLower = prefix[prefix.length - 1].toLowerCase();
		let matchingSuggestions = suggestions.filter((suggestion) => {
			let textLower = suggestion.text.toLowerCase();
			return textLower.startsWith(prefixLower);
		});

		for (const schema of applicable) {
			for (const prop of schema.properties) {
				if (prop.toLowerCase().startsWith(prefixLower)) {
					matchingSuggestions.push({
							text: prop,
							description: `${schema.name}.${prop}`,
							context: schema.name
					});
				}
			}
		}

		// console.log(matchingSuggestions);

		// run each matching suggestion through inflateSuggestion() and return
		return matchingSuggestions.map(this.inflateSuggestion);
	}

	// clones a suggestion object to a new object with some shared additions
	// cloning also fixes an issue where selecting a suggestion won't insert it
	inflateSuggestion(suggestion) {
		return {
			text: suggestion.text,
			description: suggestion.description,
			type: 'value',
			rightLabel: suggestion.context || 'SqlSuggestion'
		};
	}
}
export default new SqlProvider();
