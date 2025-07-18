/**
 * @license
 * Licensed under the MIT License, (“the License”); you may not use this
 * file except in compliance with the License.
 *
 * Copyright (c) 2020 Verizon
 */

import {
  requiredRule,
  patternRule,
  minLengthRule,
  maxLengthRule,
  minimumRule,
  maximumRule,
  SchemaProperty
} from './rules';

describe('rules', () => {
  let property: SchemaProperty;

  beforeEach(() => {
    property = {
      required: []
    };
  });

  describe('requiredRule', () => {
    it('should add the required validator if the field is required', () => {
      property.required!.push('foo');

      const result = requiredRule('foo', property);

      expect(result).toEqual('Validators.required');
    });

    it('should should not add the required validator if the field is required', () => {
      const result = requiredRule('foo', property);

      expect(result).toBeFalsy();
    });
  });

  describe('patternRule', () => {
    it('should add the pattern validator if the field contains a pattern', () => {
      property.pattern = '[A-Z]{2}';

      const result = patternRule('foo', property);

      expect(result).toEqual('Validators.pattern(/[A-Z]{2}/)');
    });

    it('should not add the pattern validator if the field contains a pattern', () => {
      const result = patternRule('foo', property);

      expect(result).toBeFalsy();
    });
  });

  describe('minLengthRule', () => {
    it('should add the minLength validator if the field contains a minLength', () => {
      property.minLength = 1;

      const result = minLengthRule('foo', property);

      expect(result).toEqual('Validators.minLength(1)');
    });

    it('should add the minLength validator if the field contains a minLength', () => {
      const result = minLengthRule('foo', property);

      expect(result).toBeFalsy();
    });
  });

  describe('maxLengthRule', () => {
    it('should add the maxLength validator if the field contains a minLength', () => {
      property.maxLength = 1;

      const result = maxLengthRule('foo', property);

      expect(result).toEqual('Validators.maxLength(1)');
    });

    it('should add the maxLength validator if the field contains a minLength', () => {
      const result = maxLengthRule('foo', property);

      expect(result).toBeFalsy();
    });
  });

  describe('minimumRule', () => {
    it('should add the minimum validator if the field contains a minimum', () => {
      property.minimum = 1;

      const result = minimumRule('foo', property);

      expect(result).toEqual('Validators.min(1)');
    });

    it('should not add the minimum validator if the field does not contain a minimum', () => {
      const result = minimumRule('foo', property);

      expect(result).toBeFalsy();
    });
  });

  describe('maximumRule', () => {
    it('should add the maximum validator if the field contains a maximum', () => {
      property.maximum = 1;

      const result = maximumRule('foo', property);

      expect(result).toEqual('Validators.max(1)');
    });

    it('should not add the maximum validator if the field does not contain a maximum', () => {
      const result = maximumRule('foo', property);

      expect(result).toBeFalsy();
    });
  });
});
