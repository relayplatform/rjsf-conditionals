import React from "react";
import Form from "@rjsf/core";
import Engine from "json-rules-engine";
import applyRules from "../../src";

import { render } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";

const rules = [
  {
    conditions: {
      any: [
        {
          fact: "name",
          operator: "equal",
          value: "truthy",
        },
      ],
    },
    event: {
      type: "log",
      params: {
        foo: "bar",
      },
    },
  },
];

const schema = {
  type: "object",
  required: ["name"],
  properties: {
    name: {
      type: "string",
    },
  },
};

const extraActions = {
  log: (params, schema, uiSchema, formData) => {
    console.log(params, schema, uiSchema, formData);
  },
};
//In our app we do not use this engine, we use json-simplied-rules. This engine does not support empty object as initial form data
// eslint-disable-next-line jest/no-disabled-tests
test.skip("json-rules-engine must not throw when rendering form", (done) => {
  const FormWithConditionals = applyRules(
    schema,
    {},
    rules,
    Engine,
    extraActions
  )(Form);

  const { container } = render(
    <FormWithConditionals formData={{ name: "foo" }} />
  );
  const name = container.querySelector("[id='root_name']");
  expect(name).not.toBeNull();

  setTimeout(() => done(), 3000);
});
