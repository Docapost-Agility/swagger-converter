const getDefinitionFromRef = options => {
    const ref = options.ref;
    const swagger = options.swagger;
    const s = ref.split('/');
    return swagger.definitions[s[s.length - 1]];
}

const getDefaultPropertyValue = options => {
    const property = options.property;
    const swagger = options.swagger;

    if (!property) {
        return "";
    }
    if (property.type === "boolean") {
        return 0;
    }
    if (property.type === "integer") {
        return 10;
    }
    if (property.type === "string" && property.format === "date-time") {
        return Date.now();
    }
    if (property.type === "string") {
        return "";
    }
    if (property.$ref) {
        return createDataFromDefinition({
            definition: getDefinitionFromRef({ swagger: swagger, ref: property.$ref }),
            swagger: swagger
        });
    }
    if (property.type === "array" && property.items && property.items.$ref) {
        return [
            createDataFromDefinition({
                definition: getDefinitionFromRef({ swagger: swagger, ref: property.items.$ref }),
                swagger: swagger
            })
        ];
    }

    return "";
}

const createDataFromDefinition = options => {
    const definition = options.definition;
    const swagger = options.swagger;

    if (definition && definition.type === "object" && definition.properties) {
        let data = {};
        for (const propertyKey of Object.keys(definition.properties)) {
            data[propertyKey] = getDefaultPropertyValue({
                property: definition.properties[propertyKey],
                swagger: swagger
            });
        }
        return data;
    }
    return "";
}

module.exports = {
    createDataFromDefinition: createDataFromDefinition,
    getDefinitionFromRef: getDefinitionFromRef
};
