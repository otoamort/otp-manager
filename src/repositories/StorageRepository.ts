/**
 * Repository for storage operations.
 * Implements the repository pattern for handling data storage and retrieval.
 */

/**
 * Generic interface for a storage repository.
 * Provides methods for storing, retrieving, and managing data.
 * 
 * @template T - The type of data stored in the repository
 */
export interface IStorageRepository<T> {
  /**
   * Gets all items from storage.
   * 
   * @returns A promise that resolves to an array of items
   */
  getAll(): Promise<T[]>;
  
  /**
   * Gets a single item by its ID.
   * 
   * @param id - The ID of the item to retrieve
   * @returns A promise that resolves to the item or null if not found
   */
  getById(id: string): Promise<T | null>;
  
  /**
   * Saves all items to storage.
   * 
   * @param items - The array of items to save
   * @returns A promise that resolves when the operation is complete
   */
  saveAll(items: T[]): Promise<void>;
  
  /**
   * Saves a single item to storage.
   * If an item with the same ID exists, it will be updated.
   * 
   * @param item - The item to save
   * @returns A promise that resolves to the saved item
   */
  save(item: T): Promise<T>;
  
  /**
   * Removes an item from storage by its ID.
   * 
   * @param id - The ID of the item to remove
   * @returns A promise that resolves to true if the item was removed, false otherwise
   */
  remove(id: string): Promise<boolean>;
  
  /**
   * Clears all items from storage.
   * 
   * @returns A promise that resolves when the operation is complete
   */
  clear(): Promise<void>;
}

/**
 * Interface for items that can be stored in a repository.
 * Requires an ID property for identification.
 */
export interface IStorageItem {
  /** Unique identifier for the item */
  id: string;
}

/**
 * Implementation of a storage repository using browser's localStorage.
 * Provides methods for storing, retrieving, and managing data in localStorage.
 * 
 * @template T - The type of data stored in the repository, must extend IStorageItem
 */
export class LocalStorageRepository<T extends IStorageItem> implements IStorageRepository<T> {
  /** The key used to store the data in localStorage */
  private storageKey: string;
  
  /**
   * Creates a new LocalStorageRepository.
   * 
   * @param storageKey - The key used to store the data in localStorage
   */
  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }
  
  /**
   * Gets all items from localStorage.
   * 
   * @returns A promise that resolves to an array of items
   */
  async getAll(): Promise<T[]> {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error retrieving data from localStorage:', error);
      return [];
    }
  }
  
  /**
   * Gets a single item by its ID from localStorage.
   * 
   * @param id - The ID of the item to retrieve
   * @returns A promise that resolves to the item or null if not found
   */
  async getById(id: string): Promise<T | null> {
    try {
      const items = await this.getAll();
      return items.find(item => item.id === id) || null;
    } catch (error) {
      console.error(`Error retrieving item with ID ${id} from localStorage:`, error);
      return null;
    }
  }
  
  /**
   * Saves all items to localStorage.
   * 
   * @param items - The array of items to save
   * @returns A promise that resolves when the operation is complete
   */
  async saveAll(items: T[]): Promise<void> {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
      throw error;
    }
  }
  
  /**
   * Saves a single item to localStorage.
   * If an item with the same ID exists, it will be updated.
   * 
   * @param item - The item to save
   * @returns A promise that resolves to the saved item
   */
  async save(item: T): Promise<T> {
    try {
      const items = await this.getAll();
      const index = items.findIndex(i => i.id === item.id);
      
      if (index >= 0) {
        // Update existing item
        items[index] = item;
      } else {
        // Add new item
        items.push(item);
      }
      
      await this.saveAll(items);
      return item;
    } catch (error) {
      console.error(`Error saving item to localStorage:`, error);
      throw error;
    }
  }
  
  /**
   * Removes an item from localStorage by its ID.
   * 
   * @param id - The ID of the item to remove
   * @returns A promise that resolves to true if the item was removed, false otherwise
   */
  async remove(id: string): Promise<boolean> {
    try {
      const items = await this.getAll();
      const initialLength = items.length;
      const filteredItems = items.filter(item => item.id !== id);
      
      if (filteredItems.length !== initialLength) {
        await this.saveAll(filteredItems);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error removing item with ID ${id} from localStorage:`, error);
      return false;
    }
  }
  
  /**
   * Clears all items from localStorage for this repository.
   * 
   * @returns A promise that resolves when the operation is complete
   */
  async clear(): Promise<void> {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Error clearing data from localStorage:', error);
      throw error;
    }
  }
}