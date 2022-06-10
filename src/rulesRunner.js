import execute from "./actions";
import deepcopy from "deepcopy";
const { utils } = require("@rjsf/core");
const { deepEquals } = utils;

function doRunRules(
  engine,
  formData,
  initialSchema,
  initialUiSchema,
  extraActions = {}
) {
  let schemaCopy = deepcopy(initialSchema);
  let uiSchemaCopy = deepcopy(initialUiSchema);
  let formDataCopy = deepcopy(formData);

  let res = engine.run(formData).then((result) => {
    let events;
    if (Array.isArray(result)) {
      events = result;
    } else if (
      typeof result === "object" &&
      result.events &&
      Array.isArray(result.events)
    ) {
      events = result.events;
    } else {
      throw new Error("Unrecognized result from rules engine");
    }
    events.forEach((event) =>
      execute(event, schemaCopy, uiSchemaCopy, formDataCopy, extraActions)
    );
  });

  return res.then(() => {
    return {
      schema: schemaCopy,
      uiSchema: uiSchemaCopy,
      formData: formDataCopy,
    };
  });
}

export function normRules(rules) {
  return rules.sort(function (a, b) {
    if (a.order === undefined) {
      return b.order === undefined ? 0 : 1;
    }
    return b.order === undefined ? -1 : a.order - b.order;
  });
}

export default function rulesRunner(
  initialSchema,
  initialUiSchema,
  rules,
  engine,
  extraActions
) {
  engine =
    typeof engine === "function" ? new engine([], initialSchema) : engine;
  normRules(rules).forEach((rule) => engine.addRule(rule));

  return ({ formData, schema: currentSchema, uiSchema: currentUiSchema }) => {
    console.log("formData", formData);
    if (formData === undefined || formData === null) {
      return Promise.resolve({
        schema: initialSchema,
        uiSchema: initialUiSchema,
        formData,
      });
    }

    return doRunRules(
      engine,
      formData,
      initialSchema,
      initialUiSchema,
      extraActions
    ).then((conf) => {
      if (deepEquals(conf.formData, formData)) {
        return conf;
      } else {
        return doRunRules(
          engine,
          conf.formData,
          initialSchema,
          initialUiSchema,
          extraActions
        );
      }
    });
  };
}
