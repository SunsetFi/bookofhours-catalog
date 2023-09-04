import { injectable, provides, singleton } from "microinject";

import { Initializable } from "../Initializable";

const pollingPeriod = 2000;

export type TaskUnsubscriber = () => void;

@injectable()
@singleton()
@provides(Initializable)
export class Scheduler implements Initializable {
  private readonly _tasks: (() => Promise<void>)[] = [];
  private currentTask = 0;

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
    this._scheduleNextPoll(0);
  }

  private _scheduleNextPoll(reduceBy: number) {
    if (this._tasks.length === 0) {
      setTimeout(() => this._scheduleNextPoll(0), 100);
      return;
    }

    let timeToWait = pollingPeriod / this._tasks.length;
    // Reduce by the time spent on the last poll, but dont go too low.
    timeToWait = Math.max(10, timeToWait - reduceBy);
    setTimeout(() => this._poll(), timeToWait);
  }

  private async _poll() {
    if (this.currentTask >= this._tasks.length) {
      this.currentTask = 0;
    }

    const task = this._tasks[this.currentTask];
    const started = Date.now();
    try {
      await task();
    } catch (e: any) {
      console.error(e);
    } finally {
      this.currentTask = (this.currentTask + 1) % this._tasks.length;
      this._scheduleNextPoll(Date.now() - started);
    }
  }
}
