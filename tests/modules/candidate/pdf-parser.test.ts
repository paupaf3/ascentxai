import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("unpdf", () => ({
    getDocumentProxy: vi.fn(),
    extractText: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
    readFile: vi.fn(),
}));

import { extractText, getDocumentProxy } from "unpdf";
import { readFile } from "node:fs/promises";
import {
    parsePdfFromBuffer,
    parsePdfFromPath,
} from "../../../src/modules/candidate/pdf-parser";

const mockedExtract = extractText as unknown as ReturnType<typeof vi.fn>;
const mockedGetDoc = getDocumentProxy as unknown as ReturnType<typeof vi.fn>;
const mockedReadFile = readFile as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
    vi.clearAllMocks();
    mockedGetDoc.mockResolvedValue({ numPages: 1 });
});

describe("parsePdfFromBuffer", () => {
    it("returns the merged text of a PDF", async () => {
        mockedExtract.mockResolvedValueOnce({ text: "Hello world" });

        const text = await parsePdfFromBuffer(new Uint8Array([1, 2, 3]));

        expect(text).toBe("Hello world");
        expect(mockedExtract).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ mergePages: true })
        );
    });

    it("joins text when unpdf returns an array of pages", async () => {
        mockedExtract.mockResolvedValueOnce({ text: ["Page 1", "Page 2"] });

        const input = Buffer.from("pdf");
        const text = await parsePdfFromBuffer(input);

        expect(text).toBe("Page 1\nPage 2");
        expect(mockedGetDoc).toHaveBeenCalledWith(
            expect.any(Uint8Array),
            expect.objectContaining({ verbosity: 0 })
        );
        expect(mockedGetDoc).not.toHaveBeenCalledWith(input);
    });

    it("throws when the PDF has no extractable text", async () => {
        mockedExtract.mockResolvedValueOnce({ text: "   " });

        await expect(parsePdfFromBuffer(Buffer.from("pdf"))).rejects.toThrow(
            /no extractable text/i
        );
    });
});

describe("parsePdfFromPath", () => {
    it("rejects non-.pdf files without touching the filesystem", async () => {
        await expect(parsePdfFromPath("resume.docx")).rejects.toThrow(
            /Expected a \.pdf file/
        );
        expect(mockedReadFile).not.toHaveBeenCalled();
    });

    it("reads the file and delegates to the buffer parser", async () => {
        mockedReadFile.mockResolvedValueOnce(Buffer.from("pdf-bytes"));
        mockedExtract.mockResolvedValueOnce({ text: "extracted content" });

        const text = await parsePdfFromPath("/tmp/resume.pdf");

        expect(mockedReadFile).toHaveBeenCalledWith("/tmp/resume.pdf");
        expect(text).toBe("extracted content");
    });

    it("accepts uppercase .PDF extensions", async () => {
        mockedReadFile.mockResolvedValueOnce(Buffer.from("pdf-bytes"));
        mockedExtract.mockResolvedValueOnce({ text: "ok" });

        await expect(parsePdfFromPath("/tmp/resume.PDF")).resolves.toBe("ok");
    });
});
