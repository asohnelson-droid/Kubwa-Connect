
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
  VENDOR_FEATURED: 3000,
  FIXIT_VERIFIED: 2000,
};

export const PaymentService = {
  getPrice(intent: PaymentIntent): number {
    return TIER_PRICES[intent];
  },

  /**
   * Same pattern as pay(), for a Mart order instead of a tier upgrade. The
   * amount shown in the Paystack popup is for display/UX only -- the actual
   * amount that's allowed to succeed is recomputed server-side from real
   * product prices in verify-order-payment, never trusted from here.
   */
  async payForOrder(params: {
    user: User;
    vendorId: string;
    items: { id: string; quantity: number; name?: string }[];
    total: number;
    deliveryOption: string;
    deliveryAddress?: string;
    contactPhone: string;
  }): Promise<PaymentResult & { orderId?: string }> {
    if (!PAYSTACK_PUBLIC_KEY) {
      return { success: false, error: "Online payment isn't set up yet. Please choose Pay on Delivery." };
    }
    if (!window.PaystackPop) {
      return { success: false, error: "Paystack failed to load. Please refresh and try again." };
    }

    const popupResult = await new Promise<{ success: boolean; reference?: string; error?: string }>((resolve) => {
      try {
        const handler = window.PaystackPop.setup({
          key: PAYSTACK_PUBLIC_KEY,
          email: params.user.email,
          amount: Math.round(params.total * 100),
          currency: 'NGN',
          ref: `KC-ORDER-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
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

    const { data, error } = await supabase.functions.invoke('verify-order-payment', {
      body: {
        reference: popupResult.reference,
        vendorId: params.vendorId,
        items: params.items,
        deliveryOption: params.deliveryOption,
        deliveryAddress: params.deliveryAddress,
        contactPhone: params.contactPhone
      }
    });

    if (error || !data?.success) {
      return { success: false, error: data?.error || error?.message || "We couldn't verify your payment. If you were charged, contact support with reference: " + popupResult.reference };
    }

    return { success: true, orderId: data.orderId };
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
