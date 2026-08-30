import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import customersRouter from "./customers";
import catalogRouter from "./catalog";
import wishlistRouter from "./wishlist";
import cartRouter from "./cart";
import bookingsRouter from "./bookings";
import executivesRouter from "./executives";
import notificationsRouter from "./notifications";
import adminRouter from "./admin";
import ordersRouter from "./orders";
import partnersRouter from "./partners";
import contentRouter from "./content";
import uploadRouter from "./upload";
import merchantsRouter from "./merchants";
import pincodesRouter from "./pincodes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(customersRouter);
router.use(catalogRouter);
router.use(wishlistRouter);
router.use(cartRouter);
router.use(bookingsRouter);
router.use(executivesRouter);
router.use(notificationsRouter);
router.use(adminRouter);
router.use(ordersRouter);
router.use(pincodesRouter);
router.use(partnersRouter);
router.use(contentRouter);
router.use(uploadRouter);
router.use(merchantsRouter);

export default router;
