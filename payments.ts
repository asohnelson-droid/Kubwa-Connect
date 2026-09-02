
import { PaymentIntent, User } from '../types';
import { supabase } from './supabase';

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: any) => { openIframe: () => void };
    };
  }
}

// process.env.PAYSTACK_PUBLIC_KEY never actually worked -- Vite only exposes
// browser env vars through import.meta.env with a VITE_ prefix, and nothing
// wired this one in at all. This is the corrected, working equivalent,
// matching how the Supabase URL/key are already handled.
const PAYSTACK_PUBLIC_KEY = (import.meta as any).env?.VITE_PAYSTACK_PUBLIC_KEY as string | undefined;

export interface PaymentResult {
  success: boolean;
  error?: string;
}

const TIER_PRICES: Record<PaymentIntent, number> = {
  VENDOR_VERIFIED: 2000,
  VENDOR_FEATURED: 5000,
  FIXIT_VERIFIED: 2000,
};

export const PaymentService = {
  getPrice(intent: PaymentIntent): number {
    return TIER_PRICES[intent];
  },

  /**
   * Opens the real Paystack popup, then -- critically -- never trusts its
   * own success callback as the final word. The popup reporting "success"
   * only means the user completed the flow in their browser; it proves
   * nothing about whether real money actually moved. The reference is sent
   * to verify-paystack-payment, which re-checks the transaction directly
   * with Paystack's own API using the secret key, and only that server-side
   * check ever grants the paid tier.
   */
  async pay(intent: PaymentIntent, user: User): Promise<PaymentResult> {
    if (!PAYSTACK_PUBLIC_KEY) {
      return { success: false, error: "Payments aren't set up yet. Please try again later." };
    }
    if (!window.PaystackPop) {
      return { success: false, error: "Paystack failed to load. Please refresh and try again." };
    }

    const amount = TIER_PRICES[intent];

    const popupResult = await new Promise<{ success: boolean; reference?: string; error?: string }>((resolve) => {
      try {
        const handler = window.PaystackPop.setup({
          key: PAYSTACK_PUBLIC_KEY,
          email: user.email,
          amount: amount * 100, // Paystack expects kobo
          currency: 'NGN',
          ref: `KC-${intent}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          metadata: {
            custom_fields: [
              { display_name: "Payment Intent", variable_name: "intent", value: intent },
              { display_name: "User ID", variable_name: "user_id", value: user.id }
            ]
          },
          callback: (response: any) => {
            resolve({ success: true, reference: response.reference });
          },
          onClose: () => {
            resolve({ success: false, error: 'Payment window was closed.' });
          }
        });
        handler.openIframe();
      } catch (err: any) {
        resolve({ success: false, error: err.message || "Could not start Paystack." });
      }
    });

    if (!popupResult.success || !popupResult.reference) {
      return { success: false, error: popupResult.error || "Payment was not completed." };
    }

    // The only step that actually matters: real, server-side verification.
    const { data, error } = await supabase.functions.invoke('verify-paystack-payment', {
      body: { reference: popupResult.reference, intent }
    });

    if (error || !data?.success) {
      return { success: false, error: data?.error || error?.message || "We couldn't verify your payment. If you were charged, contact support with reference: " + popupResult.reference };
    }

    return { success: true };
  }
};
