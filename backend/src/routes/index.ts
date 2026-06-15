import { Router } from 'express';
import { clientsRouter } from './clients.js';
import { invoicesRouter } from './invoices.js';
import { productsRouter } from './products.js';

export const apiRouter = Router();

apiRouter.use('/clients', clientsRouter);
apiRouter.use('/products', productsRouter);
apiRouter.use('/invoices', invoicesRouter);
