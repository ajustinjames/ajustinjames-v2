import { describe, expect, it } from "vitest";
import archiveJson from "../data/entries.json?raw";
import pageHtml from "../../../pages/apps/killed-by-ea.astro?raw";

const sourceFiles = import.meta.glob<string>("../**/*.ts", {
  eager: true,
  import: "default",
  query: "?raw",
});

const checkedContent = [
  ["pages/apps/killed-by-ea.astro", pageHtml],
  ["data/entries.json", archiveJson],
  ...Object.entries(sourceFiles).filter(([path]) => !path.endsWith(".test.ts")),
];

describe("banned archive wording", () => {
  for (const banned of ["upcoming", "still online", "countdown", "days left"]) {
    it(`does not include "${banned}" in page, source, or archive data`, () => {
      for (const [path, content] of checkedContent) {
        expect((content ?? "").toLocaleLowerCase(), path).not.toContain(banned);
      }
    });
  }
});
