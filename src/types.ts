import { ComponentType } from "react";

export interface BaseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper type to make all properties optional and nullable
export type SheetData<T = Record<string, any>> = {
  [K in keyof T]?: T[K] | undefined;
};

export interface SheetState<
  TKey extends string,
  TDataMap extends Record<TKey, any>
> {
  key: TKey;
  open: boolean;
  data: TDataMap[TKey];
  duplicateIndex: number;
}

export interface SheetManagerConfig<
  TKey extends string,
  TDataMap extends Record<TKey, any>
> {
  components: Record<TKey, ComponentType<BaseSheetProps & TDataMap[TKey]>>;
  onBeforeOpen?: <K extends TKey>(
    key: K,
    data: TDataMap[K]
  ) => Promise<void> | void;
  onBeforeClose?: (key: TKey) => Promise<void> | void;
  closeDelay?: number;
}
