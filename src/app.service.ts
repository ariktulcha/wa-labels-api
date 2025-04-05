import { Injectable, Logger } from '@nestjs/common';
const wppconnect = require('@wppconnect-team/wppconnect');
import chromium from '@sparticuz/chromium';
import { UsersService } from './users/users.service';

@Injectable()
export class AppService {
  private connections: Map<string, any> = new Map();
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly usersService: UsersService) {}

  async getUsers(adminToken: string): Promise<any[]> {
    return this.usersService.getUsers(adminToken);
  }

  async deleteUser(phone: string, adminToken: string): Promise<any> {
    return this.usersService.deleteUser(phone, adminToken);
  }

  async addUser(
    phone: string,
    accessToken: string,
    adminToken: string,
  ): Promise<any> {
    return this.usersService.addUser(phone, accessToken, adminToken);
  }

  async connectPhone(
    phone: string,
    accessToken: string,
    codeCallback: (code: string) => void,
  ): Promise<any> {
    if (!(await this.usersService.verifyUser(phone, accessToken))) {
      return { message: 'Invalid access token', phone };
    }

    if (this.connections.has(phone)) {
      if (this.connections.get(phone).connected === false) {
        this.connections.delete(phone);
      } else {
        return {
          message: 'Connection already exists for this phone number',
          phone,
        };
      }
    }
    try {
      const client = await wppconnect.create({
        session: phone,
        phoneNumber: phone,
        catchLinkCode: (code: string) => {
          this.logger.log(`Code for ${phone}: ${code}`);
          codeCallback(code);
        },
        statusFind: (status: string, session: any) => {
          this.logger.log(`Status for ${phone}: ${status}`);
          this.logger.log(this.connections);
        },
        disableWelcome: true,
        logQR: false,
        headless: false,
        autoClose: false,
        debug: true,
        puppeteerOptions: {
          args: [
            ...chromium.args,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
          ],
          ignoreHTTPSErrors: true,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
        },
      });

      this.connections.set(phone, client);
      return { message: 'Connection established successfully', phone };
    } catch (error) {
      this.logger.error(`Failed to establish connection for ${phone}:`, error);
      throw new Error(`Failed to establish connection for ${phone}: ${error}`);
    }
  }

  async getChatsByLabel(
    labelName: string,
    phone: string,
    accessToken: string,
  ): Promise<any[]> {
    try {
      if (!(await this.usersService.verifyUser(phone, accessToken))) {
        return ['Invalid access token'];
      }
      const client = await this.connections.get(phone);
      if (!client) return ['reconnect'];

      const chats = await client.listChats({ withLabels: [labelName] });
      const parsedChats = chats.map((chat) => {
        if (chat.isGroup) {
          return chat.groupMetadata
            ? chat.groupMetadata.subject
            : 'Unnamed Group';
        } else {
          return chat.id.user;
        }
      });

      return parsedChats;
    } catch (error) {
      this.logger.error('Error retrieving chats:', error);
      throw error;
    }
  }

  async addLabelToChats(
    labelName = '',
    phone: string,
    accessToken: string,
    numbers: string[],
  ): Promise<any[]> {
    try {
      if (!(await this.usersService.verifyUser(phone, accessToken))) {
        return ['Invalid access token'];
      }

      const client = await this.connections.get(phone);
      if (!client) return ['reconnect'];
      this.logger.log(client);

      let labels = await client.getAllLabels();
      let label = labels.find((l) => l.name === labelName);

      if (!label) {
        await client.addNewLabel(labelName);
        await new Promise<void>((resolve) => setTimeout(resolve, 10000));

        labels = await client.getAllLabels();
        this.logger.log(labels);
        label = labels.find((l) => l.name === labelName);

        this.logger.log(label.id);
      }

      this.logger.log(labelName, phone, label.id, numbers);
      await client.addOrRemoveLabels(
        numbers.map((n) => `${n}@c.us`),
        [{ labelId: label.id, type: 'add' }],
      );
      return [];
    } catch (error) {
      this.logger.error('Error adding label to chats:', error);
      throw error;
    }
  }

  async removeLabelsFromChats(
    labelName = '',
    phone: string,
    accessToken: string,
    numbers: string[],
  ): Promise<any[]> {
    try {
      if (!(await this.usersService.verifyUser(phone, accessToken))) {
        return ['Invalid access token'];
      }
      const client = await this.connections.get(phone);
      if (!client) return ['reconnect'];

      const labels = await client.getAllLabels();
      const labelId = labels.find((label) => label.name === labelName)?.id;
      if (!labelId) return ['label does not exist'];

      await client.addOrRemoveLabels(
        numbers.map((n) => `${n}@c.us`),
        [{ labelId, type: 'remove' }],
      );
      return [];
    } catch (error) {
      this.logger.error('Error removing labels from chats:', error);
      throw error;
    }
  }
}
