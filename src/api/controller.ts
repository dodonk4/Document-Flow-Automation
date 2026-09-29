import { Router } from "express";
import multer from "multer";
import { ProcessDocumentUseCase } from "../core/processDocument/ProcessDocumentUseCase";

const upload = multer({
    limits: { fileSize: 5 * 1024 * 1024 }
})

const createRouter = (
    ProcessDocumentUseCase: ProcessDocumentUseCase,
) => {
    const router = Router();

    router.post('/documents', upload.single('file'), function (req, res) {
        ProcessDocumentUseCase.execute(req);
        res.send('POST request to the homepage');
    })

    return router;
}

