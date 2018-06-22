import resolve from 'rollup-plugin-node-resolve';
import cjs from 'rollup-plugin-commonjs';

export default {
	input: './src/index.js',
	output: [{
		file: './dist/index.esm.js',
		format: 'es'
	}, {
		file: './dist/index.js',
		format: 'cjs'		
	}],
	plugins: [
		resolve({module: true, jsnext: true}),
		cjs(),
	]
};
