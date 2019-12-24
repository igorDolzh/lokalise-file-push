# lokalise-file-push

Lets you automatically push files to your lokalise.co project.

## How to use
```yaml
name: lokalise-file-push

on:
  push:
    # Only run workflow for pushes to specific branches
    branches:
      - master
    # Only run workflow when matching files are changed
    paths:
      - "src/locales/*/messages.po"

jobs:
  upload:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v1
    - uses: igorDolzh/lokalise-file-push@v0.0.1
      with:
        # Api token for the Lokalise account
        # with read/write access to the project
        api-token: ${{ secrets.LOCALIZE_TOKEN }}

        # ID of the project to sync
        project-id: 226204445dcaa59581a7b0.23094960

        # The relative directory where language files will be found
        directory: src/locales/%LANG_ISO%

        # Which format to parse (json or properties)
        format: po

        # Which platform to push new keys to
        platform: web # or android, ios, other

        # The filename new keys should be attached to
        filename: messages.po
```
