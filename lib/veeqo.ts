const VEEQO_API_BASE_URL = 'https://api.veeqo.com';

interface VeeqoApiOptions {
  method: string;
  headers: {
    'x-api-key': string;
    'Content-Type': string;
  };
  body?: string;
}

async function veeqoRequest(endpoint: string, options: Partial<VeeqoApiOptions> = {}) {
  const apiKey = process.env.VEEQO_API_KEY;

  if (!apiKey) {
    throw new Error('VEEQO_API_KEY is not configured');
  }

  const url = `${VEEQO_API_BASE_URL}${endpoint}`;

  const requestOptions: VeeqoApiOptions = {
    method: options.method || 'GET',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  if (options.body) {
    requestOptions.body = options.body;
  }

  const response = await fetch(url, requestOptions);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Veeqo API error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  return response.json();
}

export async function createVeeqoOrder(payload: any) {
  try {
    const result = await veeqoRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return result;
  } catch (error) {
    console.error('Failed to create Veeqo order:', error);
    throw error;
  }
}

export async function getVeeqoOrder(orderId: string | number) {
  try {
    const result = await veeqoRequest(`/orders/${orderId}`, {
      method: 'GET',
    });

    return result;
  } catch (error) {
    console.error(`Failed to get Veeqo order ${orderId}:`, error);
    throw error;
  }
}
