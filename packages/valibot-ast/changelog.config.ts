import type { ChangelogConfig } from "changelogen";

export default <ChangelogConfig>{
  templates: {
    commitMessage: "chore(release): valibot-ast v{{newVersion}}",
    tagMessage: "valibot-ast v{{newVersion}}",
    tagBody: "valibot-ast@{{newVersion}}",
  },
};
