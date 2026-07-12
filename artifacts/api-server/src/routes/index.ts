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

export default router;
