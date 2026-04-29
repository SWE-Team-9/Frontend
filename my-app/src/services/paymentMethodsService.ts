import api from "./api";

export interface SetupIntentResponse {
  clientSecret: string;
}

export interface AttachPaymentMethodDto {
  paymentMethodId: string;
  setAsDefault?: boolean;
}

export interface SavedPaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  cardholderName: string | null;
  isDefault: boolean;
  createdAt: string;
}

export interface DeletePaymentMethodResponse {
  subscriptionScheduledToCancel?: boolean;
  expiresAt?: string;
}

export const createSetupIntent = async (): Promise<SetupIntentResponse> => {
  const response = await api.post("/payment-methods/setup-intent");
  return response.data as SetupIntentResponse;
};

export const attachPaymentMethod = async (
  dto: AttachPaymentMethodDto,
): Promise<SavedPaymentMethod> => {
  const response = await api.post("/payment-methods/attach", dto);
  return response.data as SavedPaymentMethod;
};

export const listPaymentMethods = async (): Promise<SavedPaymentMethod[]> => {
  const response = await api.get("/payment-methods");
  return response.data as SavedPaymentMethod[];
};

export const setDefaultPaymentMethod = async (
  paymentMethodId: string,
): Promise<SavedPaymentMethod> => {
  const response = await api.post(`/payment-methods/${paymentMethodId}/default`);
  return response.data as SavedPaymentMethod;
};

export const deletePaymentMethod = async (
  paymentMethodId: string,
): Promise<DeletePaymentMethodResponse> => {
  const response = await api.delete(`/payment-methods/${paymentMethodId}`);
  return response.data as DeletePaymentMethodResponse;
};