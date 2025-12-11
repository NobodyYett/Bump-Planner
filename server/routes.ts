import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPregnancyLogSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Pregnancy logs API routes
  
  // GET /api/pregnancy/logs - Get all pregnancy logs
  app.get("/api/pregnancy/logs", async (_req, res) => {
    try {
      const logs = await storage.getPregnancyLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching pregnancy logs:", error);
      res.status(500).json({ message: "Failed to fetch pregnancy logs" });
    }
  });

  // GET /api/pregnancy/logs/week/:week - Get logs for a specific week
  app.get("/api/pregnancy/logs/week/:week", async (req, res) => {
    try {
      const week = parseInt(req.params.week, 10);
      if (isNaN(week) || week < 1 || week > 42) {
        return res.status(400).json({ message: "Invalid week number" });
      }
      const logs = await storage.getPregnancyLogsByWeek(week);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching pregnancy logs by week:", error);
      res.status(500).json({ message: "Failed to fetch pregnancy logs" });
    }
  });

  // GET /api/pregnancy/logs/date/:date - Get log for a specific date
  app.get("/api/pregnancy/logs/date/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const log = await storage.getPregnancyLogByDate(date);
      if (!log) {
        return res.status(404).json({ message: "No log found for this date" });
      }
      res.json(log);
    } catch (error) {
      console.error("Error fetching pregnancy log by date:", error);
      res.status(500).json({ message: "Failed to fetch pregnancy log" });
    }
  });

  // POST /api/pregnancy/logs - Create a new pregnancy log
  app.post("/api/pregnancy/logs", async (req, res) => {
    try {
      // Validate request body with Zod
      const validationResult = insertPregnancyLogSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationResult.error.flatten().fieldErrors 
        });
      }

      const logData = validationResult.data;
      
      // Check if a log already exists for this date
      const existingLog = await storage.getPregnancyLogByDate(logData.date);
      if (existingLog) {
        return res.status(409).json({ 
          message: "A check-in already exists for this date",
          existingLog 
        });
      }

      const newLog = await storage.createPregnancyLog(logData);
      res.status(201).json(newLog);
    } catch (error) {
      console.error("Error creating pregnancy log:", error);
      res.status(500).json({ message: "Failed to create pregnancy log" });
    }
  });

  return httpServer;
}
