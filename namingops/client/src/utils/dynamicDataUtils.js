/**
 * Dynamic Data Utilities for Request Processing
 * Handles form-configuration-driven data extraction and display
 */

// Technical fields that should be hidden from users
export const TECHNICAL_FIELDS = [
  'id', '_id', '__v', 'configId', 'configName', 'userId', 'submittedAt', 
  'createdAt', 'updatedAt', 'status', 'assignedTo', 'reviewer', 'claimedAt'
];

// User-friendly field label mappings
export const FIELD_LABEL_MAP = {
  'requestorName': 'Requestor Name',
  'requestTitle': 'Request Title', 
  'requestDescription': 'Description',
  'description': 'Description',
  'companyName': 'Company Name',
  'productName': 'Product Name',
  'targetAudience': 'Target Audience',
  'brandGuidelines': 'Brand Guidelines',
  'additionalNotes': 'Additional Notes',
  'urgency': 'Urgency Level',
  'category': 'Category',
  'type': 'Request Type',
  'summary': 'Summary',
  'details': 'Details',
  'notes': 'Notes',
  'content': 'Content'
};

/**
 * Extract user-friendly title from request data
 */
export const extractRequestTitle = (request) => {
  if (!request) return 'Name Request';
  
  const titleFields = ['title', 'requestTitle', 'name', 'subject', 'requestName'];
  
  // Check direct fields first
  for (const field of titleFields) {
    if (request[field] && typeof request[field] === 'string') {
      return request[field];
    }
  }
  
  // Check formData
  if (request.formData) {
    for (const field of titleFields) {
      if (request.formData[field] && typeof request.formData[field] === 'string') {
        return request.formData[field];
      }
    }
    
    // If no title field found, use first meaningful string field
    const meaningfulField = Object.entries(request.formData)
      .find(([key, value]) => 
        typeof value === 'string' && 
        value.length > 0 && 
        value.length < 100 &&
        !TECHNICAL_FIELDS.includes(key)
      );
    
    if (meaningfulField) {
      return meaningfulField[1];
    }
  }
  
  return 'Request #' + (request._id?.slice(-6) || request.id?.slice(-6) || 'Unknown');
};

/**
 * Extract user-friendly description from request data
 */
export const extractRequestDescription = (request) => {
  if (!request) return 'No description available';
  
  const descFields = ['description', 'requestDescription', 'summary', 'details', 'notes', 'content'];
  
  // Check direct fields first
  for (const field of descFields) {
    if (request[field] && typeof request[field] === 'string') {
      return request[field];
    }
  }
  
  // Check formData
  if (request.formData) {
    for (const field of descFields) {
      if (request.formData[field] && typeof request.formData[field] === 'string') {
        return request.formData[field];
      }
    }
    
    // If no description field found, look for first meaningful long text field
    const meaningfulField = Object.entries(request.formData)
      .find(([key, value]) => 
        typeof value === 'string' && 
        value.length > 10 && 
        !TECHNICAL_FIELDS.includes(key)
      );
    
    if (meaningfulField) {
      return meaningfulField[1];
    }
  }
  
  return 'No description provided';
};

/**
 * Get user-friendly field label
 */
export const getFieldLabel = (fieldKey) => {
  return FIELD_LABEL_MAP[fieldKey] || 
         fieldKey.replace(/([A-Z])/g, ' $1')
                 .replace(/^./, str => str.toUpperCase())
                 .trim();
};

/**
 * Filter and format form data for display (for submitters)
 */
export const getDisplayableFormData = (formData) => {
  if (!formData || typeof formData !== 'object') return [];
  
  return Object.entries(formData)
    .filter(([key, value]) => {
      // Filter out technical fields and empty values
      return !TECHNICAL_FIELDS.includes(key) && 
             value !== null && 
             value !== undefined && 
             value !== '' &&
             typeof value !== 'object'; // Skip complex objects for now
    })
    .map(([key, value]) => ({
      key,
      label: getFieldLabel(key),
      value: String(value)
    }));
};

/**
 * Extract submitter information from request
 */
export const extractSubmitterInfo = (request) => {
  if (!request) return 'Unknown';
  
  // Check various possible submitter fields
  const submitterFields = [
    'user.name', 'user.username', 'user.email',
    'formData.requestorName', 'formData.submitterName', 
    'submittedBy', 'requestorName'
  ];
  
  for (const fieldPath of submitterFields) {
    const value = getNestedValue(request, fieldPath);
    if (value && typeof value === 'string') {
      return value;
    }
  }
  
  return 'Unknown';
};

/**
 * Get nested object value by dot notation path
 */
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

/**
 * Format request data for different user roles
 */
export const formatRequestForRole = (request, userRole) => {
  if (!request) return null;
  
  const baseData = {
    id: request._id || request.id,
    title: extractRequestTitle(request),
    description: extractRequestDescription(request),
    status: request.status || 'pending',
    submitter: extractSubmitterInfo(request),
    createdAt: request.createdAt || request.submittedAt,
    updatedAt: request.updatedAt
  };
  
  switch (userRole) {
    case 'submitter':
      // Submitters see only their form data + status
      return {
        ...baseData,
        formData: getDisplayableFormData(request.formData)
      };
      
    case 'reviewer':
    case 'admin':
      // Reviewers and admins see additional metadata
      return {
        ...baseData,
        assignedTo: request.assignedTo,
        reviewer: request.reviewer,
        claimedAt: request.claimedAt,
        formData: getDisplayableFormData(request.formData),
        rawFormData: request.formData // For detailed review
      };
      
    default:
      return baseData;
  }
};

/**
 * Search across all request fields dynamically
 */
export const searchRequest = (request, searchQuery) => {
  if (!request || !searchQuery) return true;
  
  const query = searchQuery.toLowerCase();
  
  // Search in extracted title and description
  if (extractRequestTitle(request).toLowerCase().includes(query) ||
      extractRequestDescription(request).toLowerCase().includes(query)) {
    return true;
  }
  
  // Search in submitter info
  if (extractSubmitterInfo(request).toLowerCase().includes(query)) {
    return true;
  }
  
  // Search in form data
  if (request.formData) {
    return Object.values(request.formData).some(value => 
      typeof value === 'string' && value.toLowerCase().includes(query)
    );
  }
  
  return false;
};

export default {
  extractRequestTitle,
  extractRequestDescription,
  getFieldLabel,
  getDisplayableFormData,
  extractSubmitterInfo,
  formatRequestForRole,
  searchRequest,
  TECHNICAL_FIELDS,
  FIELD_LABEL_MAP
};
