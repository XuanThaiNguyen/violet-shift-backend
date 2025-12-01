/**
 *
 * @param {import('mongodb').Db} db
 * @returns {Promise<string[]>}
 */
const fetchCollections = async (db) => {
  const collections = await db.listCollections().toArray();
  return collections.map((collection) => collection.name);
};

/**
 *
 * @param {import('mongodb').Db} db
 * @param {string[]} collections
 * @param {string} collectionName
 * @returns {Promise<void>}
 */
const createCollectionIfNotExists = async (db, collections, collectionName, schema) => {
  if (!collections.includes(collectionName)) {
    await db.createCollection(collectionName, {
      validator: {
        $jsonSchema: schema,
      },
    });
    console.log(`✓ Created collection: ${collectionName}`);
  } else {
    console.log(`- Collection already exists: ${collectionName}`);
  }
};

/**
 *
 * @param {import('mongodb').Db} db
 * @param {string[]} collections
 * @param {string} collectionName
 * @param {import('mongodb').IndexSpecification} indexSpec
 * @param {import('mongodb').CreateIndexesOptions} options
 * @returns {Promise<void>}
 */
const createIndexIfNotExists = async (db, collections, collectionName, indexSpec, options = {}) => {
  if (collections.includes(collectionName)) {
    try {
      await db.createIndex(collectionName, indexSpec, {
        background: true,
        ...options,
      });
      console.log(`  ✓ Created index on ${collectionName}: ${indexSpec}`);
    } catch (error) {
      console.log(`  - Index already exists on ${collectionName} or inserted failed`);
    }
  } else {
    console.log(`  - collection ${collectionName} does not exist`);
  }
};

module.exports = {
  fetchCollections,
  createCollectionIfNotExists,
  createIndexIfNotExists,
};
