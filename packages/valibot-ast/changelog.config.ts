import type { ChangelogConfig } from 'changelogen'

export default <ChangelogConfig>{
  templates: {
    commitMessage: "chore(release): valibot-ast v{{newVersion}}",
    tagMessage: "valibot-ast@{{newVersion}}",
    tagBody: "valibot-ast v{{newVersion}}",
  },
}
