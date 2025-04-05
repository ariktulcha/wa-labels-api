import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly adminToken = 'khfsrkufhkrsfhrskhfrkshfkrsuhfrksu';

  constructor(private readonly supabaseService: SupabaseService) {}

  async getUsers(adminToken: string): Promise<any[]> {
    if (adminToken !== this.adminToken) {
      throw new Error('Wrong admin token');
    }

    const { data, error } = await this.supabaseService.client
      .from('users')
      .select('*');

    if (error) {
      this.logger.error('Error fetching users:', error);
      throw new Error('Error fetching users');
    }

    return data;
  }

  async addUser(
    phone: string,
    accessToken: string,
    adminToken: string,
  ): Promise<any> {
    if (adminToken !== this.adminToken) {
      throw new Error('Wrong admin token');
    }

    const { data, error } = await this.supabaseService.client
      .from('users')
      .select('phone')
      .eq('phone', phone);

    if (error) {
      this.logger.error('Error checking user:', error);
      throw new Error('Error checking user');
    }

    if (data && data.length > 0) {
      return { message: 'User already exists' };
    }

    const { data: insertData, error: insertError } =
      await this.supabaseService.client
        .from('users')
        .insert([{ phone, token: accessToken }]);

    if (insertError) {
      this.logger.error('Error inserting user:', insertError);
      throw new Error('Error inserting user');
    }

    return { message: 'User added successfully' };
  }

  async deleteUser(phone: string, adminToken: string): Promise<any> {
    if (adminToken !== this.adminToken) {
      throw new Error('Wrong admin token');
    }

    const { error } = await this.supabaseService.client
      .from('users')
      .delete()
      .eq('phone', phone);

    if (error) {
      this.logger.error('Error deleting user:', error);
      throw new Error('Error deleting user');
    }

    return { message: 'User deleted successfully' };
  }

  async verifyUser(phone: string, token: string): Promise<boolean> {
    if (!phone || phone.trim() === '' || !token || token.trim() === '') {
      return false;
    }

    const { data, error } = await this.supabaseService.client
      .from('users')
      .select('phone')
      .eq('phone', phone)
      .eq('token', token)
      .limit(1);

    if (error) {
      this.logger.error('Error verifying user token:', error);
      throw new Error('Error verifying user token');
    }

    return data && data.length > 0;
  }
}
