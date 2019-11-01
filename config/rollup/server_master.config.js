import clear from 'rollup-plugin-clear';
import cleanup from 'rollup-plugin-cleanup';
import copy from 'rollup-plugin-copy';
import resolve from 'rollup-plugin-node-resolve';
import commonJS from 'rollup-plugin-commonjs';
import { terser } from "rollup-plugin-terser";
import generatePackageJson from 'rollup-plugin-generate-package-json';
import json from 'rollup-plugin-json';
import replace from 'rollup-plugin-replace';
import * as pkgson from "../../package.json";


export default {
    input: 'src/server_master.js',
    output: {
        file: 'dist/server_master/app/server.js',
        format: 'cjs'
    },
    plugins: [
        clear({
            targets: ['dist/server_master'],
        }),
        replace({
            delimiters: ['', ''],
            '#!/usr/bin/env node': ''
        }),
        json({
            include: 'node_modules/**',
        }),
        resolve(),
        commonJS({
            include: 'node_modules/**'
        }),
        cleanup(),
        terser(),
        generatePackageJson({
            outputFolder: 'dist/server_master',
            baseContents: {
                "name": '@kilisio/' + pkgson.name + '_master',
                "version": pkgson.version,
                "author": "kilisio ",
                "dependencies": {
                    "absurd": "0.3.9",
                    "clean-css": "^4.2.1",
                    "express": "^4.17.1",
                    "helmet": "^3.18.0",
                    "cheerio": "^1.0.0-rc.3",
                    "html-minifier": "^4.0.0"
                },
                "scripts": {
                    "start": "node ./app/server.js"
                }
            }
        }),
        copy({
            targets: [
                {
                    src: [
                        'src/views/default_layout/assets'
                    ], 
                    dest: 'dist/server_master/app/views/default_layout'
                },
                {
                    src: [
                        'src/views/shared_assets/assets'
                    ], 
                    dest: 'dist/server_master/app/views/shared_assets'
                },
                {
                    src: [
                        'scripts/openode/Dockerfile',
                        'scripts/openode/docker-compose.yml'
                    ], 
                    dest: 'dist/server_master'
                },
                {
                    src: [
                        'node_modules/@kilisio/under_construction_lib-0.3.23/assets',
                        'node_modules/@kilisio/under_construction_lib-0.3.23/db',
                        'node_modules/@kilisio/under_construction_lib-0.3.23/log',
                    ], 
                    dest: 'dist/server_master/node_modules/@kilisio/under_construction_lib-0.3.23'
                },
            ]
        })
    ]
};

