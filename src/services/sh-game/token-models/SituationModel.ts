import {
  Observable,
  combineLatest,
  distinctUntilChanged,
  firstValueFrom,
  map,
  shareReplay,
} from "rxjs";
import {
  Aspects,
  Situation,
  SituationState,
  SphereSpec,
} from "secrethistories-api";
import { isEqual, values } from "lodash";

import { isNotNull, tokenPathContainsChild } from "@/utils";

import { filterItems, observeAllMap } from "@/observables";
import { asyncThrottleOne } from "@/async-throttle";

import { alwaysVisibleSpherePaths } from "@/spheres";

import { BatchingScheduler } from "@/services/scheduler";

import { API } from "../../sh-api";

import { filterTokenInPath } from "../observables";

import type { ConnectedTerrainModel } from "./ConnectedTerrainModel";
import { TokenModel } from "./TokenModel";
import { TokenParentTerrainFactory } from "./TokenParentTerrainFactory";
import { ElementStackModel } from "./ElementStackModel";

export function isSituationModel(model: TokenModel): model is SituationModel {
  return model instanceof SituationModel;
}

export class SituationModel extends TokenModel<Situation> {
  private readonly _parentTerrain$: Observable<ConnectedTerrainModel | null>;

  private readonly _actionThrottle = asyncThrottleOne();

  constructor(
    situation: Situation,
    api: API,
    private readonly _elementStacks$: Observable<readonly ElementStackModel[]>,
    parentTerrainFactory: TokenParentTerrainFactory,
    private readonly _scheduler: BatchingScheduler,
  ) {
    super(situation, api);
    this._parentTerrain$ = parentTerrainFactory.createParentTerrainObservable(
      this._token$,
    );
  }

  private _iconUrl$: Observable<string> | null = null;
  get iconUrl$() {
    if (!this._iconUrl$) {
      this._iconUrl$ = this._token$.pipe(
        map(
          (situation) =>
            `${this._api.baseUrl}/api/compendium/verbs/${situation.verbId}/icon.png`,
        ),
        distinctUntilChanged(),
        shareReplay(1),
      );
    }

    return this._iconUrl$;
  }

  private _verbId$: Observable<string> | null = null;
  get verbId$() {
    if (!this._verbId$) {
      this._verbId$ = this._token$.pipe(
        map((s) => s.verbId),
        distinctUntilChanged(),
        shareReplay(1),
      );
    }

    return this._verbId$;
  }

  get verbId() {
    return this._token.verbId;
  }

  private _visible$: Observable<boolean> | null = null;
  get visible$() {
    if (!this._visible$) {
      this._visible$ = this._token$.pipe(
        map((token) => {
          if (
            alwaysVisibleSpherePaths.some((path) =>
              tokenPathContainsChild(path, token.path),
            )
          ) {
            return true;
          }

          return !token.inShroudedSphere;
        }),
        distinctUntilChanged(),
        shareReplay(1),
      );
    }

    return this._visible$;
  }

  get parentTerrain$() {
    return this._parentTerrain$;
  }

  private _label$: Observable<string> | null = null;
  get label$() {
    if (!this._label$) {
      this._label$ = this._token$.pipe(
        map((s) => s.label),
        distinctUntilChanged(),
        shareReplay(1),
      );
    }

    return this._label$;
  }

  private _verbLabel$: Observable<string | null> | null = null;
  get verbLabel$() {
    if (!this._verbLabel$) {
      this._verbLabel$ = this._token$.pipe(
        map((s) => s.verbLabel),
        distinctUntilChanged(),
        shareReplay(1),
      );
    }

    return this._verbLabel$;
  }

  get verbLabel() {
    return this._token.verbLabel;
  }

  private _verbDescription$: Observable<string | null> | null = null;
  get verbDescription$() {
    if (!this._verbDescription$) {
      this._verbDescription$ = this._token$.pipe(
        map((s) => s.verbDescription),
        distinctUntilChanged(),
        shareReplay(1),
      );
    }

    return this._verbDescription$;
  }

  private _description$: Observable<string | null> | null = null;
  get description$(): Observable<string | null> {
    if (!this._description$) {
      this._description$ = this._token$.pipe(
        map((s) => s.description),
        distinctUntilChanged(),
        shareReplay(1),
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
        shareReplay(1),
      );
    }

    return this._notes$;
  }

  private _aspects$: Observable<Aspects> | null = null;
  get aspects$() {
    if (!this._aspects$) {
      this._aspects$ = this._token$.pipe(
        map((s) => Object.freeze({ ...s.aspects })),
        distinctUntilChanged(isEqual),
        shareReplay(1),
      );
    }

    return this._aspects$;
  }

  private _hints$: Observable<readonly string[]> | null = null;
  get hints$() {
    if (!this._hints$) {
      this._hints$ = this._token$.pipe(
        map((s) => Object.freeze([...s.hints])),
        distinctUntilChanged(isEqual),
        shareReplay(1),
      );
    }

    return this._hints$;
  }

  get isOpen() {
    return this._token.open;
  }

  private _isOpen$: Observable<boolean> | null = null;
  get isOpen$() {
    if (!this._isOpen$) {
      this._isOpen$ = this._token$.pipe(
        map((s) => s.open),
        distinctUntilChanged(),
        shareReplay(1),
      );
    }

    return this._isOpen$;
  }

  private _thresholds$: Observable<readonly SphereSpec[]> | null = null;
  get thresholds$() {
    if (!this._thresholds$) {
      this._thresholds$ = this._token$.pipe(
        map((s) => Object.freeze([...s.thresholds])),
        distinctUntilChanged(isEqual),
        shareReplay(1),
      );
    }

    return this._thresholds$;
  }

  get thresholds() {
    return Object.freeze([...this._token.thresholds]);
  }

  // We should probably build thresholdContents out of this, but I would like to
  // get the token by id from the source, and we would need to observe the get in case
  // the token hasnt been found yet.
  // get thresholdContentIds() {
  //   return Object.freeze({ ...this._token.thresholdContents });
  // }

  // private _thresholdContentIds$: Observable<readonly string[]> | null = null;
  // get thresholdContentIds$() {
  //   if (!this._thresholdContentIds$) {
  //     this._thresholdContentIds$ = this._token$.pipe(
  //       map((s) => Object.freeze({ ...s.thresholdContents })),
  //       distinctUntilChanged(isEqual),
  //       shareReplay(1)
  //     );
  //   }

  //   return this._thresholdContentIds$;
  // }

  private _thresholdContents$: Observable<
    Readonly<Record<string, ElementStackModel | null>>
  > | null = null;
  get thresholdContents$() {
    if (!this._thresholdContents$) {
      this._thresholdContents$ = combineLatest([
        this.thresholds$,
        this._elementStacks$.pipe(
          observeAllMap((item) =>
            item.path$.pipe(map((path) => ({ item, path }))),
          ),
        ),
      ]).pipe(
        map(([thresholds, elementPathPairs]) => {
          // We should be using situation.thresholdContents for this, but what happens if the token id isnt known to us?
          // We need to observe the get-by-id to make this work.
          const thresholdContents: Record<string, ElementStackModel | null> =
            {};

          for (const threshold of thresholds) {
            const searchPath = `${this.path}/${threshold.id}`;
            const element = elementPathPairs.find(({ path }) =>
              tokenPathContainsChild(searchPath, path),
            )?.item;

            thresholdContents[threshold.id] = element ?? null;
          }

          return Object.freeze(thresholdContents);
        }),
        shareReplay(1),
      );
    }

    return this._thresholdContents$;
  }

  private _state$: Observable<SituationState> | null = null;
  get state$() {
    if (!this._state$) {
      this._state$ = this._token$.pipe(
        map((s) => s.state),
        distinctUntilChanged(),
        shareReplay(1),
      );
    }

    return this._state$;
  }

  get state() {
    return this._token.state;
  }

  get openAmbitRecipeIds() {
    return this._token.openAmbitRecipeIds;
  }

  private _openAmbitRecipeIds$: Observable<readonly string[]> | null = null;
  get openAmbitRecipeIds$() {
    if (!this._openAmbitRecipeIds$) {
      this._openAmbitRecipeIds$ = this._token$.pipe(
        map((s) => Object.freeze([...s.openAmbitRecipeIds])),
        distinctUntilChanged(isEqual),
        shareReplay(1),
      );
    }

    return this._openAmbitRecipeIds$;
  }

  private _recipeId$: Observable<string | null> | null = null;
  get recipeId$() {
    if (!this._recipeId$) {
      this._recipeId$ = this._token$.pipe(
        map((s) => s.recipeId),
        distinctUntilChanged(),
        shareReplay(1),
      );
    }

    return this._recipeId$;
  }

  private _recipeLabel$: Observable<string | null> | null = null;
  get recipeLabel$() {
    if (!this._recipeLabel$) {
      this._recipeLabel$ = this._token$.pipe(
        map((s) => s.recipeLabel),
        distinctUntilChanged(),
        shareReplay(1),
      );
    }

    return this._recipeLabel$;
  }

  private _currentRecipeId$: Observable<string | null> | null = null;
  get currentRecipeId$() {
    if (!this._currentRecipeId$) {
      this._currentRecipeId$ = this._token$.pipe(
        map((s) => s.currentRecipeId),
        distinctUntilChanged(),
        shareReplay(1),
      );
    }

    return this._currentRecipeId$;
  }

  private _currentRecipeLabel$: Observable<string | null> | null = null;
  get currentRecipeLabel$() {
    if (!this._currentRecipeLabel$) {
      this._currentRecipeLabel$ = this._token$.pipe(
        map((s) => s.currentRecipeLabel),
        distinctUntilChanged(),
        shareReplay(1),
      );
    }

    return this._currentRecipeLabel$;
  }

  get canExecute() {
    return this._token.canExecute;
  }

  private _canExecute$: Observable<boolean> | null = null;
  get canExecute$() {
    if (!this._canExecute$) {
      this._canExecute$ = this._token$.pipe(
        map((s) => s.canExecute),
        distinctUntilChanged(),
        shareReplay(1),
      );
    }

    return this._canExecute$;
  }

  get timeRemaining() {
    return this._token.timeRemaining;
  }

  private _timeRemaining$: Observable<number> | null = null;
  get timeRemaining$(): Observable<number> {
    if (!this._timeRemaining$) {
      this._timeRemaining$ = this._token$.pipe(
        map((s) => s.timeRemaining),
        distinctUntilChanged(),
        shareReplay(1),
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
        shareReplay(1),
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
        shareReplay(1),
      );
    }

    return this._output$;
  }

  // HACK: Orchestrations close on dispose, but we often open orchestrations immediately.
  // Let them wait on the situation settling before continuing to work with them.
  awaitIdle() {
    return this._actionThrottle(() => Promise.resolve(true));
  }

  async open() {
    return this._actionThrottle(async () => {
      try {
        const now = Date.now();
        await this._api.openTokenAtPath(this.path);
        this._update({ ...this._token, open: true }, now);
        return true;
      } catch (e) {
        console.warn("Failed to open situation", this.id, e);
        return false;
      }
    });
  }

  async close() {
    return this._actionThrottle(async () => {
      try {
        const now = Date.now();
        const contents = await firstValueFrom(this.thresholdContents$);
        const result = await this._api.updateTokenById(this.id, {
          open: false,
        });
        this._update(result as Situation, now);
        await Promise.all(
          values(contents)
            .map((value) => value?.refresh())
            .filter(isNotNull),
        );
      } catch (e) {
        console.warn("Failed to close situation", this.id, e);
        return false;
      }
    });
  }

  async setSlotContents(
    slotId: string,
    token: ElementStackModel | null,
  ): Promise<boolean> {
    return this._actionThrottle(() =>
      this._scheduler.batchUpdate(async () => {
        const slotPath = `${this.path}/${slotId}`;
        const oldTokens = await firstValueFrom(this.thresholdContents$);
        const oldInSlot = oldTokens[slotId];

        if (oldInSlot) {
          await oldInSlot.evict();
        }

        if (token) {
          if (token.spherePath === slotPath) {
            // We are already there, so just say we succeeded.
            return true;
          }

          const success = await token.moveToSphere(slotPath);
          if (!success) {
            return false;
          }
        }

        await this.refresh();
        return true;
      }),
    );
  }

  async setRecipe(recipeId: string) {
    try {
      await this._api.setRecipeAtPath(this.path, recipeId);
      return true;
    } catch (e) {
      console.warn(
        "Failed to set recipe",
        recipeId,
        "for situation",
        this.id,
        e,
      );
      return false;
    }
  }

  async execute() {
    return this._scheduler.batchUpdate(async () => {
      try {
        const now = Date.now();

        // Get our contents from the input thresholds, so we can refresh them after we execute.
        const contents = await firstValueFrom(this.thresholdContents$);

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
          },
          now,
        );

        const promises: Promise<void>[] = values(contents)
          .map((token) => token?.refresh())
          .filter(isNotNull);

        // Refresh ourselves properly to get the new thresholds.
        promises.push(this.refresh());

        await Promise.all(promises);

        return true;
      } catch (e) {
        console.warn("Failed to execute situation", this.id, e);
        return false;
      }
    });
  }

  async conclude() {
    return this._scheduler.batchUpdate(async () => {
      try {
        const now = Date.now();

        // Capture the output content before concluding so we can refresh them after.
        const output = await firstValueFrom(this.output$);

        await this._api.concludeTokenAtPath(this.path);
        this._update(
          {
            ...this._token,
            currentRecipeId: null,
            currentRecipeLabel: null,
            state: "Unstarted",
          },
          now,
        );

        await Promise.all(output.map((o) => o.refresh()));

        return true;
      } catch (e) {
        console.warn("Failed to conclude situation", this.id, e);
        return false;
      }
    });
  }

  async dump() {
    return this._scheduler.batchUpdate(async () => {
      const contents = await firstValueFrom(this.thresholdContents$);
      await Promise.all(
        values(contents)
          .map((token) => token?.evict())
          .filter(isNotNull),
      );
    });
  }
}
