import axios from "axios";
import env from "../../env";

interface PaymentIntentRequest {
  amount?: number;
  currency?: string;
  planType?: string;
  metadata?: {
    [key: string]: any;
  };
}

interface CreateCustomerRequest {
  email: string;
  name: string;
  metadata?: Record<string, string>;
}

interface CreateCustomerResponse {
  success: boolean;
  customerId?: string;
  error?: string;
}

interface CreateSubscriptionRequest {
  customerId: string;
  priceId: string;
  metadata?: Record<string, string>;
  paymentMethodId?: string;
}

interface CreateSubscriptionResponse {
  success: boolean;
  clientSecret?: string;
  subscriptionId?: string;
  error?: string;
  requiresPayment?: boolean;
  subscriptionStatus?: string;
}

interface CreatePaymentResponse {
  success: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  error?: string;
  requiresSetup?: boolean;
  subscriptionId?: string;
}

interface ConfirmPaymentResponse {
  success: boolean;
  payment?: any;
  error?: string;
}

export const createPaymentAction = async (
  request: PaymentIntentRequest
): Promise<CreatePaymentResponse> => {
  try {
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/create-payment-intent`,
      request
    );

    return {
      success: true,
      clientSecret: response.data.clientSecret,
      paymentIntentId: response.data.paymentIntentId || response.data.id,
    };
  } catch (error: any) {
    console.error("Error creating payment intent:", error);

    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Failed to create payment intent",
    };
  }
};


// customerActions.ts
export const createCustomerAction = async (
  request: CreateCustomerRequest
): Promise<CreateCustomerResponse> => {
  try {
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/create-customer`,
      request,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      customerId: response.data.customerId,
    };
  } catch (error: any) {
    console.error("Error creating customer:", error);
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Failed to create customer",
    };
  }
};


// subscriptionActions.ts
export const createSubscriptionAction = async (
  request: CreateSubscriptionRequest
): Promise<CreateSubscriptionResponse> => {
  try {
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/create-subscription`,
      request,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      clientSecret: response.data.clientSecret,
      subscriptionId: response.data.subscriptionId,
    };
  } catch (error: any) {
    console.error("Error creating subscription:", error);
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Failed to create subscription",
    };
  }
};

export const confirmUpdatePaymentAction = async (
  request: FormData
): Promise<ConfirmPaymentResponse> => {
  try {
    const response = await axios.put(
      `${env.REACT_APP_BACKEND_URL}/updatePayment`,
      request,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: response.data.success,
      payment: response.data.payment,
    };
  } catch (error: any) {
    console.error("Error confirming payment:", error);

    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Failed to confirm payment",
    };
  }
};

export const confirmPaymentAction = async (
  request: FormData
): Promise<ConfirmPaymentResponse> => {
  try {
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/confirm-payment`,
      request
    );

    return {
      success: response.data.success,
      payment: response.data.payment,
    };
  } catch (error: any) {
    console.error("Error confirming payment:", error);

    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Failed to confirm payment",
    };
  }
};


export const attachPaymentMethodAction = async (
  request: FormData
): Promise<ConfirmPaymentResponse> => {
  try {
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/attachPaymentMethod`,
      request
    );

    return {
      success: response.data.success,
      payment: response.data.payment,
    };
  } catch (error: any) {
    console.error("Error confirming payment:", error);

    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Failed to confirm payment",
    };
  }
};
