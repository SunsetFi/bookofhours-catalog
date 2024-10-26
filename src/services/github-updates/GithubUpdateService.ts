import { combineLatest, firstValueFrom, map, Observable } from "rxjs";
import { inject, injectable, singleton } from "microinject";

import { version } from "@/runtime-env";
import { GithubRelease, getGithubReleases } from "@/github";
import { promiseFuncToObservable } from "@/observables";

import { SettingsManager } from "../settings";

@injectable()
@singleton()
export class GithubUpdateService {
  constructor(
    @inject(SettingsManager) private _settingsManager: SettingsManager
  ) {}

  private _githubReleases: Observable<GithubRelease[]> | null = null;
  get githubReleases$() {
    if (!this._githubReleases) {
      this._githubReleases = promiseFuncToObservable(getGithubReleases);
    }
    return this._githubReleases;
  }

  private _newVersion$: Observable<GithubRelease | null> | null = null;
  get newVersion$() {
    if (!this._newVersion$) {
      this._newVersion$ = this.githubReleases$.pipe(
        map((releases) => {
          const latestRelease = releases[0];
          if (!latestRelease) {
            return null;
          }

          if (!version) {
            console.error("No version found in runtime env.");
            return null;
          }

          const tag = latestRelease.tag_name;

          if (!isVersionGreaterThan(tag.substring(1), version)) {
            return null;
          }

          return latestRelease;
        })
      );
    }

    return this._newVersion$;
  }

  private _notifyNewRelease$: Observable<boolean> | null = null;
  get notifyNewRelease$() {
    if (!this._notifyNewRelease$) {
      this._notifyNewRelease$ = combineLatest([
        this.newVersion$,
        this._settingsManager.getObservable("ignoreNewRelease"),
      ]).pipe(
        map(([newVersion, ignoreNewRelease]) => {
          if (!newVersion) {
            return false;
          }

          if (newVersion.tag_name === ignoreNewRelease) {
            return false;
          }

          return true;
        })
      );
    }

    return this._notifyNewRelease$;
  }

  async ignoreNewRelease() {
    const currentVersion = await firstValueFrom(this.newVersion$);
    if (!currentVersion) {
      return;
    }

    this._settingsManager.set("ignoreNewRelease", currentVersion.tag_name);
  }
}

function isVersionGreaterThan(a: string, b: string) {
  const [aMajor, aMinor, aPatch] = a.split(".").map(Number);
  const [bMajor, bMinor, bPatch] = b.split(".").map(Number);

  if (aMajor > bMajor) {
    return true;
  }

  if (aMajor < bMajor) {
    return false;
  }

  if (aMinor > bMinor) {
    return true;
  }

  if (aMinor < bMinor) {
    return false;
  }

  if (aPatch > bPatch) {
    return true;
  }

  return false;
}
