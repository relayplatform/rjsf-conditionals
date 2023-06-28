import execute from "./actions";
import deepcopy from "deepcopy";
import { listAllFields } from "./utils";
import { diff } from "deep-object-diff";
import flatten from "flat";
import { utils } from '@rjsf/core';
const { deepEquals } = utils;

async function doRunRules({
  engine,
  currentFormData,
  initialSchema,
  initialUiSchema,
  extraActions = {},
  currentSchema,
  currentUiSchema,
  prevFormData = {},
  prevFormDataExists,
}) {
  let schemaCopy = deepcopy(initialSchema);
  let uiSchemaCopy = deepcopy(initialUiSchema);
  let formDataCopy = deepcopy(currentFormData);
  const previouslyAppliedRules = await engine.run(prevFormData);
  const currentAppliedRules = await engine.run(currentFormData);

  // in line 22 we are defaulting prevFormData to empty object otherwise line 28 will cause an error.
  // if initial form data is an empty object then on the first render the applied diff will return false which not correct
  // that is why we use prevFormDataExists to account for the first render
  if (
    deepEquals(previouslyAppliedRules, currentAppliedRules) &&
    prevFormDataExists
  ) {
    return {
      schema: currentSchema,
      uiSchema: currentUiSchema,
      formData: currentFormData,
    };
  }

  let events;
  if (Array.isArray(currentAppliedRules)) {
    events = currentAppliedRules;
  } else if (
    typeof currentAppliedRules === "object" &&
    currentAppliedRules.events &&
    Array.isArray(currentAppliedRules.events)
  ) {
    events = currentAppliedRules.events;
  } else {
    throw new Error("Unrecognized result from rules engine");
  }

  await events.forEach((event) =>
    execute(event, schemaCopy, uiSchemaCopy, formDataCopy, extraActions)
  );

  const schema = deepEquals(currentSchema, schemaCopy)
    ? currentSchema
    : schemaCopy;
  const uiSchema = deepEquals(currentUiSchema, uiSchemaCopy)
    ? currentUiSchema
    : uiSchemaCopy;
  const formData = deepEquals(currentFormData, formDataCopy)
    ? currentFormData
    : formDataCopy;
  return {
    schema: schema,
    uiSchema: uiSchema,
    formData: formData,
  };
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
  if (!engine) { return; }
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
        prevFormDataExists,
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
            prevFormDataExists,
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
      prevFormData,
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
          prevFormData,
        });
      }
    });
  };
}
