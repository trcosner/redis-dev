// Type declaration overrides for Express to allow non-void returns
declare module "express-serve-static-core" {
    interface RequestHandler {
        (
            req: Request,
            res: Response,
            next: NextFunction,
        ): Promise<Response | void> | Response | void;
    }

}

export {};
