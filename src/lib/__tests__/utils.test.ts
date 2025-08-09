import { describe, it, expect } from "@jest/globals";

describe("Basic Test Setup", () => {
  it("should run a simple test", () => {
    expect(1 + 1).toBe(2);
  });

  it("should handle basic string operations", () => {
    const testString = "Hello World";
    expect(testString.toLowerCase()).toBe("hello world");
    expect(testString.split(" ")).toEqual(["Hello", "World"]);
  });

  it("should handle arrays", () => {
    const testArray = [1, 2, 3, 4, 5];
    expect(testArray.length).toBe(5);
    expect(testArray.filter((n) => n > 3)).toEqual([4, 5]);
  });

  it("should handle objects", () => {
    const testObject = {
      name: "Test",
      value: 42,
      active: true,
    };

    expect(testObject.name).toBe("Test");
    expect(testObject.value).toBe(42);
    expect(testObject.active).toBe(true);
  });
});
