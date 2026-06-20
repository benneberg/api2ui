import { faker } from '@faker-js/faker';

export const mockDataService = {
  generateFromSchema(schema: any): any {
    if (!schema) return { info: "No output schema defined" };

    if (schema.type === 'array') {
      const count = faker.number.int({ min: 3, max: 8 });
      return Array.from({ length: count }, () => this.generateObject(schema.items));
    }

    return this.generateObject(schema);
  },

  generateObject(schema: any): any {
    if (!schema) return {};
    
    // Resolve $ref if present (though openapiService should have normalized most)
    if (schema.type === 'string') {
      if (schema.format === 'date-time') return faker.date.recent().toISOString();
      if (schema.format === 'date') return faker.date.recent().toISOString().split('T')[0];
      if (schema.format === 'email') return faker.internet.email();
      if (schema.format === 'uuid') return faker.string.uuid();
      if (schema.format === 'uri' || schema.format === 'url') return faker.internet.url();
      if (schema.enum) return faker.helpers.arrayElement(schema.enum);
      
      const description = (schema.description || '').toLowerCase();
      const title = (schema.title || '').toLowerCase();
      const context = description + ' ' + title;

      if (context.includes('full name') || context.includes('person name')) return faker.person.fullName();
      if (context.includes('first name')) return faker.person.firstName();
      if (context.includes('last name')) return faker.person.lastName();
      if (context.includes('city')) return faker.location.city();
      if (context.includes('address')) return faker.location.streetAddress();
      if (context.includes('country')) return faker.location.country();
      if (context.includes('company')) return faker.company.name();
      if (context.includes('phone')) return faker.phone.number();
      if (context.includes('job') || context.includes('title')) return faker.person.jobTitle();
      if (context.includes('color')) return faker.color.human();
      if (context.includes('password')) return faker.internet.password();
      
      return faker.commerce.productName();
    }

    if (schema.type === 'number' || schema.type === 'integer') {
      const min = schema.minimum ?? 1;
      const max = schema.maximum ?? 1000;
      if (schema.type === 'integer') return faker.number.int({ min, max });
      return faker.number.float({ min, max, fractionDigits: 2 });
    }

    if (schema.type === 'boolean') {
      return faker.datatype.boolean();
    }

    if (schema.type === 'object' || schema.properties) {
      const obj: any = {};
      const props = schema.properties || {};
      const required = schema.required || [];
      
      for (const [key, prop] of Object.entries(props)) {
        // High probability of including optional fields to show breadth, but not always
        if (required.includes(key) || faker.datatype.boolean(0.85)) {
          obj[key] = this.generateField(key, prop);
        }
      }
      return obj;
    }

    if (schema.type === 'array') {
      const count = faker.number.int({ min: 2, max: 5 });
      return Array.from({ length: count }, () => this.generateObject(schema.items));
    }

    return faker.lorem.word();
  },

  generateField(name: string, schema: any): any {
    // Context-aware generation based on field name
    const lowerName = name.toLowerCase();
    if (lowerName.includes('email')) return faker.internet.email();
    if (lowerName.includes('name')) return faker.person.fullName();
    if (lowerName.includes('id')) return faker.string.uuid();
    if (lowerName.includes('price')) return parseFloat(faker.commerce.price());
    if (lowerName.includes('description')) return faker.commerce.productDescription();
    if (lowerName.includes('avatar') || lowerName.includes('image')) return faker.image.url();
    if (lowerName.includes('phone')) return faker.phone.number();
    
    return this.generateObject(schema);
  }
};
