/**
 * @license
 * Licensed under the MIT License, (“the License”); you may not use this
 * file except in compliance with the License.
 *
 * Copyright (c) 2020 Verizon
 */

import { OpenAPIV2, OpenAPIV3 } from 'openapi-types';

export type Property = {
  format?: string;
  pattern?: string;
  maxLength?: number;
  minLength?: number;
  minimum?: number;
  maximum?: number;
};

export type Properties = Record<string, Property>;

export type Rule = (fieldName: string, properties: Definition) => string;

export type Definitions =
  | OpenAPIV2.DefinitionsObject
  | Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>
  | undefined;
export type Definition = OpenAPIV2.DefinitionsObject | OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject;

export type SchemaProperty = OpenAPIV2.SchemaObject | OpenAPIV3.SchemaObject;

function hasMetadata(fieldName: string, property: SchemaProperty, metadataName: string): boolean {
  return property.hasOwnProperty(metadataName);
}

function abstractRule(fieldName: string, property: SchemaProperty, ruleName: keyof Property): string {
  return hasMetadata(fieldName, property, ruleName) ? `Validators.${ruleName}(${property[ruleName]})` : '';
}

export function requiredRule(fieldName: string, property: SchemaProperty): string {
  return property.required?.includes(fieldName) ? `Validators.required` : '';
}

export function patternRule(fieldName: string, property: SchemaProperty): string {
  return hasMetadata(fieldName, property, 'pattern') ? `Validators.pattern(/${property['pattern']}/)` : '';
}

export function minLengthRule(fieldName: string, property: SchemaProperty): string {
  return abstractRule(fieldName, property, 'minLength');
}

export function maxLengthRule(fieldName: string, property: SchemaProperty): string {
  return abstractRule(fieldName, property, 'maxLength');
}

export function emailRule(fieldName: string, property: SchemaProperty): string {
  return property.format === 'email' ? `Validators.email` : '';
}

export function minimumRule(fieldName: string, property: SchemaProperty): string {
  return hasMetadata(fieldName, property, 'minimum') ? `Validators.min(${property['minimum']})` : '';
}

export function maximumRule(fieldName: string, property: SchemaProperty): string {
  return hasMetadata(fieldName, property, 'maximum') ? `Validators.max(${property['maximum']})` : '';
}
