import remove from "../../src/actions/remove";
import deepcopy from "deepcopy";

let schema = {
  definitions: {
    address: {
      properties: {
        street: { type: "string" },
        zip: { type: "string" },
      },
    },
  },
  properties: {
    title: { type: "string" },
    firstName: { type: "string" },
    address: { $ref: "#/definitions/address" },
    profile: {
      type: "object",
      properties: {
        age: { type: "number" },
        height: { type: "number" },
      },
    },
  },
};

test("remove from ref fields", () => {
  let resSchema = deepcopy(schema);
  remove({ field: ["address.zip"] }, resSchema, {});

  let newDefinition = {
    address: {
      properties: {
        street: { type: "string" },
      },
    },
  };

  let expSchema = Object.assign({}, schema, { definitions: newDefinition });
  expect(resSchema).toEqual(expSchema);
});

test("remove form data from ref fields", () => {
  let resSchema = deepcopy(schema);
  let formData = {
    firstName: "Mike",
    address: { street: "Albert", zip: "12345" },
  };
  remove({ field: ["address.zip"] }, resSchema, {}, formData);

  let newDefinition = {
    address: {
      properties: {
        street: { type: "string" },
      },
    },
  };

  let expSchema = Object.assign({}, schema, { definitions: newDefinition });
  expect(resSchema).toEqual(expSchema);
  expect(formData).toEqual({
    firstName: "Mike",
    address: { street: "Albert" },
  });
});

test("remove from Object fields", () => {
  let resSchema = deepcopy(schema);
  remove({ field: ["profile.age"] }, resSchema, {});

  let properties = Object.assign({}, schema.properties, {
    profile: {
      type: "object",
      properties: {
        height: { type: "number" },
      },
    },
  });

  let expSchema = Object.assign({}, schema, { properties });
  expect(resSchema).toEqual(expSchema);
});

test("remove form data from Object fields", () => {
  let resSchema = deepcopy(schema);
  let formData = {
    firstName: "Mike",
    profile: {
      age: 35,
      height: "6ft",
    },
  };
  remove({ field: ["profile.age"] }, resSchema, {}, formData);

  let properties = Object.assign({}, schema.properties, {
    profile: {
      type: "object",
      properties: {
        height: { type: "number" },
      },
    },
  });

  let expSchema = Object.assign({}, schema, { properties });
  expect(resSchema).toEqual(expSchema);
  expect(formData).toEqual({ firstName: "Mike", profile: { height: "6ft" } });
});
