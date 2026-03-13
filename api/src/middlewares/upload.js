import multer from "multer";

export const MAX_SERVICE_PHOTOS = 2;
export const MAX_SERVICE_PHOTO_SIZE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_SERVICE_PHOTO_MIME_TYPES = new Set([
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/webp",
	"image/heic",
	"image/heif",
]);

export const SERVICE_PHOTO_EXTENSION_BY_MIME = {
	"image/jpeg": "jpg",
	"image/jpg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
	"image/heic": "heic",
	"image/heif": "heif",
};

const storage = multer.memoryStorage();

const createUploadValidationError = (code, message) => {
	const error = new Error(message);
	error.code = code;
	return error;
};

const upload = multer({
	storage,
	limits: {
		fileSize: MAX_SERVICE_PHOTO_SIZE_BYTES,
		files: MAX_SERVICE_PHOTOS,
	},
	fileFilter: (req, file, callback) => {
		if (!ALLOWED_SERVICE_PHOTO_MIME_TYPES.has(file.mimetype)) {
			return callback(
				createUploadValidationError(
					"INVALID_FILE_TYPE",
					"Formato de arquivo inválido. Envie apenas image/jpeg, image/jpg, image/png, image/webp, image/heic ou image/heif."
				)
			);
		}

		return callback(null, true);
	},
});

const getUploadErrorResponse = (error) => {
	if (error?.code === "INVALID_FILE_TYPE") {
		return {
			status: 400,
			body: { message: error.message },
		};
	}

	if (error instanceof multer.MulterError) {
		if (error.code === "LIMIT_FILE_SIZE") {
			return {
				status: 400,
				body: { message: "Cada imagem deve ter no máximo 10MB." },
			};
		}

		if (error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE") {
			return {
				status: 400,
				body: { message: "É permitido enviar no máximo 2 imagens no campo foto." },
			};
		}
	}

	return {
		status: 500,
		body: { message: "Erro interno no upload das fotos." },
	};
};

export const uploadServiceConclusionPhotos = (req, res, next) => {
	upload.array("foto", MAX_SERVICE_PHOTOS)(req, res, (error) => {
		if (!error) {
			return next();
		}

		console.error("Erro no upload da conclusão do serviço:", {
			serviceId: req.params?.id,
			code: error.code,
			field: error.field,
			message: error.message,
		});

		const response = getUploadErrorResponse(error);
		return res.status(response.status).json(response.body);
	});
};

export default upload;