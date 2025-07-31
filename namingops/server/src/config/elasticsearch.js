const { Client } = require('@elastic/elasticsearch');
const logger = require('../utils/logger');
const NameRequest = require('../models/NamingRequest');

// Initialize Elasticsearch client
const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || 'changeme'
  },
  ssl: {
    rejectUnauthorized: false // For development only, use proper certificates in production
  },
  maxRetries: 5,
  requestTimeout: 60000,
  sniffOnStart: true
});

// Check Elasticsearch connection
const checkConnection = async () => {
  try {
    const { body } = await esClient.ping();
    if (body) {
      logger.info('Successfully connected to Elasticsearch');
      return true;
    }
  } catch (error) {
    logger.error('Error connecting to Elasticsearch:', error.message);
    return false;
  }
};

// Create or update index with mappings
const createIndex = async (indexName) => {
  try {
    const indexExists = await esClient.indices.exists({ index: indexName });
    
    if (!indexExists.body) {
      await esClient.indices.create({
        index: indexName,
        body: {
          settings: {
            analysis: {
              analyzer: {
                autocomplete_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'autocomplete_filter']
                },
                search_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase']
                }
              },
              filter: {
                autocomplete_filter: {
                  type: 'edge_ngram',
                  min_gram: 2,
                  max_gram: 15
                }
              }
            }
          },
          mappings: {
            properties: {
              request_id: { type: 'keyword' },
              request_title: { 
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' },
                  autocomplete: {
                    type: 'text',
                    analyzer: 'autocomplete_analyzer',
                    search_analyzer: 'search_analyzer'
                  }
                }
              },
              requestor_name: { type: 'keyword' },
              requestor_id: { type: 'integer' },
              business_unit: { type: 'keyword' },
              asset_type: { type: 'keyword' },
              asset_type_specify: { type: 'keyword' },
              asset_description: { type: 'text' },
              proposed_name_1: { 
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' },
                  autocomplete: {
                    type: 'text',
                    analyzer: 'autocomplete_analyzer',
                    search_analyzer: 'search_analyzer'
                  }
                }
              },
              proposed_name_2: { 
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' },
                  autocomplete: {
                    type: 'text',
                    analyzer: 'autocomplete_analyzer',
                    search_analyzer: 'search_analyzer'
                  }
                }
              },
              proposed_name_3: { 
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' },
                  autocomplete: {
                    type: 'text',
                    analyzer: 'autocomplete_analyzer',
                    search_analyzer: 'search_analyzer'
                  }
                }
              },
              rename: { type: 'boolean' },
              status: { type: 'keyword' },
              reviewer_id: { type: 'keyword' },
              final_approved_name: { 
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' },
                  autocomplete: {
                    type: 'text',
                    analyzer: 'autocomplete_analyzer',
                    search_analyzer: 'search_analyzer'
                  }
                }
              },
              trademark_details: { type: 'text' },
              approval_notes: { type: 'text' },
              request_date: { type: 'date' },
              approval_date: { type: 'date' },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' }
            }
          }
        }
      });
      
      logger.info(`Created Elasticsearch index: ${indexName}`);
      return true;
    }
    
    logger.info(`Elasticsearch index ${indexName} already exists`);
    return true;
  } catch (error) {
    logger.error(`Error creating Elasticsearch index ${indexName}:`, error);
    return false;
  }
};

// Index a single name request
const indexNameRequest = async (nameRequest) => {
  try {
    const indexName = 'name_requests';
    const body = {
      index: indexName,
      id: nameRequest._id.toString(),
      body: {
        ...nameRequest.toObject(),
        request_id: nameRequest.request_id || nameRequest._id.toString(),
        requestor_id: nameRequest.requestor_id || null,
        reviewer_id: nameRequest.reviewer_id ? nameRequest.reviewer_id.toString() : null
      },
      refresh: 'wait_for'
    };

    await esClient.index(body);
    logger.debug(`Indexed name request: ${nameRequest._id}`);
    return true;
  } catch (error) {
    logger.error(`Error indexing name request ${nameRequest._id}:`, error);
    return false;
  }
};

// Remove a name request from the index
const removeNameRequest = async (id) => {
  try {
    const indexName = 'name_requests';
    await esClient.delete({
      index: indexName,
      id: id.toString(),
      refresh: 'wait_for'
    });
    
    logger.debug(`Removed name request from index: ${id}`);
    return true;
  } catch (error) {
    // Ignore 404 errors (document not found)
    if (error.meta && error.meta.statusCode === 404) {
      return true;
    }
    
    logger.error(`Error removing name request ${id} from index:`, error);
    return false;
  }
};

// Bulk index all name requests
const bulkIndexNameRequests = async () => {
  try {
    const indexName = 'name_requests';
    const count = await NameRequest.countDocuments();
    const batchSize = 100;
    let processed = 0;
    
    logger.info(`Starting bulk index of ${count} name requests...`);
    
    while (processed < count) {
      const nameRequests = await NameRequest.find()
        .sort({ _id: 1 })
        .skip(processed)
        .limit(batchSize);
      
      if (nameRequests.length === 0) break;
      
      const body = [];
      
      nameRequests.forEach((nameRequest) => {
        body.push(
          { index: { _index: indexName, _id: nameRequest._id.toString() } },
          {
            ...nameRequest.toObject(),
            request_id: nameRequest.request_id || nameRequest._id.toString(),
            requestor_id: nameRequest.requestor_id || null,
            reviewer_id: nameRequest.reviewer_id ? nameRequest.reviewer_id.toString() : null
          }
        );
      });
      
      await esClient.bulk({
        refresh: true,
        body
      });
      
      processed += nameRequests.length;
      logger.info(`Indexed ${processed} of ${count} name requests...`);
    }
    
    logger.info(`Successfully indexed ${processed} name requests`);
    return true;
  } catch (error) {
    logger.error('Error during bulk indexing:', error);
    return false;
  }
};

// Search name requests
const searchNameRequests = async (query, filters = {}, page = 1, limit = 10) => {
  try {
    const indexName = 'name_requests';
    const from = (page - 1) * limit;
    
    // Build the query
    const must = [];
    
    // Full-text search
    if (query) {
      must.push({
        multi_match: {
          query,
          fields: [
            'request_title^3',
            'proposed_name_1^3',
            'proposed_name_2^2',
            'proposed_name_3',
            'asset_description',
            'final_approved_name^3'
          ],
          fuzziness: 'AUTO',
          prefix_length: 2
        }
      });
    }
    
    // Apply filters
    const filter = [];
    
    // Status filter
    if (filters.status) {
      filter.push({ term: { status: filters.status } });
    }
    
    // Business unit filter
    if (filters.business_unit) {
      filter.push({ term: { business_unit: filters.business_unit } });
    }
    
    // Asset type filter
    if (filters.asset_type) {
      filter.push({ term: { asset_type: filters.asset_type } });
    }
    
    // Requestor filter (for submitters to see only their requests)
    if (filters.requestor_id) {
      filter.push({ term: { requestor_id: filters.requestor_id } });
    }
    
    // Date range filter
    if (filters.startDate || filters.endDate) {
      const rangeFilter = {};
      if (filters.startDate) {
        rangeFilter.gte = new Date(filters.startDate).toISOString();
      }
      if (filters.endDate) {
        rangeFilter.lte = new Date(filters.endDate).toISOString();
      }
      filter.push({ range: { request_date: rangeFilter } });
    }
    
    const body = {
      query: {
        bool: {
          must: must.length > 0 ? must : [{ match_all: {} }],
          filter: filter.length > 0 ? filter : []
        }
      },
      from,
      size: limit,
      sort: [
        { _score: { order: 'desc' } },
        { request_date: { order: 'desc' } }
      ],
      highlight: {
        fields: {
          'request_title': {},
          'proposed_name_1': {},
          'proposed_name_2': {},
          'proposed_name_3': {},
          'asset_description': {},
          'final_approved_name': {}
        }
      }
    };
    
    const { body: result } = await esClient.search({
      index: indexName,
      body
    });
    
    // Process hits
    const hits = result.hits.hits.map(hit => ({
      _id: hit._id,
      _score: hit._score,
      highlight: hit.highlight,
      ...hit._source
    }));
    
    return {
      total: result.hits.total.value,
      page,
      pages: Math.ceil(result.hits.total.value / limit),
      limit,
      data: hits
    };
  } catch (error) {
    logger.error('Error searching name requests:', error);
    throw error;
  }
};

// Get search suggestions
const getSuggestions = async (query, field = 'proposed_name_1') => {
  try {
    const indexName = 'name_requests';
    
    const { body } = await esClient.search({
      index: indexName,
      body: {
        query: {
          match_phrase_prefix: {
            [`${field}.autocomplete`]: query
          }
        },
        _source: [field],
        size: 5
      }
    });
    
    return body.hits.hits.map(hit => hit._source[field]);
  } catch (error) {
    logger.error('Error getting search suggestions:', error);
    return [];
  }
};

// Initialize Elasticsearch
const initializeElasticsearch = async () => {
  try {
    const isConnected = await checkConnection();
    
    if (!isConnected) {
      logger.warn('Could not connect to Elasticsearch. Search functionality will be limited.');
      return false;
    }
    
    const indexCreated = await createIndex('name_requests');
    
    if (indexCreated) {
      // Reindex all documents on startup (optional, can be done manually via API)
      if (process.env.RECREATE_ELASTICSEARCH_INDEX === 'true') {
        logger.info('Recreating Elasticsearch index...');
        await esClient.indices.delete({ index: 'name_requests', ignore_unavailable: true });
        await createIndex('name_requests');
        await bulkIndexNameRequests();
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('Error initializing Elasticsearch:', error);
    return false;
  }
};

// Middleware to index name requests after save
const indexNameRequestAfterSave = async (doc) => {
  try {
    if (process.env.ELASTICSEARCH_ENABLED === 'true') {
      await indexNameRequest(doc);
    }
  } catch (error) {
    logger.error('Error in post-save hook:', error);
  }
};

// Middleware to remove name requests after remove
const removeNameRequestAfterDelete = async (doc) => {
  try {
    if (process.env.ELASTICSEARCH_ENABLED === 'true') {
      await removeNameRequest(doc._id);
    }
  } catch (error) {
    logger.error('Error in post-remove hook:', error);
  }
};

module.exports = {
  esClient,
  initializeElasticsearch,
  indexNameRequest,
  removeNameRequest,
  bulkIndexNameRequests,
  searchNameRequests,
  getSuggestions,
  indexNameRequestAfterSave,
  removeNameRequestAfterDelete
};
