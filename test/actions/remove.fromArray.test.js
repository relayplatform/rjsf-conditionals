import remove from "../../src/actions/remove";
import deepcopy from "deepcopy";

test("remove from array", () => {
  let origSchema = {
    type: "object",
    properties: {
      arr: {
        type: "array",
        items: {
          type: "object",
          properties: {
            foo: { type: "string" },
            boo: { type: "string" },
          },
        },
      },
    },
  };

  let field = "arr.boo";

  let expSchema = {
    type: "object",
    properties: {
      arr: {
        type: "array",
        items: {
          type: "object",
          properties: {
            foo: { type: "string" },
          },
        },
      },
    },
  };

  let schema = deepcopy(origSchema);
  remove({ field }, schema, {});
  expect(origSchema).not.toEqual(schema);
  expect(schema).toEqual(expSchema);
});

test("remove  values from array", () => {
  let origSchema = {
    type: "object",
    properties: {
      arr: {
        type: "array",
        items: {
          type: "object",
          properties: {
            foo: { type: "string" },
            boo: { type: "string" },
          },
        },
      },
    },
  };

  let field = "arr.boo";

  let expSchema = {
    type: "object",
    properties: {
      arr: {
        type: "array",
        items: {
          type: "object",
          properties: {
            foo: { type: "string" },
          },
        },
      },
    },
  };

  let schema = deepcopy(origSchema);
  const formData = {
    arr: [
      { boo: 1, foo: 2 },
      { boo: 3, foo: 4 },
    ],
  };
  remove({ field }, schema, {}, formData);
  expect(origSchema).not.toEqual(schema);
  expect(schema).toEqual(expSchema);
  expect(formData).toEqual({
    arr: [{ foo: 2 }, { foo: 4 }],
  });
});
