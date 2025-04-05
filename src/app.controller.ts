import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Sse,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { AppService } from './app.service';
import { Observable, Subject } from 'rxjs';
import { AddLabelToChatsDto } from './dto/add-label-to-chats.dto';
import { RemoveLabelFromChatsDto } from './dto/remove-label-from-chats';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('add-label-to-chats')
  @ApiOperation({
    summary:
      'Add label to chats for a list of phone numbers. Note: Only add numbers you have chats with. Otherwise, the function will not work properly',
  })
  @ApiQuery({ name: 'label', description: 'Label name' })
  @ApiQuery({ name: 'phone', description: 'Phone number' })
  @ApiQuery({
    name: 'accessToken',
    description: 'User access token',
  })
  @ApiBody({ type: AddLabelToChatsDto })
  @ApiResponse({
    status: 201,
    description: 'Label added to chats successfully',
  })
  async addLabelToChats(
    @Query('label') label: string,
    @Query('phone') phone: string,
    @Query('accessToken') accessToken: string,
    @Body() addLabelDto: AddLabelToChatsDto,
  ) {
    return this.appService.addLabelToChats(
      label,
      phone,
      accessToken,
      addLabelDto.phones,
    );
  }

  @Delete('remove-label-from-chats')
  @ApiOperation({
    summary:
      'Remove label from chats for a given list of phone numbers. Note: only enter numbers you have chats with. Otherwise, the function will not work properly',
  })
  @ApiQuery({ name: 'label', description: 'Label name to remove from chats' })
  @ApiQuery({ name: 'phone', description: 'Phone number' })
  @ApiQuery({
    name: 'accessToken',
    description: 'Access token',
  })
  @ApiBody({
    type: RemoveLabelFromChatsDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Label removed from chats successfully',
  })
  async removeLabelFromChats(
    @Query('label') label: string,
    @Query('phone') phone: string,
    @Query('accessToken') accessToken: string,
    @Body() removeLabelDto: RemoveLabelFromChatsDto,
  ) {
    return this.appService.removeLabelsFromChats(
      label,
      phone,
      accessToken,
      removeLabelDto.phones,
    );
  }

  @Get('chats-by-label')
  @ApiOperation({ summary: 'Get chats by label' })
  @ApiQuery({ name: 'label', description: 'Label name' })
  @ApiQuery({ name: 'phone', description: 'Phone number' })
  @ApiQuery({
    name: 'accessToken',
    description: 'Access token',
  })
  @ApiResponse({
    status: 200,
    description: 'List of chats (phone numbers or group names)',
  })
  async getChatsByLabel(
    @Query('label') label: string,
    @Query('phone') phone: string,
    @Query('accessToken') accessToken: string,
  ) {
    return this.appService.getChatsByLabel(label, phone, accessToken);
  }

  @Delete('delete-user')
  @ApiOperation({ summary: 'Delete a user by phone number' })
  @ApiQuery({
    name: 'phone',
    description: 'Phone number of the user to delete',
  })
  @ApiQuery({
    name: 'adminToken',
    description: 'Admin token for authorization',
  })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async deleteUser(
    @Query('phone') phone: string,
    @Query('adminToken') adminToken: string,
  ) {
    return this.appService.deleteUser(phone, adminToken);
  }

  @Post('add-user')
  @ApiOperation({ summary: 'Add a new user' })
  @ApiQuery({ name: 'phone', description: 'Phone number of the user to add' })
  @ApiQuery({ name: 'accessToken', description: 'Access token of the user' })
  @ApiQuery({
    name: 'adminToken',
    description: 'Admin token for authorization',
  })
  @ApiResponse({ status: 201, description: 'User added successfully' })
  async addUser(
    @Query('phone') phone: string,
    @Query('accessToken') accessToken: string,
    @Query('adminToken') adminToken: string,
  ) {
    return this.appService.addUser(phone, accessToken, adminToken);
  }

  @Get('get-users')
  @ApiOperation({ summary: 'Retrieve all users' })
  @ApiQuery({
    name: 'adminToken',
    description: 'Admin token for authorization',
  })
  @ApiResponse({ status: 200, description: 'List of users' })
  async getUsers(@Query('adminToken') adminToken: string) {
    return this.appService.getUsers(adminToken);
  }

  @Sse('connect')
  @ApiOperation({
    summary:
      'Establish a connection between WA business account and API. Send the request, wait until it sends you a code, then enter this code in mobile WA Business app, wait until connection establishes and add name to the device when prompt appears. Do not unlink this device from your mobile phone',
  })
  @ApiQuery({ name: 'phone', description: 'Phone number' })
  @ApiQuery({
    name: 'accessToken',
    description: 'Access token for authentication',
  })
  @ApiResponse({
    status: 200,
    description: 'Connection established successfully',
  })
  connect(
    @Query('phone') phone: string,
    @Query('accessToken') accessToken: string,
  ): Observable<any> {
    const subject = new Subject();

    this.appService
      .connectPhone(phone, accessToken, (code: string) => {
        subject.next({ data: { code } });
      })
      .then((result) => {
        subject.next({
          data: { message: result.message, phone: result.phone },
        });
        subject.complete();
      })
      .catch((error) => {
        subject.error({ data: { error: error.message } });
      });

    return subject.asObservable();
  }
}
