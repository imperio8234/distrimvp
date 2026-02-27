/**
 * src/lib/factus.ts
 * Cliente para la API de Factus (facturación electrónica Colombia)
 * Documentación: https://api-sandbox.factus.com.co
 */

const BASE_URL   = process.env.FACTUS_URL            ?? "https://api-sandbox.factus.com.co";
const CLIENT_ID  = process.env.FACTUS_CLIENT_ID      ?? "";
const CLIENT_SECRET = process.env.FACTUS_CLIENT_SECRET ?? "";
const USERNAME   = process.env.FACTUS_USERNAME        ?? "";
const PASSWORD   = process.env.FACTUS_PASSWORD        ?? "";

// ── Token cache (módulo-level; funciona en serverless warm starts) ──
let _token: { value: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (_token && Date.now() < _token.expiresAt - 60_000) {
    return _token.value;
  }

  const body = new URLSearchParams({
    grant_type:    "password",
    client_id:     CLIENT_ID,
    client_secret: CLIENT_SECRET,
    username:      USERNAME,
    password:      PASSWORD,
  });

  const res = await fetch(`${BASE_URL}/oauth/token`, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    body.toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(`Factus auth error: ${text}`);
  }

  const data = await res.json();
  _token = {
    value:     data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };

  return _token.value;
}

async function factusReq<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = await getToken();

  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept:         "application/json",
      Authorization:  `Bearer ${token}`,
    },
  };
  if (body !== undefined) init.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, init);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    const msg = err?.message ?? err?.error ?? `Factus error ${res.status}`;
    throw new Error(msg);
  }

  return res.json() as Promise<T>;
}

// ── Tipos ────────────────────────────────────────────────────────────

export type FactusBillCustomer = {
  identification:             string; // CC o NIT sin dígito verificación
  names:                      string;
  address:                    string;
  email:                      string;
  phone:                      string;
  legal_organization_id:      string; // "1"=Jurídica  "2"=Natural
  tribute_id:                 string; // "21"=No IVA  "1"=Resp IVA
  identification_document_id: string; // "3"=CC  "6"=NIT
  municipality_id:            string; // Código municipio Factus
};

export type FactusBillItem = {
  code_reference:  string;
  name:            string;
  quantity:        number;
  discount_rate:   number;
  price:           number;
  tax_rate:        string; // "0.00" | "5.00" | "19.00"
  unit_measure_id: number; // 70=Unidad
  standard_code_id: number; // 1
  is_excluded:     number; // 0=No  1=Sí
  tribute_id:      number; // 1=IVA
};

export type CreateBillPayload = {
  numbering_range_id:  number;
  reference_code:      string;
  observation?:        string;
  payment_form:        string; // "1"=Contado  "2"=Crédito
  payment_method_code: string; // "10"=Efectivo  "20"=Cheque  etc.
  payment_due_date?:   string; // YYYY-MM-DD — requerido si Crédito
  customer:            FactusBillCustomer;
  items:               FactusBillItem[];
};

export type FactusBill = {
  id:          number;
  number:      string;
  cufe?:       string;
  status?:     string;
  created_at?: string;
};

export type NumberingRange = {
  id:            number;
  document_type: string;
  prefix:        string;
  from:          number;
  to:            number;
  current?:      number;
  is_active?:    boolean;
};

// ── Métodos públicos ─────────────────────────────────────────────────

export const factus = {
  /** Crear factura electrónica (valida ante DIAN) */
  createBill: (payload: CreateBillPayload) =>
    factusReq<{ data: { bill: FactusBill } }>("POST", "/v1/bills/validate", payload),

  /** Listar facturas */
  listBills: (params?: { number?: string; status?: string; page?: number }) => {
    const qs = new URLSearchParams();
    if (params?.number) qs.set("number", params.number);
    if (params?.status) qs.set("status", params.status);
    if (params?.page)   qs.set("page", String(params.page));
    const q = qs.toString();
    return factusReq<{ data: { data: FactusBill[] } }>("GET", `/v1/bills${q ? `?${q}` : ""}`);
  },

  /** Enviar factura por correo */
  sendEmail: (number: string, email: string) =>
    factusReq<{ data: unknown }>("POST", `/v1/bills/send-email/${number}`, {
      email,
      send_currently_email: true,
    }),

  /** Rangos de numeración disponibles en la cuenta Factus */
  getNumberingRanges: () =>
    factusReq<{ data: NumberingRange[] }>("GET", "/v1/numbering-ranges"),
};
