import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SharedModule } from './shared/shared.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { SearchModule } from './modules/search/search.module';
import { VideosModule } from './modules/videos/videos.module';
import { StreamingModule } from './modules/streaming/streaming.module';

@Module({
  imports: [
    SharedModule,
    CategoriesModule,
    ChannelsModule,
    SearchModule,
    VideosModule,
    StreamingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
