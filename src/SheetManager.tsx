import {
  ReactNode,
  useState,
  useContext,
  createContext,
  useCallback,
} from "react";
import { SheetManagerConfig, SheetState } from "./types";

interface SheetContextValue<
  TKey extends string,
  TDataMap extends Record<TKey, any>
> {
  sheets: SheetState<TKey, TDataMap>[];
  openSheet: <K extends TKey>(key: K, data: TDataMap[K]) => Promise<void>;
  closeSheet: (key: TKey) => void;
  closeAllSheets: () => void;
}

function createSheetContext<
  TKey extends string,
  TDataMap extends Record<TKey, any>
>() {
  return createContext<SheetContextValue<TKey, TDataMap> | undefined>(
    undefined
  );
}

interface SheetManagerProviderProps {
  children: ReactNode;
  closeDelay?: number;
}

export function createSheetManager<
  TKey extends string,
  TDataMap extends Record<TKey, any>
>(config: SheetManagerConfig<TKey, TDataMap>) {
  const SheetContext = createSheetContext<TKey, TDataMap>();

  const SheetManagerProvider = ({
    children,
    closeDelay: propCloseDelay,
  }: SheetManagerProviderProps) => {
    const [sheets, setSheets] = useState<SheetState<TKey, TDataMap>[]>([]);
    const closeDelay = propCloseDelay ?? config.closeDelay ?? 300;

    const openSheet = useCallback(
      async <K extends TKey>(key: K, data: TDataMap[K]) => {
        try {
          if (config.onBeforeOpen) {
            await config.onBeforeOpen(key, data);
          }

          const duplicateIndex = sheets.filter(
            (item) => item.key === key
          ).length;
          setSheets((prev) => [
            ...prev,
            { key, open: true, data, duplicateIndex },
          ]);
        } catch (error) {
          console.error("Failed to open sheet:", error);
          throw error;
        }
      },
      [sheets, config]
    );

    const closeSheet = useCallback(
      async (key: TKey) => {
        try {
          if (config.onBeforeClose) {
            await config.onBeforeClose(key);
          }

          setSheets((prev) => {
            const index = prev.findLastIndex((s) => s.key === key);
            if (index === -1) return prev;

            const updatedSheets = [...prev];
            updatedSheets[index] = { ...updatedSheets[index], open: false };

            setTimeout(() => {
              setSheets((sheets) => sheets.filter((_, i) => i !== index));
            }, closeDelay);

            return updatedSheets;
          });
        } catch (error) {
          console.error("Failed to close sheet:", error);
        }
      },
      [config, closeDelay]
    );

    const closeAllSheets = useCallback(() => {
      setSheets([]);
    }, []);

    return (
      <SheetContext.Provider
        value={{ sheets, openSheet, closeSheet, closeAllSheets }}
      >
        {children}
      </SheetContext.Provider>
    );
  };

  const useSheetManager = () => {
    const context = useContext(SheetContext);
    if (!context) {
      throw new Error(
        "useSheetManager must be used within SheetManagerProvider"
      );
    }
    return context;
  };

  const SheetRenderer = () => {
    const { sheets, closeSheet } = useSheetManager();

    return (
      <>
        {sheets.map(({ key, open, data, duplicateIndex }) => {
          const Component = config.components[key];
          if (!Component) {
            console.warn(`No component registered for sheet key: ${key}`);
            return null;
          }

          return (
            <Component
              key={duplicateIndex > 0 ? `${key}-${duplicateIndex}` : key}
              open={open}
              onOpenChange={() => closeSheet(key)}
              {...data}
            />
          );
        })}
      </>
    );
  };

  return {
    SheetManagerProvider,
    useSheetManager,
    SheetRenderer,
  };
}
