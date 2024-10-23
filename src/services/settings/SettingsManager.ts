import { inject, injectable, provides, singleton } from "microinject";
import { BehaviorSubject, Observable } from "rxjs";

import { Initializable } from "../Initializable";
import { DialogService } from "../dialog";

import SettingsDialogContent from "./SettingsDialogContent";
import { DefaultSettings, Setting, SettingData } from "./settings";

const LocalStorageKey = "settings";

@injectable()
@singleton()
@provides(Initializable)
export class SettingsManager implements Initializable {
  private readonly _firstSetup$ = new BehaviorSubject<boolean>(false);
  private readonly _settings = new Map<
    keyof SettingData,
    BehaviorSubject<any>
  >();

  private _open = false;

  constructor(
    @inject(DialogService) private readonly _dialogService: DialogService
  ) {}

  onInitialize(): void {
    const settingsStr = window.localStorage.getItem(LocalStorageKey);

    if (settingsStr) {
      this._firstSetup$.next(true);
    }

    const settings: SettingData = {
      ...DefaultSettings,
      ...JSON.parse(settingsStr ?? "{}"),
    };

    for (const key of Object.keys(DefaultSettings) as (keyof SettingData)[]) {
      this._settings.set(key, new BehaviorSubject(settings[key]));
    }
  }

  openSettingsDialog() {
    if (this._open) {
      return;
    }

    this._dialogService
      .showDialog({
        type: "component",
        component: SettingsDialogContent,
      })
      .finally(() => {
        this._open = false;
      });
  }

  get<T extends Setting>(setting: T): SettingData[T] {
    const subject = this._settings.get(setting);
    if (!subject) {
      throw new Error(`Unknown setting: ${setting}`);
    }

    return subject.value;
  }

  getObservable<T extends Setting>(setting: T): Observable<SettingData[T]> {
    const subject = this._settings.get(setting);
    if (!subject) {
      throw new Error(`Unknown setting: ${setting}`);
    }

    return subject;
  }

  set<T extends Setting>(setting: T, value: SettingData[T]): void {
    const subject = this._settings.get(setting);
    if (!subject) {
      throw new Error(`Unknown setting: ${setting}`);
    }

    subject.next(value);

    this._writeSettings();
  }

  private _writeSettings() {
    const settings: SettingData = { ...DefaultSettings };
    for (const [key, subject] of this._settings.entries()) {
      (settings as any)[key] = subject.value;
    }

    window.localStorage.setItem(LocalStorageKey, JSON.stringify(settings));
  }
}
