import { unstable_batchedUpdates } from "react-dom";
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  distinctUntilChanged,
  firstValueFrom,
  map,
  shareReplay,
} from "rxjs";
import {
  Aspects,
  Situation as ISituation,
  SituationState,
  SphereSpec,
  Token,
} from "secrethistories-api";
import { isEqual, values } from "lodash";

import { isNotNull, tokenPathContainsChild } from "@/utils";

import { filterItems, observeAllMap } from "@/observables";

import { API } from "../../sh-api";

import { filterTokenInPath } from "../observables";

import type { ConnectedTerrainModel } from "./ConnectedTerrainModel";
import { TokenModel } from "./TokenModel";
import { TokenVisibilityFactory } from "./TokenVisibilityFactory";
import { TokenParentTerrainFactory } from "./TokenParentTerrainFactory";
import { ElementStackModel } from "./ElementStackModel";

export function isSituationModel(model: TokenModel): model is SituationModel {
  return model instanceof SituationModel;
}

export class SituationModel extends TokenModel {
  private readonly _situation$: BehaviorSubject<ISituation>;

  private readonly _visible$: Observable<boolean>;
  private readonly _parentTerrain$: Observable<ConnectedTerrainModel | null>;

  constructor(
    situation: ISituation,
    api: API,
    private readonly _elementStacks$: Observable<readonly ElementStackModel[]>,
    visibilityFactory: TokenVisibilityFactory,
    parentTerrainFactory: TokenParentTerrainFactory
  ) {
    super(situation, api);
    this._situation$ = new BehaviorSubject<ISituation>(situation);

    this._visible$ = visibilityFactory.createVisibilityObservable(
      this._situation$
    );
    this._parentTerrain$ = parentTerrainFactory.createParentTerrainObservable(
      this._situation$
    );
  }

  get id(): string {
    return this._situation$.value.id;
  }

  get payloadType(): "Situation" {
    return "Situation";
  }

  private _iconUrl$: Observable<string> | null = null;
  get iconUrl$() {
    if (!this._iconUrl$) {
      this._iconUrl$ = this._situation$.pipe(
        map(
          (situation) =>
            `${this._api.baseUrl}/api/compendium/verbs/${situation.verbId}/icon.png`
        ),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._iconUrl$;
  }

  private _verbId$: Observable<string> | null = null;
  get verbId$() {
    if (!this._verbId$) {
      this._verbId$ = this._situation$.pipe(
        map((s) => s.verbId),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._verbId$;
  }

  get verbId() {
    return this._situation$.value.verbId;
  }

  get visible$() {
    return this._visible$;
  }

  get parentTerrain$() {
    return this._parentTerrain$;
  }

  private _label$: Observable<string> | null = null;
  get label$() {
    if (!this._label$) {
      this._label$ = this._situation$.pipe(
        map((s) => s.label),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._label$;
  }

  private _verbLabel$: Observable<string | null> | null = null;
  get verbLabel$() {
    if (!this._verbLabel$) {
      this._verbLabel$ = this._situation$.pipe(
        map((s) => s.verbLabel),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._verbLabel$;
  }

  get verbLabel() {
    return this._situation$.value.verbLabel;
  }

  private _verbDescription$: Observable<string | null> | null = null;
  get verbDescription$() {
    if (!this._verbDescription$) {
      this._verbDescription$ = this._situation$.pipe(
        map((s) => s.verbDescription),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._verbDescription$;
  }

  private _description$: Observable<string | null> | null = null;
  get description$(): Observable<string | null> {
    if (!this._description$) {
      this._description$ = this._situation$.pipe(
        map((s) => s.description),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._description$;
  }

  private _notes$: Observable<readonly ElementStackModel[]> | null = null;
  get notes$() {
    if (!this._notes$) {
      this._notes$ = this._elementStacks$.pipe(
        // Notes never change their elementId, so its safe to not observe this.
        filterItems((item) => item.elementId === "tlg.note"),
        filterTokenInPath(`${this.path}/aureatenotessphere`),
        shareReplay(1)
      );
    }

    return this._notes$;
  }

  private _aspects$: Observable<Aspects> | null = null;
  get aspects$() {
    if (!this._aspects$) {
      this._aspects$ = this._situation$.pipe(
        map((s) => Object.freeze({ ...s.aspects })),
        distinctUntilChanged(isEqual),
        shareReplay(1)
      );
    }

    return this._aspects$;
  }

  private _hints$: Observable<readonly string[]> | null = null;
  get hints$() {
    if (!this._hints$) {
      this._hints$ = this._situation$.pipe(
        map((s) => Object.freeze([...s.hints])),
        distinctUntilChanged(isEqual),
        shareReplay(1)
      );
    }

    return this._hints$;
  }

  private _thresholds$: Observable<readonly SphereSpec[]> | null = null;
  get thresholds$() {
    if (!this._thresholds$) {
      this._thresholds$ = this._situation$.pipe(
        map((s) => Object.freeze([...s.thresholds])),
        distinctUntilChanged(isEqual),
        shareReplay(1)
      );
    }

    return this._thresholds$;
  }

  get thresholds() {
    return this._situation$.value.thresholds;
  }

  private _thresholdContents$: Observable<
    Readonly<Record<string, ElementStackModel | null>>
  > | null = null;
  get thresholdContents$() {
    if (!this._thresholdContents$) {
      this._thresholdContents$ = combineLatest([
        this.thresholds$,
        this._elementStacks$.pipe(
          observeAllMap((item) =>
            item.path$.pipe(map((path) => ({ item, path })))
          )
        ),
      ]).pipe(
        map(([thresholds, elementPathPairs]) => {
          const thresholdContents: Record<string, ElementStackModel | null> =
            {};

          for (const threshold of thresholds) {
            const searchPath = `${this.path}/${threshold.id}`;
            const element = elementPathPairs.find(({ path }) =>
              tokenPathContainsChild(searchPath, path)
            )?.item;

            thresholdContents[threshold.id] = element ?? null;
          }

          return Object.freeze(thresholdContents);
        }),
        shareReplay(1)
      );
    }

    return this._thresholdContents$;
  }

  private _state$: Observable<SituationState> | null = null;
  get state$() {
    if (!this._state$) {
      this._state$ = this._situation$.pipe(
        map((s) => s.state),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._state$;
  }

  get state() {
    return this._situation$.value.state;
  }

  private _recipeId$: Observable<string | null> | null = null;
  get recipeId$() {
    if (!this._recipeId$) {
      this._recipeId$ = this._situation$.pipe(
        map((s) => s.recipeId),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._recipeId$;
  }

  private _recipeLabel$: Observable<string | null> | null = null;
  get recipeLabel$() {
    if (!this._recipeLabel$) {
      this._recipeLabel$ = this._situation$.pipe(
        map((s) => s.recipeLabel),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._recipeLabel$;
  }

  private _currentRecipeId$: Observable<string | null> | null = null;
  get currentRecipeId$() {
    if (!this._currentRecipeId$) {
      this._currentRecipeId$ = this._situation$.pipe(
        map((s) => s.currentRecipeId),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._currentRecipeId$;
  }

  private _currentRecipeLabel$: Observable<string | null> | null = null;
  get currentRecipeLabel$() {
    if (!this._currentRecipeLabel$) {
      this._currentRecipeLabel$ = this._situation$.pipe(
        map((s) => s.currentRecipeLabel),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._currentRecipeLabel$;
  }

  private _timeRemaining$: Observable<number> | null = null;
  get timeRemaining$(): Observable<number> {
    if (!this._timeRemaining$) {
      this._timeRemaining$ = this._situation$.pipe(
        map((s) => s.timeRemaining),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._timeRemaining$;
  }

  private _content$: Observable<readonly ElementStackModel[]> | null = null;
  get content$(): Observable<readonly ElementStackModel[]> {
    if (!this._content$) {
      this._content$ = this._elementStacks$.pipe(
        // Filter out notes.
        filterItems((item) => item.elementId !== "tlg.note"),
        filterTokenInPath(`${this.path}/situationstoragesphere`),
        shareReplay(1)
      );
    }

    return this._content$;
  }

  private _output$: Observable<readonly ElementStackModel[]> | null = null;
  get output$(): Observable<readonly ElementStackModel[]> {
    if (this._output$ == null) {
      this._output$ = this._elementStacks$.pipe(
        // Filter out notes.
        filterItems((item) => item.elementId !== "tlg.note"),
        filterTokenInPath(`${this.path}/outputsphere`),
        shareReplay(1)
      );
    }

    return this._output$;
  }

  async open() {
    await this._api.openTokenAtPath(this.path);
  }

  async setSlotContents(
    slotId: string,
    token: ElementStackModel | null
  ): Promise<boolean> {
    const slotPath = `${this.path}/${slotId}`;
    const oldTokens = await firstValueFrom(this.thresholdContents$);
    if (token) {
      if (token.spherePath === slotPath) {
        // We are already there, so just say we succeeded.
        return true;
      }

      const success = await token.moveToSphere(slotPath);
      if (!success) {
        return false;
      }
    } else {
      await this._api.evictTokenAtPath(slotPath);
    }

    const followups: Promise<void>[] = [this.refresh()];

    const oldInSlot = oldTokens[slotId];
    if (oldInSlot) {
      followups.push(oldInSlot.refresh());
    }

    await Promise.all(followups);

    return true;
  }

  async setRecipe(recipeId: string) {
    try {
      await this._api.setRecipeAtPath(this.path, recipeId);
      return true;
    } catch {
      return false;
    }
  }

  async execute() {
    try {
      const now = Date.now();
      const result = await this._api.executeTokenAtPath(this.path);
      this._update(
        {
          ...this._token,
          label: result.executedRecipeLabel,
          // This is wrong, but we don't have the correct state yet.
          // We want to blank out thresholds for now, so the current ones don't leak
          // into ongoing ones.
          thresholds: [],
          state: "Ongoing",
        } as Token,
        now
      );

      // Refresh our threshold contents as they will now be in a different sphere.
      const contents = await firstValueFrom(this.thresholdContents$);

      const promises: Promise<void>[] = values(contents)
        .map((token) => token?.refresh())
        .filter(isNotNull);

      // Refresh ourselves properly to get the new thresholds.
      promises.push(this.refresh());

      await Promise.all(promises);

      return true;
    } catch (e) {
      return false;
    }
  }

  async conclude() {
    try {
      const now = Date.now();
      await this._api.concludeTokenAtPath(this.path);
      this._update(
        {
          ...this._situation$.value,
          currentRecipeId: null,
          currentRecipeLabel: null,
          state: "Unstarted",
        },
        now
      );

      // Refresh our contents so they update their locations
      const output = await firstValueFrom(this.output$);
      await Promise.all(output.map((o) => o.refresh()));

      return true;
    } catch (e) {
      return false;
    }
  }

  _onUpdate(situation: ISituation) {
    if (situation.id !== this.id) {
      throw new Error("Invalid situation update: Wrong ID.");
    }

    this._situation$.next(situation);
  }
}
