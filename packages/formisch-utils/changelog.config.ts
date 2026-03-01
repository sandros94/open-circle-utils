import type { ChangelogConfig } from "changelogen";

export default <ChangelogConfig>{
  templates: {
    commitMessage: "chore(release): formisch-utils v{{newVersion}}",
    tagMessage: "formisch-utils v{{newVersion}}",
    tagBody: "formisch-utils@{{newVersion}}",
  },
};
