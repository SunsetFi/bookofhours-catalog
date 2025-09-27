const githubApiRoot = "https://api.github.com";

const owner = "SunsetFi";
const repository = "bookofhours-catalog";

export const repositoryUrl = `https://github.com/${owner}/${repository}`;

export interface GithubRelease {
  url: string;
  html_url: string;
  tag_name: string;
  assets: GithubReleaseAsset[];
}

export interface GithubReleaseAsset {
  url: string;
  name: string;
  label: string | null;
  browser_download_url: string;
}

export async function getGithubReleases(): Promise<GithubRelease[]> {
  const response = await fetch(
    `${githubApiRoot}/repos/${owner}/${repository}/releases`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  const body = await response.json();
  return body;
}

export function findBepInExPluginAsset(
  release: GithubRelease,
): GithubReleaseAsset | null {
  return release.assets.find((asset) => asset.name.includes("BepInEx")) ?? null;
}
