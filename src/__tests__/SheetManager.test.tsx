// ============================================================================
// SheetManager.test.tsx - Updated tests for refactored architecture
// ============================================================================

import { render, act, waitFor, screen } from "@testing-library/react";
import { createSheetManager } from "../SheetManager";
import { ComponentType } from "react";

// Mock sheet components
const MockAccountSheet: ComponentType<any> = ({ open, onOpenChange, id }) => (
  <div data-testid="account-sheet">
    {open && <div data-testid="account-id">{id}</div>}
    <button onClick={() => onOpenChange(false)}>Close</button>
  </div>
);

const MockMerchantSheet: ComponentType<any> = ({
  open,
  onOpenChange,
  id,
  merchantName,
}) => (
  <div data-testid="merchant-sheet">
    {open && (
      <>
        <div data-testid="merchant-id">{id}</div>
        <div data-testid="merchant-name">{merchantName}</div>
      </>
    )}
    <button onClick={() => onOpenChange(false)}>Close</button>
  </div>
);

const MockUserSheet: ComponentType<any> = ({ open, onOpenChange, id }) => (
  <div data-testid="user-sheet">
    {open && <div data-testid="user-id">{id}</div>}
    <button onClick={() => onOpenChange(false)}>Close</button>
  </div>
);

const MockTransactionSheet: ComponentType<any> = ({
  open,
  onOpenChange,
  id,
}) => (
  <div data-testid="transaction-sheet">
    {open && <div data-testid="transaction-id">{id}</div>}
    <button onClick={() => onOpenChange(false)}>Close</button>
  </div>
);

// Define test types
interface TestSheetDataMap {
  account: { id: string | undefined };
  merchant: { id: string | undefined; merchantName: string | undefined };
  user: { id: string | undefined };
  transaction: { id: string | undefined };
}

type TestSheetKey = keyof TestSheetDataMap;

describe("SheetManager", () => {
  let mockOnBeforeOpen: jest.Mock;
  let mockOnBeforeClose: jest.Mock;

  beforeEach(() => {
    mockOnBeforeOpen = jest.fn().mockResolvedValue(undefined);
    mockOnBeforeClose = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createTestSheetManager = (overrides = {}) => {
    return createSheetManager<TestSheetKey, TestSheetDataMap>({
      components: {
        account: MockAccountSheet,
        merchant: MockMerchantSheet,
        user: MockUserSheet,
        transaction: MockTransactionSheet,
      },
      onBeforeOpen: mockOnBeforeOpen,
      onBeforeClose: mockOnBeforeClose,
      closeDelay: 100, // Faster for tests
      ...overrides,
    });
  };

  it("renders children and provides context", () => {
    const { SheetManagerProvider, useSheetManager } = createTestSheetManager();

    const TestComponent = () => {
      const { sheets } = useSheetManager();
      return <div data-testid="sheets-count">{sheets.length}</div>;
    };

    render(
      <SheetManagerProvider>
        <TestComponent />
      </SheetManagerProvider>
    );

    expect(screen.getByTestId("sheets-count")).toHaveTextContent("0");
  });

  it("throws error when useSheetManager is used outside provider", () => {
    const { useSheetManager } = createTestSheetManager();

    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const TestWithoutProvider = () => {
      useSheetManager();
      return <div>Should not render</div>;
    };

    expect(() => render(<TestWithoutProvider />)).toThrow(
      "useSheetManager must be used within SheetManagerProvider"
    );

    consoleSpy.mockRestore();
  });

  it("opens sheet after successful auth check", async () => {
    const { SheetManagerProvider, useSheetManager, SheetRenderer } =
      createTestSheetManager();

    const TestComponent = () => {
      const { sheets, openSheet } = useSheetManager();
      return (
        <div>
          <div data-testid="sheets-count">{sheets.length}</div>
          <button onClick={() => openSheet("account", { id: "123" })}>
            Open Account
          </button>
        </div>
      );
    };

    render(
      <SheetManagerProvider>
        <TestComponent />
        <SheetRenderer />
      </SheetManagerProvider>
    );

    await act(async () => {
      screen.getByText("Open Account").click();
    });

    expect(mockOnBeforeOpen).toHaveBeenCalledWith("account", { id: "123" });
    expect(screen.getByTestId("sheets-count")).toHaveTextContent("1");
    expect(screen.getByTestId("account-id")).toHaveTextContent("123");
  });

  it("closes specific sheet", async () => {
    const { SheetManagerProvider, useSheetManager, SheetRenderer } =
      createTestSheetManager();

    const TestComponent = () => {
      const { sheets, openSheet, closeSheet } = useSheetManager();
      return (
        <div>
          <div data-testid="sheets-count">{sheets.length}</div>
          <button onClick={() => openSheet("account", { id: "123" })}>
            Open Account
          </button>
          <button onClick={() => closeSheet("account")}>Close Account</button>
        </div>
      );
    };

    render(
      <SheetManagerProvider>
        <TestComponent />
        <SheetRenderer />
      </SheetManagerProvider>
    );

    await act(async () => {
      screen.getByText("Open Account").click();
    });
    expect(screen.getByTestId("sheets-count")).toHaveTextContent("1");

    await act(async () => {
      screen.getByText("Close Account").click();
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("sheets-count")).toHaveTextContent("0");
      },
      { timeout: 200 }
    );

    expect(mockOnBeforeClose).toHaveBeenCalledWith("account");
  });

  it("closes all sheets", async () => {
    const { SheetManagerProvider, useSheetManager, SheetRenderer } =
      createTestSheetManager();

    const TestComponent = () => {
      const { sheets, openSheet, closeAllSheets } = useSheetManager();
      return (
        <div>
          <div data-testid="sheets-count">{sheets.length}</div>
          <button onClick={() => openSheet("account", { id: "123" })}>
            Open Account
          </button>
          <button onClick={() => openSheet("user", { id: "456" })}>
            Open User
          </button>
          <button onClick={closeAllSheets}>Close All</button>
        </div>
      );
    };

    render(
      <SheetManagerProvider>
        <TestComponent />
        <SheetRenderer />
      </SheetManagerProvider>
    );

    await act(async () => {
      screen.getByText("Open Account").click();
    });
    await act(async () => {
      screen.getByText("Open User").click();
    });
    expect(screen.getByTestId("sheets-count")).toHaveTextContent("2");

    await act(async () => {
      screen.getByText("Close All").click();
    });

    expect(screen.getByTestId("sheets-count")).toHaveTextContent("0");
  });

  it("handles multiple sheets of same type with duplicateIndex", async () => {
    const { SheetManagerProvider, useSheetManager, SheetRenderer } =
      createTestSheetManager();

    const TestComponent = () => {
      const { sheets, openSheet } = useSheetManager();
      return (
        <div>
          <div data-testid="sheets-count">{sheets.length}</div>
          <button onClick={() => openSheet("account", { id: "1" })}>
            Open First
          </button>
          <button onClick={() => openSheet("account", { id: "2" })}>
            Open Second
          </button>
        </div>
      );
    };

    render(
      <SheetManagerProvider>
        <TestComponent />
        <SheetRenderer />
      </SheetManagerProvider>
    );

    await act(async () => {
      screen.getByText("Open First").click();
    });
    expect(screen.getByTestId("sheets-count")).toHaveTextContent("1");

    await act(async () => {
      screen.getByText("Open Second").click();
    });
    expect(screen.getByTestId("sheets-count")).toHaveTextContent("2");

    // Both sheets should be rendered
    const accountSheets = screen.getAllByTestId("account-sheet");
    expect(accountSheets).toHaveLength(2);
  });

  it("provides correct sheet data structure", async () => {
    const { SheetManagerProvider, useSheetManager, SheetRenderer } =
      createTestSheetManager();

    const TestComponent = () => {
      const { sheets, openSheet } = useSheetManager();
      return (
        <div>
          <div data-testid="sheets-count">{sheets.length}</div>
          <button
            onClick={() =>
              openSheet("merchant", {
                id: "merchant-123",
                merchantName: "Test Merchant",
              })
            }
          >
            Open Merchant
          </button>
        </div>
      );
    };

    render(
      <SheetManagerProvider>
        <TestComponent />
        <SheetRenderer />
      </SheetManagerProvider>
    );

    await act(async () => {
      screen.getByText("Open Merchant").click();
    });

    expect(screen.getByTestId("merchant-id")).toHaveTextContent("merchant-123");
    expect(screen.getByTestId("merchant-name")).toHaveTextContent(
      "Test Merchant"
    );
  });

  it("handles different sheet types and closes all", async () => {
    const { SheetManagerProvider, useSheetManager, SheetRenderer } =
      createTestSheetManager();

    const TestComponent = () => {
      const { sheets, openSheet, closeAllSheets } = useSheetManager();
      return (
        <div>
          <div data-testid="sheets-count">{sheets.length}</div>
          <button onClick={() => openSheet("user", { id: "user-1" })}>
            Open User
          </button>
          <button onClick={() => openSheet("transaction", { id: "txn-1" })}>
            Open Transaction
          </button>
          <button onClick={closeAllSheets}>Close All</button>
        </div>
      );
    };

    render(
      <SheetManagerProvider>
        <TestComponent />
        <SheetRenderer />
      </SheetManagerProvider>
    );

    await act(async () => {
      screen.getByText("Open User").click();
    });
    expect(screen.getByTestId("sheets-count")).toHaveTextContent("1");

    await act(async () => {
      screen.getByText("Open Transaction").click();
    });
    expect(screen.getByTestId("sheets-count")).toHaveTextContent("2");

    await act(async () => {
      screen.getByText("Close All").click();
    });

    expect(screen.getByTestId("sheets-count")).toHaveTextContent("0");
  });

  it("respects custom closeDelay from provider props", async () => {
    const { SheetManagerProvider, useSheetManager, SheetRenderer } =
      createTestSheetManager();

    const TestComponent = () => {
      const { sheets, openSheet, closeSheet } = useSheetManager();
      return (
        <div>
          <div data-testid="sheets-count">{sheets.length}</div>
          <button onClick={() => openSheet("account", { id: "123" })}>
            Open Account
          </button>
          <button onClick={() => closeSheet("account")}>Close Account</button>
        </div>
      );
    };

    render(
      <SheetManagerProvider closeDelay={50}>
        <TestComponent />
        <SheetRenderer />
      </SheetManagerProvider>
    );

    await act(async () => {
      screen.getByText("Open Account").click();
    });

    await act(async () => {
      screen.getByText("Close Account").click();
    });

    // Should be removed within 50ms + buffer
    await waitFor(
      () => {
        expect(screen.getByTestId("sheets-count")).toHaveTextContent("0");
      },
      { timeout: 100 }
    );
  });

  it("handles missing component gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

    const { SheetManagerProvider, useSheetManager, SheetRenderer } =
      createSheetManager<TestSheetKey, TestSheetDataMap>({
        components: {
          account: MockAccountSheet,
          // Missing other components
        } as any,
        closeDelay: 100,
      });

    const TestComponent = () => {
      const { openSheet } = useSheetManager();
      return (
        <button onClick={() => openSheet("user", { id: "123" })}>
          Open User
        </button>
      );
    };

    render(
      <SheetManagerProvider>
        <TestComponent />
        <SheetRenderer />
      </SheetManagerProvider>
    );

    await act(async () => {
      screen.getByText("Open User").click();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("No component registered for sheet key: user")
    );

    consoleSpy.mockRestore();
  });

  it("closes the most recent sheet when multiple of same type exist", async () => {
    const { SheetManagerProvider, useSheetManager, SheetRenderer } =
      createTestSheetManager();

    const TestComponent = () => {
      const { sheets, openSheet, closeSheet } = useSheetManager();
      return (
        <div>
          <div data-testid="sheets-count">{sheets.length}</div>
          <button onClick={() => openSheet("account", { id: "1" })}>
            Open 1
          </button>
          <button onClick={() => openSheet("account", { id: "2" })}>
            Open 2
          </button>
          <button onClick={() => openSheet("account", { id: "3" })}>
            Open 3
          </button>
          <button onClick={() => closeSheet("account")}>Close Last</button>
        </div>
      );
    };

    render(
      <SheetManagerProvider>
        <TestComponent />
        <SheetRenderer />
      </SheetManagerProvider>
    );

    await act(async () => {
      screen.getByText("Open 1").click();
    });
    await act(async () => {
      screen.getByText("Open 2").click();
    });
    await act(async () => {
      screen.getByText("Open 3").click();
    });
    expect(screen.getByTestId("sheets-count")).toHaveTextContent("3");

    await act(async () => {
      screen.getByText("Close Last").click();
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("sheets-count")).toHaveTextContent("2");
      },
      { timeout: 200 }
    );
  });
});
