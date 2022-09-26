import { validateFields } from "./validateAction";
import PropTypes from "prop-types";

/**
 * Override original field in uiSchema with defined configuration
 *
 * @param field
 * @param schema
 * @param uiSchema
 * @param conf
 * @returns {{schema: *, uiSchema: *}}
 */
function doOverride(uiSchema, params) {
  for (let field in params) {
    // Prevent prototype pollution
    if (!Object.prototype.hasOwnProperty.call(params, field)) {
      continue;
    }
    if (field === "__proto__" || field === "constructor") {
      continue;
    }

    let appendVal = params[field];
    let fieldUiSchema = uiSchema[field];
    if (!fieldUiSchema) {
      uiSchema[field] = appendVal;
    } else if (typeof appendVal === "object" && !Array.isArray(appendVal)) {
      doOverride(fieldUiSchema, appendVal);
    } else {
      uiSchema[field] = appendVal;
    }
  }
}

export default function uiOverride(params, schema, uiSchema) {
  doOverride(uiSchema, params);
}

uiOverride.propTypes = PropTypes.object.isRequired;
uiOverride.validate = validateFields("uiOverride", function (params) {
  return Object.keys(params);
});
