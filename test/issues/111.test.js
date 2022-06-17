import React from "react";
import Form from "@rjsf/core";
import Engine from "json-rules-engine-simplified";
import applyRules from "../../src";

import { render } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";

const rules = [
  {
    conditions: {
      "A.x": "undef",
    },
    event: {
      type: "remove",
      params: {
        field: ["B"],
      },
    },
  },
  {
    conditions: {
      "B.x": "undef",
    },
    event: {
      type: "remove",
      params: {
        field: ["B.y"],
      },
    },
  },
];

const schema = {
  $schema: "http://json-schema.org/schema#",
  title: "Should not throw/error when rendering",
  type: "object",
  properties: {
    A: {
      title: "A",
      description: "See console full of errors",
      type: "object",
      properties: {
        x: {
          title: "X?",
          type: "boolean",
        },
      },
    },
    B: {
      title: "B",
      type: "object",
      properties: {
        x: {
          title: "X?",
          type: "boolean",
        },
        y: {
          title: "Y?",
          type: "boolean",
        },
      },
    },
  },
};

test("should not throw when removing removed field", () => {
  const FormWithConditionals = applyRules(schema, {}, rules, Engine)(Form);

  const { container } = render(<FormWithConditionals />);
  const name = container.querySelector("[id='root_A']");
  expect(name).not.toBeNull();
});
