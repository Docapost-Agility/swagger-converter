
/**
 * Initialize export
 */
const create = () => {
    throw new Error('ConverterInterface.create not implemented');
};


/**
 * 
 * Add a Workspace
 * 
 * @param {Object} options 
 * @param {string} [options.name]
 * 
 * @returns {string} workspaceId
 */
const createWorkspace = options => {
    throw new Error('ConverterInterface.createWorkspace not implemented');
};

/**
 * 
 * Add data to workspace's variables
 * 
 * @param {Object} data 
 * @param {string} [data[x]]
 */
const addGlobalVars = data => {
    throw new Error('ConverterInterface.addGlobalVars not implemented');
};

/**
 * 
 * @param {string} key 
 * 
 * @return {string} environmentVariablePattern
 */
const toEnvironmentVar = key => {
    throw new Error('ConverterInterface.addEnvironmentData not implemented');
};

/**
 * 
 * Add a requests' group to current workspace
 * 
 * @param {Object} options 
 * @param {string} [options.name]
 * @param {string} [options.description]
 * @param {string} [options.parentId]
 * 
 * @returns {string} requestsGroupId
 */
const addRequestsGroup = options => {
    throw new Error('ConverterInterface.addRequestsGroup not implemented');
};

/**
 * 
 * Add a request to current workspace
 * 
 * @param {Object} options 
 * @param {string} options.url
 * @param {string} [options.name]
 * @param {string} [options.description]
 * @param {string} [options.parentId]
 * @param {Object[]} [options.queryParams]
 * @param {string} [options.queryParams.name]
 * @param {string} [options.queryParams.value]
 * @param {Object} [options.JSONBody]
 * @param {Object} [options.authentication]
 * @param {string} [options.authentication.type]
 * @param {string} [options.authentication.value]
 * 
 * @returns {string} requestId
 */
const addRequest = options => {
    throw new Error('ConverterInterface.addRequest not implemented');
};

/**
 * Merge requests groups when a group only have a single group as child
 */
const mergeRequestsGroupWithOneChild = () => {
    throw new Error('ConverterInterface.mergeRequestsGroupWithOneChild not implemented');
};

/**
 * Reorder requests and groups if needed
 */
const reorder = () => { };

/**
 * Return the export
 */
const get = () => {
    throw new Error('ConverterInterface.get not implemented');
};

module.exports = {
    create: create,
    createWorkspace: createWorkspace,
    addGlobalVars: addGlobalVars,
    toEnvironmentVar: toEnvironmentVar,
    addRequestsGroup: addRequestsGroup,
    addRequest: addRequest,
    mergeRequestsGroupWithOneChild: mergeRequestsGroupWithOneChild,
    reorder: reorder,
    get: get
}