import React from "react";
import Form from "@rjsf/core";
import Engine from "json-rules-engine-simplified";
import sinon from "sinon";
import Adapter from "enzyme-adapter-react-16";
import { shallow, configure } from "enzyme";
import { render } from "@testing-library/react";
import { waitFor } from "@testing-library/dom";
import rulesRunner from "../src/rulesRunner";
import { FormWithConditionals } from "../src/applyRules";

configure({ adapter: new Adapter() });

const schema = {
  type: "object",
  title: "Encounter",
  required: [],
  properties: {
    firstName: { type: "string" },
    lastName: { type: "string" },
    name: { type: "string" },
  },
};

const RULES = [
  {
    conditions: {
      firstName: "empty",
    },
    event: {
      type: "remove",
      params: {
        field: ["lastName", "name"],
      },
    },
  },
];

let handleChangeSpy, updateConfSpy, setStateSpy, renderSpy;

beforeEach(function () {
  handleChangeSpy = sinon.spy(FormWithConditionals.prototype, "handleChange");
  updateConfSpy = sinon.spy(FormWithConditionals.prototype, "updateConf");
  setStateSpy = sinon.spy(FormWithConditionals.prototype, "setState");
  renderSpy = sinon.spy(FormWithConditionals.prototype, "render");
});

afterEach(function () {
  FormWithConditionals.prototype.handleChange.restore(); // Unwraps the spy
  FormWithConditionals.prototype.updateConf.restore();
  FormWithConditionals.prototype.setState.restore();
  FormWithConditionals.prototype.render.restore();
});

test("NO re render on same data", async () => {
  const runRules = rulesRunner(schema, {}, RULES, Engine);

  const { rerender } = render(
    <FormWithConditionals
      formComponent={Form}
      initialSchema={schema}
      rulesRunner={runRules}
      formData={{ firstName: "A" }}
    />
  );

  expect(updateConfSpy.callCount).toEqual(1);
  //intial form data did not cause the schema to change hence the state was not updated
  await waitFor(() => expect(setStateSpy.callCount).toEqual(0));
  expect(handleChangeSpy.notCalled).toEqual(true);

  rerender(
    <FormWithConditionals
      formComponent={Form}
      initialSchema={schema}
      rulesRunner={runRules}
      formData={{ firstName: "A" }}
    />
  );
  expect(updateConfSpy.callCount).toEqual(1);
  expect(setStateSpy.callCount).toEqual(0);
  expect(handleChangeSpy.notCalled).toEqual(true);
});

test("Re render on formData change", async () => {
  const runRules = rulesRunner(schema, {}, RULES, Engine);

  const { rerender } = render(
    <FormWithConditionals
      formComponent={Form}
      initialSchema={schema}
      rulesRunner={runRules}
      formData={{ firstName: "A" }}
    />
  );

  expect(updateConfSpy.calledOnce).toEqual(true);
  await waitFor(() => expect(setStateSpy.callCount).toEqual(0));
  expect(handleChangeSpy.notCalled).toEqual(true);

  rerender(
    <FormWithConditionals
      formComponent={Form}
      initialSchema={schema}
      rulesRunner={runRules}
      formData={{ firstName: "An" }}
    />
  );
  expect(updateConfSpy.callCount).toEqual(2);
  //intial form data did not cause the schema to change hence the state was not updated
  await waitFor(() => expect(setStateSpy.callCount).toEqual(1));
  expect(handleChangeSpy.notCalled).toEqual(true);
});

test("Re render on non formData change change", () => {
  const runRules = rulesRunner(schema, {}, RULES, Engine);
  const wrapper = shallow(
    <FormWithConditionals
      formComponent={Form}
      initialSchema={schema}
      rulesRunner={runRules}
      formData={{ firstName: "A" }}
      some="A"
    />
  );

  wrapper.setProps({ formData: { firstName: "A" }, some: "B" });
  expect(renderSpy.calledTwice).toEqual(true);
});
