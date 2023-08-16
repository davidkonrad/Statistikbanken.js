/*
	Demo / test for Statistikbanken.js
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

		//!!
		Statistikbanken.data('FOLK1C', {
			'OMRÅDE': ['000', '185', '791', '787'],
			'KØN': '*',
			'Tid': ['2010k2', '(1)']
		}).then(function(result) {
			console.log(result)
		})

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
	}

	const updateCache = function() {
		gebi('cache-hits').textContent = Statistikbanken.cache.hits
		gebi('cache-bytes').textContent = N.format(Statistikbanken.cache.bytes)
	}

	const initCtrls = function() {
		const process = function(name, result) {
			switch (data_format) {
				case 'JSON':
					console.log(result)
					break
				case 'XML':
					console.dirxml(result)
					break
				default:
					console.dir(result)
					break
			}
			gebi('result-' + name).innerText = data_format === 'JSON' ? JSON.stringify(result) : result
			gebi('result-' + name + '-length').innerText = data_format === 'JSON' ? JSON.stringify(result).length : result.toString().length //!?
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
				process('tableinfo', result)
			})
		}
		gebi('btn-run-data').onclick = function() {
			const table_id = 'BEBRIT20'
			const params = { Type: 10, FORMÅL:[10,20], Tid:[2016,2018,2020] }
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


