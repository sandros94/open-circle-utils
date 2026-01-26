import { defineBuildConfig } from "obuild/config";

export default defineBuildConfig({
  entries: [
    {
      type: "bundle",
      input: ["./src/index.ts"],
      rolldown: {
        platform: "neutral",
      },
    },
    {
      type: "bundle",
      input: ["./src/types.ts"],
      rolldown: {
        platform: "neutral",
      },
    },
  ],
});
