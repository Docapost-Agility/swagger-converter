
const PREFIX_WORKSPACE = "wrk_";
const PREFIX_ENV = "env_";
const PREFIX_GROUP = "fld_";
const PREFIX_REQUEST = "req_";

const generateId = () => {
    const k = "abcdef1234567890";
    let id = "";
    for (i = 0; i < 32; i++) {
        id += k[Math.floor(Math.random() * 10)];
    }
    return id;
}

let insomiaJson = null;
let workspaceId = null;
let defaultEnv = null;

/**
 * Initialize export
 */
const create = () => {
    insomiaJson = {
        "_type": "export",
        "__export_format": 3,
        "resources": []
    }
};


/**
 * 
 * Add a Workspace
 * 
 * @param {Object} [options]
 * @param {string} [options.name=New Workspace]
 * 
 * @returns {string} workspaceId
 */
const createWorkspace = options => {
    if (!insomiaJson) {
        create();
    }
    workspaceId = PREFIX_WORKSPACE + generateId();
    insomiaJson.resources.push({
        "_id": workspaceId,
        "name": options && options.name || "New Workspace",
        "_type": "workspace",
    });
    return workspaceId;
};

/**
 * 
 * Create an environment for the current workspace
 * 
 * @param {Object} options 
 * @param {string} [options.name=Default Environment]
 * @param {Object} [options.data]
 */
const createEnvironment = options => {
    if (!workspaceId) {
        createWorkspace();
    }
    const defaultEnvId = PREFIX_ENV + generateId();
    defaultEnv = {
        "_id": defaultEnvId,
        "isPrivate": false,
        "name": options && options.name || "Default Environment",
        "parentId": workspaceId,
        "_type": "environment",
        "data": options && options.data || {},
    };
    insomiaJson.resources.push(defaultEnv);
};

/**
 * 
 * Add data to worspace's environment
 * 
 * @param {Object} options 
 * @param {string} options.key
 * @param {string} [options.value]
 */
const addEnvironmentData = options => {
    if (!defaultEnv) {
        createEnvironment();
    }
    if (options && options.key) {
        defaultEnv.data[options.key] = options.value;
    }
};

/**
 * 
 * @param {string} key 
 * 
 * @return {string} environmentVariablePattern
 */
const toEnvironmentVar = key => {
    return `{{${key}}}`
};

/**
 * 
 * Add a requests' group to current workspace
 * 
 * @param {Object} options 
 * @param {string} [options.name=Requests Group]
 * @param {string} [options.description]
 * @param {string} [options.parentId]
 * 
 * @returns {string} requestsGroupId
 */
const addRequestsGroup = options => {
    if (!options) {
        return;
    }
    if (!workspaceId) {
        createWorkspace();
    }
    const requestsGroupId = PREFIX_GROUP + generateId();
    insomiaJson.resources.push({
        "_id": requestsGroupId,
        "name": options.name || "Requests Group",
        "description": options.description || "",
        "parentId": options.parentId || workspaceId,
        "_type": "request_group"
    });
    return requestsGroupId;
}

/**
 * 
 * Add a request to current workspace
 * 
 * @param {Object} options 
 * @param {string} options.url
 * @param {string} options.method
 * @param {string} [options.name=Request]
 * @param {string} [options.description]
 * @param {string} [options.parentId]
 * @param {Object} [options.JSONBody]
 * @param {Object[]} [options.queryParams]
 * @param {string} [options.queryParams.name]
 * @param {string} [options.queryParams.value]
 * 
 * @param {Object} [options.authentication]
 * 
 * @returns {string} requestId
 */
const addRequest = options => {
    if (!options || !options.url) {
        return;
    }
    if (!workspaceId) {
        createWorkspace();
    }
    const requestId = PREFIX_REQUEST + generateId();
    let request = {
        "_id": requestId,
        "description": options.description || "",
        "parentId": options.parentId || workspaceId,
        "isPrivate": false,
        "name": options.name || "Request",
        "url": options.url,
        "method": options.method,
        "parameters": options.queryParams || [],
        "_type": "request",
        "authentication": options.authentication || {},

    };
    if (options.JSONBody) {
        request.body = {
            "mimeType": "application/json",
            "text": JSON.stringify(options.JSONBody, null, "\t")
        };
    }
    insomiaJson.resources.push(request);
    return requestId;
}

/**
 * Merge requests groups when a group only have a single group as child
 */
const mergeRequestsGroupWithOneChild = () => {
    let idsToRemove = [];
    let subGroupResources = insomiaJson.resources.filter(r => r._id.startsWith(PREFIX_GROUP) && r.parentId !== workspaceId/* && !swaggersGroupsIds.includes(r.parentId)*/);
    for (let group of subGroupResources) {
        const children = insomiaJson.resources.filter(g => g.parentId === group._id);
        if (children.length === 1 && children[0]._id.startsWith(PREFIX_GROUP)) {
            children[0].name = group.name + "/" + children[0].name;
            children[0].parentId = group.parentId;
            idsToRemove.push(group._id);
        }
    }
    insomiaJson.resources = insomiaJson.resources.filter(g => !idsToRemove.includes(g._id));
}

/**
 * Reorder requests and groups if needed
 */
const reorder = () => {
    insomiaJson.resources.sort((a, b) => a._id.startsWith(PREFIX_REQUEST) && !b._id.startsWith(PREFIX_REQUEST) ? 1 : 0);
}

module.exports = {
    create: create,
    createWorkspace: createWorkspace,
    createEnvironment: createEnvironment,
    addEnvironmentData: addEnvironmentData,
    toEnvironmentVar: toEnvironmentVar,
    addRequestsGroup: addRequestsGroup,
    addRequest: addRequest,
    mergeRequestsGroupWithOneChild: mergeRequestsGroupWithOneChild,
    reorder: reorder,
    get: () => insomiaJson
}