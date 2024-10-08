import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './domains/users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './utils/configuration';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from './domains/users/users.service';
import { Role } from './domains/users/entities/user.entity';
import { EbooksModule } from './domains/ebooks/ebooks.module';
import { EbookCommentsModule } from './domains/comments/comments.module';
import { AuthModule } from './domains/auth/auth.module';
import { SearchModule } from './domains/search/search.module';
import { CategoriesModule } from './domains/categories/categories.module';
import { UserEbooksModule } from './domains/user_ebooks/user_ebooks.module';
import { EbookComment } from './domains/comments/entities/comment.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: configuration().database.host,
      port: configuration().database.port,
      username: configuration().database.username,
      password: configuration().database.password,
      database: configuration().database.name,
      synchronize: true,
      autoLoadEntities: true,
      logging: true,
      ssl: { rejectUnauthorized: false },
    }),
    JwtModule.register({
      global: true,
      secret: configuration().jwt_secret,
      signOptions: { expiresIn: '3600s' },
    }),
    UsersModule,
    EbooksModule,
    CategoriesModule,
    AuthModule,
    SearchModule,
    UserEbooksModule,
    EbookCommentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(
    private userService: UsersService,
    private configService: ConfigService,
  ) {
    try {
      //find in the db if there is a user with the admin role
      this.userService.findOneByRole('ADMIN').then(async (user) => {
        if (!user) {
          await this.userService.create({
            id: 'admin',
            userName: 'admin',
            email: this.configService.get<string>('STATIC_USER_EMAIL'),
            avatarURL: '',
            joinedDate: '',
            password: this.configService.get<string>('STATIC_USER_PASSWORD'),
            role: Role.ADMIN,
            wallPaperURL: '',
          });
        } else {
          console.log('static admin user already exists');
        }
      });
    } catch (e) {
      console.log(e);
    }
  }
}
