import {
  extractRefSchema,
  flatMap,
} from "json-rules-engine-simplified/lib/utils";

import { fieldsFromCondition } from "json-rules-engine-simplified/lib/validation";
import env from "./env";

export const toArray = (field) => {
  if (Array.isArray(field)) {
    return field;
  } else {
    return [field];
  }
};

export const toError = (message) => {
  if (env.isDevelopment()) {
    throw new ReferenceError(message);
  } else {
    logWarning(message);
  }
};

export const logWarning = (message) => {
  console.warn(message);
};

/**
 * Find relevant schema for the field
 * @returns { field: "string", schema: "object" } relevant field and schema
 */
export const findRelSchemaAndField = (field, schema) => {
  let separator = field.indexOf(".");
  if (separator === -1) {
    return { field, schema };
  }

  let parentField = field.substr(0, separator);
  let refSchema;
  try {
    refSchema = extractRefSchema(parentField, schema);
  } catch (e) {
    refSchema = null;
  }
  if (refSchema) {
    return findRelSchemaAndField(field.substr(separator + 1), refSchema);
  }

  logWarning(`Failed to retrieve nested schema with key ${field}`);
  return { field, schema };
};

export function findRelUiSchema(field, uiSchema) {
  let separator = field.indexOf(".");
  if (separator === -1) {
    return uiSchema;
  }

  let parentField = field.substr(0, separator);
  let refUiSchema = uiSchema[parentField];
  if (!refUiSchema) {
    return uiSchema;
  } else {
    return findRelUiSchema(field.substr(separator + 1), refUiSchema);
  }
}

export function listAllFields(rules) {
  const allRulesConditions = rules.map((rule) => rule.conditions);
  const allFields = allRulesConditions.map((conditions) => {
    return flatMap([conditions], fieldsFromCondition);
  });
  return allFields.flat();
}

export function removeFieldValue(path, formData = {}) {
  let separator = path.indexOf(".");

  if (separator === -1) {
    formData[path] = undefined;
  }

  const key = path.substring(0, separator);

  if (typeof formData[key] === "object" && Array.isArray(formData[key])) {
    formData[key].forEach((_f, index) => {
      removeFieldValue(path.substring(separator + 1), formData[key][index]);
    });
  }
  if (typeof formData[key] === "object" && !Array.isArray(formData[key])) {
    removeFieldValue(path.substring(separator + 1), formData[key]);
  }
}
