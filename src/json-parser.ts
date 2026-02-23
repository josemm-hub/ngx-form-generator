import * as JSONBig from 'json-bigint';
import { FileInfo } from '@apidevtools/swagger-parser';

const JSONBigNative = JSONBig.default({ protoAction: 'preserve' });

/**
 * Parser for JSON files that can handle big integers.
 */
export const JSON_PARSER = {
  order: 1,
  canParse: '.json',
  parse: (file: FileInfo) => {
    const fileContent = file.data.toString();

    try {
      return JSONBigNative.parse(fileContent);
    } catch (e) {
      const error = e as Error;
      console.error(`Error parsing JSON file: ${error.message}`);
      throw error;
    }
  },
};
