import { type User, type InsertUser, type PregnancyLog, type InsertPregnancyLog } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Pregnancy log methods
  createPregnancyLog(log: InsertPregnancyLog): Promise<PregnancyLog>;
  getPregnancyLogs(): Promise<PregnancyLog[]>;
  getPregnancyLogsByWeek(week: number): Promise<PregnancyLog[]>;
  getPregnancyLogByDate(date: string): Promise<PregnancyLog | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private pregnancyLogs: Map<string, PregnancyLog>;

  constructor() {
    this.users = new Map();
    this.pregnancyLogs = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createPregnancyLog(insertLog: InsertPregnancyLog): Promise<PregnancyLog> {
    const id = randomUUID();
    const log: PregnancyLog = {
      id,
      date: insertLog.date,
      week: insertLog.week,
      mood: insertLog.mood,
      symptoms: insertLog.symptoms ?? null,
      notes: insertLog.notes ?? null,
      createdAt: new Date(),
    };
    this.pregnancyLogs.set(id, log);
    return log;
  }

  async getPregnancyLogs(): Promise<PregnancyLog[]> {
    // Return logs sorted by date descending (most recent first)
    return Array.from(this.pregnancyLogs.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getPregnancyLogsByWeek(week: number): Promise<PregnancyLog[]> {
    return Array.from(this.pregnancyLogs.values())
      .filter((log) => log.week === week)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getPregnancyLogByDate(date: string): Promise<PregnancyLog | undefined> {
    return Array.from(this.pregnancyLogs.values()).find(
      (log) => log.date === date
    );
  }
}

export const storage = new MemStorage();
