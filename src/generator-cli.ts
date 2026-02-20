#! /usr/bin/env node

/**
 * @license
 * Licensed under the MIT License, (“the License”); you may not use this
 * file except in compliance with the License.
 *
 * Copyright (c) 2020 Verizon
 */

import { saveFile } from './file-utils.js';
import { makeForm, makeFileName, loadSpec } from './generator-lib.js';
import { join } from 'node:path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

async function main(): Promise<void> {
  const argv = await yargs(hideBin(process.argv))
    .option('input-spec', {
      alias: ['i', 'swaggerUrl'],
      description: 'Location of the OpenAPI spec as a URL or file path',
      type: 'string',
      demandOption: true,
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
    .example('ngx-form-generator -i https://petstore.swagger.io/v2/swagger.json -o petstore-forms', 'Generate forms from a remote JSON spec')
    .example('ngx-form-generator -i https://petstore.swagger.io/v2/swagger.yaml -o petstore-forms', 'Generate forms from a remote YAML spec')
    .example('npx ngx-form-generator -i swagger.json -o project/form/src/lib', 'Generate forms from a local JSON spec')
    .alias('help', 'h')
    .parse();

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
