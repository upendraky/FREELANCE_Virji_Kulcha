declare module "@cashfreepayments/cashfree-js" {
  type CashfreeMode = "sandbox" | "production";

  interface CheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: "_self" | "_blank" | "_top" | "_modal";
  }

  interface CashfreeInstance {
    checkout(options: CheckoutOptions): Promise<unknown>;
  }

  export function load(options: {
    mode: CashfreeMode;
  }): Promise<CashfreeInstance>;
}
