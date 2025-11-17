# Shadcnui Sheet Manager

A type-safe, flexible sheet/modal management library for React applications. **Built specifically for shadcn/ui**, but compatible with any UI library that follows the `open`/`onOpenChange` pattern.

[![npm version](https://badge.fury.io/js/react-sheet-manager.svg)](https://www.npmjs.com/package/react-sheet-manager)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📦 Installation

```bash
npm install react-sheet-manager
```

```bash
yarn add react-sheet-manager
```

```bash
pnpm add react-sheet-manager
```

## 🚀 Quick Start

### 1. Define Your Sheet Types

First, define the types for your sheets and their data:

```typescript
// types/sheets.ts
interface MySheetDataMap {
  account: { id: string };
  merchant: { id: string; merchantName?: string };
  user: { id: string };
  transaction: { id: string };
}

type MySheetKey = keyof MySheetDataMap;
```

### 2. Create Your Sheet Manager

Import your sheet components and create a sheet manager instance:

```typescript
// lib/sheet-manager.ts
import { createSheetManager } from "react-sheet-manager";
import { ShowAccountSheet } from "./components/ShowAccountSheet";
import { ShowMerchantSheet } from "./components/ShowMerchantSheet";
import { ShowUserSheet } from "./components/ShowUserSheet";
import { ShowTransactionSheet } from "./components/ShowTransactionSheet";

export const { SheetManagerProvider, useSheetManager, SheetRenderer } =
  createSheetManager<MySheetKey, MySheetDataMap>({
    components: {
      account: ShowAccountSheet,
      merchant: ShowMerchantSheet,
      user: ShowUserSheet,
      transaction: ShowTransactionSheet,
    },
    onBeforeOpen: async (key, data) => {
      // Optional
      console.log(`Opening ${key} sheet with data:`, data);
    },
    closeDelay: 300, // Animation delay in milliseconds
  });
```

### 3. Wrap Your App with Provider

```typescript
// App.tsx
import { SheetManagerProvider, SheetRenderer } from "./lib/sheet-manager";

function App() {
  return (
    <SheetManagerProvider>
      <YourAppContent />
      <SheetRenderer />
    </SheetManagerProvider>
  );
}

export default App;
```

### 4. Use in Your Components

```typescript
// components/UserList.tsx
import { useSheetManager } from "../lib/sheet-manager";

function UserList() {
  const { openSheet } = useSheetManager();

  const handleViewUser = (userId: string) => {
    // Data is optional - you can pass it or not
    openSheet("user", { id: userId });
  };

  const handleCreateUser = () => {
    // Open sheet without any data
    openSheet("user");
  };

  return (
    <div>
      <button onClick={() => handleViewUser("123")}>View User Profile</button>
      <button onClick={handleCreateUser}>Create New User</button>
    </div>
  );
}
```

## 📖 Complete Example

Here's a full working example with shadcn/ui:

```typescript
// lib/sheet-manager.ts
import { createSheetManager } from "react-sheet-manager";

// Define your sheet data types
interface AppSheetDataMap {
  account: { id: string };
  merchant: { id: string; merchantName: string };
  user: { id: string };
}

type AppSheetKey = keyof AppSheetDataMap;

// Import your shadcn/ui sheet components
import { ShowAccountSheet } from "../widgets/lists/Accounts/ShowAccountSheet";
import { ShowMerchantSheet } from "../widgets/lists/Merchants/ShowMerchantSheet";
import { ShowUserSheet } from "../widgets/lists/Users/ShowUserSheet";

// Create sheet manager with authentication
export const { SheetManagerProvider, useSheetManager, SheetRenderer } =
  createSheetManager<AppSheetKey, AppSheetDataMap>({
    components: {
      account: ShowAccountSheet,
      merchant: ShowMerchantSheet,
      user: ShowUserSheet,
    },
    onBeforeOpen: async (key, data) => {},
    onBeforeClose: (key) => {
      console.log(`Closing ${key} sheet`);
    },
    closeDelay: 300,
  });
```

Example shadcn/ui Sheet component:

```typescript
// components/ShowAccountSheet.tsx
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface ShowAccountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  id?: string;
}

export function ShowAccountSheet({
  open,
  onOpenChange,
  id,
}: ShowAccountSheetProps) {
  const [account, setAccount] = useState(null);
  const isCreateMode = !id;

  useEffect(() => {
    if (id) {
      // Fetch account data
      fetchAccount(id).then(setAccount);
    }
  }, [id]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {isCreateMode ? "Create New Account" : "Account Details"}
          </SheetTitle>
          <SheetDescription>
            {isCreateMode
              ? "Fill in the account information below"
              : `Viewing account ${id}`}
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          {isCreateMode ? (
            <form>
              {/* Create form */}
              <Button type="submit">Create Account</Button>
            </form>
          ) : (
            <div>
              {/* Display account details */}
              <p>Account ID: {id}</p>
              {account && <p>Balance: {account.balance}</p>}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

```typescript
// App.tsx
import { SheetManagerProvider, SheetRenderer } from "./lib/sheet-manager";

function App() {
  return (
    <SheetManagerProvider>
      <Layout>
        <Routes />
      </Layout>
      <SheetRenderer />
    </SheetManagerProvider>
  );
}
```

```typescript
// components/MerchantTable.tsx
import { useSheetManager } from "../lib/sheet-manager";

function MerchantTable({ merchants }) {
  const { openSheet } = useSheetManager();

  return (
    <table>
      <tbody>
        {merchants.map((merchant) => (
          <tr key={merchant.id}>
            <td>{merchant.name}</td>
            <td>
              <button
                onClick={() =>
                  openSheet("merchant", {
                    id: merchant.id,
                    merchantName: merchant.name,
                  })
                }
              >
                View Details
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## 🎯 API Reference

### `createSheetManager<TKey, TDataMap>(config)`

Creates a sheet manager instance with the specified configuration.

#### Parameters

```typescript
interface SheetManagerConfig<TKey, TDataMap> {
  // Required: Map of sheet keys to their components
  components: Record<TKey, ComponentType<BaseSheetProps & TDataMap[TKey]>>;

  // Optional: Called before opening a sheet (for auth, validation, etc.)
  onBeforeOpen?: <K extends TKey>(
    key: K,
    data: TDataMap[K]
  ) => Promise<void> | void;

  // Optional: Called before closing a sheet (for cleanup, etc.)
  onBeforeClose?: (key: TKey) => Promise<void> | void;

  // Optional: Delay in milliseconds before unmounting closed sheets (default: 300)
  closeDelay?: number;
}
```

#### Returns

```typescript
{
  SheetManagerProvider: ComponentType<{ children: ReactNode }>;
  useSheetManager: () => SheetContextValue;
  SheetRenderer: ComponentType;
}
```

### `useSheetManager()`

Hook to access sheet manager functions. Must be used within `SheetManagerProvider`.

#### Returns

```typescript
{
  // Array of currently open sheets
  sheets: SheetState<TKey, TDataMap>[];

  // Open a new sheet (data is optional and all properties are optional)
  openSheet: <K extends TKey>(key: K, data?: Partial<TDataMap[K]>) => Promise<void>;

  // Close the most recent sheet of the given type
  closeSheet: (key: TKey) => void;

  // Close all open sheets
  closeAllSheets: () => void;
}
```

### Close animation configuration override

```typescript
<SheetManagerProvider closeDelay={500}>
  <App />
</SheetManagerProvider>
```

## 🔧 Advanced Usage

### Multiple Sheet Manager Instances

Create separate managers for different contexts:

```typescript
// Modals
export const {
  SheetManagerProvider: ModalProvider,
  useSheetManager: useModals,
  SheetRenderer: ModalRenderer,
} = createSheetManager<ModalKey, ModalDataMap>({
  /* ... */
});

// Drawers
export const {
  SheetManagerProvider: DrawerProvider,
  useSheetManager: useDrawers,
  SheetRenderer: DrawerRenderer,
} = createSheetManager<DrawerKey, DrawerDataMap>({
  /* ... */
});

// Usage
<ModalProvider>
  <DrawerProvider>
    <App />
    <ModalRenderer />
    <DrawerRenderer />
  </DrawerProvider>
</ModalProvider>;
```

## 📋 Sheet Component Requirements

Your sheet components must follow the open/onOpenChange pattern with these props:

```typescript
interface BaseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Example with shadcn/ui Sheet component
interface AccountSheetProps extends BaseSheetProps {
  id?: string;
  name?: string;
}

function ShowAccountSheet({ open, onOpenChange, id, name }: AccountSheetProps) {
  const isCreateMode = !id;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {isCreateMode ? "Create Account" : "Account Details"}
          </SheetTitle>
          <SheetDescription>
            {isCreateMode
              ? "Enter account information"
              : `Viewing account ${id}`}
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          {id && <div>Account ID: {id}</div>}
          {name && <div>Account Name: {name}</div>}
          {!id && <div>Create new account form here</div>}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

**Important Notes:**

- `open` and `onOpenChange` are **required** props (standard pattern)
- All other data props are **optional** (automatically wrapped with `Partial<>`)
- This allows sheets to work in both "view" and "create" modes
- Check for data presence in your component to handle different modes

## 🎨 Works With

**Primary Support:**

- ✅ **shadcn/ui** - Sheet, Dialog, Drawer (Built specifically for this)

**Also Compatible With:**

- ✅ Radix UI - Any component using `open`/`onOpenChange`
- ✅ Headless UI - Dialog, Disclosure patterns
- ✅ Material-UI - Dialog, Drawer (with adapter)
- ✅ Chakra UI - Modal, Drawer (with adapter)

However, the library is designed to work with **any UI component** that accepts `open: boolean` and `onOpenChange: (open: boolean) => void` props.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT © David Grigoryan

## 🐛 Issues

Found a bug? Please [file an issue](https://github.com/ilert1/Shadcn-sheet-manager/issues).

## ⭐ Support

If you find this library helpful, please consider giving it a star on GitHub!

---

Made with ❤️ for the React community
