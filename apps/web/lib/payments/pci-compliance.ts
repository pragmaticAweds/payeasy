import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export class PCIComplianceError extends Error {
  readonly code:
    | "PCI_RAW_CARD_DATA_DETECTED"
    | "PCI_TOKEN_REQUIRED"
    | "PCI_INVALID_TOKEN"
    | "PCI_INSECURE_TRANSPORT"
    | "PCI_ACCESS_DENIED"
    | "PCI_ENCRYPTION_KEY_MISSING"
    | "PCI_ENCRYPTION_KEY_INVALID"
    | "PCI_AUDIT_WRITE_FAILED";

  constructor(code: PCIComplianceError["code"], message: string) {
    super(message);
    this.name = "PCIComplianceError";
    this.code = code;
  }
}

export type StripeTokenReference =
  | { type: "payment_method"; id: string }
  | { type: "token"; id: string }
  | { type: "source"; id: string }
  | { type: "payment_intent"; id: string }
  | { type: "setup_intent"; id: string }
  | { type: "client_secret"; id: string };

export type PaymentActorRole = "service" | "admin" | "support" | "user" | "auditor";

export type PaymentPermission =
  | "payments:create"
  | "payments:update"
  | "payments:refund"
  | "payments:read"
  | "payments:audit";

export interface PaymentActor {
  id: string;
  role: PaymentActorRole;
  permissions?: readonly PaymentPermission[];
}

export interface PciRequestContext {
  method: string;
  url?: string;
  headers?: Headers | Record<string, string | string[] | undefined>;
  actor?: PaymentActor;
  requireIdempotencyKey?: boolean;
}

export interface EncryptionEnvelope {
  algorithm: "aes-256-gcm";
  keyVersion: string;
  iv: string;
  authTag: string;
  ciphertext: string;
}

export interface AuditEventInput {
  actorId: string;
  action: string;
  resourceType: "payment" | "refund" | "customer" | "token" | "compliance";
  resourceId?: string;
  outcome: "success" | "failure" | "denied";
  reason?: string;
  requestId?: string;
  ipAddress?: string;
  metadata?: unknown;
  occurredAt?: Date;
}

export interface PaymentAuditEvent {
  actorId: string;
  action: string;
  resourceType: AuditEventInput["resourceType"];
  resourceIdHash?: string;
  outcome: AuditEventInput["outcome"];
  reason?: string;
  requestId?: string;
  ipAddressHash?: string;
  metadata: unknown;
  occurredAt: string;
}

export interface QuarterlyAssessmentStatus {
  lastAssessmentAt?: string;
  nextAssessmentDueAt: string;
  overdue: boolean;
  daysUntilDue: number;
}

export interface PciBreachIncident {
  incidentId: string;
  detectedAt: string;
  severity: "low" | "medium" | "high" | "critical";
  suspectedSystems: string[];
  suspectedDataTypes: string[];
  containmentActions: string[];
  notificationActions: string[];
  investigationActions: string[];
}

export interface PciComplianceGuidance {
  processor: "stripe";
  controls: readonly string[];
  operationalChecklist: readonly string[];
  prohibitedPractices: readonly string[];
}

const STRIPE_TOKEN_PATTERNS: ReadonlyArray<[StripeTokenReference["type"], RegExp]> = [
  ["payment_method", /^pm_[A-Za-z0-9]+$/],
  ["token", /^tok_[A-Za-z0-9]+$/],
  ["source", /^src_[A-Za-z0-9]+$/],
  ["payment_intent", /^pi_[A-Za-z0-9]+$/],
  ["setup_intent", /^seti_[A-Za-z0-9]+$/],
  ["client_secret", /^(?:pi|seti)_[A-Za-z0-9]+_secret_[A-Za-z0-9]+$/],
];

const TOKEN_FIELD_CANDIDATES = [
  "paymentMethodId",
  "paymentMethod",
  "payment_method",
  "token",
  "source",
  "paymentIntentId",
  "payment_intent",
  "setupIntentId",
  "setup_intent",
  "clientSecret",
  "client_secret",
];

const FORBIDDEN_KEY_PARTS = [
  "cardnumber",
  "card_number",
  "pan",
  "primaryaccountnumber",
  "cvv",
  "cvc",
  "securitycode",
  "expmonth",
  "exp_month",
  "expyear",
  "exp_year",
  "expiry",
  "expiration",
  "track",
  "magstripe",
  "pin",
  "pinblock",
];

const SECURITY_HEADER_VALUES = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "payment=(), camera=(), microphone=()",
} as const;

const ROLE_PERMISSIONS: Record<PaymentActorRole, ReadonlySet<PaymentPermission>> = {
  service: new Set(["payments:create", "payments:update", "payments:read", "payments:audit"]),
  admin: new Set([
    "payments:create",
    "payments:update",
    "payments:refund",
    "payments:read",
    "payments:audit",
  ]),
  support: new Set(["payments:read"]),
  user: new Set(["payments:create", "payments:read"]),
  auditor: new Set(["payments:read", "payments:audit"]),
};

const REDACTED = "[REDACTED]";

export const PCI_COMPLIANCE_GUIDANCE: PciComplianceGuidance = {
  processor: "stripe",
  controls: [
    "Use Stripe tokenization (PaymentMethod/Token/Intent IDs) for all card-presenting flows.",
    "Reject requests containing raw PAN/CVV/track data before persistence or logging.",
    "Encrypt non-card sensitive payment metadata at rest using managed AES-256 keys.",
    "Enforce HTTPS/TLS for payment APIs and disable caching on payment endpoints.",
    "Apply least-privilege access to payment mutations and audit log access.",
    "Record immutable audit events with redacted metadata and hashed identifiers.",
  ],
  operationalChecklist: [
    "Run quarterly PCI DSS self-assessment and retain evidence.",
    "Rotate encryption keys and review access grants on a defined schedule.",
    "Validate Stripe webhook signatures and segregate webhook secrets.",
    "Maintain breach-response runbook and incident escalation contacts.",
  ],
  prohibitedPractices: [
    "Do not store full card numbers, CVV, PIN, or magnetic stripe/track data.",
    "Do not log raw payment request bodies before PCI sanitization.",
    "Do not send card data through internal APIs when Stripe Elements/Checkout can tokenize it.",
  ],
};

export function assertNoRawCardData(input: unknown): void {
  walkForCardData(input, []);
}

export function sanitizePciPayload<T>(input: T): T {
  return sanitizeValue(input) as T;
}

export function extractStripeTokenReference(input: unknown): StripeTokenReference {
  assertNoRawCardData(input);

  const object = asRecord(input);
  if (!object) {
    throw new PCIComplianceError(
      "PCI_TOKEN_REQUIRED",
      "Payment input must include a Stripe tokenized reference.",
    );
  }

  for (const field of TOKEN_FIELD_CANDIDATES) {
    const value = object[field];
    if (typeof value !== "string" || !value.trim()) continue;

    const parsed = parseStripeToken(value.trim());
    if (!parsed) {
      throw new PCIComplianceError(
        "PCI_INVALID_TOKEN",
        `Invalid Stripe tokenized reference in field "${field}".`,
      );
    }
    return parsed;
  }

  throw new PCIComplianceError(
    "PCI_TOKEN_REQUIRED",
    "No Stripe tokenized reference found. Raw card data must never be sent to this API.",
  );
}

export function assertPciApiRequestSecurity(
  context: PciRequestContext,
  permission?: PaymentPermission,
): void {
  assertSecureTransport(context);

  if (permission && context.actor) {
    assertPaymentAccess(context.actor, permission);
  }

  if (
    context.requireIdempotencyKey !== false &&
    context.method.toUpperCase() === "POST" &&
    !getHeader(context.headers, "idempotency-key")
  ) {
    throw new PCIComplianceError(
      "PCI_INSECURE_TRANSPORT",
      "Missing Idempotency-Key header for payment POST request.",
    );
  }
}

export function buildPciSecurityHeaders(
  extra?: Record<string, string>,
): Record<string, string> {
  return { ...SECURITY_HEADER_VALUES, ...extra };
}

export function assertPaymentAccess(actor: PaymentActor, permission: PaymentPermission): void {
  const grantedByRole = ROLE_PERMISSIONS[actor.role];
  const hasRolePermission = grantedByRole.has(permission);
  const hasExplicitPermission = actor.permissions?.includes(permission) ?? false;

  if (!hasRolePermission && !hasExplicitPermission) {
    throw new PCIComplianceError(
      "PCI_ACCESS_DENIED",
      `Actor ${actor.id} is not permitted to perform ${permission}.`,
    );
  }
}

export function createPciAuditEvent(
  input: AuditEventInput,
  options?: { hashKey?: string },
): PaymentAuditEvent {
  const metadata = sanitizePciPayload(input.metadata ?? {});
  assertNoRawCardData(metadata);

  return {
    actorId: input.actorId,
    action: input.action,
    resourceType: input.resourceType,
    resourceIdHash: input.resourceId ? hashAuditValue(input.resourceId, options?.hashKey) : undefined,
    outcome: input.outcome,
    reason: input.reason,
    requestId: input.requestId,
    ipAddressHash: input.ipAddress ? hashAuditValue(input.ipAddress, options?.hashKey) : undefined,
    metadata,
    occurredAt: (input.occurredAt ?? new Date()).toISOString(),
  };
}

export async function writePciAuditEvent(
  event: PaymentAuditEvent,
  writer: (event: PaymentAuditEvent) => Promise<void> | void,
): Promise<void> {
  try {
    await writer(event);
  } catch (error) {
    throw new PCIComplianceError(
      "PCI_AUDIT_WRITE_FAILED",
      `Failed to write PCI audit event: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }
}

export function encryptSensitivePaymentMetadata(
  plaintext: string,
  options?: { key?: string; keyVersion?: string },
): EncryptionEnvelope {
  const key = getAes256Key(options?.key);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    algorithm: "aes-256-gcm",
    keyVersion: options?.keyVersion ?? "v1",
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };
}

export function decryptSensitivePaymentMetadata(
  envelope: EncryptionEnvelope,
  options?: { key?: string },
): string {
  if (envelope.algorithm !== "aes-256-gcm") {
    throw new PCIComplianceError("PCI_ENCRYPTION_KEY_INVALID", "Unsupported encryption algorithm.");
  }

  const key = getAes256Key(options?.key);
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(envelope.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(envelope.authTag, "base64"));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

export function getQuarterlyAssessmentStatus(
  lastAssessmentAt?: string | Date,
  now = new Date(),
): QuarterlyAssessmentStatus {
  const baseline = lastAssessmentAt ? new Date(lastAssessmentAt) : now;
  if (Number.isNaN(baseline.getTime())) {
    throw new Error("Invalid lastAssessmentAt date.");
  }

  const nextDue = addMonths(lastAssessmentAt ? baseline : now, 3);
  const diffMs = nextDue.getTime() - now.getTime();
  const daysUntilDue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return {
    lastAssessmentAt: lastAssessmentAt ? baseline.toISOString() : undefined,
    nextAssessmentDueAt: nextDue.toISOString(),
    overdue: diffMs < 0,
    daysUntilDue,
  };
}

export function createPciBreachIncidentResponse(input: {
  severity: PciBreachIncident["severity"];
  suspectedSystems: string[];
  suspectedDataTypes: string[];
  detectedAt?: Date;
}): PciBreachIncident {
  const detectedAt = (input.detectedAt ?? new Date()).toISOString();
  const incidentId = `pci-${Date.now()}-${randomBytes(4).toString("hex")}`;

  const containmentActions = [
    "Isolate affected payment systems and revoke impacted credentials.",
    "Preserve logs, database snapshots, and application traces for forensics.",
    "Disable non-essential payment writes until scope is confirmed.",
  ];

  const notificationActions = [
    "Notify internal security, engineering leadership, and compliance owner.",
    "Notify payment processor (Stripe) and required partners per incident policy.",
    "Determine PCI DSS / legal notification obligations and timelines.",
  ];

  const investigationActions = [
    "Confirm whether PAN/CVV data exposure occurred (should be none if tokenization is enforced).",
    "Validate audit trail completeness and identify access paths used.",
    "Document root cause, remediation, and compensating controls.",
  ];

  if (input.severity === "critical" || input.severity === "high") {
    notificationActions.unshift("Trigger incident bridge and 24/7 escalation immediately.");
  }

  return {
    incidentId,
    detectedAt,
    severity: input.severity,
    suspectedSystems: [...new Set(input.suspectedSystems)],
    suspectedDataTypes: [...new Set(input.suspectedDataTypes)],
    containmentActions,
    notificationActions,
    investigationActions,
  };
}

function parseStripeToken(value: string): StripeTokenReference | null {
  for (const [type, pattern] of STRIPE_TOKEN_PATTERNS) {
    if (pattern.test(value)) return { type, id: value };
  }
  return null;
}

function assertSecureTransport(context: PciRequestContext): void {
  const url = context.url ? safeUrl(context.url) : undefined;
  const forwardedProto = getHeader(context.headers, "x-forwarded-proto")?.split(",")[0]?.trim();
  const isHttps =
    url?.protocol === "https:" ||
    forwardedProto === "https" ||
    (url?.hostname === "localhost" || url?.hostname === "127.0.0.1");

  if (!isHttps) {
    throw new PCIComplianceError(
      "PCI_INSECURE_TRANSPORT",
      "Payment APIs must be accessed over HTTPS/TLS.",
    );
  }
}

function walkForCardData(value: unknown, path: string[]): void {
  if (value == null) return;

  if (typeof value === "string") {
    if (containsPAN(value)) {
      throw new PCIComplianceError(
        "PCI_RAW_CARD_DATA_DETECTED",
        `Potential card number detected at ${formatPath(path)}.`,
      );
    }
    return;
  }

  if (typeof value !== "object") return;

  if (Array.isArray(value)) {
    value.forEach((item, index) => walkForCardData(item, [...path, String(index)]));
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    const normalizedKey = normalizeKey(key);
    if (FORBIDDEN_KEY_PARTS.some((part) => normalizedKey.includes(part))) {
      throw new PCIComplianceError(
        "PCI_RAW_CARD_DATA_DETECTED",
        `Forbidden payment field "${key}" detected at ${formatPath(path)}.`,
      );
    }
    walkForCardData(child, [...path, key]);
  }
}

function sanitizeValue(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === "string") {
    return containsPAN(value) ? REDACTED : value;
  }
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((entry) => sanitizeValue(entry));

  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    const normalizedKey = normalizeKey(key);
    if (FORBIDDEN_KEY_PARTS.some((part) => normalizedKey.includes(part))) {
      output[key] = REDACTED;
      continue;
    }
    output[key] = sanitizeValue(child);
  }
  return output;
}

function containsPAN(input: string): boolean {
  const digits = input.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  return passesLuhn(digits);
}

function passesLuhn(digits: string): boolean {
  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (Number.isNaN(digit)) return false;
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function formatPath(path: string[]): string {
  return path.length ? path.join(".") : "<root>";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function getHeader(
  headers: PciRequestContext["headers"],
  name: string,
): string | undefined {
  if (!headers) return undefined;
  const lower = name.toLowerCase();

  if (headers instanceof Headers) {
    return headers.get(name) ?? headers.get(lower) ?? undefined;
  }

  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== lower || value == null) continue;
    return Array.isArray(value) ? value[0] : value;
  }
  return undefined;
}

function hashAuditValue(value: string, secret?: string): string {
  if (!secret) {
    return createHash("sha256").update(value).digest("hex");
  }
  return createHmac("sha256", secret).update(value).digest("hex");
}

function getAes256Key(overrideKey?: string): Buffer {
  const raw = overrideKey ?? process.env.PCI_ENCRYPTION_KEY ?? process.env.PAYMENT_ENCRYPTION_KEY;
  if (!raw) {
    throw new PCIComplianceError(
      "PCI_ENCRYPTION_KEY_MISSING",
      "Missing PCI encryption key (PCI_ENCRYPTION_KEY or PAYMENT_ENCRYPTION_KEY).",
    );
  }

  const decoded = decodeKeyMaterial(raw);
  if (decoded.length !== 32) {
    throw new PCIComplianceError(
      "PCI_ENCRYPTION_KEY_INVALID",
      "PCI encryption key must decode to 32 bytes for AES-256-GCM.",
    );
  }

  // Copy to avoid accidental mutation across callers.
  return Buffer.from(decoded);
}

function decodeKeyMaterial(input: string): Buffer {
  const trimmed = input.trim();

  if (/^[A-Fa-f0-9]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, "hex");
  }

  try {
    const buffer = Buffer.from(trimmed, "base64");
    if (buffer.length > 0) return buffer;
  } catch {
    // fall through
  }

  // Last resort: use utf8 bytes to preserve deterministic behavior in non-prod tests.
  return Buffer.from(trimmed, "utf8");
}

function safeUrl(value: string): URL | undefined {
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function compareWebhookSignatures(expected: string, received: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}
