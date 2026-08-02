import { Module } from '@nestjs/common';
import { AdminPaymentsController } from './admin-payments.controller';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  controllers: [OrdersController, AdminPaymentsController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
