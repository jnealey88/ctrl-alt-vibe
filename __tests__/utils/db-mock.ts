import { jest } from '@jest/globals';
import { eq, and, asc, desc, isNull } from 'drizzle-orm';

/**
 * This utility creates a mock implementation of the Drizzle ORM
 * for testing database operations without touching a real database.
 * 
 * Usage:
 * ```
 * import { createDbMock } from '../utils/db-mock';
 * 
 * jest.mock('../../db', () => createDbMock({
 *   users: [
 *     { id: 1, username: 'testuser', email: 'test@example.com' }
 *   ],
 *   posts: [
 *     { id: 1, title: 'Test Post', authorId: 1 }
 *   ]
 * }));
 * ```
 */

export function createDbMock(initialData = {}) {
  // Create a copy of the initial data to avoid mutations affecting the original
  const data = JSON.parse(JSON.stringify(initialData));
  
  // Create in-memory tables if they don't exist
  Object.keys(data).forEach(table => {
    if (!Array.isArray(data[table])) {
      data[table] = [];
    }
  });
  
  // Helper to find records based on a condition function
  const findRecords = (table, conditionFn = () => true) => {
    if (!data[table]) return [];
    return data[table].filter(conditionFn);
  };
  
  // Helper to handle WHERE conditions
  const processWhereCondition = (condition, record) => {
    if (!condition) return true;
    
    // Handle eq operator
    if (condition._type === 'eq') {
      const { left, right } = condition;
      const field = left.path ? left.path[0] : null;
      return field ? record[field] === right : false;
    }
    
    // Handle and operator
    if (condition._type === 'and') {
      return condition.conditions.every(cond => 
        processWhereCondition(cond, record)
      );
    }
    
    // Handle isNull operator
    if (condition._type === 'is' && condition.isNull) {
      const field = condition.field.path ? condition.field.path[0] : null;
      return field ? record[field] === null : false;
    }
    
    // Default to true if we don't know how to handle the condition
    return true;
  };
  
  // Helper to apply sorting
  const applyOrderBy = (records, orderBy) => {
    if (!orderBy) return records;
    
    const sorted = [...records];
    
    // Handle single orderBy objects
    if (typeof orderBy === 'object' && !Array.isArray(orderBy)) {
      const field = orderBy.field.path ? orderBy.field.path[0] : null;
      const direction = orderBy.order === 'asc' ? 1 : -1;
      
      if (field) {
        sorted.sort((a, b) => {
          if (a[field] < b[field]) return -1 * direction;
          if (a[field] > b[field]) return 1 * direction;
          return 0;
        });
      }
      return sorted;
    }
    
    // Handle array of orderBy objects
    if (Array.isArray(orderBy)) {
      return sorted.sort((a, b) => {
        for (const order of orderBy) {
          const field = order.field.path ? order.field.path[0] : null;
          const direction = order.order === 'asc' ? 1 : -1;
          
          if (field) {
            if (a[field] < b[field]) return -1 * direction;
            if (a[field] > b[field]) return 1 * direction;
          }
        }
        return 0;
      });
    }
    
    return sorted;
  };
  
  // Create a chainable query builder
  const createQueryBuilder = () => {
    let currentTable = null;
    let whereCondition = null;
    let orderByConfig = null;
    let limitValue = null;
    let offsetValue = null;
    let selectColumns = null;
    let returnColumns = null;
    let updateValues = null;
    let insertValues = null;
    
    const builder = {
      // Select operations
      select: (columns) => {
        selectColumns = columns;
        return builder;
      },
      from: (table) => {
        currentTable = table.table || table;
        return builder;
      },
      where: (condition) => {
        whereCondition = condition;
        return builder;
      },
      orderBy: (orderByInfo) => {
        orderByConfig = orderByInfo;
        return builder;
      },
      limit: (limit) => {
        limitValue = limit;
        return builder;
      },
      offset: (offset) => {
        offsetValue = offset;
        return builder;
      },
      execute: jest.fn().mockImplementation(async () => {
        if (!currentTable || !data[currentTable]) return [];
        
        let results = findRecords(currentTable, r => 
          processWhereCondition(whereCondition, r)
        );
        
        results = applyOrderBy(results, orderByConfig);
        
        if (offsetValue) {
          results = results.slice(offsetValue);
        }
        
        if (limitValue) {
          results = results.slice(0, limitValue);
        }
        
        if (selectColumns) {
          // Apply projection if select columns are specified
          return results.map(r => {
            const result = {};
            for (const key in selectColumns) {
              if (typeof selectColumns[key] === 'string') {
                result[key] = selectColumns[key];
              } else {
                result[key] = r[key];
              }
            }
            return result;
          });
        }
        
        return results;
      }),
      
      // Insert operations
      insert: (table) => {
        currentTable = table.table || table;
        return builder;
      },
      values: (values) => {
        insertValues = Array.isArray(values) ? values : [values];
        return builder;
      },
      returning: jest.fn().mockImplementation(async () => {
        if (!currentTable || !insertValues) return [];
        
        // Ensure the table exists
        if (!data[currentTable]) {
          data[currentTable] = [];
        }
        
        // Generate IDs for new records if they don't have them
        const result = insertValues.map(record => {
          const maxId = data[currentTable].reduce(
            (max, r) => Math.max(max, r.id || 0), 0
          );
          
          const newRecord = { ...record };
          if (!newRecord.id) {
            newRecord.id = maxId + 1;
          }
          
          // Add timestamps if they exist in the schema
          if (!newRecord.createdAt && data[currentTable].some(r => r.createdAt)) {
            newRecord.createdAt = new Date();
          }
          if (!newRecord.updatedAt && data[currentTable].some(r => r.updatedAt)) {
            newRecord.updatedAt = new Date();
          }
          
          data[currentTable].push(newRecord);
          return newRecord;
        });
        
        return result;
      }),
      
      // Update operations
      update: (table) => {
        currentTable = table.table || table;
        return builder;
      },
      set: (values) => {
        updateValues = values;
        return builder;
      },
      
      // Delete operations
      delete: (table) => {
        currentTable = table.table || table;
        return builder;
      }
    };
    
    return builder;
  };
  
  // Create a mock query builder for each table
  const queryBuilder = {};
  Object.keys(data).forEach(table => {
    queryBuilder[table] = {
      findMany: jest.fn().mockImplementation(async (options = {}) => {
        let results = data[table] || [];
        
        if (options.where) {
          results = results.filter(r => processWhereCondition(options.where, r));
        }
        
        if (options.orderBy) {
          results = applyOrderBy(results, options.orderBy);
        }
        
        if (options.offset) {
          results = results.slice(options.offset);
        }
        
        if (options.limit) {
          results = results.slice(0, options.limit);
        }
        
        // Handle relations
        if (options.with) {
          return results.map(record => {
            const result = { ...record };
            
            for (const relationName in options.with) {
              if (options.with[relationName]) {
                // This is a simplified relation handling
                // In a real implementation, you'd use schema information
                const foreignKey = `${relationName}Id`;
                const relatedTable = relationName + 's';
                
                if (data[relatedTable]) {
                  const related = data[relatedTable].find(r => r.id === record[foreignKey]);
                  result[relationName] = related || null;
                }
              }
            }
            
            return result;
          });
        }
        
        return results;
      }),
      findFirst: jest.fn().mockImplementation(async (options = {}) => {
        const results = await queryBuilder[table].findMany(options);
        return results.length > 0 ? results[0] : null;
      })
    };
  });
  
  return {
    db: {
      query: queryBuilder,
      select: createQueryBuilder().select,
      insert: createQueryBuilder().insert,
      update: createQueryBuilder().update,
      delete: createQueryBuilder().delete,
    },
    eq, and, desc, asc, isNull // Re-export these for use in tests
  };
}

/**
 * Helper to create a transaction mock for testing
 * 
 * Usage:
 * ```
 * // In your test
 * const { mockTx } = require('../utils/db-mock');
 * 
 * jest.mock('../../db', () => ({
 *   db: { ... },
 *   transaction: mockTx
 * }));
 * 
 * // Then in the test
 * mockTx.mockImplementation(async (fn) => fn(myMockDb));
 * ```
 */
export const mockTx = jest.fn();
