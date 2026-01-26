import { defineBuildConfig } from "obuild/config";
import { rmSync } from "node:fs";
import { join } from "node:path";

export default defineBuildConfig({
  entries: [
    {
      type: "bundle",
      input: ["./src/index.ts"],
      rolldown: {
        platform: "neutral",
        external: ["valibot", "valibot-introspection"],
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
  hooks: {
    end(ctx) {
      rmSync(join(ctx.pkgDir, "dist", "types.mjs"), { force: true });
    },
  },
});
