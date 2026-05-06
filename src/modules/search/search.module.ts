import { Module } from '@nestjs/common';
import { ChannelsModule } from '../channels/channels.module';
import { VideosModule } from '../videos/videos.module';
import { SearchContentUseCase } from './application/use-cases/search-content.use-case';
import { SearchController } from './presentation/controllers/search.controller';

@Module({
  imports: [VideosModule, ChannelsModule],
  controllers: [SearchController],
  providers: [SearchContentUseCase],
})
export class SearchModule {}
