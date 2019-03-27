import { useEffect } from 'react'

export const useAsyncEffect = (create, inputs) => useEffect(() => {
	const finalizers = []
	const Finally = finalizer => {
		if (!running) throw new Error('Effect is already done')
		finalizers.push(finalizer)
	}
	const iterator = create(Finally)
	let running = true

	function callIterator(method, data) {
		var value = undefined
		var done = true
		try {
			var { value, done } = iterator[method](data)
			if (!done) Promise.resolve(value).then(next, Throw)
		} finally {
			if (done) {
				running = false
				if (value !== undefined) finalizers.push(value)
			}
		}
	}

	function next(data) { if (running) callIterator('next', data) }
	function Throw(data) { if (running) callIterator('throw', data) }

	next(undefined)

	return () => {
		if (running) {
			running = false
			finalizers.push(() => callIterator('return', undefined))
		}

		function finalize() {
			try {
				while (finalizers.length > 0) finalizers.pop()()
			} finally {
				if (finalizers.length > 0) finalize()
			}
		}

		if (finalizers.length > 0) finalize()
	}
}, inputs)
