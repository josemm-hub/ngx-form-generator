#! /usr/bin/env node

/**
 * @license
 * Licensed under the MIT License, (“the License”); you may not use this
 * file except in compliance with the License.
 *
 * Copyright (c) 2020 Verizon
 */

import { saveFile } from './file-utils';
import { makeForm, makeFileName, loadSpec } from './generator-lib';
import { join } from 'node:path';
const yargs = require('yargs');

async function main(): Promise<void> {
  const argv = yargs
    .option('input-spec', {
      alias: ['i', 'swaggerUrl'],
      description: 'Location of the OpenAPI spec as a URL or file path',
      type: 'string',
      require: true,
    })
    .option('output', {
      alias: ['o', 'outDir'],
      description: 'Where to write the generated files',
      type: 'string',
    })
    .option('file-name', {
      alias: ['f', 'outFile'],
      description: 'Generated file name',
      type: 'string',
    })
    .option('max-depth', {
      alias: ['d', 'maxDepth'],
      description: 'Maximum depth of the generated forms',
      type: 'number',
    })
    .help()
    .wrap(null)
    .usage('Generates Angular ReactiveForms from an OpenAPI v2 or v3 spec.\n\n Usage: $0 -i <spec> -o <path>')
    .example('ngx-form-generator -i https://petstore.swagger.io/v2/swagger.json -o petstore-forms')
    .example('ngx-form-generator -i https://petstore.swagger.io/v2/swagger.yaml -o petstore-forms')
    .example('npx ngx-form-generator -i swagger.json -o project/form/src/lib')
    .alias('help', 'h').argv;

  const spec = await loadSpec(argv['input-spec']);

  const maxDepth = argv['max-depth'];
  if (maxDepth !== undefined && (Number.isNaN(maxDepth) || maxDepth < 1)) {
    console.error('Error: max-depth must be a number greater than 0');
    process.exit(1);
  }

  const file = await makeForm(spec, maxDepth);

  let fileName = argv['file-name'] || makeFileName(spec) || 'forms.ts';

  if (argv.output) {
    fileName = join(argv.output, fileName);
  }

  saveFile(file, fileName);
}

await main();
