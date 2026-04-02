'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useMemo, useCallback, useRef } from 'react';

export interface ParamConfig<T> {
  key: string;
  defaultValue: T;
  serialize: (value: T) => string | null;
  deserialize: (raw: string | null) => T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ParamConfigs = Record<string, ParamConfig<any>>;

type StateFromConfigs<C extends ParamConfigs> = {
  [K in keyof C]: C[K] extends ParamConfig<infer T> ? T : never;
};

type SettersFromConfigs<C extends ParamConfigs> = {
  [K in keyof C]: (value: C[K] extends ParamConfig<infer T> ? T : never) => void;
};

type SetMultiple<C extends ParamConfigs> = (updates: Partial<StateFromConfigs<C>>) => void;

export function useUrlState<C extends ParamConfigs>(
  configs: C
): [StateFromConfigs<C>, SettersFromConfigs<C>, SetMultiple<C>] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const configsRef = useRef(configs);
  configsRef.current = configs;

  const state = useMemo(() => {
    const result = {} as Record<string, unknown>;
    for (const [name, config] of Object.entries(configs)) {
      result[name] = config.deserialize(searchParams.get(config.key));
    }
    return result as StateFromConfigs<C>;
  }, [searchParams, configs]);

  const buildParams = useCallback(
    (updates: Partial<Record<string, unknown>>) => {
      const params = new URLSearchParams(searchParams.toString());
      const cfgs = configsRef.current;

      for (const [name, value] of Object.entries(updates)) {
        const config = cfgs[name];
        if (!config) continue;
        const serialized = config.serialize(value as never);
        if (serialized === null) {
          params.delete(config.key);
        } else {
          params.set(config.key, serialized);
        }
      }

      return params;
    },
    [searchParams]
  );

  const setMultiple = useCallback(
    (updates: Partial<StateFromConfigs<C>>) => {
      const params = buildParams(updates);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [buildParams, router, pathname]
  );

  const setters = useMemo(() => {
    const result = {} as Record<string, (value: unknown) => void>;
    for (const name of Object.keys(configs)) {
      result[name] = (value: unknown) => {
        setMultiple({ [name]: value } as Partial<StateFromConfigs<C>>);
      };
    }
    return result as SettersFromConfigs<C>;
  }, [configs, setMultiple]);

  return [state, setters, setMultiple];
}

// Helper factories

export function booleanParam(key: string, defaultValue: boolean = false): ParamConfig<boolean> {
  return {
    key,
    defaultValue,
    serialize: (value) => (value === defaultValue ? null : value ? '1' : '0'),
    deserialize: (raw) => (raw === null ? defaultValue : raw === '1'),
  };
}

export function stringParam(key: string, defaultValue: string = ''): ParamConfig<string> {
  return {
    key,
    defaultValue,
    serialize: (value) => (value === defaultValue ? null : value),
    deserialize: (raw) => (raw === null ? defaultValue : raw),
  };
}

export function enumParam<T extends string>(
  key: string,
  defaultValue: T,
  validValues: readonly T[]
): ParamConfig<T> {
  return {
    key,
    defaultValue,
    serialize: (value) => (value === defaultValue ? null : value),
    deserialize: (raw) => {
      if (raw === null) return defaultValue;
      return validValues.includes(raw as T) ? (raw as T) : defaultValue;
    },
  };
}
