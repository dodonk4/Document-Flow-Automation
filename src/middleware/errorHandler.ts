import express, { Request, Response, NextFunction } from "express"
import { ZodError } from "zod";
import { AppError } from "../domain/errors/AppError";

const errorHandler = (error: Error | ZodError | AppError, __req: Request, res: Response, next: NextFunction) => {

    if (error instanceof ZodError) {
        res.status(400).json({
            message: "Validation failed",
            errors: JSON.parse(error.message)[0].message,
        });
        return;
    }

    if (error instanceof AppError) {
        res.status(error.statusCode).send({
            message: error.message,
            name: error.name,
        })
    }

    next(error);
}

export default errorHandler;