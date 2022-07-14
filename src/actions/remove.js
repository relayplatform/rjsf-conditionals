import {
  toArray,
  findRelSchemaAndField,
  findRelUiSchema,
  removeFieldValue,
} from "../utils";
import { validateFields } from "./validateAction";
import PropTypes from "prop-types";

function doRemove({ field, schema }, uiSchema, { formData, path }) {
  let requiredIndex = schema.required ? schema.required.indexOf(field) : -1;
  if (requiredIndex !== -1) {
    schema.required.splice(requiredIndex, 1);
  }

  delete schema.properties[field];
  delete uiSchema[field];
  removeFieldValue(path, formData);

  let fieldIndex = (uiSchema["ui:order"] ? uiSchema["ui:order"] : []).indexOf(
    field
  );
  if (fieldIndex !== -1) {
    uiSchema["ui:order"].splice(fieldIndex, 1);
  }
}

/**
 * Remove specified field both from uiSchema and schema
 *
 * @param field
 * @param schema
 * @param uiSchema
 * @returns {{schema: *, uiSchema: *}}
 */
export default function remove({ field }, schema, uiSchema, formData) {
  let fieldArr = toArray(field);
  fieldArr.forEach((field) =>
    doRemove(
      findRelSchemaAndField(field, schema),
      findRelUiSchema(field, uiSchema),
      {
        formData,
        path: field,
      }
    )
  );
}

remove.propTypes = {
  field: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]).isRequired,
};

remove.validate = validateFields("remove", function ({ field }) {
  return field;
});
