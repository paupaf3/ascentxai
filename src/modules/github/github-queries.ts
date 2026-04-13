export const PROFILE_AND_PINNED_QUERY = `
  query ProfileAndPinned($username: String!) {
    user(login: $username) {
      name
      bio
      location 
      company
      websiteUrl
      avatarUrl
      followers {
        totalCount
      }
      following {
        totalCount
      }
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name
            description
            url
            primaryLanguage {
              name
            }
            object(expression: "HEAD:README.md") {
              ... on Blob {
                text
              }
            }
          }
        }
      }
    }
  }
`;

export const SINGLE_REPO_QUERY = `
  query SingleRepo($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      name
      description
      url
      primaryLanguage {
        name
      }
      object(expression: "HEAD:README.md") {
        ... on Blob {
          text
        }
      }
    }
  }
`;
