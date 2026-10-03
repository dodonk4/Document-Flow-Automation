import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import test from "node:test";
import { app } from "../../src/api/app.ts";
import { prisma } from "../../src/infrastructure/database/config.ts";

let storagePath: string;

test.before(async () => {
    storagePath = await mkdtemp(path.join(os.tmpdir(), "document-flow-test-"));
    process.env.STORAGE_PATH = storagePath;
    await prisma.invoice.deleteMany();
    await prisma.document.deleteMany();
});

test.after(async () => {
    await prisma.invoice.deleteMany();
    await prisma.document.deleteMany();
    await prisma.$disconnect();
    await rm(storagePath, { recursive: true, force: true });
});

test("POST /api/documents stores a parsed invoice and rejects its duplicate", async () => {
    const pdf = await readFile(new URL("../fixtures/factura-de-prueba.pdf", import.meta.url));

    const created = await request(app)
        .post("/api/documents")
        .attach("file", pdf, {
            filename: "invoice.pdf",
            contentType: "application/pdf",
        });

    assert.equal(created.status, 201, JSON.stringify(created.body));
    assert.equal(created.body.invoiceNumber, "00010-00000101");
    assert.equal(created.body.issuerName, "LOGISTICA PAMPEANA S.R.L.");
    assert.equal(created.body.total, 5855.5);

    const storedDocument = await prisma.document.findUnique({
        where: { id: created.body.documentId },
        include: { invoice: true },
    });
    assert.ok(storedDocument);
    assert.equal(storedDocument.status, "SUCCESS");
    assert.equal(storedDocument.invoice?.invoiceNumber, "00010-00000101");
    assert.equal(storedDocument.invoice?.issuerName, "LOGISTICA PAMPEANA S.R.L.");
    assert.equal(storedDocument.invoice?.total.toNumber(), 5855.5);

    const duplicate = await request(app)
        .post("/api/documents")
        .attach("file", pdf, {
            filename: "invoice.pdf",
            contentType: "application/pdf",
        });

    assert.equal(duplicate.status, 409);
    assert.equal((await prisma.document.count()), 1);
    assert.equal((await prisma.invoice.count()), 1);
});
