import {
  findRelSchemaAndField,
  toError,
  listAllFields,
  removeFieldValue,
} from "../src/utils";
import selectn from "selectn";
import envMock, { isDevelopmentMock } from "../src/env";
jest.mock("../src/env");

let addressSchema = {
  properties: {
    street: { type: "string" },
    zip: { type: "string" },
  },
};

let schema = {
  definitions: {
    address: addressSchema,
  },
  properties: {
    lastName: { type: "string" },
    age: { type: "number" },
    someAddress: {
      $ref: "#/definitions/address",
    },
    houses: {
      type: "array",
      items: {
        $ref: "#/definitions/address",
      },
    },
    email: {
      $ref: "https://example.com/email.json",
    },
  },
};

test("isProduction", () => {
  expect(envMock.isDevelopment()).toBeTruthy();
  expect(isDevelopmentMock).toHaveBeenCalledTimes(1);
  isDevelopmentMock.mockReturnValueOnce(false);
  expect(envMock.isDevelopment()).toBeFalsy();
  expect(isDevelopmentMock).toHaveBeenCalledTimes(2);
});

test("error throws exception", () => {
  expect(() => toError("Yes")).toThrow();
  isDevelopmentMock.mockReturnValueOnce(false);
  expect(toError("Yes")).toBeUndefined();
});

test("find rel schema with plain schema", () => {
  expect(findRelSchemaAndField("lastName", schema)).toEqual({
    field: "lastName",
    schema,
  });
  expect(findRelSchemaAndField("age", schema)).toEqual({
    field: "age",
    schema,
  });
});

test("find rel schema with ref object schema", () => {
  expect(findRelSchemaAndField("someAddress", schema)).toEqual({
    field: "someAddress",
    schema,
  });
  expect(findRelSchemaAndField("someAddress.street", schema)).toEqual({
    field: "street",
    schema: addressSchema,
  });
});

test("find rel schema with ref array object schema", () => {
  let {
    definitions: { address },
  } = schema;
  expect(findRelSchemaAndField("houses", schema)).toEqual({
    field: "houses",
    schema,
  });
  expect(findRelSchemaAndField("houses.street", schema)).toEqual({
    field: "street",
    schema: address,
  });
});

test("fail to find rel schema", () => {
  expect(findRelSchemaAndField("email.host", schema)).toEqual({
    field: "email.host",
    schema,
  });
});

test("fail to find rel schema field", () => {
  expect(findRelSchemaAndField("email.protocol", schema)).toEqual({
    field: "email.protocol",
    schema,
  });
});

test("invalid field", () => {
  expect(findRelSchemaAndField("lastName.protocol", schema)).toEqual({
    field: "lastName.protocol",
    schema,
  });
});

test("selectn", () => {
  expect(selectn("firstName", { firstName: {} })).toEqual({});
});

test("listAllFields", () => {
  const rules = [
    {
      conditions: {
        a: {
          is: "blue",
        },
      },
    },
    {
      conditions: {
        or: [
          {
            b: "empty",
          },
          {
            c: "empty",
          },
        ],
      },
    },
    {
      conditions: {
        "d.e": "empty",
      },
    },
    {
      conditions: {
        not: {
          or: [
            {
              f: "empty",
              g: "empty",
            },
            {
              h: "empty",
            },
          ],
        },
      },
    },
  ];

  const fields = listAllFields(rules);
  expect(fields).toEqual(["a", "b", "c", "d.e", "f", "g", "h"]);
});

test("remove field value from plain schema", () => {
  const formData = {
    firstName: "Michael",
    lastName: "Jordan",
    age: "50",
  };
  removeFieldValue("lastName", formData);
  expect(formData).toEqual({ firstName: "Michael", age: "50" });
});

test("remove field value from nested schema", () => {
  const formData = {
    profile: {
      firstName: "Michael",
      lastName: "Jordan",
      age: "50",
    },
  };
  removeFieldValue("profile.lastName", formData);
  expect(formData).toEqual({ profile: { firstName: "Michael", age: "50" } });
});

test("remove field value from deeply nested schema", () => {
  const formData = {
    profile: {
      firstName: "Michael",
      lastName: "Jordan",
      age: "50",
      address: {
        zip: "1234",
        street: "Albert",
      },
    },
  };
  removeFieldValue("profile.address.zip", formData);
  expect(formData).toEqual({
    profile: {
      firstName: "Michael",
      lastName: "Jordan",
      age: "50",
      address: {
        street: "Albert",
      },
    },
  });
});

test("remove field from deeply nested array", () => {
  const formData = {
    courses: [
      {
        subject: "Math",
        students: [
          {
            firstName: "Mike",
            id: 1,
          },
          {
            firstName: "Jordan",
            id: 2,
          },
        ],
      },
      {
        subject: "Physics",
        students: [
          {
            firstName: "Dwayne",
            id: 3,
          },
          {
            firstName: "Johnson",
            id: 4,
          },
        ],
      },
    ],
  };
  removeFieldValue("courses.students.id", formData);
  expect(formData).toEqual({
    courses: [
      {
        subject: "Math",
        students: [
          {
            firstName: "Mike",
          },
          {
            firstName: "Jordan",
          },
        ],
      },
      {
        subject: "Physics",
        students: [
          {
            firstName: "Dwayne",
          },
          {
            firstName: "Johnson",
          },
        ],
      },
    ],
  });
});
