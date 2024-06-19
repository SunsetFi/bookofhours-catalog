import { inject, injectable, singleton } from "microinject";
import {
  BehaviorSubject,
  Observable,
  firstValueFrom,
  map,
  of,
  switchMap,
} from "rxjs";

import {
  distinctUntilShallowArrayChanged,
  filterItemObservations,
  switchMapIf,
  switchMapIfNotNull,
} from "@/observables";

import { Compendium } from "@/services/sh-compendium";

import { GameStateSource } from "../sources/RunningSource";
import { TokensSource } from "../sources/TokensSource";

import { SituationModel } from "../token-models/SituationModel";

import {
  Orchestration,
  OrchestrationRequest,
  isRecipeOrchestrationRequest,
  isSituationOrchestrationRequest,
} from "./types";

import { OrchestrationFactory } from "./OrchestrationFactory";

@injectable()
@singleton()
export class Orchestrator {
  private readonly _orchestration$ = new BehaviorSubject<Orchestration | null>(
    null
  );

  private readonly _open$ = new BehaviorSubject<boolean>(false);

  constructor(
    @inject(GameStateSource) runningSource: GameStateSource,
    @inject(TokensSource) private readonly _tokensSource: TokensSource,
    @inject(OrchestrationFactory)
    private readonly _orchestrationFactory: OrchestrationFactory,
    @inject(Compendium) private readonly _compendium: Compendium
  ) {
    runningSource.isLegacyRunning$.subscribe((isRunning) => {
      if (!isRunning) {
        this._updateOrchestration(null);
        this._open$.next(false);
      }
    });

    // We monitor the situation state on behalf of orchestrations, as this logic
    // is common to all orchestrations.
    const currentSituation$ = this._orchestration$.pipe(
      switchMapIfNotNull((o) => o.situation$)
    );

    currentSituation$
      .pipe(
        switchMap((situation) =>
          situation
            ? situation.state$.pipe(map((s) => [situation, s] as const))
            : of([null, null])
        ),
        // This is very important; do not allow infinite loops.
        distinctUntilShallowArrayChanged()
      )
      .subscribe(([situation, situationState]) => {
        const orchestration = this._orchestration$.value;
        if (!orchestration) {
          return;
        }

        if (situation == null || situationState == null) {
          // Assume the orchestration cleared this out and knows what it's doing.
          return;
        }

        if (orchestration._onSituationStateUpdated) {
          // The orchestration can handle state changes.
          orchestration._onSituationStateUpdated(situationState);
          return;
        }

        // The orchestration has delegated state change handling to us.
        this._openSituationOrchestrationByState(situation);
      });

    // Currently this should never happen, but we do have aspirations of using orchestrations for unlocking terrains,
    // which this will happen for.
    currentSituation$
      .pipe(switchMapIfNotNull((s) => s.retired$))
      .subscribe((retired) => {
        if (retired) {
          this._updateOrchestration(null);
        }
      });
  }

  get orchestration(): Orchestration | null {
    return this._orchestration$.value;
  }

  get orchestration$(): Observable<Orchestration | null> {
    return this._orchestration$;
  }

  get open(): boolean {
    return this._open$.value;
  }

  get open$(): Observable<boolean> {
    return this._open$;
  }

  private _executingSituations$: Observable<SituationModel[]> | null = null;
  get executingSituations$(): Observable<SituationModel[]> {
    if (!this._executingSituations$) {
      this._executingSituations$ = this._tokensSource.visibleSituations$.pipe(
        filterItemObservations((s) =>
          s.state$.pipe(map((s) => s !== "Unstarted"))
        )
      );
    }
    return this._executingSituations$;
  }

  toggleDrawer() {
    if (this._open$.value) {
      this._open$.next(false);
    } else {
      this._open$.next(true);
    }
  }

  async openOrchestration(request: OrchestrationRequest) {
    if (isRecipeOrchestrationRequest(request)) {
      const { recipeId, desiredElementIds } = request;
      const recipe = this._compendium.getRecipeById(recipeId);
      const exists = await firstValueFrom(recipe.exists$);
      if (!exists) {
        return;
      }

      const desiredElements = (desiredElementIds ?? []).map((id) =>
        this._compendium.getElementById(id)
      );

      const orchestration =
        this._orchestrationFactory.createRecipeOrchestration(
          recipe,
          desiredElements,
          (orchestration) => this._updateOrchestration(orchestration)
        );

      this._updateOrchestration(orchestration);
    } else if (isSituationOrchestrationRequest(request)) {
      if (!request.situation) {
        const orchestration =
          this._orchestrationFactory.createUnstartedOrchestration(
            null,
            (orchestration) => this._updateOrchestration(orchestration)
          );
        this._updateOrchestration(orchestration);
      } else {
        this._openSituationOrchestrationByState(request.situation);
      }
    }

    this._open$.next(true);
  }

  closeOrchestration() {
    this._updateOrchestration(null);
  }

  private _openSituationOrchestrationByState(situation: SituationModel) {
    if (
      situation == null ||
      situation.state === "Unstarted" ||
      situation.state === "RequiringExecution"
    ) {
      const orchestration =
        this._orchestrationFactory.createUnstartedOrchestration(
          situation,
          (orchestration) => this._updateOrchestration(orchestration)
        );
      this._updateOrchestration(orchestration);
    } else if (
      situation.state === "Ongoing" ||
      situation.state === "Starting"
    ) {
      const orchestration =
        this._orchestrationFactory.createOngoingOrchestration(
          situation,
          (orchestration) => this._updateOrchestration(orchestration)
        );
      this._updateOrchestration(orchestration);
    } else if (situation.state === "Complete") {
      const orchestration =
        this._orchestrationFactory.createCompletedOrchestration(
          situation,
          (orchestration) => this._updateOrchestration(orchestration)
        );
      this._updateOrchestration(orchestration);
    } else {
      console.warn(`Unhandled situation state: ${situation.state}`);
      this._updateOrchestration(null);
    }
  }

  private _updateOrchestration(orchestration: Orchestration | null) {
    if (this._orchestration$.value) {
      this._orchestration$.value._dispose();
    }

    this._orchestration$.next(orchestration);
  }
}
