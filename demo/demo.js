/*
	Playground for Statistikbanken.js
	(c) David Konrad, 2023- present
*/

"use strict";

const Demo = (function(window, document, Statistikbanken) {
	const gebi = (id) => { return document.getElementById(id) }
	const qall = (sel) => { return document.querySelectorAll(sel) }

	const N = Intl.NumberFormat("en", {
		notation: "compact",
		style: "unit",
		unit: "byte",
		unitDisplay: "narrow",
	})

	let data_format = 'JSON'

	const init = function() {
		initSettings()
		initCtrls()
		Statistikbanken.cache.empty()
	}

	const wait = function() {
		if (document.body.classList.contains('wait')) {
			document.body.classList.remove('wait')
		} else {
			document.body.classList.add('wait')
		}
	}

	const getParams = function(form) {
		let result = {}
		gebi(form).querySelectorAll('input').forEach(function(input) {
			if (input.type === 'checkbox') {
				if (input.checked) result[input.name] = true
			}
			if (input.type === 'text') {
				if (input.value.trim() !== '') result[input.name] = input.value.split(',')
			}
			if (input.type === 'number') {
				if (input.value > 0) result[input.name] = input.value
			}
		})
		return result
	}

	const initSettings = function() {
		gebi('checkbox-cache').onclick = function() {
			Statistikbanken.init({ cache: this.checked })
		}
		qall('input[name="radio-language"]').forEach(function(radio) {
			radio.onclick = function() {
				Statistikbanken.init({ language: this.value })
			}
		})
		qall('input[name="radio-data-format"]').forEach(function(radio) {
			radio.onclick = function() {
				data_format = this.value
				Statistikbanken.init({ format: this.value })
			}
		})
		qall('input[name="radio-fetch-method"]').forEach(function(radio) {
			radio.onclick = function() {
				Statistikbanken.init({ method: this.value })
			}
		})
	}

	const initVariables = function(table_info) {
		gebi('btn-run-data').removeAttribute('disabled')
		gebi('data-tableid').value = table_info.id

		const varCnt = gebi('variables-cnt')
		varCnt.innerText = ''

		const getSelect = function(variable) {
			const italic = !variable.elimination ? 'class="italic"' : ''
			const cnt = `<div class="variable-cnt">
				<label ${italic}">${variable.text}</label><br>
				<select multiple size="8" name="${variable.id}"></select>
				</div>
			`
			varCnt.insertAdjacentHTML('beforeend', cnt)
			return varCnt.querySelector(`select[name="${variable.id}"]`)
		}

		const initSelect = function(variable) {
			const select = getSelect(variable)
			variable.values.forEach(function(v) {
				const option = document.createElement('option')
				option.value = v.id
				option.textContent = v.text 
				select.append(option)
			})
		}
				
		table_info.variables.forEach(function(variable) {
			initSelect(variable)
		})
	}

	const updateCache = function() {
		gebi('cache-hits').textContent = Statistikbanken.cache.hits
		gebi('cache-bytes').textContent = N.format(Statistikbanken.cache.bytes)
	}

	const initCtrls = function() {

		const process = function(name, result) {
			let text = undefined
			switch (data_format) {
				case 'JSON':
					console.log(result)
					text = JSON.stringify(result) 
					break 
				case 'XML':
					console.dirxml(result)
					text = new XMLSerializer().serializeToString(result) 
					break
				default:
					console.dir(result)
					text = result
					break
			}
			gebi('result-' + name).innerText = text
			gebi('result-' + name + '-length').innerText = text.length
			updateCache()
			wait()
		}

		gebi('btn-run-subjects').onclick = function() {
			wait()
			Statistikbanken.subjects(getParams('form-subjects')).then(function(result) {
				process('subjects', result)
			})
		}

		gebi('btn-run-tables').onclick = function() {
			wait()
			Statistikbanken.tables(getParams('form-tables')).then(function(result) {
				process('tables', result)
			})
		}

		gebi('btn-run-tableinfo').onclick = function() {
			const table_id = gebi('form-tableinfo').querySelector('input').value
			wait()
			Statistikbanken.tableInfo(table_id).then(function(result) {
				initVariables(result)	
				process('tableinfo', result)
			})
		}

		gebi('btn-run-data').onclick = function() {
			const params = {}
			const table_id = gebi('data-tableid').value

			qall('#variables-cnt select').forEach(function(select) {
				if (select.value) {
					const values = []
					for (const option of select.options) {
						if (option.selected) values.push(option.value)
					}
					params[select.name] = values
				}
			})

			wait()
			Statistikbanken.data(table_id, params).then(function(result) {
				process('data', result)
			})
		}

	}

	return {
		init
	}

})(window, document, Statistikbanken); // eslint-disable-line no-undef

document.addEventListener('DOMContentLoaded', function() {
	Demo.init()
})


