import {
  Controller,
  Get,
  Logger,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Public } from '../common/public.decorator';
import { AdminGuard } from '../common/admin.guard';
import { OrdersService } from './orders.service';

@Controller('admin/payments')
@Public()
@UseGuards(AdminGuard)
export class AdminPaymentsController {
  private readonly logger = new Logger(AdminPaymentsController.name);

  constructor(private readonly orders: OrdersService) {}

  @Get('pending')
  listPending() {
    return this.orders.listPendingManual();
  }

  @Post(':orderId/confirm')
  confirm(@Param('orderId') orderId: string) {
    this.logger.log(`Admin confirm requested for order ${orderId}`);
    return this.orders.adminConfirm(orderId, 'admin');
  }

  @Post(':orderId/refund')
  refund(@Param('orderId') orderId: string) {
    this.logger.log(`Admin refund requested for order ${orderId}`);
    return this.orders.adminRefund(orderId);
  }
}
