const Original = Symbol("Original");

export function decorateObjectInstance<
  TClass extends object,
  TAdditional extends Record<string | symbol, any>
>(target: TClass, additional: TAdditional): TClass & TAdditional {
  return new Proxy(target, {
    get: (target, prop: string | symbol) => {
      if (prop == Original) {
        return target;
      }

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

export function undecorateObjectInstance<TClass extends object>(
  target: TClass
): TClass {
  return (target as any)[Original] || target;
}
