import {
  BehaviorSubject,
  Observable,
  combineLatest,
  map,
  shareReplay,
} from "rxjs";
import { Aspects, combineAspects } from "secrethistories-api";

import { EmptyObject$, observeAll } from "@/observables";

import { Compendium, RecipeModel } from "@/services/sh-compendium";

import { SituationModel } from "../token-models/SituationModel";

import {
  CompletedOrchestration,
  Orchestration,
  OrchestrationBase,
  OrchestrationSlot,
} from "./types";
import { ElementStackModel } from "../token-models/ElementStackModel";

export class CompletedSituationOrchestration
  implements OrchestrationBase, CompletedOrchestration
{
  constructor(
    private readonly _situation: SituationModel,
    private readonly _compendium: Compendium,
    private readonly _replaceOrchestration: (
      orchestration: Orchestration | null
    ) => void
  ) {}

  _dispose() {}

  private _label$: Observable<string | null> | null = null;
  get label$(): Observable<string | null> {
    if (this._label$ == null) {
      this._label$ = combineLatest([
        this._situation.label$,
        this._situation.recipeLabel$,
      ]).pipe(
        map(([situationLabel, recipeLabel]) => {
          let label = recipeLabel ?? situationLabel;
          if (label === ".") {
            label = situationLabel;
          }
          return label;
        })
      );
    }
    return this._situation.label$;
  }

  private _recipe$: Observable<RecipeModel | null> | null = null;
  get recipe$(): Observable<RecipeModel | null> {
    if (!this._recipe$) {
      // TODO: We do a lot of this... Should we have recipe$ in situation that returns the model?
      this._recipe$ = this._situation.recipeId$.pipe(
        map((recipeId) =>
          recipeId ? this._compendium.getRecipeById(recipeId) : null
        ),
        shareReplay(1)
      );
    }

    return this._recipe$;
  }

  get requirements$(): Observable<Readonly<Aspects>> {
    return EmptyObject$;
  }

  private readonly _situation$ = new BehaviorSubject(this._situation);
  get situation$(): Observable<SituationModel | null> {
    return this._situation$;
  }

  get slots$(): Observable<Readonly<Record<string, OrchestrationSlot>>> {
    return EmptyObject$;
  }

  private _aspects$: Observable<Readonly<Aspects>> | null = null;
  get aspects$(): Observable<Readonly<Aspects>> {
    if (!this._aspects$) {
      this._aspects$ = this._situation.output$.pipe(
        map((output) => output.map((o) => o.aspects$)),
        observeAll(),
        map((aspects) => aspects.reduce((a, b) => combineAspects(a, b), {})),
        shareReplay(1)
      );
    }

    return this._aspects$;
  }

  get notes$() {
    return this._situation.notes$;
  }

  get content$(): Observable<readonly ElementStackModel[]> {
    return this._situation.output$;
  }

  async conclude(): Promise<boolean> {
    if (await this._situation.conclude()) {
      this._replaceOrchestration(null);
      return true;
    }

    return false;
  }
}
