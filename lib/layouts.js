
var cli = require('cli-color');

var DEFAULT_PATTERN = '%yyyy-%MM-%dd%T%HH:%mm:%ss %levelc %loggerc %msg %argsc (%linec)%nstack';

/**
 * Format layouts
 */
function createLayout(layoutConfig, globalConfig) {

	layoutConfig = layoutConfig || {};

	layoutConfig.pattern = layoutConfig.pattern ||
		globalConfig.pattern ||
		DEFAULT_PATTERN;

	return patternLayout(layoutConfig, globalConfig);

}

/**
 * Create pattern layout from string format
 */
function patternLayout(layoutConfig, globalConfig) {

	var pattern = layoutConfig.pattern;
	var levels = globalConfig.levels;
	var colors = globalConfig.colors;

	var formatters = {
		yyyy: function(level, now) {
			return now.getFullYear();
		},
		MM: function(level, now) {
			return padZero(now.getMonth()+1, 2);
		},
		dd: function(level, now) {
			return padZero(now.getDate(), 2);
		},
		T: function() {
			return 'T';
		},
		HH: function(level, now) {
			return padZero(now.getHours(), 2);
		},
		hh: function(level, now) {
			return padZero(now.getHours()%12, 2);
		},
		mm: function(level, now) {
			return padZero(now.getMinutes(), 2);
		},
		ss: function(level, now) {
			return padZero(now.getSeconds(), 2);
		},
		level: function(level) {
			return levels[level];
		},
		levelc: function(level) {
			return colors[level](levels[level]);
		},
		msg: function(level, now, msg) {
			return msg;
		},
		logger: function() {
			var logger = this;
			return logger.name;
		},
		loggerc: function() {
			var logger = this;
			return cli.blue(logger.name);
		},
		args: function(level, now, msg, args) {
			return join(args);
		},
		argsc: function(level, now, msg, args) {
			return cli.magenta(join(args));
		},
		line: function() {
			var stack = new Error().stack;
			if (stack) {
				stack = stack.split('\n')[5];
				if (stack && stack.match(/\/([^\/]+?[0-9:]+)/)) {
					return RegExp.$1;
				}
			}
			return 'unknown';
		},
		linec: function() {
			var stack = new Error().stack;
			if (stack) {
				stack = stack.split('\n')[5];
				if (stack && stack.match(/\/([^\/]+?[0-9:]+)/)) {
					return cli.blackBright(RegExp.$1);
				}
			}
			return cli.blackBright('unknown');
		},
		error: function(level, now, msg, args) {
			if (msg.stack) {
				return msg.message;
			}
			for (var i = 0; i < args.length; i++) {
				if (args[i].stack) {
					return args[i].message;
				}
			}
			return '';
		},
		stack: function(level, now, msg, args) {
			if (msg.stack) {
				return msg.stack;
			}
			for (var i = 0; i < args.length; i++) {
				if (args[i].stack) {
					return args[i].stack;
				}
			}
			return '';
		},
		nstack: function(level, now, msg, args) {
			if (msg.stack) {
				return '\n'+msg.stack;
			}
			for (var i = 0; i < args.length; i++) {
				if (args[i].stack) {
					return '\n' + args[i].stack;
				}
			}
			return '';
		},
		n: function n() {
			return '\n';
		}
	};
	for (var name in formatters) {
		formatters[name]._name = name;
	}

	var list = [];
	var curr = 0;

	pattern.replace(/%([a-zA-Z]+)/g, function(text, match, offset, whole) {
		if (offset > curr) {
			list.push(whole.substring(curr, offset));
		}
		var format = formatters[match];
		if (format) {
			list.push(format);
		} else {
			list.push(text);
		}
		curr = offset + text.length;
	});
	if (curr < pattern.length) {
		list.push(pattern.substring(curr));
	}

	if (layoutConfig.object) {
		// for worker
		return function() {
			var args = arguments;
			var obj = {};
			for (var i = 0; i < list.length; i++) {
				var item = list[i];
				if (item._name) {
					obj[item._name] = item.apply(this, args);
				}
			}
			return obj;
		};
	} else {
		// for master
		return function() {
			var args = arguments;
			if (args.length === 4) {
				var obj = args[2];
				if (obj && obj.type === '_PROTEUS_LOG_') {
					var data = obj.data;
					var line = pattern;
					for (var name in data) {
						line = line.replace('%'+name, data[name]);
					}
					return line;
				}
			}

			// parse and composite log text
			var text = '';
			for (var i = 0; i < list.length; i++) {
				var item = list[i];
				if (typeof item === 'function') {
					text += item.apply(this, args);
				} else {
					if (item) {
						text += item;
					}
				}
			}
			return text;
		};
	}
}

function padZero(number, length) {
	var text = String(number);
	while (text.length < length) {
		text = '0' + text;
	}
	return text;
}

function join(args, delimiter) {
	var line = '';
	delimiter = delimiter || ' ';
	for (var i = 0; i < args.length; i++) {
		if (i > 0) {
			line += delimiter;
		}
		var arg = args[i];
		line += convert(arg);
	}
	return line;
}

function convert(object) {
	var type = typeof object;
	if (type === 'string') {
		return object;
	} else if (type === 'number') {
		return String(object);
	} else if (type === 'function') {
		// recursively returns object
		return convert(object());
	} else {
		if (object instanceof Error) {
			// skip error (use %error to print error message)
			return '';
		} else {
			// stringify
			if (object) {
				var line = '';
				for (var name in object) {
					if (line.length > 0) {
						line += ' ';
					}
					var value = object[name];
					line += name + '='  + JSON.stringify(value);
				}
				return line;
			}
		}
	}
}

module.exports = createLayout;

createLayout.defaultPattern = DEFAULT_PATTERN;