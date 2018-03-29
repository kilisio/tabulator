var Clipboard = function(table){
	this.table = table;
	this.selector = false;
	this.selectorParams = {};
	this.formatter = false;
	this.formatterParams = {};

	this.blocked = true; //block copy actions not originating from this command
};

Clipboard.prototype.initialize = function(){
	var self = this;

	this.table.element.on("copy", function(e){
		if(!self.blocked){
			e.preventDefault();

			e.originalEvent.clipboardData.setData('text/plain', self.generateContent());

			self.reset();
		}
	});

	this.table.element.on("paste", function(e){
		self.paste(e);
	})
}

Clipboard.prototype.reset = function(){
	this.blocked = false;
	this.originalSelectionText = "";
}


Clipboard.prototype.paste = function(e){
	var data;

	if(this.checkPaseOrigin(e)){

		data = this.getPasteData(e);

		if(this.parsePasteData(data)){
			e.preventDefault();
		}
	}
}

Clipboard.prototype.checkPaseOrigin = function(e){
	var valid = true;

	if(e.target.tagName != "DIV" || this.table.extensions.edit.currentCell){
		valid = false;
	}

	return valid;
}

Clipboard.prototype.getPasteData = function(e){
	var data = undefined;

	if (window.clipboardData && window.clipboardData.getData) {
		data = window.clipboardData.getData('Text');
	} else if (e.clipboardData && e.clipboardData.getData) {
		data = e.clipboardData.getData('text/plain');
	} else if (e.originalEvent && e.originalEvent.clipboardData.getData) {
		data = e.originalEvent.clipboardData.getData('text/plain');
	}

	return data;
}

Clipboard.prototype.parsePasteData = function(clipboard){
	var data = [],
	success = false,
	headerFindSuccess = true,
	columns = this.table.columnManager.columnsByIndex,
	columnMap = [],
	rows = [];

	//get data from clipboard into array of columns and rows.
	clipboard = clipboard.split("\n");

	clipboard.forEach(function(row){
		data.push(row.split("\t"));
	});

	if(data.length && !(data.length === 1 && data[0].length < 2)){
		success = true;

		//check if headers are present by title
		data[0].forEach(function(value){
			var column = columns.find(function(column){
				return column.definition.title.trim() === value.trim();
			});

			if(column){
				columnMap.push(column);
			}else{
				headerFindSuccess = false;
			}
		});

		//check if column headers are present by field
		if(!headerFindSuccess){
			headerFindSuccess = true;
			columnMap = [];

			data[0].forEach(function(value){
				var column = columns.find(function(column){
					return value.trim() && column.field.trim() === value.trim();
				});

				if(column){
					columnMap.push(column);
				}else{
					headerFindSuccess = false;
				}
			});

			if(!headerFindSuccess){
				columnMap = columns;
			}
		}

		//remove header row if found
		if(headerFindSuccess){
			data.shift();
		}

		data.forEach(function(item){
			var row = {};

			item.forEach(function(value, i){
				if(columnMap[i]){
					row[columnMap[i].field] = value;
				}
			});

			rows.push(row);
		});

		switch(this.table.options.clipboardPasteMode){
			case "replace":
			this.table.setData(rows);
			break;

			case "update":
			this.table.updateOrAddData(rows);
			break;

			case "insert":
			this.table.addData(rows);
			break;
		}

	}

	return success;
}


Clipboard.prototype.copy = function(selector, selectorParams, formatter, formatterParams, internal){
	var range, sel;
	this.blocked = false;

	if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
		range = document.createRange();
		range.selectNodeContents(this.table.element[0]);
		sel = window.getSelection();

		if(sel.toString() && internal){
			selector = "userSelection";
			formatter = "raw";
			this.selectorParams = sel.toString();
		}

		sel.removeAllRanges();
		sel.addRange(range);
	} else if (typeof document.selection != "undefined" && typeof document.body.createTextRange != "undefined") {
		textRange = document.body.createTextRange();
		textRange.moveToElementText(this.table.element[0]);
		textRange.select();
	}

	this.setSelector(selector);
	this.selectorParams = typeof selectorParams != "undefined" && selectorParams != null ? selectorParams : {};
	this.setFormatter(formatter);
	this.formatterParams = typeof formatterParams != "undefined" && formatterParams != null ? formatterParams : {};

	document.execCommand('copy');

	if(sel){
		sel.removeAllRanges();
	}
}

Clipboard.prototype.setSelector = function(selector){

	selector = selector || this.table.options.clipboardSelector;

	switch(typeof selector){
		case "string":
		if(this.selectors[selector]){
			this.selector = this.selectors[selector];
		}else{
			console.warn("Clipboard Error - No such selector found:", selector)
		}
		break;

		case "function":
		this.selector = selector
		break;
	}
}

Clipboard.prototype.setFormatter = function(formatter){

	formatter = formatter || this.table.options.clipboardFormatter;

	switch(typeof formatter){
		case "string":
		if(this.formatters[formatter]){
			this.formatter = this.formatters[formatter];
		}else{
			console.warn("Clipboard Error - No such formatter found:", formatter)
		}
		break;

		case "function":
		this.formatter = formatter
		break;
	}
}


Clipboard.prototype.generateContent = function(){
	var data = this.selector.call(this, this.selectorParams);
	return this.formatter.call(this, data, this.formatterParams);
}

Clipboard.prototype.rowsToData = function(rows, params){
	var columns = this.table.columnManager.columnsByIndex,
	headers = [],
	data = [];

	if(params){
		columns.forEach(function(column){
			headers.push(column.definition.title);
		});

		data.push(headers);
	}

	rows.forEach(function(row){
		var rowArray = [],
		rowData = row.getData();

		columns.forEach(function(column){
			var value = column.getFieldValue(rowData);
			rowArray.push(value);
		});

		data.push(rowArray);
	});

	return data;
}


Clipboard.prototype.selectors = {
	userSelection: function(params){
		return params;
	},
	selected: function(params){
		var rows = [];

		if(this.table.extExists("selectRow", true)){
			rows = this.table.extensions.selectRow.getSelectedRows();
		}

		return this.rowsToData(rows, params);
	},
	table: function(params){
		return this.rowsToData(this.table.rowManager.getComponents(), params);
	},
	active: function(params){
		return this.rowsToData(this.table.rowManager.getComponents(true), params);
	},
}

Clipboard.prototype.formatters = {
	raw: function(data, params){
		return data;
	},
	table: function(data, params){
		var output = [];

		data.forEach(function(row){
			row.forEach(function(value){
				if(typeof value == "undefined"){
					value = ""
				}

				value = typeof value == "undefined" ? "" : value.toString();

				if(value.match(/\r|\n/)){
					value = value.split('"').join('""');
					value = '"' + value + '"';
				}
			});

			output.push(row.join("\t"));
		});

		return output.join("\n");
	}
}


Tabulator.registerExtension("clipboard", Clipboard);