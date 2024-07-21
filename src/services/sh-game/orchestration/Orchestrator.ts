import { inject, injectable, singleton } from "microinject";
import {
  BehaviorSubject,
  Observable,
  firstValueFrom,
  map,
  of,
  switchMap,
} from "rxjs";
import { SituationState } from "secrethistories-api";

import {
  distinctUntilShallowArrayChanged,
  filterItemObservations,
  switchMapIfNotNull,
} from "@/observables";

import { Compendium } from "@/services/sh-compendium";
import { SettingsManager } from "@/services/settings/SettingsManager";

import { GameStateSource } from "../sources/GameStateSource";
import { TokensSource } from "../sources/TokensSource";

import { SituationModel } from "../token-models/SituationModel";

import {
  Orchestration,
  OrchestrationRequest,
  isRecipeOrchestrationRequest,
  isSituationOrchestrationRequest,
} from "./types";

import { OrchestrationFactory } from "./OrchestrationFactory";
import { SituationStateChangedResponse } from "./internal";
import { RecipeOrchestration } from "./RecipeOrchestration";

// These states don't last long and seem to be stepping stones to other states.
// We get them intermittently, but can't really act on them.
const TransientStates: SituationState[] = [
  "Halting",
  "Inchoate",
  "RequiringExecution",
  "Starting",
];

@injectable()
@singleton()
export class Orchestrator {
  private readonly _orchestration$ = new BehaviorSubject<Orchestration | null>(
    null
  );

  private readonly _open$ = new BehaviorSubject<boolean>(false);

  constructor(
    @inject(SettingsManager) private readonly _settings: SettingsManager,
    @inject(GameStateSource) runningSource: GameStateSource,
    @inject(TokensSource) private readonly _tokensSource: TokensSource,
    @inject(OrchestrationFactory)
    private readonly _orchestrationFactory: OrchestrationFactory,
    @inject(Compendium) private readonly _compendium: Compendium
  ) {
    this._settings.getObservable("interactivity").subscribe((interactivity) => {
      if (interactivity === "read-only") {
        this._updateOrchestration(null);
        this._open$.next(false);
      } else if (
        interactivity === "minimal" &&
        this._orchestration$.value instanceof RecipeOrchestration
      ) {
        this._updateOrchestration(null);
      }
    });

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

        // Weird states we can't act on.
        // Particularly, we get flickers of RequiringExecution when passing time to conclude a situation.
        if (TransientStates.includes(situationState)) {
          return;
        }

        let response: SituationStateChangedResponse = "update-orchestration";
        if (orchestration._onSituationStateUpdated) {
          // The orchestration can handle state changes.
          response = orchestration._onSituationStateUpdated(situationState);
        }

        if (response === "update-orchestration") {
          // The orchestration has delegated state change handling to us.
          this._openSituationOrchestrationByState(situation);
        } else if (response === "clear-orchestration") {
          this._updateOrchestration(null);
        }
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
    if (this._settings.get("interactivity") === "read-only") {
      return;
    }

    if (this._open$.value) {
      this._open$.next(false);
    } else {
      this._open$.next(true);
    }
  }

  async openOrchestration(
    request: OrchestrationRequest
  ): Promise<Orchestration | null> {
    const interactivity = this._settings.get("interactivity");
    if (interactivity === "read-only") {
      return null;
    }

    if (isRecipeOrchestrationRequest(request)) {
      if (interactivity !== "full") {
        return null;
      }

      // FIXME: If another verb is open, we should close and wait first.
      // This is because we have a tendancy to try and snatch cards from other open verbs,
      // but the verbs will close as part of opening this orchestration.

      const { recipeId, desiredElementIds } = request;
      const recipe = this._compendium.getRecipeById(recipeId);
      const exists = await firstValueFrom(recipe.exists$);
      if (!exists) {
        return null;
      }

      const desiredElements = (desiredElementIds ?? []).map((id) =>
        this._compendium.getElementById(id)
      );

      const orchestration =
        this._orchestrationFactory.createRecipeOrchestration(
          recipe,
          desiredElements
        );

      this._updateOrchestration(orchestration);
    } else if (isSituationOrchestrationRequest(request)) {
      if (!request.situation) {
        const orchestration =
          this._orchestrationFactory.createUnstartedOrchestration(null);
        this._updateOrchestration(orchestration);
      } else {
        this._openSituationOrchestrationByState(request.situation);
      }
    }

    this._open$.next(true);

    return this._orchestration$.value;
  }

  closeOrchestration() {
    this._updateOrchestration(null);
  }

  private _openSituationOrchestrationByState(situation: SituationModel) {
    if (situation == null || situation.state === "Unstarted") {
      const orchestration =
        this._orchestrationFactory.createUnstartedOrchestration(situation);
      this._updateOrchestration(orchestration);
    } else if (situation.state === "Ongoing") {
      const orchestration =
        this._orchestrationFactory.createOngoingOrchestration(situation);
      this._updateOrchestration(orchestration);
    } else if (situation.state === "Complete") {
      const orchestration =
        this._orchestrationFactory.createCompletedOrchestration(situation);
      this._updateOrchestration(orchestration);
    } else {
      console.warn(`Unhandled situation state: ${situation.state}`);
      // Just ignore it for now.  It's probably transient and will become something more sensible later.
    }
  }

  private _updateOrchestration(orchestration: Orchestration | null) {
    if (this._orchestration$.value) {
      this._orchestration$.value._dispose();
    }

    this._orchestration$.next(orchestration);
  }
}
