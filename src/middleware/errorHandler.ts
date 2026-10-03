import { Request, Response, NextFunction } from "express"
import multer from "multer";
import { ZodError } from "zod";
import { AppError } from "../domain/errors/AppError.ts";

const errorHandler = (error: Error | ZodError | AppError, __req: Request, res: Response, next: NextFunction) => {

    if (error instanceof ZodError) {
        res.status(422).json({
            message: "El PDF no coincide con el formato de factura esperado.",
            errors: error.issues.map((issue) => issue.message),
        });
        return;
    }

    if (error instanceof multer.MulterError) {
        res.status(400).json({
            message: error.code === "LIMIT_FILE_SIZE"
                ? "El archivo supera el límite de 5 MB."
                : "No se pudo recibir el archivo.",
            code: error.code,
        });
        return;
    }

    if (error instanceof AppError) {
        res.status(error.statusCode).send({
            message: error.message,
            code: error.code,
        })
        return;
    }

    next(error);
}

export default errorHandler;