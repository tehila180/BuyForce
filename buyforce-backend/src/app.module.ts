import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { GroupsModule } from './groups/groups.module';
import { AdminModule } from './admin/admin.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  
  imports: [PrismaModule, AuthModule, CategoriesModule, ProductsModule, 
      CategoriesModule, GroupsModule, AdminModule, PaymentsModule],
  controllers: [AppController], // ← זה קריטי
  providers: [AppService],
   
})
export class AppModule {}
