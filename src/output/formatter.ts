const SEPARATOR = "━".repeat(60);
const TIMESTAMP_OPTIONS: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
};

export interface RenderOptions {
    runId?: string;
}

export function render(analysis: string, options?: RenderOptions): void {
    const now = new Date().toLocaleString("en-US", TIMESTAMP_OPTIONS);
    const headerParts = ["AscentX Career Architect", `  Run at: ${now}`];
    if (options?.runId) {
        headerParts.push(`  Run ID: ${options.runId}`);
    }

    process.stdout.write(`${SEPARATOR}\n`);
    process.stdout.write(`${headerParts.join("\n")}\n`);
    process.stdout.write(`${SEPARATOR}\n\n`);
    process.stdout.write(analysis);
    process.stdout.write(`\n\n${SEPARATOR}\n`);
}
