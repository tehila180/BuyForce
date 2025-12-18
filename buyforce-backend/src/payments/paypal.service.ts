import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PaypalService {
  private baseUrl() {
    return process.env.PAYPAL_ENV === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  async getAccessToken() {
    const clientId = process.env.PAYPAL_CLIENT_ID!;
    const secret = process.env.PAYPAL_SECRET!;
    const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');

    const res = await axios.post(
      `${this.baseUrl()}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    return res.data.access_token as string;
  }

  async createOrder(amountIls: number, paymentId: number) {
    const token = await this.getAccessToken();
    const backend = process.env.BACKEND_URL || 'http://localhost:3001';
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';

    const res = await axios.post(
      `${this.baseUrl()}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'ILS',
              value: (amountIls / 100).toFixed(2), // אם amount באגורות → מחלקים ב-100
            },
          },
        ],
        application_context: {
          return_url: `${backend}/payments/paypal/capture?paymentId=${paymentId}`,
          cancel_url: `${frontend}/payment/cancel?paymentId=${paymentId}`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return res.data;
  }

  async captureOrder(orderId: string) {
    const accessToken = await this.getAccessToken();
    await axios.post(
      `${this.baseUrl()}/v2/checkout/orders/${orderId}/capture`,
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
  }
}
