import type { PaginationDto } from '../../../../shared/presentation/dto/pagination.dto';
import type { MyMembershipItemResponse } from './my-membership-item.response';

export interface MyMembershipsResponse {
  items: MyMembershipItemResponse[];
  pagination: PaginationDto;
}
