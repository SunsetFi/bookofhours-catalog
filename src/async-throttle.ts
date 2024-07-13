export type AsyncThrottler = <T>(fn: () => Promise<T>) => Promise<T>;
export function asyncThrottleOne(): AsyncThrottler {
  let previous: Promise<any> = Promise.resolve();
  return async function asyncThrottle<T>(fn: () => Promise<T>): Promise<T> {
    const current = previous.then(() => fn());
    previous = current.catch(() => {});
    return current;
  };
}
