import { db } from '@db';
import { users } from '@shared/schema';
import { eq, or } from 'drizzle-orm';
import crypto from 'crypto';

export class AuthService {
  /**
   * Hash a password using scrypt (more secure than bcrypt)
   * @param password Plain text password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Generate a random salt
      const salt = crypto.randomBytes(16).toString('hex');
      
      // Use scrypt to hash the password with the salt
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) reject(err);
        resolve(salt + ':' + derivedKey.toString('hex'));
      });
    });
  }
  
  /**
   * Compare a password with a stored hash
   * @param supplied Plain text password to check
   * @param stored Stored hashed password
   * @returns True if the password matches
   */
  async comparePasswords(supplied: string, stored: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Extract the salt from the stored hash
      const [salt, hash] = stored.split(':');
      
      // Use scrypt to hash the supplied password with the same salt
      crypto.scrypt(supplied, salt, 64, (err, derivedKey) => {
        if (err) reject(err);
        resolve(hash === derivedKey.toString('hex'));
      });
    });
  }
  
  /**
   * Get a user by email or username
   * @param identifier Email or username
   * @returns User or null if not found
   */
  async getUserByIdentifier(identifier: string) {
    // Find a user by email or username
    const user = await db.query.users.findFirst({
      where: or(
        eq(users.email, identifier.toLowerCase()),
        eq(users.username, identifier)
      )
    });
    
    return user;
  }
  
  /**
   * Get a user by ID
   * @param id User ID
   * @returns User or null if not found
   */
  async getUser(id: number) {
    return await db.query.users.findFirst({
      where: eq(users.id, id)
    });
  }
  
  /**
   * Create a new user
   * @param userData User data including password
   * @returns The created user
   */
  async createUser(userData: any) {
    // Hash the password
    const hashedPassword = await this.hashPassword(userData.password);
    
    // Create the user with the hashed password
    const [user] = await db.insert(users)
      .values({
        ...userData,
        password: hashedPassword,
        email: userData.email.toLowerCase(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return user;
  }
  
  /**
   * Update a user
   * @param userId ID of the user to update
   * @param userData User data to update
   * @returns Updated user or null if not found
   */
  async updateUser(userId: number, userData: Partial<Omit<Express.User, 'id'>>) {
    // If updating the password, hash it first
    if (userData.password) {
      userData.password = await this.hashPassword(userData.password);
    }
    
    // Update email case if provided
    if (userData.email) {
      userData.email = userData.email.toLowerCase();
    }
    
    // Add updated timestamp
    const updatedData = {
      ...userData,
      updatedAt: new Date()
    };
    
    // Update the user
    const [user] = await db.update(users)
      .set(updatedData)
      .where(eq(users.id, userId))
      .returning();
    
    return user || null;
  }
}
