
import { User, PaymentIntent } from '../types';

/**
 * TYPE DEFINITIONS for Paystack Global Object (Loaded via index.html script)
 */
declare global {
  interface Window {
    PaystackPop: {
      setup: (config: any) => { openIframe: () => void };
    };
  }
}

/**
 * CONFIGURATION: 
 * We prioritize Paystack if the Public Key exists in the environment.
 */
const P_KEY = process.env.PAYSTACK_PUBLIC_KEY;
const ACTIVE_PROVIDER: 'MOCK' | 'PAYSTACK' = (P_KEY && P_KEY !== 'undefined' && P_KEY !== '') ? 'PAYSTACK' : 'MOCK';

export interface PaymentResponse {
  success: boolean;
  reference: string;
  error?: string;
}

/**
 * THE PAYMENT ENGINE
 * Decouples the UI from the specific payment gateway logic.
 */
export const PaymentService = {
  
  async pay(intent: PaymentIntent, amount: number, user: User): Promise<PaymentResponse> {
    console.log(`[PaymentService] Intent: ${intent} | Provider: ${ACTIVE_PROVIDER}`);

    if (ACTIVE_PROVIDER === 'PAYSTACK') {
      return this._payWithPaystack(intent, amount, user);
    }

    // Default Fallback: Mock Engine
    return this._simulateMockPayment(intent, amount);
  },

  /**
   * PAYSTACK INLINE IMPLEMENTATION
   * Uses the PaystackPop object from the global window scope.
   */
  async _payWithPaystack(intent: PaymentIntent, amount: number, user: User): Promise<PaymentResponse> {
    return new Promise((resolve) => {
      try {
        if (!window.PaystackPop) {
          throw new Error("Paystack SDK failed to load. Please refresh.");
        }

        const handler = window.PaystackPop.setup({
          key: P_KEY,
          email: user.email,
          amount: amount * 100, // Paystack expects Kobo (Naira * 100)
          currency: 'NGN',
          ref: `KC-${intent}-${Math.floor((Math.random() * 1000000000) + 1)}`,
          metadata: {
            custom_fields: [
              {
                display_name: "Payment Intent",
                variable_name: "intent",
                value: intent
              },
              {
                display_name: "User ID",
                variable_name: "user_id",
                value: user.id
              }
            ]
          },
          callback: (response: any) => {
            // SUCCESS: Response includes 'reference' and 'status'
            console.log("[Paystack] Payment Successful:", response);
            resolve({
              success: true,
              reference: response.reference
            });
          },
          onClose: () => {
            // USER CANCELLED
            console.log("[Paystack] Window Closed");
            resolve({
              success: false,
              reference: '',
              error: 'Payment window was closed.'
            });
          }
        });

        handler.openIframe();
      } catch (err: any) {
        console.error("[Paystack] Initialization Error:", err);
        resolve({
          success: false,
          reference: '',
          error: err.message || "Could not start Paystack."
        });
      }
    });
  },

  /**
   * INTERNAL: Mock Engine
   * Realistic behavior for local dev and testing.
   */
  async _simulateMockPayment(intent: PaymentIntent, amount: number): Promise<PaymentResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const isSuccess = Math.random() > 0.1;
        if (isSuccess) {
          resolve({
            success: true,
            reference: `KCB-MOCK-${Math.random().toString(36).substring(7).toUpperCase()}`
          });
        } else {
          resolve({
            success: false,
            reference: '',
            error: 'Transaction declined (Mock Error)'
          });
        }
      }, 1500);
    });
  }
};
