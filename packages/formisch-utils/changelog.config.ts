import type { ChangelogConfig } from 'changelogen'

export default <ChangelogConfig>{
  templates: {
    commitMessage: "chore(release): formisch-utils v{{newVersion}}",
    tagMessage: "formisch-utils@{{newVersion}}",
    tagBody: "formisch-utils v{{newVersion}}",
  },
}
