import execute from "./actions";
import deepcopy from "deepcopy";
import { listAllFields } from "./utils";
import { diff } from "deep-object-diff";
import flatten from "flat";
const { utils } = require("@rjsf/core");
const { deepEquals } = utils;

function doRunRules({
  engine,
  currentFormData,
  initialSchema,
  initialUiSchema,
  extraActions = {},
  currentSchema,
  currentUiSchema,
}) {
  let schemaCopy = deepcopy(initialSchema);
  let uiSchemaCopy = deepcopy(initialUiSchema);
  let formDataCopy = deepcopy(currentFormData);

  let res = engine.run(currentFormData).then((result) => {
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
    const schema = diff(currentSchema, schemaCopy) ? schemaCopy : currentSchema;
    const uiSchema = diff(currentUiSchema, uiSchemaCopy)
      ? uiSchemaCopy
      : currentUiSchema;
    const formData = diff(currentFormData, formDataCopy)
      ? formDataCopy
      : currentFormData;
    return {
      schema: schema,
      uiSchema: uiSchema,
      formData: formData,
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
  const conditionedFields = listAllFields(rules);
  return ({
    formData: currentFormData,
    schema: currentSchema,
    uiSchema: currentUiSchema,
    prevFormData,
  }) => {
    if (currentFormData === undefined || currentFormData === null) {
      return Promise.resolve({
        schema: initialSchema,
        uiSchema: initialUiSchema,
        formData: currentFormData,
      });
    }

    const prevFormDataExists =
      prevFormData !== undefined &&
      prevFormData !== null &&
      typeof prevFormData === "object";

    if (!prevFormDataExists) {
      return doRunRules({
        engine,
        currentFormData,
        initialSchema,
        initialUiSchema,
        extraActions,
        currentSchema,
        currentUiSchema,
      }).then((conf) => {
        if (deepEquals(conf.formData, currentFormData)) {
          return conf;
        } else {
          return doRunRules({
            engine,
            currentFormData: conf.formData,
            initialSchema,
            initialUiSchema,
            extraActions,
            currentSchema,
            currentUiSchema,
          });
        }
      });
    }

    const formDataDiff = diff(prevFormData, currentFormData);
    const formDataHasChanged = Object.keys(formDataDiff).length > 0;

    if (!formDataHasChanged) {
      return Promise.resolve({
        formData: currentFormData,
        schema: currentSchema,
        uiSchema: currentUiSchema,
      });
    }
    const condtionedFieldsHasChanged = Object.keys(flatten(formDataDiff)).some(
      (key) =>
        conditionedFields.some(
          (field) => key === field || key.startsWith(field + ".")
        )
    );

    if (!condtionedFieldsHasChanged) {
      return Promise.resolve({
        formData: currentFormData,
        schema: currentSchema,
        uiSchema: currentUiSchema,
      });
    }

    return doRunRules({
      engine,
      currentFormData,
      initialSchema,
      initialUiSchema,
      extraActions,
      currentSchema,
      currentUiSchema,
    }).then((conf) => {
      if (deepEquals(conf.formData, currentFormData)) {
        return conf;
      } else {
        return doRunRules({
          engine,
          currentFormData: conf.formData,
          initialSchema,
          initialUiSchema,
          extraActions,
          currentSchema,
          currentUiSchema,
        });
      }
    });
  };
}
