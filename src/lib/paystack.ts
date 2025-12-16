// Paystack server-side helper (use only on server/API routes)
// Chooses test or live secret based on environment.

type PaystackInit = { secretKey: string | null; baseURL: string; mode: "live" | "test" | "mock" };

export function initPaystack(): PaystackInit {
  const modeEnv = (process.env.PAYSTACK_MODE || "").toLowerCase();
  const testKey = process.env.PAYSTACK_TEST_SECRET_KEY || "";
  const liveKey = process.env.PAYSTACK_LIVE_SECRET_KEY || "";

  // Mode selection: explicit PAYSTACK_MODE overrides; else prefer test key if present
  let mode: PaystackInit["mode"] = "live";
  let secretKey = liveKey;

  if (modeEnv === "test") {
    mode = "test";
    secretKey = testKey || liveKey;
  } else if (modeEnv === "live") {
    mode = "live";
    secretKey = liveKey;
  } else {
    // auto-detect: prefer test key if available
    if (testKey) {
      mode = "test";
      secretKey = testKey;
    } else if (liveKey) {
      mode = "live";
      secretKey = liveKey;
    } else {
      throw new Error("No Paystack secret key configured (set PAYSTACK_TEST_SECRET_KEY or PAYSTACK_LIVE_SECRET_KEY)");
    }
  }

  return { secretKey, baseURL: "https://api.paystack.co", mode };
}

// In-memory mock transactions for local/mock mode
export const mockTransactions: Record<string, {
  status: string;
  amount: number;
  email: string;
  metadata?: Record<string, unknown>;
  reference: string;
  createdAt: number;
  paidAt?: number;
}> = {};

export async function createPaystackTransaction(
  email: string,
  amount: number, // in kobo (NGN × 100)
  reference: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>
) {
  const init = initPaystack();

  if (init.mode === "mock") {
    // store a mock transaction and return a mock authorization URL
    mockTransactions[reference] = {
      status: "initialized",
      amount,
      email,
      metadata: metadata || {},
      reference,
      createdAt: Date.now(),
    };

    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const authorization_url = `${base}/api/checkout/mock-redirect?reference=${encodeURIComponent(reference)}`;
    return { status: true, data: { authorization_url, access_code: `MOCK-${reference}` } };
  }

  const { secretKey, baseURL } = init;

  if (!secretKey) {
    throw new Error("No Paystack secret key available for non-mock mode");
  }

  const response = await fetch(`${baseURL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount,
      reference,
      metadata: metadata || {},
    }),
  });

  if (!response.ok) {
    throw new Error(`Paystack error: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

export async function verifyPaystackTransaction(reference: string) {
  const init = initPaystack();

  if (init.mode === "mock") {
    const tx = mockTransactions[reference];
    if (!tx) return { status: false, message: "Not found", data: null };
    return {
      status: true,
      data: {
        amount: tx.amount,
        reference: tx.reference,
        status: tx.status === "success" ? "success" : "pending",
        customer: { email: tx.email },
        metadata: tx.metadata || {},
      },
    };
  }

  const { secretKey, baseURL } = init;

  if (!secretKey) {
    throw new Error("No Paystack secret key available for non-mock mode");
  }

  const response = await fetch(`${baseURL}/transaction/verify/${reference}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Paystack verification failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}