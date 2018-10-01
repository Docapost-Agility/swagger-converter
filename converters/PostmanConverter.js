const generateUuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

let postmanExport = null;
let itemsContainers = {};

/**
 * Initialize export
 */
const create = () => {
    postmanExport = {
        info: {},
        item: [],
        variable: [],
    }
};

/**
 * 
 * Add a Workspace
 * 
 * @param {Object} [options]
 * @param {string} [options.name=New Workspace]
 * @param {string} [options.description]
 * 
 * @returns {string} workspaceId
 */
const createWorkspace = options => {
    if (!postmanExport) {
        create();
    }
    postmanExport.id = generateUuid();
    postmanExport.info = {
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
        "name": options && options.name || "New Collection"
    }
    itemsContainers[postmanExport.id] = postmanExport;
    return postmanExport.id;
};

/**
 * 
 * Create an environment for the current workspace
 * 
 * @param {Object} options 
 * @param {string} [options.name]
 * @param {Object} [options.data]
 */
const createEnvironment = options => {
    if (!postmanExport) {
        create();
    }
    postmanExport.variable = options && options.data && Object.keys(options.data).map(k => ({ key: k, value: options.data[k] })) || [];
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
    if (!postmanExport.variable) {
        createEnvironment();
    }
    if (options && options.key) {
        postmanExport.variable.push({
            "key": options.key,
            "value": options.value
        });
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
 * @param {string} [options.name]
 * @param {string} [options.description]
 * @param {string} [options.parentId]
 * 
 * @returns {string} requestsGroupId
 */
const addRequestsGroup = options => {
    if (!postmanExport) {
        create();
    }
    const requestsGroupId = generateUuid();
    const group = {
        "id": requestsGroupId,
        "name": options && options.name || "Requests Group",
        "description": options && options.description || "",
        "item": []

    };
    if (options && options.parentId && itemsContainers[options.parentId]) {
        itemsContainers[options.parentId].item.push(group);
    } else {
        postmanExport.item.push(group);
    }
    itemsContainers[group.id] = group;
    return requestsGroupId;
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
    if (!options || !options.url) {
        return;
    }
    if (!postmanExport) {
        createWorkspace();
    }
    const requestId = generateUuid();
    let request = {
        "id": requestId,
        "description": options.description || "",
        "name": options.name || "Request",
        "request": {
            "url": options.url,
            "method": options.method,
        },
    };
    if (options.JSONBody) {
        request.request.body = {};
        request.request.body.mode = "raw";
        request.request.body.raw = JSON.stringify(options.JSONBody, null, "\t");
        request.request.headers = request.request.headers || [];
        request.request.headers.push({ key: "Content-Type", value: "application/json" });
    }

    if (options.queryParams) {
        request.request.url += "?" + options.queryParams.map(p => p.name + "=" + p.value).join("&");
    }

    if(options.authentication && options.authentication.type) {
        if(options.authentication.type === "bearer") {
            request.request.auth = {
                type: "bearer",
                bearer : [
                    {
                        key: "token",
                        value: options.authentication.value
                    }
                ]
            };
        }
    }

    if (options && options.parentId && itemsContainers[options.parentId]) {
        itemsContainers[options.parentId].item.push(request);
    } else {
        postmanExport.item.push(request);
    }
    return requestId;
};

/**
 * Merge requests groups when a group only have a single group as child
 */
const mergeRequestsGroupWithOneChild = () => {

    reduceChildren = container => {
        for (const group of container.item) {
            if (group.item) {
                if (group.item.length === 1) {
                    group.name = group.name + "/" + group.item[0].name;
                    group.item = group.item[0].item;
                }
                if (group.item) {
                    for (const subGroup of group.item) {
                        if (subGroup.item) {
                            reduceChildren(subGroup);
                        }
                    }
                }
            }
        }
    }

    for (const mainGroup of postmanExport.item) {
        reduceChildren(mainGroup);
    }
};

/**
 * Reorder requests and groups if needed
 */
const reorder = () => { };

/**
 * Return the export
 */
const get = () => postmanExport;

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
    get: get
}