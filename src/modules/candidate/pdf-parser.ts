import { readFile } from "node:fs/promises";
import { extractText, getDocumentProxy } from "unpdf";

/**
 * Reads a PDF file from disk and returns its raw text content.
 *
 * The POC uses `unpdf` — a zero-dependency, serverless-friendly fork of the
 * Mozilla PDF.js text extractor. It keeps the toolchain lightweight and
 * avoids the native build requirements of heavier alternatives.
 *
 * @throws when the file cannot be read or parsed.
 */
export async function parsePdfFromPath(filePath: string): Promise<string> {
    if (!filePath.toLowerCase().endsWith(".pdf")) {
        throw new Error(`Expected a .pdf file, received: ${filePath}`);
    }

    const buffer = await readFile(filePath);
    return parsePdfFromBuffer(buffer);
}

/**
 * Extracts text from an in-memory PDF buffer. Useful when the resume is
 * uploaded via an HTTP endpoint and never touches disk.
 */
export async function parsePdfFromBuffer(
    buffer: Buffer | Uint8Array
): Promise<string> {
    const bytes = Buffer.isBuffer(buffer)
        ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
        : buffer;
    const pdf = await getDocumentProxy(bytes, { verbosity: 0 });
    const { text } = await extractText(pdf, { mergePages: true });

    const normalized = Array.isArray(text) ? text.join("\n") : text;
    if (!normalized || normalized.trim().length === 0) {
        throw new Error(
            "PDF parsed successfully but contained no extractable text."
        );
    }

    return normalized;
}
