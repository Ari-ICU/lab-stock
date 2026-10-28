import { Request, Response, NextFunction } from 'express';
import { ValidationException } from '../exceptions/errorHandler.js';
import { validatePasswordStrength } from '../utils/password.js';
import { isValidEmail } from './commonValidation.js';

/**
 * Validate user login payload
 */
export function validateLogin(req: Request, _res: Response, next: NextFunction) {
  const { email, password } = req.body;
  const errors: Record<string, string> = {};

  if (!email || !isValidEmail(email)) {
    errors.email = 'A valid institutional email address is required';
  }

  if (!password || typeof password !== 'string' || password.trim().length === 0) {
    errors.password = 'Password is required';
  }

  if (Object.keys(errors).length > 0) {
    return next(new ValidationException('Invalid login credentials payload', errors));
  }

  req.body.email = email.trim().toLowerCase();
  next();
}

/**
 * Validate new user registration payload
 */
export function validateRegister(req: Request, _res: Response, next: NextFunction) {
  const { name, email, password, role, department } = req.body;
  const errors: Record<string, string> = {};

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.name = 'Full name must be at least 2 characters';
  }

  if (!email || !isValidEmail(email)) {
    errors.email = 'A valid institutional email address is required';
  }

  const passwordCheck = validatePasswordStrength(password);
  if (!passwordCheck.valid) {
    errors.password = passwordCheck.error || 'Password does not meet security requirements';
  }

  if (role && typeof role !== 'string') {
    errors.role = 'Role must be a valid string identifier';
  }

  if (department && typeof department !== 'string') {
    errors.department = 'Department must be a string identifier';
  }

  if (Object.keys(errors).length > 0) {
    return next(new ValidationException('User registration validation failed', errors));
  }

  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  next();
}

/**
 * Validate password change payload
 */
export function validatePasswordChange(req: Request, _res: Response, next: NextFunction) {
  const { currentPassword, newPassword } = req.body;
  const errors: Record<string, string> = {};

  if (!currentPassword || typeof currentPassword !== 'string') {
    errors.currentPassword = 'Current password is required';
  }

  const passwordCheck = validatePasswordStrength(newPassword);
  if (!passwordCheck.valid) {
    errors.newPassword = passwordCheck.error || 'New password does not meet security requirements';
  }

  if (currentPassword === newPassword) {
    errors.newPassword = 'New password cannot be the same as the current password';
  }

  if (Object.keys(errors).length > 0) {
    return next(new ValidationException('Password change validation failed', errors));
  }

  next();
}
