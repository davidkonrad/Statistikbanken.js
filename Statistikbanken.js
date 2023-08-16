/*
 * (c) David Konrad, 2023- present
 * 
 * Small script to access Statistics Denmark API
 * https://www.dst.dk/en/Statistik/brug-statistikken/muligheder-i-statistikbanken/api
 *
 * Released under the MIT License.
 */

"use strict";

const Statistikbanken = (function() { // eslint-disable-line no-unused-vars

	const Msg = {
		da: {
			ERR_FETCH: 'Der blev returneret en ukendt fejl. Se evt. konsollen for yderligere info',
			ERR_PARAM: 'Ukendt eller forkert udformet parameter',
			ERR_CACHE: 'Fejl ved skrivning til cache. Din localStorage er formentlig fuld (5mb)',
			ERR_NO_DATA: 'Resultatsættet er tomt. Prøv igen eller juster søgningsparametre'
		},
		en: {
			ERR_FETCH: 'An unknown error occured. Look in the console for details',
			ERR_PARAM: 'Unknown or malformed param',
			ERR_CACHE: 'Error on expanding cache. Your localStorage have probably exceeded max (5mb)',
			ERR_NO_DATA: 'Returned result is empty. Try to refine the search'
		}
	}

	const Path = 'https://api.statbank.dk/v1/'

	let cache_hits = 0
	let cache_bytes = 0
	const cache_prefix = 'sb-cache-'

	let use_cache = false
	let language = 'da'
	let data_format = 'JSON'

	const init = function(settings) {
		if (settings && settings.cache) use_cache = settings.cache
		if (settings && settings.language) language = settings.language
		if (settings && settings.format) data_format = settings.format
	}

	const storage = function(key, value) {
		if (!value) return localStorage.getItem(key)
		try {
			localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
			return true
		} catch (err) {
			console.error( Msg[language].ERR_CACHE )
			return false
		}
	}

	const cache = (function() {	
		const getKey = path => { return cache_prefix + path.replace('https', '').replace(/[^a-zA-Z0-9]/g, '') }
		const test = path => { return (getKey(path) in localStorage) }
		const get = path => { return storage(getKey(path)) }
		const set = (path, response) => { return storage(getKey(path), response) }
		return { test, get, set }
	})()

	const emptyCache = function() {
		for (const key in localStorage) {
			if (key.indexOf(cache_prefix) === 0) localStorage.removeItem(key)
		}
	}

	const parseCSV = function(csv) {
		csv = csv.split(/\r?\n|\r|\n/g)
		const props = csv[0].split(';')
		const data = []
		csv.forEach(function(row, idx) {
			if (row && idx > 0) {
				row = row.split(';')
				let obj = {}
				for (let i = 0; i < props.length; i++) {
					obj[props[i]] = row[i]
				}
				data.push(obj)
			}
		})
		if (!data.length) {
			console.log( Msg[language].ERR_NO_DATA )	
			return '' //!
		} else {
			return data
		}
	}

	const get = function(path) {
		const append = function(name, value) {
			path += path.indexOf('?') === -1 ? '?' : '&'
			path += name + '=' + value
		}
		append('lang', language)
		append('format', data_format)

		return new Promise((resolve) => {
			if (cache.test(path)) {
				const data = cache.get(path)
				cache_bytes += data.length
				cache_hits += 1
				switch (data_format) {
					case 'JSON':
						resolve( JSON.parse(data) )
						break
					case 'CSV':
						resolve( parseCSV(data) )
						break
					default:
						resolve( data )
						break
				}
			} else {
				fetch(path, { 
					method: 'GET'
				}).then(function(res) {
					return res.text()
				}).then(function(res) {
					if (use_cache) cache.set(path, res)
					switch (data_format) {
						case 'JSON':
							resolve( JSON.parse(res) )
							break
						case 'CSV':
							resolve( parseCSV(res) )
							break
						default:
							resolve( res )
							break
					}
				})
				.catch(function(error) {
					console.log( Msg[language].ERR_FETCH )
					console.error(error)
					resolve([])
				})
			}
		})
	}

	const objToRequest = function(params) {
		let request = ''
		if (params && typeof params === 'object') {
			for (const param in params) {
				request += request === '' ? '?' : '&'
				switch (typeof params[param]) {
					case 'string': 
						request += param + '=' + params[param]
						break
					case 'object':
						request += param + '=' + params[param].join(',')
						break
					case 'boolean':
					case 'number':
						request += param + '=' + params[param].toString()
						break
					default:
						console.log( Msg[language].ERR_PARAM, param )
						break
				}
			}
		}
		return request
	}					
			
	const subjects = function(params) {
		return get( Path + 'subjects' + objToRequest(params) )
	}

	const tables = function(params) {
		return get( Path + 'tables' + objToRequest(params) )
	}

	const tableInfo = function(table_id) {
		return get( Path + 'tableinfo?id=' + table_id )
	}

	const data = function(table_id, params) {
		return new Promise((resolve) => {
			const old_format = data_format
			data_format = 'CSV'
			get( Path + 'data/' + table_id + '/' + objToRequest(params) ).then(function(result) {
				data_format = old_format
				resolve(result)
			})
		})
	}

	return {
		init,
		subjects,
		tables,
		tableInfo,
		data,
		cache: {
			empty: emptyCache,
			get hits() { return cache_hits },
			get bytes() { return cache_bytes }
		}
	}

})(); 


