import { HallService } from '@/services/HallService';
import { database } from '@/database/DatabaseConnection';
import { CreateHallRequest, UpdateHallRequest } from '@/types';

// Mock the database
jest.mock('@/database/DatabaseConnection');

describe('HallService', () => {
  let hallService: HallService;
  let mockPrisma: any;

  beforeEach(() => {
    hallService = new HallService();
    mockPrisma = {
      hall: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
      },
    };
    (database.getPrisma as jest.Mock).mockReturnValue(mockPrisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createHall', () => {
    it('should create a hall successfully', async () => {
      const hallData: CreateHallRequest = {
        name: 'Grand Hall',
        capacity: 200,
        location: 'Main Building',
        baseRate: 5000,
      };

      const createdHall = {
        id: 'test-hall-id',
        ...hallData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.hall.findUnique.mockResolvedValue(null);
      mockPrisma.hall.create.mockResolvedValue(createdHall);

      const result = await hallService.createHall(hallData);

      expect(mockPrisma.hall.findUnique).toHaveBeenCalledWith({
        where: { name: hallData.name },
      });
      expect(mockPrisma.hall.create).toHaveBeenCalled();
      expect(result).toEqual(createdHall);
    });

    it('should throw error if hall with same name exists', async () => {
      const hallData: CreateHallRequest = {
        name: 'Grand Hall',
        capacity: 200,
        location: 'Main Building',
        baseRate: 5000,
      };

      const existingHall = {
        id: 'existing-hall-id',
        name: 'Grand Hall',
      };

      mockPrisma.hall.findUnique.mockResolvedValue(existingHall);

      await expect(hallService.createHall(hallData)).rejects.toThrow('Hall with this name already exists');
    });
  });

  describe('getHallById', () => {
    it('should return hall if found', async () => {
      const hallId = 'test-hall-id';
      const hall = {
        id: hallId,
        name: 'Grand Hall',
        capacity: 200,
        location: 'Main Building',
        baseRate: 5000,
      };

      mockPrisma.hall.findUnique.mockResolvedValue(hall);

      const result = await hallService.getHallById(hallId);

      expect(mockPrisma.hall.findUnique).toHaveBeenCalledWith({
        where: { id: hallId },
      });
      expect(result).toEqual(hall);
    });

    it('should return null if hall not found', async () => {
      const hallId = 'non-existent-id';

      mockPrisma.hall.findUnique.mockResolvedValue(null);

      const result = await hallService.getHallById(hallId);

      expect(result).toBeNull();
    });
  });

  describe('getHalls', () => {
    it('should return paginated halls', async () => {
      const halls = [
        {
          id: 'hall-1',
          name: 'Hall 1',
          capacity: 100,
        },
        {
          id: 'hall-2',
          name: 'Hall 2',
          capacity: 200,
        },
      ];

      mockPrisma.hall.findMany.mockResolvedValue(halls);
      mockPrisma.hall.count.mockResolvedValue(2);

      const result = await hallService.getHalls();

      expect(mockPrisma.hall.findMany).toHaveBeenCalled();
      expect(mockPrisma.hall.count).toHaveBeenCalled();
      expect(result.data).toEqual(halls);
      expect(result.pagination.total).toBe(2);
    });

    it('should apply filters correctly', async () => {
      const filters = {
        location: 'Main Building',
        capacity: 200,
      };

      mockPrisma.hall.findMany.mockResolvedValue([]);
      mockPrisma.hall.count.mockResolvedValue(0);

      await hallService.getHalls(filters);

      expect(mockPrisma.hall.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            location: {
              contains: 'Main Building',
              mode: 'insensitive',
            },
            capacity: {
              gte: 200,
            },
          }),
        })
      );
    });
  });

  describe('updateHall', () => {
    it('should update hall successfully', async () => {
      const hallId = 'test-hall-id';
      const updateData: UpdateHallRequest = {
        name: 'Updated Hall Name',
        capacity: 300,
      };

      const existingHall = {
        id: hallId,
        name: 'Original Hall Name',
        capacity: 200,
      };

      const updatedHall = {
        ...existingHall,
        ...updateData,
      };

      mockPrisma.hall.findUnique.mockResolvedValue(existingHall);
      mockPrisma.hall.update.mockResolvedValue(updatedHall);

      const result = await hallService.updateHall(hallId, updateData);

      expect(mockPrisma.hall.findUnique).toHaveBeenCalledWith({
        where: { id: hallId },
      });
      expect(mockPrisma.hall.update).toHaveBeenCalledWith({
        where: { id: hallId },
        data: updateData,
      });
      expect(result).toEqual(updatedHall);
    });

    it('should throw error if hall not found', async () => {
      const hallId = 'non-existent-id';
      const updateData: UpdateHallRequest = {
        name: 'Updated Hall Name',
      };

      mockPrisma.hall.findUnique.mockResolvedValue(null);

      await expect(hallService.updateHall(hallId, updateData)).rejects.toThrow('Hall not found');
    });
  });

  describe('deleteHall', () => {
    it('should delete hall successfully', async () => {
      const hallId = 'test-hall-id';
      const existingHall = {
        id: hallId,
        name: 'Test Hall',
        bookings: [],
        quotations: [],
      };

      mockPrisma.hall.findUnique.mockResolvedValue(existingHall);
      mockPrisma.hall.delete.mockResolvedValue(existingHall);

      const result = await hallService.deleteHall(hallId);

      expect(mockPrisma.hall.findUnique).toHaveBeenCalledWith({
        where: { id: hallId },
        include: {
          bookings: true,
          quotations: true,
        },
      });
      expect(mockPrisma.hall.delete).toHaveBeenCalledWith({
        where: { id: hallId },
      });
      expect(result).toBe(true);
    });

    it('should throw error if hall has active bookings', async () => {
      const hallId = 'test-hall-id';
      const existingHall = {
        id: hallId,
        name: 'Test Hall',
        bookings: [
          {
            id: 'booking-1',
            isCancelled: false,
            status: 'CONFIRMED',
          },
        ],
        quotations: [],
      };

      mockPrisma.hall.findUnique.mockResolvedValue(existingHall);

      await expect(hallService.deleteHall(hallId)).rejects.toThrow('Cannot delete hall with active bookings');
    });
  });

  describe('checkHallAvailability', () => {
    it('should return true if hall is available', async () => {
      const hallId = 'test-hall-id';
      const date = '2024-12-31';
      const startTime = '10:00';
      const endTime = '18:00';

      const hall = {
        id: hallId,
        isActive: true,
        isAvailable: true,
      };

      mockPrisma.hall.findUnique.mockResolvedValue(hall);
      mockPrisma.hallBooking.findFirst.mockResolvedValue(null);
      mockPrisma.hallAvailability.findFirst.mockResolvedValue(null);

      const result = await hallService.checkHallAvailability(hallId, date, startTime, endTime);

      expect(result).toBe(true);
    });

    it('should return false if hall is not active', async () => {
      const hallId = 'test-hall-id';
      const date = '2024-12-31';
      const startTime = '10:00';
      const endTime = '18:00';

      const hall = {
        id: hallId,
        isActive: false,
        isAvailable: true,
      };

      mockPrisma.hall.findUnique.mockResolvedValue(hall);

      const result = await hallService.checkHallAvailability(hallId, date, startTime, endTime);

      expect(result).toBe(false);
    });
  });
});
