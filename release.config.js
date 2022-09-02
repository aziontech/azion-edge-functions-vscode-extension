module.exports = {
    branches: ["main"],
    analyzeCommits: {
      preset: 'conventionalcommits',
      parserOpts: {
        headerPattern: /^(\[ENG-.*])?\s?(\w+):\s(.*)$/,
        headerCorrespondence: ['scope', 'type', 'subject'],
      },
    },
    generateNotes: {
      preset: 'conventionalcommits',
      parserOpts: {
        headerPattern: /^(\[ENG-.*])?\s?(\w+):\s(.*)$/,
        headerCorrespondence: ['scope', 'type', 'subject'],
      },
      options: {
        preset: {
          name: 'conventionalchangelog',
          issuePrefixes: ['ENG-'],
          issueUrlFormat: 'https://aziontech.atlassian.net/browse/{prefix}{id}',
        },
      },
    },
    npmPublish: false,
  };