import { injectable, provides, singleton } from "microinject";

import { Initializable } from "../Initializable";

const pollingPeriod = 2000;

export type TaskUnsubscriber = () => void;

@injectable()
@singleton()
@provides(Initializable)
export class Scheduler implements Initializable {
  private readonly _tasks: (() => Promise<void>)[] = [];
  private _currentTask = 0;
  private _pollingTimeout: NodeJS.Timeout | null = null;

  addTask(task: () => Promise<void>): () => void {
    this._tasks.push(task);
    return () => {
      const index = this._tasks.indexOf(task);
      if (index >= 0) {
        this._tasks.splice(index, 1);
      }
    };
  }

  onInitialize(): void {
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        this.updateNow();
      } else {
        this._cancelPoll();
      }
    });

    this._scheduleNextPoll(0);
  }

  async updateNow() {
    this._cancelPoll();

    try {
      await Promise.all(this._tasks.map((task) => task()));
    } finally {
      this._currentTask = 0;
      this._scheduleNextPoll(0);
    }
  }

  private _cancelPoll() {
    if (this._pollingTimeout) {
      clearTimeout(this._pollingTimeout);
      this._pollingTimeout = null;
    }
  }

  private _scheduleNextPoll(reduceBy: number) {
    if (document.hidden) {
      return;
    }

    this._cancelPoll();

    if (this._tasks.length === 0) {
      this._pollingTimeout = setTimeout(() => this._scheduleNextPoll(0), 100);
      return;
    }

    let timeToWait = pollingPeriod / this._tasks.length;
    // Reduce by the time spent on the last poll, but dont go too low.
    timeToWait = Math.max(10, timeToWait - reduceBy);
    this._pollingTimeout = setTimeout(() => this._poll(), timeToWait);
  }

  private async _poll() {
    this._pollingTimeout = null;
    if (this._currentTask >= this._tasks.length) {
      this._currentTask = 0;
    }

    const task = this._tasks[this._currentTask];
    const started = Date.now();
    try {
      await task();
    } catch (e: any) {
      console.error(e);
    } finally {
      this._currentTask = (this._currentTask + 1) % this._tasks.length;
      this._scheduleNextPoll(Date.now() - started);
    }
  }
}
