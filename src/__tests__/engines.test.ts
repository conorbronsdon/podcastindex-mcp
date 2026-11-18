import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// #36: `engines` and the README must not promise a Node line that CI never
// runs. The oldest CI leg is the supported floor.
const root = fileURLToPath(new URL("../../", import.meta.url));
const read = (path: string) => readFileSync(root + path, "utf8");

const matrix = read(".github/workflows/ci.yml").match(/node-version:\s*\[([^\]]*)\]/);
const legs = (matrix?.[1] ?? "")
  .split(",")
  .map((leg) => leg.trim().replace(/^['"]|['"]$/g, ""))
  .filter(Boolean);
const majors = legs.map((leg) => Number.parseInt(leg, 10));
const oldest = legs[majors.indexOf(Math.min(...majors))].replace(/\.x$/, ".0");

describe("supported Node versions match CI (#36)", () => {
  it("reads the CI matrix", () => {
    expect(legs.length).toBeGreaterThan(0);
    expect(majors.every(Number.isInteger)).toBe(true);
  });

  it("package.json engines starts at the oldest CI leg", () => {
    const pkg = JSON.parse(read("package.json"));
    expect(pkg.engines.node).toBe(`>=${oldest}`);
  });

  it("package-lock.json root engines matches package.json", () => {
    const lock = JSON.parse(read("package-lock.json"));
    expect(lock.packages[""].engines).toEqual(JSON.parse(read("package.json")).engines);
  });

  it("README prerequisite names only the oldest CI leg", () => {
    const line = read("README.md").split("\n").find((l) => l.startsWith("- Node.js "));
    expect(line).toBe(`- Node.js ${oldest.replace(/\.0$/, "")}+`);
  });
});
