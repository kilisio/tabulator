import clear from 'rollup-plugin-clear';
import cleanup from 'rollup-plugin-cleanup';
import copy from 'rollup-plugin-copy';
import resolve from 'rollup-plugin-node-resolve';
import commonJS from 'rollup-plugin-commonjs';
import { terser } from "rollup-plugin-terser";
import replace from 'rollup-plugin-replace';
import generatePackageJson from 'rollup-plugin-generate-package-json';
import * as pkgson from "../../package.json";

export default {
    input: 'src/views.js',
    output: {
        file: 'dist/lib_views/views.js',
        format: 'esm'
    },
    plugins: [
        clear({
            targets: ['dist/lib_views'],
        }),
        replace({
            exclude: 'node_modules/**',
            delimiters: ['.', 'default_layout/'],
            values: {
                assets: '/' + pkgson.name + '/',
            }
        }),
        replace({
            exclude: 'node_modules/**',
            delimiters: ['@', '@'],
            values: {
                package_name: pkgson.name,
                package_version: pkgson.version
            }
        }),
        resolve(),
        commonJS({
              include: 'node_modules/**'
        }),
        cleanup(),
        terser(),
        generatePackageJson({
            outputFolder: 'dist/lib_views',
            baseContents: {
                "name": '@kilisio/' + pkgson.name + '_views',
                "version": pkgson.version,
                "main": "views.js",
                "author": "kilisio ",
                "license": "MIT"
            }
        }),
        copy({
            targets: [
                {
                    src: [
                        'src/views/default_layout/assets',
                        'src/views/shared_assets/assets',
                    ], 
                    dest: 'dist/lib_views/views'
                }
            ]
        })
    ]
};
