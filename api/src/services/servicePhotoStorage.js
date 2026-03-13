import { GridFSBucket, ObjectId } from "mongodb";
import { getDb } from "../db.js";

const SERVICE_PHOTO_BUCKET_NAME = "servicePhotos";
const GRIDFS_SERVICE_PHOTO_URL_REGEX = /^\/api\/uploads\/services\/([a-f\d]{24})$/i;

let servicePhotoStorageOverride = null;

const buildServicePhotoUrl = (fileId) => `/api/uploads/services/${fileId}`;

const extractGridFsFileIdFromUrl = (photoUrl) => {
    if (typeof photoUrl !== "string") {
        return null;
    }

    const match = photoUrl.match(GRIDFS_SERVICE_PHOTO_URL_REGEX);
    return match?.[1] ?? null;
};

const getServicePhotoBucket = async () => {
    const db = await getDb();
    return new GridFSBucket(db, { bucketName: SERVICE_PHOTO_BUCKET_NAME });
};

export const saveServicePhotos = async (files = [], serviceId) => {
    if (servicePhotoStorageOverride?.saveServicePhotos) {
        return servicePhotoStorageOverride.saveServicePhotos(files, serviceId);
    }

    if (!Array.isArray(files) || files.length === 0) {
        return [];
    }

    const bucket = await getServicePhotoBucket();

    return Promise.all(
        files.map(
            (file, index) =>
                new Promise((resolve, reject) => {
                    const uploadStream = bucket.openUploadStream(
                        file.originalname || `service-${serviceId}-${index}`,
                        {
                            contentType: file.mimetype,
                            metadata: {
                                service_id: serviceId,
                                original_name: file.originalname || null,
                                field_name: file.fieldname || "foto",
                                uploaded_at: new Date(),
                                size: file.size ?? file.buffer?.length ?? null,
                            },
                        }
                    );

                    uploadStream.on("error", reject);
                    uploadStream.on("finish", () => {
                        const fileId = uploadStream.id.toString();
                        resolve({
                            fileId,
                            url: buildServicePhotoUrl(fileId),
                        });
                    });

                    uploadStream.end(file.buffer);
                })
        )
    );
};

export const deleteServicePhotos = async (photoUrls = []) => {
    if (servicePhotoStorageOverride?.deleteServicePhotos) {
        return servicePhotoStorageOverride.deleteServicePhotos(photoUrls);
    }

    const fileIds = [...new Set(photoUrls.map(extractGridFsFileIdFromUrl).filter(Boolean))];
    if (fileIds.length === 0) {
        return;
    }

    const bucket = await getServicePhotoBucket();

    await Promise.all(
        fileIds.map(async (fileId) => {
            try {
                await bucket.delete(new ObjectId(fileId));
            } catch (error) {
                console.error("Erro ao remover foto antiga do serviço no MongoDB:", {
                    fileId,
                    message: error.message,
                });
            }
        })
    );
};

export const openServicePhotoDownload = async (fileId) => {
    if (servicePhotoStorageOverride?.openServicePhotoDownload) {
        return servicePhotoStorageOverride.openServicePhotoDownload(fileId);
    }

    if (!ObjectId.isValid(fileId)) {
        return null;
    }

    const bucket = await getServicePhotoBucket();
    const normalizedFileId = new ObjectId(fileId);
    const fileDocument = await bucket.find({ _id: normalizedFileId }).next();

    if (!fileDocument) {
        return null;
    }

    return {
        file: fileDocument,
        stream: bucket.openDownloadStream(normalizedFileId),
    };
};

export const setServicePhotoStorageForTests = (storage) => {
    servicePhotoStorageOverride = storage;
};

export const resetServicePhotoStorageForTests = () => {
    servicePhotoStorageOverride = null;
};

export { buildServicePhotoUrl, extractGridFsFileIdFromUrl };