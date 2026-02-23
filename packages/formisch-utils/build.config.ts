import { defineBuildConfig } from "obuild/config";

const frameworks = ["preact", "qwik", "react", "solid", "vue"] as const;

export default defineBuildConfig({
  entries: [
    {
      type: "bundle",
      input: ["./src/index.ts", ...frameworks.map((fw) => `./src/${fw}/index.ts`)],
      rolldown: {
        platform: "neutral",
        external: ["valibot", "valibot-ast", ...frameworks.map((fw) => `@formisch/${fw}`)],
      },
    },
  ],
});
