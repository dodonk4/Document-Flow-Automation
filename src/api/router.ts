import { Router } from "express";
import multer from "multer";
import { DocumentController } from "./controller";

const upload = multer({
    limits: { fileSize: 5 * 1024 * 1024 }
})

export const createDocumentRouter = (
    documentController: DocumentController,
): Router => {
    const router = Router();

    router.post(
        '/',
        upload.single('file'),
        documentController.processDocumentController
    )

    return router;
}

