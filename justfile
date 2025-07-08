_default:
  @just --list

new-post filename:
  hugo new posts/{{filename}}.md

serve:
  hugo serve -D