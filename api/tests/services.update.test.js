import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { ObjectId } from "mongodb";
import request from "supertest";
import { createApp } from "../index.js";
import { resetDbForTests, setDbForTests } from "../src/db.js";
import { MAX_SERVICE_PHOTO_SIZE_BYTES } from "../src/middlewares/upload.js";
import {
    resetServicePhotoStorageForTests,
    setServicePhotoStorageForTests,
} from "../src/services/servicePhotoStorage.js";

const buildFakeDb = (initialService) => {
    const services = new Map([[initialService._id.toString(), structuredClone(initialService)]]);

    return {
        services,
        collection(name) {
            if (name !== "servicos") {
                throw new Error(`Collection não suportada no teste: ${name}`);
            }

            return {
                async findOne(query) {
                    return services.get(query._id.toString()) ?? null;
                },
                async updateOne(query, update) {
                    const current = services.get(query._id.toString());
                    if (!current) {
                        return { modifiedCount: 0 };
                    }

                    services.set(query._id.toString(), {
                        ...current,
                        ...structuredClone(update.$set),
                    });

                    return { modifiedCount: 1 };
                },
            };
        },
    };
};

let app;
let fakeDb;
let serviceId;
let storedPhotos;

beforeEach(async () => {
    serviceId = new ObjectId();
    storedPhotos = new Map();
    fakeDb = buildFakeDb({
        _id: serviceId,
        status: "aguardando",
        checklist: [],
        created_at: new Date(),
        updated_at: new Date(),
    });

    setDbForTests(fakeDb);
    setServicePhotoStorageForTests({
        async saveServicePhotos(files) {
            return files.map((file) => {
                const fileId = new ObjectId().toString();
                storedPhotos.set(fileId, {
                    buffer: file.buffer,
                    contentType: file.mimetype,
                });

                return {
                    fileId,
                    url: `/api/uploads/services/${fileId}`,
                };
            });
        },
        async deleteServicePhotos(photoUrls) {
            for (const photoUrl of photoUrls) {
                const fileId = photoUrl.split("/").pop();
                if (fileId) {
                    storedPhotos.delete(fileId);
                }
            }
        },
        async openServicePhotoDownload(fileId) {
            const photo = storedPhotos.get(fileId);
            if (!photo) {
                return null;
            }

            return {
                file: {
                    contentType: photo.contentType,
                    length: photo.buffer.length,
                },
                stream: Readable.from(photo.buffer),
            };
        },
    });
    app = createApp();
});

afterEach(async () => {
    resetDbForTests();
    resetServicePhotoStorageForTests();
});

test("PATCH /api/services/:id aceita uma foto e mantém compatibilidade com foto_url", async () => {
    const response = await request(app)
        .patch(`/api/services/${serviceId.toString()}`)
        .field("status", "concluido")
        .field("checklist", JSON.stringify(["item-1"]))
        .field("assinatura", "data:image/png;base64,assinatura")
        .attach("foto", Buffer.from("foto-1"), {
            filename: "foto-1.jpg",
            contentType: "image/jpeg",
        });

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(typeof response.body.foto_url, "string");
    assert.deepEqual(response.body.fotos_urls, [response.body.foto_url]);

    const storedService = fakeDb.services.get(serviceId.toString());
    assert.equal(storedService.status, "concluido");
    assert.equal(storedService.foto_url, response.body.foto_url);
    assert.deepEqual(storedService.fotos_urls, response.body.fotos_urls);
    assert.equal(storedService.fotos_urls.length, 1);
});

test("PATCH /api/services/:id aceita duas fotos e retorna ambas as URLs", async () => {
    const response = await request(app)
        .patch(`/api/services/${serviceId.toString()}`)
        .field("status", "concluido")
        .field("checklist", JSON.stringify(["item-1", "item-2"]))
        .field("assinatura", "data:image/png;base64,assinatura")
        .attach("foto", Buffer.from("foto-1"), {
            filename: "foto-1.jpg",
            contentType: "image/jpeg",
        })
        .attach("foto", Buffer.from("foto-2"), {
            filename: "foto-2.png",
            contentType: "image/png",
        });

    assert.equal(response.status, 200);
    assert.equal(response.body.foto_url, response.body.fotos_urls[0]);
    assert.equal(response.body.fotos_urls.length, 2);

    const storedService = fakeDb.services.get(serviceId.toString());
    assert.equal(storedService.fotos_urls.length, 2);
    assert.equal(storedService.foto_url, storedService.fotos_urls[0]);
});

test("GET /api/uploads/services/:fileId retorna a foto salva no MongoDB", async () => {
    const updateResponse = await request(app)
        .patch(`/api/services/${serviceId.toString()}`)
        .field("status", "concluido")
        .field("checklist", JSON.stringify(["item-1"]))
        .field("assinatura", "data:image/png;base64,assinatura")
        .attach("foto", Buffer.from("foto-1"), {
            filename: "foto-1.jpg",
            contentType: "image/jpeg",
        });

    const fileId = updateResponse.body.foto_url.split("/").pop();
    const photoResponse = await request(app).get(`/api/uploads/services/${fileId}`);

    assert.equal(photoResponse.status, 200);
    assert.equal(photoResponse.headers["content-type"], "image/jpeg");
    assert.equal(photoResponse.body.toString(), "foto-1");
});

test("PATCH /api/services/:id rejeita mais de duas fotos", async () => {
    const response = await request(app)
        .patch(`/api/services/${serviceId.toString()}`)
        .field("status", "concluido")
        .field("checklist", JSON.stringify(["item-1"]))
        .field("assinatura", "data:image/png;base64,assinatura")
        .attach("foto", Buffer.from("foto-1"), {
            filename: "foto-1.jpg",
            contentType: "image/jpeg",
        })
        .attach("foto", Buffer.from("foto-2"), {
            filename: "foto-2.jpg",
            contentType: "image/jpeg",
        })
        .attach("foto", Buffer.from("foto-3"), {
            filename: "foto-3.jpg",
            contentType: "image/jpeg",
        });

    assert.equal(response.status, 400);
    assert.match(response.body.message, /no máximo 2 imagens/i);
});

test("PATCH /api/services/:id rejeita tipo de arquivo inválido", async () => {
    const response = await request(app)
        .patch(`/api/services/${serviceId.toString()}`)
        .field("status", "concluido")
        .field("checklist", JSON.stringify(["item-1"]))
        .field("assinatura", "data:image/png;base64,assinatura")
        .attach("foto", Buffer.from("arquivo-texto"), {
            filename: "foto.txt",
            contentType: "text/plain",
        });

    assert.equal(response.status, 400);
    assert.match(response.body.message, /formato de arquivo inválido/i);
});

test("PATCH /api/services/:id rejeita arquivo acima de 10MB", async () => {
    const response = await request(app)
        .patch(`/api/services/${serviceId.toString()}`)
        .field("status", "concluido")
        .field("checklist", JSON.stringify(["item-1"]))
        .field("assinatura", "data:image/png;base64,assinatura")
        .attach("foto", Buffer.alloc(MAX_SERVICE_PHOTO_SIZE_BYTES + 1, 1), {
            filename: "foto-grande.jpg",
            contentType: "image/jpeg",
        });

    assert.equal(response.status, 400);
    assert.match(response.body.message, /no máximo 10MB/i);
});