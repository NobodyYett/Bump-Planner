import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPregnancyLogSchema } from "@shared/schema";
import { createClient } from "@supabase/supabase-js";

// Create admin client for user deletion
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // DELETE /api/account - Delete user account
  app.delete("/api/account", async (req, res) => {
    try {
      // Get the authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const token = authHeader.split(" ")[1];

      // Verify the token and get user
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      
      if (authError || !user) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const userId = user.id;

      // Delete user data from all tables
      await supabaseAdmin.from("pregnancy_logs").delete().eq("user_id", userId);
      await supabaseAdmin.from("pregnancy_appointments").delete().eq("user_id", userId);
      await supabaseAdmin.from("pregnancy_profiles").delete().eq("user_id", userId);

      // Delete the auth user using admin API
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (deleteError) {
        console.error("Error deleting auth user:", deleteError);
        return res.status(500).json({ message: "Failed to delete user" });
      }

      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

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
      const validationResult = insertPregnancyLogSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationResult.error.flatten().fieldErrors 
        });
      }

      const logData = validationResult.data;
      
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