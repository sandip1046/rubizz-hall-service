import { Hall, CreateHallRequest, UpdateHallRequest, HallSearchFilters, PaginationParams, PaginatedResponse, HallWithRelations } from '@/types';
export declare class HallService {
    private redisService;
    constructor();
    createHall(data: CreateHallRequest): Promise<Hall>;
    getHallById(id: string): Promise<Hall | null>;
    getHalls(filters?: HallSearchFilters, pagination?: PaginationParams): Promise<PaginatedResponse<Hall>>;
    updateHall(id: string, data: UpdateHallRequest): Promise<Hall>;
    deleteHall(id: string): Promise<boolean>;
    checkHallAvailability(hallId: string, date: string, startTime: string, endTime: string): Promise<boolean>;
    getHallWithRelations(id: string): Promise<HallWithRelations | null>;
    searchHalls(query: string, pagination?: PaginationParams): Promise<PaginatedResponse<Hall>>;
    getHallStatistics(hallId: string): Promise<any>;
    private isTimeOverlapping;
    private clearHallCache;
}
export default HallService;
//# sourceMappingURL=HallService.d.ts.map