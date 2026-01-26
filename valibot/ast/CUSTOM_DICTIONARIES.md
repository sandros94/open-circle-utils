# Custom Dictionaries for AST Serialization

This guide explains how to handle non-serializable operations (custom validations and transformations) when converting schemas to and from AST representation.

## The Problem

Some validation and transformation operations cannot be automatically serialized to JSON:

- **Custom validations**: Business logic that validates data using functions
- **Custom transformations**: Data transformations that modify values using custom logic
- **Async operations**: Validations or transformations that involve async operations (database lookups, API calls, etc.)

## The Solution: Custom Dictionaries

You can provide dictionaries that map these custom operations to unique keys during serialization, and then provide the actual implementations when deserializing.

## Usage

### 1. Schema to AST with Custom Operations

When converting a schema with custom operations to AST, provide dictionaries that map the operation instances to unique keys:

```typescript
import * as v from 'valibot';
import { schemaToAST } from './ast/index.ts';

// Create a custom transformation function
const myCustomTransform = (input: string) => input.split(',').map(s => s.trim());

// Create a custom validation function
const myCustomValidation = (input: string[]) => input.length > 0;

// Build your schema using these custom operations
const schema = v.pipe(
  v.string(),
  v.transform(myCustomTransform),
  v.check(myCustomValidation, 'Must have at least one item')
);

// Create dictionaries mapping operations to unique keys
const transformationDict = new Map();
transformationDict.set(myCustomTransform, 'split-and-trim');

const validationDict = new Map();
validationDict.set(myCustomValidation, 'non-empty-array');

// Convert to AST with dictionaries
const astDocument = schemaToAST(schema, {
  transformationDictionary: transformationDict,
  validationDictionary: validationDict,
  metadata: {
    description: 'Example schema with custom operations',
  },
});

// Serialize to JSON
const json = JSON.stringify(astDocument, null, 2);
```

The resulting AST document will include:

```json
{
  "version": "1.0.0",
  "library": "valibot",
  "schema": { ... },
  "customTransformations": {
    "split-and-trim": {
      "name": "split-and-trim",
      "transformationType": "custom"
    }
  },
  "customValidations": {
    "non-empty-array": {
      "name": "non-empty-array",
      "validationType": "custom"
    }
  }
}
```

### 2. AST to Schema with Custom Implementations

When reconstructing a schema from AST that contains custom operations, provide the actual implementations:

```typescript
import { astToSchema } from './ast/index.ts';

// Parse the JSON back to AST
const parsedAST = JSON.parse(json);

// Provide the actual implementations
const transformationImpl = new Map();
transformationImpl.set('split-and-trim', (input: string) => input.split(',').map(s => s.trim()));

const validationImpl = new Map();
validationImpl.set('non-empty-array', (input: string[]) => input.length > 0);

// Reconstruct the schema
const reconstructedSchema = astToSchema(parsedAST, {
  transformationDictionary: transformationImpl,
  validationDictionary: validationImpl,
});

// The schema now works exactly like the original
```

### 3. Async Operations

For async operations, use `astToSchemaAsync` instead:

```typescript
import { astToSchemaAsync } from './ast/index.ts';

// Async validation (e.g., checking if username is available)
const checkUsernameAvailable = async (username: string): Promise<boolean> => {
  const response = await fetch(`/api/check-username/${username}`);
  return response.ok;
};

// Async transformation (e.g., geocoding an address)
const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number }> => {
  const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
  return response.json();
};

// Create async schema
const asyncSchema = v.pipeAsync(
  v.string(),
  v.checkAsync(checkUsernameAvailable, 'Username not available'),
  v.transformAsync(geocodeAddress)
);

// Convert to AST
const asyncDict = new Map();
asyncDict.set(checkUsernameAvailable, 'check-username');
asyncDict.set(geocodeAddress, 'geocode');

const astDoc = schemaToAST(asyncSchema, {
  validationDictionary: asyncDict,
  transformationDictionary: asyncDict,
});

// Reconstruct with async support
const asyncImplDict = new Map();
asyncImplDict.set('check-username', checkUsernameAvailable);
asyncImplDict.set('geocode', geocodeAddress);

const reconstructed = astToSchemaAsync(astDoc, {
  validationDictionary: asyncImplDict,
  transformationDictionary: asyncImplDict,
});
```

## Best Practices

### 1. Use Descriptive Keys

Choose meaningful, descriptive keys for your custom operations:

```typescript
// ✅ Good
transformationDict.set(myTransform, 'format-phone-number');
validationDict.set(myValidation, 'validate-credit-card');

// ❌ Bad
transformationDict.set(myTransform, 'transform1');
validationDict.set(myValidation, 'val');
```

### 2. Add Metadata to Custom Operations

When creating custom operations, add metadata for better documentation:

```typescript
const myCustomTransform = Object.assign(
  (input: string) => input.toUpperCase(),
  {
    name: 'to-uppercase',
    description: 'Converts input to uppercase',
    type: 'string-formatting',
  }
);
```

### 3. Centralize Custom Dictionaries

For larger applications, maintain a central registry of custom operations:

```typescript
// custom-operations.ts
export const CUSTOM_OPERATIONS = {
  transformations: {
    'format-phone': (input: string) => {
      // Format phone number
    },
    'geocode-address': async (address: string) => {
      // Geocode address
    },
  },
  validations: {
    'check-uniqueness': async (value: string) => {
      // Check if value is unique in database
    },
    'validate-business-rule': (value: any) => {
      // Complex business logic
    },
  },
};

// Helper function to create dictionaries
export function createDictionaries() {
  const transformDict = new Map();
  const validationDict = new Map();

  for (const [key, impl] of Object.entries(CUSTOM_OPERATIONS.transformations)) {
    transformDict.set(impl, key);
  }

  for (const [key, impl] of Object.entries(CUSTOM_OPERATIONS.validations)) {
    validationDict.set(impl, key);
  }

  return { transformDict, validationDict };
}

// Helper function to create implementation dictionaries
export function createImplementationDictionaries() {
  const transformDict = new Map(
    Object.entries(CUSTOM_OPERATIONS.transformations)
  );
  const validationDict = new Map(
    Object.entries(CUSTOM_OPERATIONS.validations)
  );

  return { transformDict, validationDict };
}
```

### 4. Version Your Custom Operations

If your custom operations change over time, include version information:

```typescript
const astDoc = schemaToAST(schema, {
  transformationDictionary: transformDict,
  validationDictionary: validationDict,
  metadata: {
    customOperationsVersion: '2.1.0',
  },
});
```

## Error Handling

The AST conversion will throw helpful errors when:

1. **Missing dictionary**: AST contains custom operations but no dictionary provided
2. **Missing implementation**: Dictionary key referenced but implementation not found
3. **Library mismatch**: AST was created for a different validation library

```typescript
try {
  const schema = astToSchema(astDoc, options);
} catch (error) {
  if (error.message.includes('custom transformations')) {
    // Handle missing transformation dictionary
  } else if (error.message.includes('custom validations')) {
    // Handle missing validation dictionary
  } else if (error.message.includes('library')) {
    // Handle library mismatch
  }
}
```

## Limitations

Some operations fundamentally cannot be serialized and reconstructed:

1. **Instance schemas**: Require runtime class references
2. **Lazy schemas**: Require runtime getter functions
3. **Closures**: Functions that capture variables from outer scope

For these cases, you'll need to manually reconstruct the schema or redesign your validation logic to be more serialization-friendly.

## Complete Example

Here's a complete example showing the full workflow:

```typescript
import * as v from 'valibot';
import { schemaToAST, astToSchema } from './ast/index.ts';

// 1. Define custom operations
const customOps = {
  normalizeEmail: (email: string) => email.toLowerCase().trim(),
  checkDomain: (email: string) => {
    const domain = email.split('@')[1];
    return ['example.com', 'test.com'].includes(domain);
  },
};

// 2. Create schema
const emailSchema = v.pipe(
  v.string(),
  v.email(),
  v.transform(customOps.normalizeEmail),
  v.check(customOps.checkDomain, 'Invalid email domain')
);

// 3. Convert to AST with dictionary
const toAstDict = new Map([
  [customOps.normalizeEmail, 'normalize-email'],
  [customOps.checkDomain, 'check-email-domain'],
]);

const astDoc = schemaToAST(emailSchema, {
  transformationDictionary: toAstDict,
  validationDictionary: toAstDict,
});

// 4. Serialize to JSON
const json = JSON.stringify(astDoc);

// 5. Later: deserialize and reconstruct
const parsed = JSON.parse(json);

const fromAstDict = new Map([
  ['normalize-email', customOps.normalizeEmail],
  ['check-email-domain', customOps.checkDomain],
]);

const reconstructed = astToSchema(parsed, {
  transformationDictionary: fromAstDict,
  validationDictionary: fromAstDict,
});

// 6. Use the reconstructed schema
const result = v.safeParse(reconstructed, '  User@EXAMPLE.COM  ');
console.log(result.success); // true
console.log(result.output); // "user@example.com"
```

## Summary

Custom dictionaries allow you to:

- ✅ Serialize schemas with custom business logic
- ✅ Reconstruct schemas with the same behavior
- ✅ Support both sync and async operations
- ✅ Maintain type safety and validation integrity
- ✅ Document and version your custom operations

By following these patterns, you can confidently serialize and deserialize even complex validation schemas.
