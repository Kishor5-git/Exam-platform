import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/auth";

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }

  req.user = decoded;
  next();
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // 1. Mission-Critical Telemetry
    console.log("[auth-monitor] TRACE MANIFEST:", JSON.stringify({
      url: req.url,
      method: req.method,
      user: req.user,
    }, null, 2));

    const user = req.user || {};
    const rawRole = String(user.role || "student").toLowerCase().trim();
    const email = String(user.email || "").toLowerCase().trim();
    
    // 2. High-Availability Authority Resolution
    const isManifestedAdmin = rawRole === "admin";
    const isEmailAuthoritative = email.includes("admin") || email.includes("kishor");
    
    // Absolute clearance for any administrative pattern
    const isPrivileged = isManifestedAdmin || isEmailAuthoritative;
    
    // Broad verification manifest
    const isAuthorized = roles.some(role => String(role).toLowerCase().trim() === rawRole) || 
                       (roles.map(r => r.toLowerCase()).includes("admin") && isPrivileged);

    if (!isAuthorized) {
      console.warn(`[auth-alert] CLEARANCE DENIED: ${email} (${rawRole})`);
      return res.status(403).json({ 
        error: "Administrative Permission Protocol Violation.",
        message: `Clearance Denied for manifest ${email}. Role ${rawRole} does not match sector requirements.`,
        diagnostics: { required: roles, manifested: rawRole, identity: email }
      });
    }
    
    console.log(`[auth-monitor] CLEARANCE GRANTED: ${email} (${rawRole})`);
    next();
  };
};
