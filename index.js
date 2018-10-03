const Utils = require("./Utils");

const queryParamsRegEx = /\{([a-zA-Z]*)\}/g;
const forbiddenJsonKeyChars = /[\s\-'.]/g;

/**
 *
 * @param {Object} options
 * @param {Object[]} options.swaggers
 * @param {string} options.swaggers[x].name
 * @param {Object} options.swaggers[x].json
 * @param {string} [options.workspaceName]
 * @param {Object} [options.converter=InsomniaConverter]
 * @param {Object} [options.globalVars]
 */
module.exports = options => {
    if (!options) {
        throw new Error("No parameter found");
    }

    const swaggers = options.swaggers;

    if (!swaggers.length) {
        throw new Error("No swagger found");
    }

    if (swaggers.length > 1 && swaggers.filter(s => !s.name).length) {
        throw new Error("Multiple swaggers must be identified by a name");
    }

    const converter =
        options.converter || require("./converters/InsomiaConverter");

    converter.create();

    const workspaceId = converter.createWorkspace({
        name: options.workspaceName
    });

    converter.addGlobalVars({
        protocole: "https://",
    });

    converter.addGlobalVars(options.globalVars);

    let defaultHost = null;

    pushSwagger = (name, swaggerJson) => {
        if (typeof swaggerJson === "string") {
            try {
                swaggerJson = JSON.parse(swaggerJson);
            } catch (e) {
                throw new Error("swagger should be a valid json");
            }
        }

        //Add swagger host and basePath to defaultEnv
        const swaggerPrefix = name && (name.replace(forbiddenJsonKeyChars, "_") + "_") || "";
        let hostKey = "host";
        if (!defaultHost) {
            defaultHost = swaggerJson.host;
            converter.addGlobalVars({
                [hostKey]: defaultHost
            });
        } else if (defaultHost !== swaggerJson.host) {
            hostKey = `${swaggerPrefix}host`;
            converter.addGlobalVars({
                [hostKey]: swaggerJson.host
            });
        }
        const basePathKey = `${swaggerPrefix}basePath`;
        converter.addGlobalVars({
            [basePathKey]: swaggerJson.basePath
        });

        let swaggerGroupId = null;
        if (!!name || swaggers.length > 1) {
            swaggerGroupId = converter.addRequestsGroup({
                name: name,
                parentId: workspaceId
            });
        }

        // Request tags groups
        const groups = {};
        if (swaggerJson.tags) {
            for (const tag of swaggerJson.tags) {
                const groupId = converter.addRequestsGroup({
                    name: tag.name,
                    parentId: swaggerGroupId || workspaceId,
                    description: tag.description
                });
                groups[tag.name] = { id: groupId, children: {} };
            }
        }

        // Requests
        if (swaggerJson.paths) {
            for (const originalPath of Object.keys(swaggerJson.paths)) {
                const splitedPath = originalPath.split("/");
                let path = originalPath;
                if (
                    swaggerJson.basePath &&
                    swaggerJson.basePath.startsWith("/" + splitedPath[1])
                ) {
                    splitedPath.splice(1, 1);
                    path = splitedPath.join("/");
                }

                // Extract path methods
                for (const method of Object.keys(
                    swaggerJson.paths[originalPath]
                )) {
                    const request = swaggerJson.paths[originalPath][method];
                    const resource = {
                        description:
                            request.summary +
                            ((request.description &&
                                "\n\n" + request.description) ||
                                ""),
                        name: request.summary,
                        url:
                            converter.toEnvironmentVar("protocole") +
                            converter.toEnvironmentVar(hostKey) +
                            converter.toEnvironmentVar(basePathKey) +
                            path.replace(
                                queryParamsRegEx,
                                converter.toEnvironmentVar("$1")
                            )
                    };
                    if (!path.includes("/public")) {
                        resource.authentication = {
                            value: converter.toEnvironmentVar("jwt_token"),
                            type: "bearer"
                        };
                    }
                    resource.method = method;

                    if (request.parameters) {
                        // Body params
                        for (const param of request.parameters.filter(
                            p => p.in === "body"
                        )) {
                            if (param.schema && param.schema.$ref) {
                                const definition = Utils.getDefinitionFromRef({
                                    ref: param.schema.$ref,
                                    swagger: swaggerJson
                                });
                                resource.JSONBody = Utils.createDataFromDefinition(
                                    {
                                        definition: definition,
                                        swagger: swaggerJson
                                    }
                                );
                            }
                        }
                        // Query params
                        resource.queryParams = [];
                        for (const param of request.parameters.filter(
                            p => p.in === "query"
                        )) {
                            const queryKey =
                                swaggerPrefix +
                                param.name.replace(forbiddenJsonKeyChars, "_");
                            resource.queryParams.push({
                                name: param.name,
                                value: converter.toEnvironmentVar(queryKey)
                            });
                        }
                    }

                    // add to each tag
                    for (const tag of request.tags) {
                        let currentParent = groups[tag];
                        for (const part of splitedPath) {
                            if (!queryParamsRegEx.test(part) && !!part) {
                                if (currentParent.children[part]) {
                                    currentParent =
                                        currentParent.children[part];
                                } else {
                                    const newGroupId = converter.addRequestsGroup(
                                        {
                                            name: part,
                                            parentId: currentParent.id
                                        }
                                    );
                                    currentParent.children[part] = {
                                        id: newGroupId,
                                        children: {}
                                    };
                                    currentParent =
                                        currentParent.children[part];
                                }
                            }
                        }
                        converter.addRequest({
                            parentId: currentParent.id,
                            ...resource
                        });
                    }
                }
            }
        }
    };

    for (const swagger of swaggers) {
        pushSwagger(swagger.name, swagger.json);
    }

    converter.mergeRequestsGroupWithOneChild();
    converter.reorder();

    return converter.get();
};
