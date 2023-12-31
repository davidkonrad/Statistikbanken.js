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

	let fetch_method = 'POST'
	let use_cache = false
	let language = 'da'
	let data_format = 'JSON'

	const init = function(settings) {
		if (settings && settings.cache) use_cache = settings.cache
		if (settings && settings.language) language = settings.language
		if (settings && settings.method) fetch_method = settings.method
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

	const CSV = {
		parse: function(csv) {
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
	}

	const XML = {
		parse: function(xml) {
			return new DOMParser().parseFromString(xml, 'application/xml')
		}
	}

	const process = function(data) {
		switch (data_format) {
			case 'JSON':
				return JSON.parse(data)
				break	// eslint-disable-line no-unreachable
			case 'CSV':
				return CSV.parse(data)
				break	// eslint-disable-line no-unreachable
			case 'XML':
				return XML.parse(data) 
				break	// eslint-disable-line no-unreachable
			default:
				return data
				break	// eslint-disable-line no-unreachable
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
			if (use_cache && cache.test(path)) {
				const data = cache.get(path)
				cache_bytes += data.length
				cache_hits += 1
				resolve(process(data))
			} else {
				fetch(path, { 
					method: 'GET'
				}).then(function(res) {
					return res.text()
				}).then(function(res) {
					if (use_cache) cache.set(path, res)
					resolve(process(res))
				})
				.catch(function(error) {
					console.log( Msg[language].ERR_FETCH )
					console.error(error)
					resolve([])
				})
			}
		})
	}

	const post = function(path, params) {
		params['lang'] = language
		params['format'] = data_format
		console.log(path, params)
		return new Promise((resolve) => {
			const body = JSON.stringify(params)
			const cp = path + body.replace(/[^a-zA-Z0-9]/g, '')
			if (use_cache && cache.test(cp)) {
				const data = cache.get(cp)
				cache_bytes += data.length
				cache_hits += 1
				resolve(process(data))
			} else {
				fetch(path, { 
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					},
					method: 'POST',
					body: body
				}).then(function(res) {
					return res.text()
				}).then(function(res) {
					if (use_cache) cache.set(cp, res)
					resolve(process(res))
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
		if (fetch_method === 'GET') {
			let path = Path + 'subjects'
			if (params && params.subjects) {
				path += '/' + params.subjects.join(',')
				delete params.subjects
			}
			return get( path + objToRequest(params) )
		} else {
			return post( Path + 'subjects', params )
		}
	}

	const tables = function(params) {
		if (fetch_method === 'GET') {
			return get( Path + 'tables' + objToRequest(params) )
		} else {
			return post( Path + 'tables', params )
		}
	}

	const tableInfo = function(table_id) {
		if (fetch_method === 'GET') {
			return get( Path + 'tableinfo?id=' + table_id )
		} else {
			return post( Path + 'tableinfo', { table: table_id })
		}
	}

	const data = function(table_id, params) {
		return new Promise((resolve) => {
			const old_format = data_format
			data_format = 'CSV' //!!
			if (fetch_method === 'GET') {
				get( Path + 'data/' + table_id + '/' + objToRequest(params) ).then(function(result) {
					data_format = old_format
					resolve(result)
				})
			} else {
				let pp = { variables: [] }
				for (const p in params) {
					pp.variables.push({ code: p, values: params[p] })
				}
				pp.table = table_id
				post( Path + 'data', pp).then(function(result) {
					data_format = old_format
					resolve(result)
				})
			}
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


