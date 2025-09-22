import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../modules/auth/auth.module';

@Global()
@Module({
  imports: [PrismaModule, AuthModule],
  providers: [],
  exports: [AuthModule],
})
export class SharedModule {}