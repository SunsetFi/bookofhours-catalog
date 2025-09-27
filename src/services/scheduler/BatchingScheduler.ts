import { injectable, singleton } from "microinject";
import { SchedulerLike, Subscription, asyncScheduler } from "rxjs";

@injectable()
@singleton()
export class BatchingScheduler implements SchedulerLike {
  private _queue: (() => void)[] = [];
  private _pauseDepth = 0;

  schedule<T>(
    work: (state?: T) => void,
    delay: number = 0,
    state?: T,
  ): Subscription {
    if (this._pauseDepth === 0) {
      work(state);
      return new Subscription();
    }

    const update = () => {
      if (delay > 0) {
        asyncScheduler.schedule(work, delay, state);
      } else {
        work(state);
      }
    };
    this._queue.push(update);

    const subscription = new Subscription();
    subscription.add(() => {
      const index = this._queue.indexOf(update);
      if (index >= 0) {
        this._queue.splice(index, 1);
      }
    });

    return subscription;
  }

  now(): number {
    return asyncScheduler.now();
  }

  async batchUpdate<T>(callback: () => Promise<T>): Promise<T> {
    this._pause();
    try {
      return await callback();
    } finally {
      this._unpause();
    }
  }

  private _pause(): void {
    this._pauseDepth++;
  }

  private _unpause(): void {
    if (this._pauseDepth === 0) {
      return;
    }

    this._pauseDepth--;

    if (this._pauseDepth !== 0) {
      return;
    }

    this._flush();
  }

  private _flush() {
    if (this._queue.length === 0) {
      return;
    }

    while (this._queue.length > 0) {
      const work = this._queue.shift();
      if (work) {
        work();
      }
    }
  }
}
