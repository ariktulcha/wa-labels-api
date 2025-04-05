import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersService } from './users/users.service';
import { SupabaseService } from './supabase/supabase.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [SupabaseService, UsersService, AppService],
})
export class AppModule {}
