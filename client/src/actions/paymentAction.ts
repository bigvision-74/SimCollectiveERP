import axios from "axios";
import env from "../../env";

interface PaymentIntentRequest {
  amount: number;
  currency?: string;
  metadata?: {
    [key: string]: any;
  };
}

interface PaymentConfirmationRequest {
  paymentIntentId: string;
  billingName: string;
  institutionName: string;
  planTitle: string;
  planDuration: string;
}

interface CreatePaymentResponse {
  success: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  error?: string;
}

interface ConfirmPaymentResponse {
  success: boolean;
  payment?: any;
  error?: string;
}

export const createPaymentAction = async (request: PaymentIntentRequest): Promise<CreatePaymentResponse> => {
  try {
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/create-payment-intent`,
      request
    );

    return {
      success: true,
      clientSecret: response.data.clientSecret,
      paymentIntentId: response.data.paymentIntentId || response.data.id
    };
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    
    return {
      success: false,
      error: error.response?.data?.error || error.message || "Failed to create payment intent"
    };
  }
};

export const confirmPaymentAction = async (
  request: PaymentConfirmationRequest
): Promise<ConfirmPaymentResponse> => {
  try {
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/confirm-payment`,
      request
    );

    return {
      success: response.data.success,
      payment: response.data.payment
    };
  } catch (error: any) {
    console.error("Error confirming payment:", error);
    
    return {
      success: false,
      error: error.response?.data?.error || error.message || "Failed to confirm payment"
    };
  }
};