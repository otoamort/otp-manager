/**
 * Repository for secure storage operations.
 * Extends the LocalStorageRepository to add encryption for sensitive data.
 */
import {LocalStorageRepository, IStorageItem, IStorageRepository} from './StorageRepository';
import { EncryptionService } from '@/services/EncryptionService';

/**
 * Interface for items that contain sensitive data that should be encrypted.
 * Extends the base IStorageItem interface.
 */
export interface ISecureStorageItem extends IStorageItem {
  /** Sensitive data that should be encrypted */
  sensitiveData: Record<string, any>;
}

/**
 * Interface for the encrypted version of a secure storage item.
 * This is the format that will be stored in localStorage.
 */
interface IEncryptedStorageItem extends IStorageItem {
  /** Encrypted sensitive data as a base64 string */
  encryptedData: string;
  /** Salt used for key derivation, as a base64 string */
  salt: string;
  /** Initialization vector used for encryption, as a base64 string */
  iv: string;
  /** Non-sensitive data that doesn't need encryption */
  publicData: Record<string, any>;
}

/**
 * Implementation of a secure storage repository using encryption.
 * Extends the LocalStorageRepository to add encryption for sensitive data.
 * 
 * @template T - The type of data stored in the repository, must extend ISecureStorageItem
 */
export class SecureStorageRepository<T extends ISecureStorageItem> extends LocalStorageRepository<T> implements IStorageRepository<T> {
  /** The password used for encryption */
  private password: string;
  
  /**
   * Creates a new SecureStorageRepository.
   * 
   * @param storageKey - The key used to store the data in localStorage
   * @param password - The password used for encryption
   */
  private encryptedItems: Map<string, IEncryptedStorageItem> = new Map();

  constructor(storageKey: string, password: string) {
    super(storageKey);
    this.password = password;
  }
  
  /**
   * Sets the password used for encryption.
   * This should be called when the user changes their password.
   * 
   * @param newPassword - The new password to use for encryption
   */
  setPassword(newPassword: string): void {
    this.password = newPassword;
  }
  
  /**
   * Gets all items from storage, decrypting the sensitive data.
   * 
   * @returns A promise that resolves to an array of decrypted items
   */
  override async getAll(): Promise<T[]> {
    try {
      const items = await super.getAll();
      const decryptedItems: T[] = [];

      for (const item of items) {
        if (this.encryptedItems.has(item.id)) {
          try {
            const encryptedItem = this.encryptedItems.get(item.id)!;
            const decryptedItem = await this.decryptItem(encryptedItem);
            decryptedItems.push(decryptedItem);
          } catch (error) {
            console.error(`Error decrypting item ${item.id}:`, error);
            // Skip items that can't be decrypted (e.g., wrong password)
          }
        } else {
          decryptedItems.push(item);
        }
      }

      return decryptedItems;
    } catch (error) {
      console.error('Error retrieving and decrypting data:', error);
      return [];
    }
  }
  
  /**
   * Gets a single item by its ID, decrypting the sensitive data.
   * 
   * @param id - The ID of the item to retrieve
   * @returns A promise that resolves to the decrypted item or null if not found
   */
  async getById(id: string): Promise<T | null> {
    try {
      const item = await super.getById(id);
      if (!item || !this.encryptedItems.has(item.id)) {
        return null;
      }

      const encryptedItem = this.encryptedItems.get(item.id)!;
      return this.decryptItem(encryptedItem);
    } catch (error) {
      console.error(`Error retrieving and decrypting item with ID ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Saves a single item to storage, encrypting the sensitive data.
   * 
   * @param item - The item to save
   * @returns A promise that resolves to the saved item
   */
  async save(item: T): Promise<T> {
    try {
      const encryptedItem = await this.encryptItem(item);
      this.encryptedItems.set(item.id, encryptedItem);
      await super.save(item);
      return item;
    } catch (error) {
      console.error(`Error encrypting and saving item:`, error);
      throw error;
    }
  }
  
  /**
   * Saves all items to storage, encrypting the sensitive data.
   * 
   * @param items - The array of items to save
   * @returns A promise that resolves when the operation is complete
   */
  async saveAll(items: T[]): Promise<void> {
    try {
      for (const item of items) {
        const encryptedItem = await this.encryptItem(item);
        this.encryptedItems.set(item.id, encryptedItem);
      }

      await super.saveAll(items);
    } catch (error) {
      console.error('Error encrypting and saving data:', error);
      throw error;
    }
  }
  
  /**
   * Encrypts an item's sensitive data.
   * 
   * @param item - The item to encrypt
   * @returns A promise that resolves to the encrypted item
   */
  private async encryptItem(item: T): Promise<IEncryptedStorageItem> {
    // Extract sensitive data and public data
    const { sensitiveData, id, ...publicData } = item;
    
    // Convert sensitive data to JSON string
    const sensitiveDataString = JSON.stringify(sensitiveData);
    
    // Encrypt sensitive data
    const encryptionResult = await EncryptionService.encrypt(
      sensitiveDataString,
      this.password
    );
    
    // Return encrypted item
    return {
      id,
      encryptedData: encryptionResult.encryptedData,
      salt: encryptionResult.salt,
      iv: encryptionResult.iv,
      publicData
    };
  }
  
  /**
   * Decrypts an item's sensitive data.
   * 
   * @param encryptedItem - The encrypted item to decrypt
   * @returns A promise that resolves to the decrypted item
   */
  private async decryptItem(encryptedItem: IEncryptedStorageItem): Promise<T> {
    // Extract encrypted data
    const { id, encryptedData, salt, iv, publicData } = encryptedItem;
    
    // Decrypt sensitive data
    const decryptedDataString = await EncryptionService.decrypt(
      encryptedData,
      this.password,
      salt,
      iv
    );
    
    // Parse decrypted data
    const sensitiveData = JSON.parse(decryptedDataString);
    
    // Return decrypted item
    return {
      id,
      sensitiveData,
      ...publicData
    } as T;
  }
}