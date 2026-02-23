/**
 * @license
 * Licensed under the MIT License, (“the License”); you may not use this
 * file except in compliance with the License.
 *
 * Copyright (c) 2020 Verizon
 */

import * as prettier from 'prettier';
import camelcase from 'camelcase';
import {
  requiredRule,
  patternRule,
  minLengthRule,
  maxLengthRule,
  emailRule,
  minimumRule,
  maximumRule,
  type Definition,
  type Rule,
  type Definitions,
  type SchemaProperty,
} from './rules.js';
import { type OpenAPI, OpenAPIV3 } from 'openapi-types';
import SwaggerParser from '@apidevtools/swagger-parser';
import { JSON_PARSER } from './json-parser.js';

const DEFAULT_RULES = [requiredRule, patternRule, minLengthRule, maxLengthRule, emailRule, minimumRule, maximumRule];

const NEEDED_IMPORTS = `import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms'; \n`;

let rules: Rule[] = [...DEFAULT_RULES];

let MAX_DEPTH = 2;

/**
 * Generates Angular ReactiveForms from an OpenAPI v2 or v3 spec.
 * @param spec - The OpenAPI document.
 * @param maxDepth - The maximum depth of the generated forms.
 * @returns A string representing the generated forms.
 */
export async function makeForm(spec: OpenAPI.Document, maxDepth?: number): Promise<string> {
  let definitions: Definitions;
  MAX_DEPTH = maxDepth ?? MAX_DEPTH;
  if ('definitions' in spec) {
    definitions = spec.definitions;
  } else if ('components' in spec) {
    definitions = spec.components?.schemas as Definitions;
  } else {
    throw new Error('Cannot find schemas/definitions');
  }

  if (!definitions) {
    throw new Error('Cannot find schemas/definitions');
  }

  let body = NEEDED_IMPORTS + '\n\n';

  for (const [key, value] of Object.entries(definitions)) {
    if (value) {
      body += makeDefinition(key, value);
    }
  }

  return await prettier.format(body, { parser: 'typescript', singleQuote: true });
}

/**
 * Creates a form definition for a given OpenAPI definition.
 * @param definitionName - The name of the definition.
 * @param definition - The OpenAPI definition object.
 * @returns A string representing the form definition.
 */
function makeDefinition(definitionName: string, definition: Definition): string {
  return `export const ${camelcase(definitionName)}Form = () => new FormGroup({
      ${makeFieldsBody({ ...definition }, 0)}
    });\n`;
}

/**
 * Generates the body of fields for a form based on the provided definition.
 * @param definition - The OpenAPI definition object containing properties.
 * @param depth - The current depth of recursion.
 * @returns An array of strings representing the form fields.
 */
function makeFieldsBody(definition: Definition, depth: number): string[] {
  if (depth >= MAX_DEPTH) return [];
  depth++;
  return [...extractPropertiesFields(definition, depth), ...extractAllOfFields(definition, depth)];
}

/**
 * Extracts fields from the properties of a given OpenAPI definition.
 * @param definition - The OpenAPI definition object.
 * @param depth - The current depth of recursion.
 * @returns An array of strings representing the form fields.
 */
function extractPropertiesFields(definition: Definition, depth: number): string[] {
  if (!('properties' in definition) || !definition.properties) return [];
  const fields: string[] = [];
  for (const [fieldName, fieldValue] of Object.entries(definition.properties)) {
    const field = makeField(fieldName, fieldValue, !!definition.required?.includes(fieldName), depth);
    if (field !== '') {
      fields.push(field);
    }
  }
  return fields;
}

/**
 * Extracts fields from the allOf properties of a given OpenAPI definition.
 * @param definition - The OpenAPI definition object.
 * @param depth - The current depth of recursion.
 * @returns An array of strings representing the form fields.
 */
function extractAllOfFields(definition: Definition, depth: number): string[] {
  if (!('allOf' in definition) || !Array.isArray(definition.allOf)) return [];
  const fields: string[] = [];
  const definitionRequired = (definition as OpenAPIV3.SchemaObject).required ?? [];
  for (const subSchema of definition.allOf) {
    if ('$ref' in subSchema) {
      const refName = subSchema.$ref.split('/').pop() as string;
      const refSchema =
        (definition as any).definitions?.[refName] || (definition as any).components?.schemas?.[refName];
      if (refSchema) {
        refSchema.required = [...refSchema.required, ...definitionRequired];
        fields.push(...makeFieldsBody(refSchema, depth));
      }
    } else if ('type' in subSchema && subSchema.type === 'object') {
      subSchema.required = [...(subSchema.required ?? []), ...definitionRequired];
      fields.push(...makeFieldsBody(subSchema, depth));
    } else {
      fields.push(...makeFieldsBody(subSchema, depth));
    }
  }
  return fields;
}

/**
 * Creates a form field for a given OpenAPI property.
 * @param fieldName - The name of the field.
 * @param property - The OpenAPI property object.
 * @param isRequired - Indicates if the field is required.
 * @param depth - The current depth of recursion.
 * @returns A string representing the form field.
 */
function makeField(fieldName: string, property: SchemaProperty, isRequired: boolean, depth: number): string {
  let fieldRepesentation;
  if (property.allOf) {
    fieldRepesentation = makeField(fieldName, property.allOf, isRequired, depth);
  } else if (property.type === 'array') {
    fieldRepesentation = makeArrayField(fieldName, property as OpenAPIV3.ArraySchemaObject, isRequired, depth);
  } else if (property.type === 'object') {
    fieldRepesentation = makeObjectField(fieldName, property, isRequired, depth);
  } else {
    fieldRepesentation = makePrimitiveField(fieldName, property, isRequired);
  }
  return fieldRepesentation;
}

/**
 * Creates a form array field for a given OpenAPI array schema.
 * @param fieldName - The name of the field.
 * @param property - The OpenAPI array schema object.
 * @param isRequired - Indicates if the field is required.
 * @param depth - The current depth of recursion.
 * @returns A string representing the form array field.
 */
function makeArrayField(
  fieldName: string,
  property: OpenAPIV3.ArraySchemaObject,
  isRequired: boolean,
  depth: number,
): string {
  const itemDefinition = property.items as OpenAPIV3.SchemaObject;
  const minItems = property['minItems'] ?? 1;

  const items: string[] = [];
  if (itemDefinition['type'] === 'object') {
    for (let i = 0; i <= minItems; i++) {
      items.push(`new FormGroup({${makeFieldsBody(itemDefinition, depth)}})`);
    }
  } else {
    const _dummyProps = {
      properties: {
        dummy: itemDefinition,
      },
    };
    const value = 'default' in _dummyProps.properties.dummy ? `'${_dummyProps.properties.dummy.default}'` : null;
    for (let i = 1; i <= minItems; i++) {
      items.push(`new FormControl(${value}, [${makeFieldRules('dummy', _dummyProps, isRequired)}])`);
    }
  }
  return `"${fieldName}": new FormArray([${items.join(',')}])`;
}

/**
 * Creates a form object field for a given OpenAPI object schema.
 * @param fieldName - The name of the field.
 * @param property - The OpenAPI object schema object.
 * @param isRequired - Indicates if the field is required.
 * @param depth - The current depth of recursion.
 * @returns A string representing the form object field.
 */
function makeObjectField(fieldName: string, property: SchemaProperty, isRequired: boolean, depth: number): string {
  const groupBody = makeFieldsBody(property, depth);
  return `"${fieldName}": new FormGroup({${groupBody}}, [${makeFieldRules(fieldName, property, isRequired)}])`;
}

/**
 * Creates a form control for a primitive field based on its OpenAPI definition.
 * @param fieldName - The name of the field.
 * @param property - The OpenAPI property object.
 * @param isRequired - Indicates if the field is required.
 * @returns A string representing the form control.
 */
function makePrimitiveField(fieldName: string, property: SchemaProperty, isRequired: boolean): string {
  const value = 'default' in property ? `'${property.default}'` : null;
  return `"${fieldName}": new FormControl(${value}, [${makeFieldRules(fieldName, property, isRequired)}])`;
}

/**
 * Creates validation rules for a form field based on its OpenAPI definition.
 * @param fieldName - The name of the field.
 * @param property - The OpenAPI property object.
 * @param isRequired - Indicates if the field is required.
 * @returns A string representing the validation rules.
 */
function makeFieldRules(fieldName: string, property: SchemaProperty, isRequired: boolean): string {
  return rules
    .map((rule) => rule(fieldName, property, isRequired))
    .filter((item) => item != '')
    .join();
}

/**
 * Adds a validation rule for a form field.
 * @param rule - The validation rule to add.
 */
export function addRule(rule: Rule): void {
  rules.push(rule);
}

/**
 * Removes a validation rule from the form field rules.
 * @param rule - The validation rule to remove.
 */
export function resetRules(): void {
  rules = [...DEFAULT_RULES];
}

/**
 * Generates a file name based on the OpenAPI spec title.
 * @param swagger - The OpenAPI document.
 * @returns A string representing the file name or undefined if no title is available.
 */
export function makeFileName(swagger: OpenAPI.Document): string | undefined {
  if (swagger.info?.title) {
    return `${camelcase(swagger.info.title)}.ts`;
  }
}

/**
 * Loads an OpenAPI specification from a file or URL.
 * @param fileOrUrlPath - The path to the OpenAPI spec file or URL.
 * @returns A promise that resolves to the dereferenced OpenAPI document.
 */
export async function loadSpec(fileOrUrlPath: string): Promise<OpenAPI.Document> {
  return SwaggerParser.dereference(fileOrUrlPath, {
    parse: {
      json: JSON_PARSER,
    },
  });
}
