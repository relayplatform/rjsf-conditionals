import remove from "./remove";
import _require from "./_require";
import uiAppend from "./uiAppend";
import uiReplace from "./uiReplace";
import uiOverride from "./uiOverride";

export const DEFAULT_ACTIONS = {
  remove,
  'require': _require,
  uiAppend,
  uiReplace,
  uiOverride,
};

export default function execute(
  { type, params },
  schema,
  uiSchema,
  formData,
  extraActions = {}
) {
  let action = extraActions[type] ? extraActions[type] : DEFAULT_ACTIONS[type];
  action(params, schema, uiSchema, formData);
}
