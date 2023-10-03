export function decorateClassInstance<
  TClass extends object,
  TAdditional extends Record<string, any>
>(target: TClass, additional: TAdditional): TClass & TAdditional {
  return new Proxy(target, {
    get: (target, prop: string) => {
      if (prop in additional) {
        return additional[prop];
      }

      return (target as any)[prop];
    },
    set: (target, prop: string, value) => {
      if (prop in additional) {
        (additional as any)[prop] = value;
        return true;
      }
      (target as any)[prop] = value;
      return true;
    },
  }) as TClass & TAdditional;
}
