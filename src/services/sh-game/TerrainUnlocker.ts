import { inject, injectable, singleton } from "microinject";
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  distinctUntilChanged,
  firstValueFrom,
  map,
  switchMap,
  shareReplay,
} from "rxjs";
import { Aspects, aspectsMatch } from "secrethistories-api";
import { pick } from "lodash";

import {
  filterItemObservations,
  filterItems,
  firstOrDefault,
  switchMapIfNotNull,
} from "@/observables";

import { TokensSource } from "./sources/TokensSource";

import { isSituationModel } from "./token-models/SituationModel";
import { ConnectedTerrainModel } from "./token-models/ConnectedTerrainModel";
import { ElementStackModel } from "./token-models/ElementStackModel";

@injectable()
@singleton()
export class TerrainUnlocker {
  private readonly _target$ = new BehaviorSubject<ConnectedTerrainModel | null>(
    null
  );

  private readonly _selectedStack$ =
    new BehaviorSubject<ElementStackModel | null>(null);

  constructor(
    @inject(TokensSource) private readonly _tokensSource: TokensSource
  ) {
    this.unlockCandidateStacks$.subscribe((items) => {
      if (
        this._selectedStack$.value &&
        !items.includes(this._selectedStack$.value)
      ) {
        this._selectedStack$.next(null);
      }
    });
  }

  get target$(): Observable<ConnectedTerrainModel | null> {
    return this._target$;
  }

  private _unlockingTerrainId$: Observable<string | null> | null = null;
  get unlockingTerrainId$() {
    if (!this._unlockingTerrainId$) {
      this._unlockingTerrainId$ = this._tokensSource.tokens$.pipe(
        // More nasty gnarly observable chains
        filterItems(isSituationModel),
        // This isnt an observable, but the situation is created and destroyed as it is used,
        // so this is safe.
        firstOrDefault((situation) => situation.verbId === "terrain.unlock"),
        switchMapIfNotNull((situation) => situation.recipeId$),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._unlockingTerrainId$;
  }

  private _unlockEssentials$: Observable<Aspects | null> | null = null;
  get unlockEssentials$() {
    if (!this._unlockEssentials$) {
      this._unlockEssentials$ = this.target$.pipe(
        switchMapIfNotNull((target) => target.unlockEssentials$),
        shareReplay(1)
      );
    }

    return this._unlockEssentials$;
  }

  private _unlockRequirements$: Observable<Aspects | null> | null = null;
  get unlockRequirements$() {
    if (!this._unlockRequirements$) {
      this._unlockRequirements$ = this.target$.pipe(
        switchMapIfNotNull((target) => target.unlockRequirements$),
        shareReplay(1)
      );
    }

    return this._unlockRequirements$;
  }

  private _unlockForbiddens$: Observable<Aspects | null> | null = null;
  get unlockForbiddens$() {
    if (!this._unlockForbiddens$) {
      this._unlockForbiddens$ = this.target$.pipe(
        switchMapIfNotNull((target) => target.unlockForbiddens$),
        shareReplay(1)
      );
    }

    return this._unlockForbiddens$;
  }

  private _unlockCandidateStacks$: Observable<
    readonly ElementStackModel[]
  > | null = null;
  get unlockCandidateStacks$() {
    if (!this._unlockCandidateStacks$) {
      this._unlockCandidateStacks$ = combineLatest([
        this.unlockEssentials$,
        this.unlockRequirements$,
        this.unlockForbiddens$,
      ]).pipe(
        switchMap(([essentials, requirements, forbiddens]) => {
          return this._tokensSource.visibleElementStacks$.pipe(
            filterItemObservations((stack) =>
              stack.aspectsAndSelf$.pipe(
                map((aspects) => {
                  if (!essentials || !requirements || !forbiddens) {
                    return false;
                  }

                  if (!aspectsMatch(aspects, essentials)) {
                    return false;
                  }

                  // This can return null if we have no requirements.
                  if (aspectsMatchAny(aspects, requirements) === false) {
                    return false;
                  }

                  // This can return null if we have no forbiddens
                  if (aspectsMatchAny(aspects, forbiddens) === true) {
                    return false;
                  }
                  return true;
                })
              )
            )
          );
        })
      );
    }

    return this._unlockCandidateStacks$;
  }

  get selectedStack$(): Observable<ElementStackModel | null> {
    return this._selectedStack$;
  }

  open(terrainModel: ConnectedTerrainModel) {
    this._target$.next(terrainModel);
  }

  close() {
    this._target$.next(null);
  }

  async selectStack(stack: ElementStackModel | null) {
    const candidates = await firstValueFrom(this.unlockCandidateStacks$);
    if (stack && !candidates.includes(stack)) {
      throw new Error("Not a valid unlock candidate.");
    }

    this._selectedStack$.next(stack);
  }

  async execute() {
    if (!this._selectedStack$.value) {
      return false;
    }

    const target = await firstValueFrom(this.target$);
    if (!target) {
      return false;
    }

    try {
      await target.unlockTerrain(this._selectedStack$.value);
      this.close();
      return true;
    } catch {
      return false;
    }
  }
}

function aspectsMatchAny(aspects: Aspects, match: Aspects): boolean | null {
  const keys = Object.keys(match);
  if (!keys.length) {
    return null;
  }

  return keys.some((key) => aspectsMatch(aspects, pick(match, key)));
}
