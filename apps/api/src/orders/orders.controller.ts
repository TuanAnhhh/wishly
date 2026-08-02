import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClaimPaidSchema, CreateOrderSchema } from '@wishly/contracts';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateOrderSchema))
    body: ReturnType<typeof CreateOrderSchema.parse>,
    @CurrentUser() user: AuthUser
  ) {
    return this.orders.create(body, user);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.orders.get(id, user);
  }

  @Post(':id/claim-paid')
  claim(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ClaimPaidSchema))
    _body: ReturnType<typeof ClaimPaidSchema.parse>,
    @CurrentUser() user: AuthUser
  ) {
    return this.orders.claimPaid(id, user);
  }
}
