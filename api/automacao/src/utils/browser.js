function parseBoolean(value, defaultValue = true) {
    if (value === undefined || value === null || String(value).trim() === '') {
        return defaultValue;
    }

    const normalized = String(value).trim().toLowerCase();
    return ['1', 'true', 't', 'yes', 'y', 'on'].includes(normalized);
}

export function getHeadlessMode(options = {}) {
    const semDisplay = process.platform === 'linux' && !process.env.DISPLAY;

    if (semDisplay) {
        console.warn('[WARN] DISPLAY ausente no Linux; forçando headless=true para evitar erro de X server.');
        return true;
    }

    if (typeof options.headless === 'boolean') {
        return options.headless;
    }

    if (options.envKey) {
        return parseBoolean(process.env[options.envKey], options.defaultHeadless ?? true);
    }

    return options.defaultHeadless ?? true;
}

export function getChromiumArgs() {
    return ['--no-sandbox', '--disable-setuid-sandbox'];
}
