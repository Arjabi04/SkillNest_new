import { createTransport } from "nodemailer";

const toBoolean = (value) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === "boolean") return value;
    const normalized = String(value).trim().toLowerCase();
    if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "n", "off"].includes(normalized)) return false;
    return undefined;
};

export const createMailTransport = () => {
    const host = process.env.EMAIL_HOST;
    const port = Number(process.env.EMAIL_PORT);
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASSWORD;

    if (!host || !Number.isFinite(port) || !user || !pass) {
        return null;
    }

    const secureFromEnv = toBoolean(process.env.EMAIL_SECURE);
    const secure =
        secureFromEnv !== undefined ? secureFromEnv : port === 465;

    const rejectUnauthorizedFromEnv = toBoolean(
        process.env.EMAIL_TLS_REJECT_UNAUTHORIZED,
    );

    return createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        ...(rejectUnauthorizedFromEnv === false
            ? { tls: { rejectUnauthorized: false } }
            : {}),
    });
};

