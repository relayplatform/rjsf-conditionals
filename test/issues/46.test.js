import React from "react";
import Form from "@rjsf/core";
import Engine from "json-rules-engine-simplified";
import sinon from "sinon";
import Adapter from "enzyme-adapter-react-16";
import { mount, configure } from "enzyme";
import { FormWithConditionals } from "../../src/applyRules";
import rulesRunner from "../../src/rulesRunner";

configure({ adapter: new Adapter() });

let schema = {
  type: "object",
  properties: {
    firstName: { type: "string" },
    lastName: { type: "string" },
  },
};

let uiSchema = {
  firstName: {},
  lastName: {},
};

test("no exception on formData undefined", () => {
  const runRules = rulesRunner(
    schema,
    uiSchema,
    [
      {
        conditions: { firstName: { is: "An" } },
        event: { type: "remove", params: { field: "lastName" } },
      },
    ],
    Engine
  );

  const updateConfSpy = sinon.spy(FormWithConditionals.prototype, "updateConf");

  mount(
    <FormWithConditionals
      formComponent={Form}
      initialSchema={schema}
      initialUiSchema={uiSchema}
      rulesRunner={runRules}
      formData={undefined}
    />
  );
  expect(updateConfSpy.calledOnce).toEqual(true);
  expect(updateConfSpy.threw()).toEqual(false);

  FormWithConditionals.prototype.updateConf.restore();
});
