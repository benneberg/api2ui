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
    
    if (schema.type === 'string') {
      if (schema.format === 'date-time') return faker.date.recent().toISOString();
      if (schema.format === 'email') return faker.internet.email();
      if (schema.enum) return faker.helpers.arrayElement(schema.enum);
      
      const name = schema.description?.toLowerCase() || '';
      if (name.includes('name')) return faker.person.fullName();
      if (name.includes('city')) return faker.location.city();
      if (name.includes('url')) return faker.internet.url();
      if (name.includes('id')) return faker.string.uuid();
      
      return faker.commerce.productName();
    }

    if (schema.type === 'number' || schema.type === 'integer') {
      return faker.number.int({ min: 1, max: 1000 });
    }

    if (schema.type === 'boolean') {
      return faker.datatype.boolean();
    }

    if (schema.type === 'object' && schema.properties) {
      const obj: any = {};
      for (const [key, prop] of Object.entries(schema.properties)) {
        obj[key] = this.generateField(key, prop);
      }
      return obj;
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
