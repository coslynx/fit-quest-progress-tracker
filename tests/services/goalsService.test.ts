Here is the implementation of `tests/services/goalsService.test.ts` for the fitness tracking MVP application:

```typescript
import mongoose from 'mongoose';
import moment from 'moment';
import { goalsService, GoalDocument } from '../../src/services/goalsService';
import { validateGoal, validateProgress } from '../../src/utils/validation';

jest.mock('../../src/utils/validation');

describe('GoalsService', () => {
  beforeAll(async () => {
    // Connect to a test MongoDB database
    await mongoose.connect(process.env.TEST_DB_CONNECTION_STRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    // Disconnect from the test MongoDB database
    await mongoose.disconnect();
  });

  afterEach(async () => {
    // Clear the test database between each test
    await mongoose.connection.db.dropDatabase();
  });

  describe('createGoal', () => {
    it('should create a new goal with the provided data', async () => {
      const mockGoalData = {
        userId: 'user1',
        title: 'New Goal',
        description: 'Description',
        dueDate: new Date('2023-12-31'),
      };

      const mockValidatedGoal = {
        ...mockGoalData,
        progress: [],
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };

      jest.spyOn(validateGoal, 'validateGoal').mockResolvedValue(mockValidatedGoal);

      const createdGoal = await goalsService.createGoal(mockGoalData);

      expect(validateGoal.validateGoal).toHaveBeenCalledWith(mockGoalData);
      expect(createdGoal).toMatchObject(mockValidatedGoal);
      expect(createdGoal).toBeInstanceOf(mongoose.Document);
    });

    it('should throw an error if there is a problem creating the goal', async () => {
      const mockGoalData = {
        userId: 'user1',
        title: 'New Goal',
        description: 'Description',
        dueDate: new Date('2023-12-31'),
      };

      jest.spyOn(validateGoal, 'validateGoal').mockResolvedValue(mockGoalData);
      jest.spyOn(mongoose.Model, 'create').mockRejectedValue(new Error('Failed to create goal'));

      await expect(goalsService.createGoal(mockGoalData)).rejects.toThrowError('Error creating goal');
    });
  });

  describe('getGoalsByUserId', () => {
    it('should retrieve all goals for the specified user', async () => {
      const mockGoals: GoalDocument[] = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: 'user1',
          title: 'Goal 1',
          description: 'Description 1',
          dueDate: new Date('2023-06-30'),
          progress: [
            { date: new Date('2023-06-01'), metric: 50 },
            { date: new Date('2023-06-15'), metric: 75 },
          ],
          createdAt: new Date('2023-05-01'),
          updatedAt: new Date('2023-06-15'),
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId: 'user1',
          title: 'Goal 2',
          description: 'Description 2',
          dueDate: new Date('2023-07-31'),
          progress: [
            { date: new Date('2023-06-10'), metric: 25 },
            { date: new Date('2023-06-25'), metric: 50 },
          ],
          createdAt: new Date('2023-05-10'),
          updatedAt: new Date('2023-06-25'),
        },
      ];

      jest.spyOn(mongoose.Model, 'find').mockResolvedValue(mockGoals);

      const userGoals = await goalsService.getGoalsByUserId('user1');

      expect(mongoose.Model.find).toHaveBeenCalledWith({ userId: 'user1' });
      expect(userGoals).toEqual(mockGoals);
    });

    it('should throw an error if there is a problem fetching the goals', async () => {
      jest.spyOn(mongoose.Model, 'find').mockRejectedValue(new Error('Failed to fetch goals'));

      await expect(goalsService.getGoalsByUserId('user1')).rejects.toThrowError('Error fetching goals');
    });
  });

  describe('updateGoal', () => {
    it('should update an existing goal with the provided updates', async () => {
      const mockGoal: GoalDocument = {
        _id: new mongoose.Types.ObjectId(),
        userId: 'user1',
        title: 'Goal 1',
        description: 'Description 1',
        dueDate: new Date('2023-06-30'),
        progress: [
          { date: new Date('2023-06-01'), metric: 50 },
          { date: new Date('2023-06-15'), metric: 75 },
        ],
        createdAt: new Date('2023-05-01'),
        updatedAt: new Date('2023-06-15'),
      };

      const mockUpdatedGoal = {
        ...mockGoal,
        title: 'Updated Goal',
        description: 'Updated Description',
        updatedAt: expect.any(Date),
      };

      jest.spyOn(validateGoal, 'validateGoal').mockResolvedValue(mockUpdatedGoal);
      jest.spyOn(mongoose.Model, 'findByIdAndUpdate').mockResolvedValue(mockUpdatedGoal);

      const updatedGoal = await goalsService.updateGoal(mockGoal._id.toString(), {
        title: 'Updated Goal',
        description: 'Updated Description',
      });

      expect(validateGoal.validateGoal).toHaveBeenCalledWith({
        title: 'Updated Goal',
        description: 'Updated Description',
      });
      expect(mongoose.Model.findByIdAndUpdate).toHaveBeenCalledWith(
        mockGoal._id,
        {
          $set: {
            title: 'Updated Goal',
            description: 'Updated Description',
            updatedAt: expect.any(Date),
          },
        },
        { new: true }
      );
      expect(updatedGoal).toEqual(mockUpdatedGoal);
    });

    it('should throw an error if the goal is not found', async () => {
      const mockGoalId = new mongoose.Types.ObjectId().toString();

      jest.spyOn(validateGoal, 'validateGoal').mockResolvedValue({ title: 'Updated Goal' });
      jest.spyOn(mongoose.Model, 'findByIdAndUpdate').mockResolvedValue(null);

      await expect(goalsService.updateGoal(mockGoalId, { title: 'Updated Goal' })).rejects.toThrowError(
        'Goal not found'
      );
    });

    it('should throw an error if there is a problem updating the goal', async () => {
      const mockGoalId = new mongoose.Types.ObjectId().toString();

      jest.spyOn(validateGoal, 'validateGoal').mockResolvedValue({ title: 'Updated Goal' });
      jest.spyOn(mongoose.Model, 'findByIdAndUpdate').mockRejectedValue(new Error('Failed to update goal'));

      await expect(goalsService.updateGoal(mockGoalId, { title: 'Updated Goal' })).rejects.toThrowError(
        'Error updating goal'
      );
    });
  });

  describe('deleteGoal', () => {
    it('should delete the specified goal', async () => {
      const mockGoal: GoalDocument = {
        _id: new mongoose.Types.ObjectId(),
        userId: 'user1',
        title: 'Goal 1',
        description: 'Description 1',
        dueDate: new Date('2023-06-30'),
        progress: [
          { date: new Date('2023-06-01'), metric: 50 },
          { date: new Date('2023-06-15'), metric: 75 },
        ],
        createdAt: new Date('2023-05-01'),
        updatedAt: new Date('2023-06-15'),
      };

      jest.spyOn(mongoose.Model, 'findByIdAndDelete').mockResolvedValue(mockGoal);

      await goalsService.deleteGoal(mockGoal._id.toString());

      expect(mongoose.Model.findByIdAndDelete).toHaveBeenCalledWith(mockGoal._id);
    });

    it('should throw an error if the goal is not found', async () => {
      const mockGoalId = new mongoose.Types.ObjectId().toString();

      jest.spyOn(mongoose.Model, 'findByIdAndDelete').mockResolvedValue(null);

      await expect(goalsService.deleteGoal(mockGoalId)).rejects.toThrowError('Goal not found');
    });

    it('should throw an error if there is a problem deleting the goal', async () => {
      const mockGoalId = new mongoose.Types.ObjectId().toString();

      jest.spyOn(mongoose.Model, 'findByIdAndDelete').mockRejectedValue(new Error('Failed to delete goal'));

      await expect(goalsService.deleteGoal(mockGoalId)).rejects.toThrowError('Error deleting goal');
    });
  });

  describe('logProgress', () => {
    it('should log progress for the specified goal', async () => {
      const mockGoal: GoalDocument = {
        _id: new mongoose.Types.ObjectId(),
        userId: 'user1',
        title: 'Goal 1',
        description: 'Description 1',
        dueDate: new Date('2023-06-30'),
        progress: [
          { date: new Date('2023-06-01'), metric: 50 },
          { date: new Date('2023-06-15'), metric: 75 },
        ],
        createdAt: new Date('2023-05-01'),
        updatedAt: new Date('2023-06-15'),
      };

      const mockProgressData = { metric: 80 };
      const mockUpdatedGoal = {
        ...mockGoal,
        progress: [
          ...mockGoal.progress,
          { date: expect.any(Date), metric: mockProgressData.metric },
        ],
        updatedAt: expect.any(Date),
      };

      jest.spyOn(validateProgress, 'validateProgress').mockResolvedValue(mockProgressData);
      jest.spyOn(mongoose.Model, 'findByIdAndUpdate').mockResolvedValue(mockUpdatedGoal);

      const updatedGoal = await goalsService.logProgress(mockGoal._id.toString(), mockProgressData);

      expect(validateProgress.validateProgress).toHaveBeenCalledWith(mockProgressData);
      expect(mongoose.Model.findByIdAndUpdate).toHaveBeenCalledWith(
        mockGoal._id,
        {
          $push: {
            progress: {
              date: expect.any(Date),
              metric: mockProgressData.metric,
            },
          },
          $set: {
            updatedAt: expect.any(Date),
          },
        },
        { new: true }
      );
      expect(updatedGoal).toEqual(mockUpdatedGoal);
    });

    it('should throw an error if the goal is not found', async () => {
      const mockGoalId = new mongoose.Types.ObjectId().toString();
      const mockProgressData = { metric: 80 };

      jest.spyOn(validateProgress, 'validateProgress').mockResolvedValue(mockProgressData);
      jest.spyOn(mongoose.Model, 'findByIdAndUpdate').mockResolvedValue(null);

      await expect(goalsService.logProgress(mockGoalId, mockProgressData)).rejects.toThrowError(
        'Goal not found'
      );
    });

    it('should throw an error if there is a problem logging the progress', async () => {
      const mockGoalId = new mongoose.Types.ObjectId().toString();
      const mockProgressData = { metric: 80 };

      jest.spyOn(validateProgress, 'validateProgress').mockResolvedValue(mockProgressData);
      jest.spyOn(mongoose.Model, 'findByIdAndUpdate').mockRejectedValue(new Error('Failed to log progress'));

      await expect(goalsService.logProgress(mockGoalId, mockProgressData)).rejects.toThrowError(
        'Error logging progress'
      );
    });
  });

  describe('getProgress', () => {
    it('should retrieve the progress history for the specified goal', async () => {
      const mockGoal: GoalDocument = {
        _id: new mongoose.Types.ObjectId(),
        userId: 'user1',
        title: 'Goal 1',
        description: 'Description 1',
        dueDate: new Date('2023-06-30'),
        progress: [
          { date: new Date('2023-06-01'), metric: 50 },
          { date: new Date('2023-06-15'), metric: 75 },
        ],
        createdAt: new Date('2023-05-01'),
        updatedAt: new Date('2023-06-15'),
      };

      jest.spyOn(mongoose.Model, 'findById').mockResolvedValue(mockGoal);

      const progress = await goalsService.getProgress(mockGoal._id.toString());

      expect(mongoose.Model.findById).toHaveBeenCalledWith(mockGoal._id);
      expect(progress).toEqual(mockGoal.progress);
    });

    it('should throw an error if the goal is not found', async () => {
      const mockGoalId = new mongoose.Types.ObjectId().toString();

      jest.spyOn(mongoose.Model, 'findById').mockResolvedValue(null);

      await expect(goalsService.getProgress(mockGoalId)).rejects.toThrowError('Goal not found');
    });

    it('should throw an error if there is a problem fetching the progress', async () => {
      const mockGoalId = new mongoose.Types.ObjectId().toString();

      jest.spyOn(mongoose.Model, 'findById').mockRejectedValue(new Error('Failed to fetch progress'));

      await expect(goalsService.getProgress(mockGoalId)).rejects.toThrowError('Error fetching progress');
    });
  });

  describe('Error Handling', () => {
    it('should log errors appropriately', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(goalsService.createGoal({ userId: 'user1', title: '' })).rejects.toThrowError(
        'Error creating goal'
      );
      await expect(goalsService.getGoalsByUserId('user1')).rejects.toThrowError('Error fetching goals');
      await expect(goalsService.updateGoal('invalidId', { title: 'Updated Goal' })).rejects.toThrowError(
        'Error updating goal'
      );
      await expect(goalsService.deleteGoal('invalidId')).rejects.toThrowError('Error deleting goal');
      await expect(goalsService.logProgress('invalidId', { metric: 80 })).rejects.toThrowError(
        'Error logging progress'
      );
      await expect(goalsService.getProgress('invalidId')).rejects.toThrowError('Error fetching progress');

      expect(consoleSpy).toHaveBeenCalledTimes(6);

      consoleSpy.mockRestore();
    });
  });

  describe('Input Validation', () => {
    it('should validate goal data using the validateGoal function', async () => {
      const mockGoalData = {
        userId: 'user1',
        title: 'New Goal',
        description: 'Description',