import mongoose from 'mongoose';

export abstract class BaseRepository<T extends mongoose.Document> {
  protected model: mongoose.Model<T>;

  constructor(model: mongoose.Model<T>) {
    this.model = model;
  }

  async create(data: Partial<T>): Promise<T> {
    const doc = new this.model(data);
    return doc.save() as Promise<T>;
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec() as Promise<T | null>;
  }

  async findOne(filter: any): Promise<T | null> {
    return this.model.findOne(filter).exec() as Promise<T | null>;
  }

  async find(filter: any = {}, options: any = {}): Promise<T[]> {
    return this.model.find(filter, null, options).exec() as Promise<T[]>;
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec() as Promise<T | null>;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }

  async count(filter: any = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  async paginate(filter: any = {}, page: number = 1, limit: number = 10, sort: any = {}) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.model.find(filter).sort(sort).skip(skip).limit(limit).exec() as Promise<T[]>,
      this.count(filter)
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }
}
